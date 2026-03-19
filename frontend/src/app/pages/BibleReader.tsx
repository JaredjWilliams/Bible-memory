import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BOOKS, CHAPTERS_PER_BOOK } from '../../lib/bible-books';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Parse ESV text format: "[1] In the beginning... [2] The earth..."
// Also handles "1 In the beginning" (verse number without brackets) and raw text
const parseVerses = (text: string): { number: number; text: string }[] => {
  if (!text?.trim()) return [];

  // Format 1: [1] [2] [3] - brackets with verse numbers
  const bracketMatches = text.matchAll(/(\[\d+\])\s*([^[]*?)(?=\[\d+\]|$)/gs);
  const bracketVerses: { number: number; text: string }[] = [];
  for (const m of bracketMatches) {
    const numMatch = m[1].match(/\[(\d+)\]/);
    const num = numMatch ? parseInt(numMatch[1], 10) : bracketVerses.length + 1;
    const verseText = (m[2] ?? '').trim();
    if (verseText) bracketVerses.push({ number: num, text: verseText });
  }
  if (bracketVerses.length > 0) return bracketVerses;

  // Format 2: Split on [\d+] pattern (alternate)
  const segments = text.split(/(\[\d+\]\s*)/);
  const altVerses: { number: number; text: string }[] = [];
  for (let i = 1; i < segments.length; i += 2) {
    const numMatch = segments[i].match(/\[(\d+)\]/);
    const num = numMatch ? parseInt(numMatch[1], 10) : altVerses.length + 1;
    const verseText = (segments[i + 1] ?? '').trim();
    if (verseText) altVerses.push({ number: num, text: verseText });
  }
  if (altVerses.length > 0) return altVerses;

  // Format 3: Single block - treat entire text as one verse
  return [{ number: 1, text: text.trim() }];
};

export function BibleReader() {
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [showNavigation, setShowNavigation] = useState(true);
  const [passageText, setPassageText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxChapter = CHAPTERS_PER_BOOK[selectedBook] || 50;
  const verses = passageText ? parseVerses(passageText) : [];

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
    <div className="container mx-auto px-4 py-8 text-sm sm:text-base">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Controls */}
        <Card className="gap-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-3 pb-2">
            <CardTitle className="text-base">Read Scripture</CardTitle>
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
                <ChevronDown className="h-5 w-5" />
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
                <CardContent className="space-y-4">
                  {/* Book and Chapter Selectors */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Book
                      </label>
                      <Select value={selectedBook} onValueChange={handleBookChange}>
                        <SelectTrigger>
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
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chapter
                      </label>
                      <Select 
                        value={currentChapter.toString()} 
                        onValueChange={handleChapterChange}
                      >
                        <SelectTrigger>
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
                  <div className="flex flex-wrap justify-between items-center gap-2 pt-2 min-w-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={handlePreviousChapter}
                      disabled={selectedBook === BOOKS[0] && currentChapter === 1}
                    >
                      <ChevronLeft className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Previous Chapter</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    
                    <div className="text-sm text-gray-600 shrink-0 text-center order-last sm:order-none w-full sm:w-auto">
                      {selectedBook} {currentChapter}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
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
          <CardHeader className="px-4 pt-4">
            <CardTitle className="text-lg sm:text-xl">
              {selectedBook} {currentChapter}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 [&:last-child]:pb-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <span className="w-6 h-4 bg-gray-200 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-amber-600 py-4">{error}</p>
            ) : verses.length > 0 ? (
              <motion.div
                key={`${selectedBook}-${currentChapter}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-4"
              >
                {verses.map((verse, idx) => (
                  <p key={`${verse.number}-${idx}`} className="text-gray-800 leading-relaxed text-sm sm:text-base">
                    <sup className="text-gray-500 font-semibold align-super text-xs sm:text-sm mr-1">
                      {verse.number}
                    </sup>
                    {verse.text}
                  </p>
                ))}
              </motion.div>
            ) : (
              <p className="text-gray-500 py-4">No verses to display.</p>
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