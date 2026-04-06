import { useEffect, useRef, useState } from 'react';
import { StickyNote, Bookmark, Highlighter, Share2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { formatVerseRange } from '../../lib/verse-utils';

interface VerseActionPanelProps {
  selectedVerses: Set<number>;
  anchorEl: HTMLElement | null;
  onOpenNotes: () => void;
  onDismiss: () => void;
}

export function VerseActionPanel({ selectedVerses, anchorEl, onOpenNotes, onDismiss }: VerseActionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!anchorEl) {
      setPosition(null);
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const panelWidth = 180;
    let left = rect.left + rect.width / 2 - panelWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
    setPosition({
      top: rect.bottom + window.scrollY + 6,
      left: left + window.scrollX,
    });
  }, [anchorEl, selectedVerses]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('[data-verse]')) return;
        onDismiss();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onDismiss]);

  if (selectedVerses.size === 0 || !position) return null;

  const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
  const label = formatVerseRange(sorted);

  return (
    <div
      ref={panelRef}
      className="absolute z-40 bg-popover border border-border rounded-lg shadow-lg px-2 py-1.5 flex items-center gap-1"
      style={{ top: position.top, left: position.left }}
    >
      <span className="text-xs text-muted-foreground px-1.5 font-medium whitespace-nowrap">
        v. {label}
      </span>
      <div className="w-px h-5 bg-border" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onOpenNotes}>
            <StickyNote className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add Note</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled>
            <Highlighter className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Highlight (coming soon)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled>
            <Bookmark className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bookmark (coming soon)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled>
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Share (coming soon)</TooltipContent>
      </Tooltip>
      <div className="w-px h-5 bg-border" />
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDismiss}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

