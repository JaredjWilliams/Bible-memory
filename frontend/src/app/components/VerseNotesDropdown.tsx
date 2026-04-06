import { useEffect, useRef, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { type ReaderNote } from '../../lib/reader-notes-api';
import { expandVerseRange } from '../../lib/verse-utils';

interface VerseNotesDropdownProps {
  verseNum: number;
  anchorEl: HTMLElement | null;
  notes: ReaderNote[];
  onClose: () => void;
}

export function VerseNotesDropdown({ verseNum, anchorEl, notes, onClose }: VerseNotesDropdownProps) {
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
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Notes for verse {verseNum}
      </p>
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
