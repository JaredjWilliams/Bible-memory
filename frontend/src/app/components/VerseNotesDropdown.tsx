import { useEffect, useRef, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { StickyNote } from 'lucide-react';
import { type ReaderNote } from '../../lib/reader-notes-api';
import { expandVerseRange } from '../../lib/verse-utils';
import { Button } from './ui/button';

interface VerseNotesDropdownProps {
  verseNum: number;
  anchorEl: HTMLElement | null;
  notes: ReaderNote[];
  onAddNote: (verseNum: number) => void;
  onClose: () => void;
}

export function VerseNotesDropdown({ verseNum, anchorEl, notes, onAddNote, onClose }: VerseNotesDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => expandVerseRange(note.verseRange).has(verseNum));
  }, [notes, verseNum]);

  useEffect(() => {
    if (!anchorEl) {
      setPosition(null);
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const dropdownWidth = 320;
    let left = rect.left + window.scrollX;
    if (left + dropdownWidth > window.innerWidth - 16) {
      left = window.innerWidth - dropdownWidth - 16;
    }
    left = Math.max(8, left);
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left,
    });
  }, [anchorEl]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-40 w-80 max-h-64 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg p-3"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          Notes for verse {verseNum}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => onAddNote(verseNum)}
          aria-label={`Add note for verse ${verseNum}`}
        >
          <StickyNote className="h-3.5 w-3.5" />
        </Button>
      </div>
      {filteredNotes.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 text-center">
          No notes for this verse.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((note) => (
            <div key={note.id} className="rounded border p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium bg-primary/10 text-primary rounded px-1 py-0.5">
                  v. {note.verseRange}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(note.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-xs"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
