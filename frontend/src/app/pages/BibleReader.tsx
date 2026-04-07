import { useState, useEffect, useCallback, useRef, useMemo, Fragment } from 'react';
import { api } from '../../lib/api';
import { BOOKS, CHAPTERS_PER_BOOK } from '../../lib/bible-books';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VerseActionPanel } from '../components/VerseActionPanel';
import { ReaderNotesPanel } from '../components/ReaderNotesPanel';
import { VerseNotesDropdown } from '../components/VerseNotesDropdown';
import { formatVerseRange, expandVerseRange } from '../../lib/verse-utils';
import { fetchChapterNotes, type ReaderNote } from '../../lib/reader-notes-api';
import { loadReaderPosition, saveReaderPosition } from '../../lib/reader-position';

/** Split passage text by paragraph breaks (\n\n). */
function parseParagraphs(text: string): string[] {
  if (!text?.trim()) return [];
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

/** ESV section headings: end with |, or short paragraph with no verse markers. */
function isHeading(para: string): boolean {
  const trimmed = para.trim();
  if (/^[^\[\]]+\|\s*$/.test(trimmed)) return true;
  if (!/\[\d+\]/.test(trimmed) && trimmed.length < 80) return true;
  return false;
}

/** Remove trailing | from heading text for display. */
function formatHeading(text: string): string {
  return text.replace(/\|\s*$/, '').trim();
}

interface VerseSegment {
  type: 'sup' | 'text';
  verseNum: number | null;
  content: string;
}

/** Normalize API newline variants so split matches ESV / Java `\R` line breaks. */
function normalizePoetryNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u2028/g, '\n');
}

/** True when a poetry line has visible text (ESV may use space-only lines for layout). */
function lineHasRenderableText(line: string): boolean {
  return line.trim().length > 0;
}

/** Parse a paragraph into segments with associated verse numbers. */
function parseVerseSegments(paragraph: string): VerseSegment[] {
  const raw = paragraph.split(/(\[\d+\])\s*/);
  const segments: VerseSegment[] = [];
  let currentVerse: number | null = null;

  for (const seg of raw) {
    if (!seg) continue;
    const numMatch = seg.match(/\[(\d+)\]/);
    if (numMatch) {
      currentVerse = parseInt(numMatch[1], 10);
      segments.push({ type: 'sup', verseNum: currentVerse, content: numMatch[1] });
    } else if (seg.trim()) {
      segments.push({ type: 'text', verseNum: currentVerse, content: seg });
    }
  }
  return segments;
}

