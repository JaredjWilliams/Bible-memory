import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BOOKS, CHAPTERS_PER_BOOK } from '../../lib/bible-books';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/** Split passage text by paragraph breaks (\n\n). */
function parseParagraphs(text: string): string[] {
  if (!text?.trim()) return [];
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

/** ESV section headings: end with |, or short paragraph with no verse markers. */
function isHeading(para: string): boolean {
  const trimmed = para.trim();
  // Format 1: ends with pipe (e.g. "Moses Flees to Midian| ")
  if (/^[^\[\]]+\|\s*$/.test(trimmed)) return true;
  // Format 2: no verse numbers [n], short text (likely standalone heading)
  if (!/\[\d+\]/.test(trimmed) && trimmed.length < 80) return true;
  return false;
}

/** Remove trailing | from heading text for display. */
function formatHeading(text: string): string {
  return text.replace(/\|\s*$/, '').trim();
}

/** Render a paragraph with inline verse numbers ([1], [2], etc.) as superscripts. */
function renderParagraphWithInlineVerses(paragraph: string): React.ReactNode {
  const segments = paragraph.split(/(\[\d+\])\s*/);
  return segments.map((seg, i) => {
    const numMatch = seg.match(/\[(\d+)\]/);
    if (numMatch) {
      return (
        <sup key={i} className="text-muted-foreground font-semibold align-super text-[8px] sm:text-[9px] mr-0.5">
          {numMatch[1]}
        </sup>
      );
    }
    return <span key={i}>{seg}</span>;
  });
}

export function BibleReader() {
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [showNavigation, setShowNavigation] = useState(true);
  const [passageText, setPassageText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxChapter = CHAPTERS_PER_BOOK[selectedBook] || 50;
  const paragraphs = passageText ? parseParagraphs(passageText) : [];

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

  const handlePreviousChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    } else {
      // Go to previous book's last chapter
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
      // Go to next book's first chapter
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
    setCurrentChapter(parseInt(chapter));
  };

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base">
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
                    <p key={idx} className="text-foreground leading-relaxed text-sm sm:text-base">
                      {renderParagraphWithInlineVerses(para)}
                    </p>
                  );
                })}
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
    </div>
  );
}