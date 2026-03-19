import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock Bible books
const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
];

// Mock chapters per book (simplified)
const CHAPTERS_PER_BOOK: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
};

// Generate mock verses for a chapter
const generateMockVerses = (book: string, chapter: number, verseCount: number) => {
  const verses = [];
  const loremTexts = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
    'Nisi ut aliquip ex ea commodo consequat.',
    'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
    'Consectetur adipisci velit, sed quia non numquam eius modi tempora.',
    'Incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
    'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis.',
  ];

  for (let i = 1; i <= verseCount; i++) {
    verses.push({
      number: i,
      text: loremTexts[i % loremTexts.length],
    });
  }

  return verses;
};

export function BibleReader() {
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [showNavigation, setShowNavigation] = useState(true);
  
  const maxChapter = CHAPTERS_PER_BOOK[selectedBook] || 50;
  const verses = generateMockVerses(selectedBook, currentChapter, 25);

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Controls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Read Scripture</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNavigation(!showNavigation)}
              aria-label={showNavigation ? 'Hide navigation' : 'Show navigation'}
            >
              {showNavigation ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
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
                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviousChapter}
                      disabled={selectedBook === BOOKS[0] && currentChapter === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous Chapter
                    </Button>
                    
                    <div className="text-sm text-gray-600">
                      {selectedBook} {currentChapter}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={handleNextChapter}
                      disabled={
                        selectedBook === BOOKS[BOOKS.length - 1] && 
                        currentChapter === maxChapter
                      }
                    >
                      Next Chapter
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Bible Text Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {selectedBook} {currentChapter}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verses.map(verse => (
                <div key={verse.number} className="flex gap-3">
                  <span className="text-sm font-semibold text-gray-500 mt-1 flex-shrink-0">
                    {verse.number}
                  </span>
                  <p className="text-gray-800 leading-relaxed">
                    {verse.text}
                  </p>
                </div>
              ))}
            </div>
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