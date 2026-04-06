import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, BookOpen, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { cn } from './ui/utils';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface NoteEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  autofocus?: boolean;
}

export function NoteEditor({ content = '', onChange, placeholder, autofocus = false }: NoteEditorProps) {
  const [isFetchingVerse, setIsFetchingVerse] = useState(false);
  // TipTap updates selection without React re-renders; tick forces toolbar (e.g. Insert Verse) to stay in sync.
  const [, setSelectionTick] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[100px] px-3 py-2 focus:outline-none text-sm',
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    onSelectionUpdate: () => {
      setSelectionTick((n) => n + 1);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  useEffect(() => {
    if (editor && autofocus) {
      editor.commands.focus('end');
    }
  }, [editor, autofocus]);

  const handleInsertVerse = useCallback(async () => {
    if (!editor || isFetchingVerse) return;

    const { from, to } = editor.state.selection;
    if (from === to) {
      toast.error('Select a verse reference first (e.g. "John 3:16")');
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to).trim();
    if (!selectedText) {
      toast.error('Select a verse reference first');
      return;
    }

    setIsFetchingVerse(true);
    try {
      const res = await api.get<{ text: string; reference: string }>(
        `/api/passages?q=${encodeURIComponent(selectedText)}`
      );

      if (!res?.text?.trim()) {
        toast.error(`Could not find passage: "${selectedText}"`);
        return;
      }

      editor.chain().focus()
        .deleteRange({ from, to })
        .insertContent({
          type: 'blockquote',
          content: [{
            type: 'paragraph',
            content: [
              { type: 'text', text: res.text.trim(), marks: [{ type: 'italic' }] },
            ],
          }, {
            type: 'paragraph',
            content: [
              { type: 'text', text: `\u2014 ${res.reference}`, marks: [{ type: 'bold' }] },
            ],
          }],
        })
        .run();
    } catch {
      toast.error(`Failed to fetch verse: "${selectedText}"`);
    } finally {
      setIsFetchingVerse(false);
    }
  }, [editor, isFetchingVerse]);

  if (!editor) return null;

  const hasSelection = !editor.state.selection.empty;

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="flex items-center gap-0.5 border-b px-1 py-1 bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-7 w-7 p-0', editor.isActive('bold') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-7 w-7 p-0', editor.isActive('italic') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-7 w-7 p-0', editor.isActive('bulletList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('h-7 w-7 p-0', isFetchingVerse && 'opacity-50')}
              onClick={handleInsertVerse}
              disabled={isFetchingVerse || !hasSelection}
            >
              {isFetchingVerse
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <BookOpen className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasSelection ? 'Insert Verse' : 'Select a verse reference to insert'}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <p className="absolute top-0 left-0 px-3 py-2 text-sm text-muted-foreground pointer-events-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
