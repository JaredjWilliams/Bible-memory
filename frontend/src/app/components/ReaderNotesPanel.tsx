import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from './ui/sheet';
import { Button } from './ui/button';
import { NoteEditor } from './NoteEditor';
import {
  type ReaderNote,
  fetchChapterNotes,
  createReaderNote,
  updateReaderNote,
  deleteReaderNote,
} from '../../lib/reader-notes-api';

interface ReaderNotesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: string;
  chapter: number;
  verseRange: string;
  preloadedNotes?: ReaderNote[];
  onNotesChanged?: () => void;
}

export function ReaderNotesPanel({
  open, onOpenChange, book, chapter, verseRange,
  preloadedNotes, onNotesChanged,
}: ReaderNotesPanelProps) {
  const [notes, setNotes] = useState<ReaderNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (preloadedNotes) {
      setNotes(preloadedNotes);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchChapterNotes(book, chapter);
      setNotes(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [book, chapter, preloadedNotes]);

  useEffect(() => {
    if (open) {
      loadNotes();
      setNewNoteContent('');
      setEditingId(null);
      setDeletingId(null);
    }
  }, [open, loadNotes]);

  const handleSave = async () => {
    if (!newNoteContent.trim() || newNoteContent === '<p></p>') return;
    setIsSaving(true);
    try {
      const note = await createReaderNote({ book, chapter, verseRange, content: newNoteContent });
      setNotes((prev) => [note, ...prev]);
      setNewNoteContent('');
      onNotesChanged?.();
    } catch {
      // TODO: toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim() || editContent === '<p></p>') return;
    try {
      const updated = await updateReaderNote(id, editContent);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setEditingId(null);
      onNotesChanged?.();
    } catch {
      // TODO: toast
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReaderNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setDeletingId(null);
      onNotesChanged?.();
    } catch {
      // TODO: toast
    }
  };

  const startEditing = (note: ReaderNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Notes &mdash; {book} {chapter}</SheetTitle>
          <SheetDescription>Your notes for this chapter</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-4 px-4 pb-4">
            {/* New note form */}
            <div className="space-y-2 border-b pb-4">
              <p className="text-xs font-medium text-muted-foreground">
                New note for v. {verseRange}
              </p>
              <NoteEditor
                key={`new-${book}-${chapter}-${verseRange}`}
                content={newNoteContent}
                onChange={setNewNoteContent}
                placeholder="Write your note..."
                autofocus
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !newNoteContent.trim() || newNoteContent === '<p></p>'}
                className="w-full"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save Note'}
              </Button>
            </div>

            {/* Existing notes */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2 p-3 rounded-md border">
                      <div className="h-3 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No notes for this chapter yet.
                </p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-primary/10 text-primary rounded px-1.5 py-0.5">
                          v. {note.verseRange}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {editingId === note.id ? (
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => startEditing(note)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {deletingId === note.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive" size="sm" className="h-7 text-xs px-2"
                              onClick={() => handleDelete(note.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => setDeletingId(null)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(note.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingId === note.id ? (
                      <div className="space-y-2">
                        <NoteEditor
                          content={editContent}
                          onChange={setEditContent}
                        />
                        <Button size="sm" onClick={() => handleUpdate(note.id)} className="w-full">
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          Update Note
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