export function BibleReader() {
  const initialReaderRef = useRef<{ book: string; chapter: number } | null>(null);
  if (initialReaderRef.current === null) {
    initialReaderRef.current =
      typeof window !== 'undefined'
        ? (loadReaderPosition() ?? { book: 'Genesis', chapter: 1 })
        : { book: 'Genesis', chapter: 1 };
  }
  const [selectedBook, setSelectedBook] = useState(initialReaderRef.current.book);
  const [currentChapter, setCurrentChapter] = useState(initialReaderRef.current.chapter);
  const [showNavigation, setShowNavigation] = useState(false);
  const [passageText, setPassageText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [noteVerseRange, setNoteVerseRange] = useState('');
  const [viewingVerse, setViewingVerse] = useState<number | null>(null);
  const [viewingAnchorEl, setViewingAnchorEl] = useState<HTMLElement | null>(null);
  const [chapterNotes, setChapterNotes] = useState<ReaderNote[]>([]);
  const verseRefsMap = useRef<Map<number, HTMLElement>>(new Map());

  const maxChapter = CHAPTERS_PER_BOOK[selectedBook] || 50;
  const paragraphs = passageText ? parseParagraphs(passageText) : [];

  const versesWithNotes = useMemo(() => {
    const set = new Set<number>();
    for (const note of chapterNotes) {
      for (const v of expandVerseRange(note.verseRange)) {
        set.add(v);
      }
    }
    return set;
  }, [chapterNotes]);

  useEffect(() => {
    saveReaderPosition(selectedBook, currentChapter);
  }, [selectedBook, currentChapter]);

  useEffect(() => {
    const query = `${selectedBook} ${currentChapter}`;
    setIsLoading(true);
    setError(null);
    api
      .get<{ text: string; reference: string }>(
        `/api/passages?q=${encodeURIComponent(query)}&reader=true`
      )
      .then((res) => {
        if (res?.text?.trim()) {
          setPassageText(res.text);
        } else {
          setPassageText(null);
          setError('Passage not found');
        }
      })
      .catch((e) => {
        setPassageText(null);
        const msg = e instanceof Error ? e.message : '';
        setError(
          msg?.toLowerCase().includes('api key') || msg?.toLowerCase().includes('not configured')
            ? 'Bible text unavailable. Please contact the administrator.'
            : msg || 'Failed to load passage.'
        );
      })
      .finally(() => setIsLoading(false));
  }, [selectedBook, currentChapter]);

  // Clear selection on chapter/book change and pre-fetch notes
  useEffect(() => {
    setSelectedVerses(new Set());
    setAnchorEl(null);
    setViewingVerse(null);
    setViewingAnchorEl(null);
    verseRefsMap.current.clear();
    fetchChapterNotes(selectedBook, currentChapter)
      .then(setChapterNotes)
      .catch(() => setChapterNotes([]));
  }, [selectedBook, currentChapter]);

  const refreshChapterNotes = useCallback(() => {
    fetchChapterNotes(selectedBook, currentChapter)
      .then(setChapterNotes)
      .catch(() => {});
  }, [selectedBook, currentChapter]);

  const handleVerseClick = useCallback((e: React.MouseEvent, verseNum: number | null) => {
    if (!verseNum) return;

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSelectedVerses((prev) => {
        const next = new Set(prev);
        if (next.has(verseNum)) {
          next.delete(verseNum);
        } else {
          next.add(verseNum);
        }
        return next;
      });
      const el = e.currentTarget as HTMLElement;
      setAnchorEl(el);
      verseRefsMap.current.set(verseNum, el);
    } else {
      if (viewingVerse === verseNum) {
        setViewingVerse(null);
        setViewingAnchorEl(null);
      } else {
        setViewingVerse(verseNum);
        setViewingAnchorEl(e.currentTarget as HTMLElement);
      }
    }
  }, [viewingVerse]);

  const handleDismiss = useCallback(() => {
    setSelectedVerses(new Set());
    setAnchorEl(null);
  }, []);

  const handleOpenNotes = useCallback(() => {
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    setViewingVerse(null);
    setNoteVerseRange(formatVerseRange(sorted));
    setNotesPanelOpen(true);
  }, [selectedVerses]);

  const handlePreviousChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    } else {
      const currentBookIndex = BOOKS.indexOf(selectedBook);
      if (currentBookIndex > 0) {
        const previousBook = BOOKS[currentBookIndex - 1];
        setSelectedBook(previousBook);
        setCurrentChapter(CHAPTERS_PER_BOOK[previousBook] || 1);
      }
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < maxChapter) {
      setCurrentChapter(currentChapter + 1);
    } else {
      const currentBookIndex = BOOKS.indexOf(selectedBook);
      if (currentBookIndex < BOOKS.length - 1) {
        const nextBook = BOOKS[currentBookIndex + 1];
        setSelectedBook(nextBook);
        setCurrentChapter(1);
      }
    }
  };

  const handleBookChange = (book: string) => {
    setSelectedBook(book);
    setCurrentChapter(1);
  };

  const handleChapterChange = (chapter: string) => {
    setCurrentChapter(parseInt(chapter, 10));
    setShowNavigation(false);
  };

  const renderParagraphWithInlineVerses = (paragraph: string) => {
    const segments = parseVerseSegments(paragraph);
    return segments.map((seg, i) => {
      if (seg.type === 'sup') {
        return (
          <sup key={i} className="text-muted-foreground font-semibold align-super text-[8px] sm:text-[9px] mr-0.5">
            {seg.content}
          </sup>
        );
      }
      const isSelected = seg.verseNum !== null && selectedVerses.has(seg.verseNum);
      const hasNotes = seg.verseNum !== null && versesWithNotes.has(seg.verseNum);
      const lines = normalizePoetryNewlines(seg.content).split('\n');
      return (
        <Fragment key={i}>
          {lines.map((line, lineIdx) => {
            const showDecoration = lineHasRenderableText(line);
            let className = 'cursor-pointer';
            if (showDecoration && isSelected) {
              className = 'underline decoration-primary decoration-2 underline-offset-2 cursor-pointer';
            } else if (showDecoration && hasNotes) {
              className = 'border-b border-dashed border-primary/40 cursor-pointer';
            }
            return (
              <Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                {line.length > 0 ? (
                  <span
                    data-verse={seg.verseNum ?? undefined}
                    className={className}
                    onClick={(e) => handleVerseClick(e, seg.verseNum)}
                  >
                    {line}
                  </span>
                ) : (
                  <br />
                )}
              </Fragment>
            );
          })}
        </Fragment>
      );
    });
  };

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base relative">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Controls */}
        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-4">
            <CardTitle className="text-sm font-medium">Read Scripture</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNavigation(!showNavigation)}
              aria-label={showNavigation ? 'Hide navigation' : 'Show navigation'}
            >
              <motion.span
                animate={{ rotate: showNavigation ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="inline-flex"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </Button>
          </CardHeader>
          <AnimatePresence initial={false}>
            {showNavigation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <CardContent className="space-y-3 px-4 pb-4 pt-0">
                  {/* Book and Chapter Selectors */}
                  <div className="flex flex-row gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Book
                      </label>
                      <Select value={selectedBook} onValueChange={handleBookChange}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOOKS.map(book => (
                            <SelectItem key={book} value={book}>
                              {book}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Chapter
                      </label>
                      <Select 
                        value={currentChapter.toString()} 
                        onValueChange={handleChapterChange}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: maxChapter }, (_, i) => i + 1).map(chapter => (
                            <SelectItem key={chapter} value={chapter.toString()}>
                              Chapter {chapter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Previous/Next Chapter Buttons */}
                  <div className="flex flex-wrap justify-between items-center gap-2 min-w-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8"
                      onClick={handlePreviousChapter}
                      disabled={selectedBook === BOOKS[0] && currentChapter === 1}
                    >
                      <ChevronLeft className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Previous Chapter</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8"
                      onClick={handleNextChapter}
                      disabled={
                        selectedBook === BOOKS[BOOKS.length - 1] && 
                        currentChapter === maxChapter
                      }
                    >
                      <span className="hidden sm:inline">Next Chapter</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="h-4 w-4 sm:ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Bible Text Display */}
        <Card className="gap-4">
          <CardContent className="px-4 pt-4 pb-4 [&:last-child]:pb-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <span className="w-6 h-4 bg-muted rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-amber-600 py-4">{error}</p>
            ) : paragraphs.length > 0 ? (
              <motion.div
                key={`${selectedBook}-${currentChapter}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-4"
              >
                {paragraphs.map((para, idx) => {
                  if (isHeading(para)) {
                    const headingText = formatHeading(para);
                    return headingText ? (
                      <p key={idx} className="text-center font-extrabold text-foreground text-sm sm:text-base mt-4 mb-2 first:mt-0">
                        {headingText}
                      </p>
                    ) : null;
                  }
                  return (
                    <p key={idx} className="text-foreground leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                      {renderParagraphWithInlineVerses(para)}
                    </p>
                  );
                })}

                {selectedVerses.size > 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Ctrl+Click to select/deselect verses
                  </p>
                )}
              </motion.div>
            ) : (
              <p className="text-muted-foreground py-4">No verses to display.</p>
            )}
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreviousChapter}
              disabled={selectedBook === BOOKS[0] && currentChapter === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={handleNextChapter}
              disabled={
                selectedBook === BOOKS[BOOKS.length - 1] && 
                currentChapter === maxChapter
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating action panel near selected verses */}
      <VerseActionPanel
        selectedVerses={selectedVerses}
        anchorEl={anchorEl}
        onOpenNotes={handleOpenNotes}
        onDismiss={handleDismiss}
      />

      {/* Inline notes dropdown on normal click */}
      {viewingVerse !== null && viewingAnchorEl && (
        <VerseNotesDropdown
          verseNum={viewingVerse}
          anchorEl={viewingAnchorEl}
          notes={chapterNotes}
          onClose={() => {
            setViewingVerse(null);
            setViewingAnchorEl(null);
          }}
        />
      )}

      {/* Notes side panel (opened via Ctrl+Click action panel) */}
      <ReaderNotesPanel
        open={notesPanelOpen}
        onOpenChange={setNotesPanelOpen}
        book={selectedBook}
        chapter={currentChapter}
        verseRange={noteVerseRange}
        preloadedNotes={chapterNotes}
        onNotesChanged={refreshChapterNotes}
      />
    </div>
  );
}
