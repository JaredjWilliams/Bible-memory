import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useData, Verse } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { ArrowLeft, AlertCircle } from 'lucide-react';

type PracticeMode = 'full' | 'alternating' | 'blank';

/** Treat straight and curly quotes as equivalent when comparing typed vs target. */
function quotesMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const quoteVariants = [
    ['"', '\u201C', '\u201D'], // straight, left curly, right curly double
    ["'", '\u2018', '\u2019'], // straight, left curly, right curly single
  ];
  for (const group of quoteVariants) {
    if (group.includes(a) && group.includes(b)) return true;
  }
  return false;
}

export function TypingPractice() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { collections, getVersesByCollection, recordPractice, getDueVerses } = useData();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('full');
  const inputRef = useRef<HTMLInputElement>(null);

  const resetPractice = useCallback(() => {
    setCurrentVerseIndex(0);
    setTypedText('');
    setIsComplete(false);
    setStartTime(null);
  }, []);

  useEffect(() => {
    if (collectionId) {
      const collectionVerses = getVersesByCollection(collectionId);
      setVerses(collectionVerses);
      if (collectionVerses.length > 0) {
        setSelectedRange({ start: 0, end: collectionVerses.length - 1 });
      }
    }
  }, [collectionId, getVersesByCollection]);

  useEffect(() => {
    resetPractice();
  }, [practiceMode, resetPractice]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentVerseIndex]);

  const collection = collectionId ? collections.find(c => c.id === collectionId) : null;

  if (!collectionId || !collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-600 mb-4">Collection not found</p>
              <Button onClick={() => navigate('/collections')}>Back to Collections</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (verses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/collections/${collectionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="mt-4">
            <CardContent className="py-8 text-center text-gray-500">
              No verses in this collection. Add some verses first!
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const dueCount = getDueVerses(collectionId);
  const practiceVerses = verses.slice(selectedRange.start, selectedRange.end + 1);
  const currentVerse = practiceVerses[currentVerseIndex];
  const targetText = currentVerse?.text || '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;

    if (!startTime && newText.length === 1) {
      setStartTime(Date.now());
    }

    if (newText.length <= targetText.length) {
      setTypedText(newText);
    }

    const isCompleteMatch = newText.length === targetText.length &&
      [...newText].every((c, i) => quotesMatch(c, targetText[i]));
    if (isCompleteMatch) {
      const endTime = Date.now();
      const elapsedSeconds = startTime ? (endTime - startTime) / 1000 : 0;
      const wordCount = targetText.split(' ').length;
      const success = elapsedSeconds < wordCount * 5;

      recordPractice(currentVerse.id, success).catch(() => {
        toast.error('Failed to save practice result');
      });

      setTimeout(() => {
        if (currentVerseIndex < practiceVerses.length - 1) {
          setCurrentVerseIndex(currentVerseIndex + 1);
          setTypedText('');
          setStartTime(null);
        } else {
          setIsComplete(true);
        }
      }, 500);
    }
  };

  // Build word boundaries for visibility logic
  const words = targetText.split(' ');
  const wordRanges: { start: number; end: number }[] = [];
  let pos = 0;
  for (let i = 0; i < words.length; i++) {
    const start = pos;
    pos += words[i].length;
    if (i < words.length - 1 && pos < targetText.length && targetText[pos] === ' ') {
      pos++;
    }
    wordRanges.push({ start, end: pos });
  }

  const getWordIndex = (charIndex: number): number => {
    for (let j = 0; j < wordRanges.length; j++) {
      if (charIndex >= wordRanges[j].start && charIndex < wordRanges[j].end) return j;
    }
    return Math.max(0, wordRanges.length - 1);
  };

  const isCharVisible = (charIndex: number): boolean => {
    if (practiceMode === 'full') return true;
    if (practiceMode === 'blank') return false;
    return getWordIndex(charIndex) % 2 === 0;
  };

  const getCharacterClass = (index: number): string => {
    if (index >= typedText.length) {
      return 'text-gray-300';
    }
    return quotesMatch(typedText[index], targetText[index]) ? 'text-green-600' : 'text-red-600';
  };

  const renderDisplayChar = (char: string, index: number) => {
    if (index < typedText.length) {
      return (
        <span key={index} className={getCharacterClass(index)}>
          {typedText[index]}
        </span>
      );
    }
    if (isCharVisible(index)) {
      return (
        <span key={index} className="text-gray-300">
          {char}
        </span>
      );
    }
    return (
      <span key={index} className="text-gray-300">
        {char === ' ' ? ' ' : '_'}
      </span>
    );
  };

  const totalCharsInPractice = practiceVerses.reduce((sum, v) => sum + v.text.length, 0);
  const completedChars = practiceVerses
    .slice(0, currentVerseIndex)
    .reduce((sum, v) => sum + v.text.length, 0);

  const correctCount = targetText.length > 0
    ? [...typedText].filter((c, i) => quotesMatch(c, targetText[i])).length
    : 0;
  const incorrectCount = typedText.length - correctCount;
  const correctPercent = targetText.length > 0 ? (correctCount / targetText.length) * 100 : 0;
  const incorrectPercent = targetText.length > 0 ? (incorrectCount / targetText.length) * 100 : 0;

  const overallCorrect = completedChars + correctCount;
  const overallTyped = completedChars + typedText.length;
  const overallCorrectPercent = totalCharsInPractice > 0 ? (overallCorrect / totalCharsInPractice) * 100 : 0;
  const overallIncorrectPercent = totalCharsInPractice > 0 ? (incorrectCount / totalCharsInPractice) * 100 : 0;

  if (isComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/collections/${collectionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>

          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold">Practice Complete!</h2>
              <p className="text-gray-600">
                You've completed typing {practiceVerses.length} verse{practiceVerses.length > 1 ? 's' : ''}.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button onClick={resetPractice}>Practice Again</Button>
                <Button variant="outline" onClick={() => navigate(`/collections/${collectionId}`)}>
                  Back to Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/collections/${collectionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{collection.name}</h1>
        </div>

        {/* Due for Review Banner */}
        {dueCount > 0 && (
          <Card className="border-blue-500 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-blue-900">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">
                  {dueCount} verse{dueCount > 1 ? 's' : ''} due for review
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verse Range Selector */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">From Verse</label>
                <Select
                  value={selectedRange.start.toString()}
                  onValueChange={(value) => {
                    const start = parseInt(value);
                    setSelectedRange({
                      start,
                      end: Math.max(start, selectedRange.end),
                    });
                    resetPractice();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {verses.map((verse, index) => (
                      <SelectItem key={verse.id} value={index.toString()}>
                        {verse.reference}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">To Verse</label>
                <Select
                  value={selectedRange.end.toString()}
                  onValueChange={(value) => {
                    const end = parseInt(value);
                    setSelectedRange({
                      start: Math.min(selectedRange.start, end),
                      end,
                    });
                    resetPractice();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {verses.map((verse, index) => (
                      <SelectItem key={verse.id} value={index.toString()}>
                        {verse.reference}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {currentVerseIndex + 1} of {practiceVerses.length}
                {overallTyped > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    {Math.round((overallCorrect / overallTyped) * 100)}%
                  </span>
                )}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="absolute left-0 top-0 h-full bg-green-600 transition-all"
                style={{ width: `${overallCorrectPercent}%` }}
              />
              <div
                className="absolute top-0 h-full bg-red-600 transition-all"
                style={{ left: `${overallCorrectPercent}%`, width: `${overallIncorrectPercent}%` }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Current Verse</span>
              <span>
                {typedText.length > 0
                  ? `${Math.round((correctCount / typedText.length) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="absolute left-0 top-0 h-full bg-green-600 transition-all"
                style={{ width: `${correctPercent}%` }}
              />
              <div
                className="absolute top-0 h-full bg-red-600 transition-all"
                style={{ left: `${correctPercent}%`, width: `${incorrectPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Verse Reference */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-blue-600">
            {currentVerse?.reference}
          </h2>
        </div>

        {/* Practice Mode Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Practice Mode</label>
              <ToggleGroup
                type="single"
                value={practiceMode}
                onValueChange={(value) => value && setPracticeMode(value as PracticeMode)}
                className="w-full max-w-full"
              >
                <ToggleGroupItem value="full" className="flex-1 justify-center">
                  Full
                </ToggleGroupItem>
                <ToggleGroupItem value="alternating" className="flex-1 justify-center">
                  Alternating
                </ToggleGroupItem>
                <ToggleGroupItem value="blank" className="flex-1 justify-center">
                  Blank
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-gray-500">
                {practiceMode === 'full' && 'All words visible'}
                {practiceMode === 'alternating' && 'Every other word hidden'}
                {practiceMode === 'blank' && 'All words hidden — type from memory'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Typing Area - Single inline display, no separate field */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div
              className="font-mono text-lg leading-relaxed p-4 bg-gray-50 rounded-lg min-h-[120px] max-h-[300px] overflow-auto relative cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              {targetText.split('').map((char, index) => (
                <span key={index}>
                  {index === typedText.length && (
                    <span className="inline-block w-0.5 h-5 bg-blue-600 animate-pulse mr-0.5 align-middle" />
                  )}
                  {renderDisplayChar(char, index)}
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={typedText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                maxLength={targetText.length}
                className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                aria-label="Type the verse"
              />
            </div>

            <div className="text-sm text-gray-500 text-center">
              Click above and type the verse. Green = correct, red = mistake.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
