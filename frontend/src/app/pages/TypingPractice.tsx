import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useData, Verse } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';

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
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    // Focus input when component mounts or verse changes
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // Start timer on first keystroke
    if (!startTime && newText.length === 1) {
      setStartTime(Date.now());
    }
    
    // Prevent typing more than the target text length
    if (newText.length <= targetText.length) {
      setTypedText(newText);
    }

    // Check if verse is complete
    if (newText === targetText) {
      const endTime = Date.now();
      const elapsedSeconds = startTime ? (endTime - startTime) / 1000 : 0;
      
      // Record success if completed reasonably quickly (within 5 seconds per word)
      const wordCount = targetText.split(' ').length;
      const success = elapsedSeconds < wordCount * 5;
      
      recordPractice(currentVerse.id, success).catch(() => {
        toast.error('Failed to save practice result');
      });
      
      // Move to next verse or complete
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

  const getCharacterClass = (index: number): string => {
    if (index >= typedText.length) {
      return 'text-gray-300';
    }
    return typedText[index] === targetText[index] ? 'text-green-600' : 'text-red-600';
  };

  const overallProgress = practiceVerses.length > 0
    ? ((currentVerseIndex + (typedText.length / targetText.length)) / practiceVerses.length) * 100
    : 0;

  const verseProgress = targetText.length > 0
    ? (typedText.length / targetText.length) * 100
    : 0;

  const resetPractice = () => {
    setCurrentVerseIndex(0);
    setTypedText('');
    setIsComplete(false);
    setStartTime(null);
  };

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
              <span>{currentVerseIndex + 1} of {practiceVerses.length}</span>
            </div>
            <Progress value={overallProgress} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Current Verse</span>
              <span>{Math.round(verseProgress)}%</span>
            </div>
            <Progress value={verseProgress} />
          </div>
        </div>

        {/* Current Verse Reference */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-blue-600">
            {currentVerse?.reference}
          </h2>
        </div>

        {/* Typing Area */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Visual feedback text */}
            <div className="font-mono text-lg leading-relaxed p-4 bg-gray-50 rounded-lg min-h-[120px] relative">
              {targetText.split('').map((char, index) => (
                <span key={index} className={getCharacterClass(index)}>
                  {char}
                  {index === typedText.length && (
                    <span className="inline-block w-0.5 h-5 bg-blue-600 animate-pulse ml-0.5" />
                  )}
                </span>
              ))}
            </div>

            {/* Hidden input for typing */}
            <textarea
              ref={inputRef}
              value={typedText}
              onChange={handleInputChange}
              className="w-full p-4 border rounded-lg font-mono text-lg resize-none"
              placeholder="Start typing the verse..."
              rows={4}
              autoFocus
            />

            <div className="text-sm text-gray-500 text-center">
              Type the verse exactly as shown above. Green indicates correct characters,
              red indicates mistakes.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}