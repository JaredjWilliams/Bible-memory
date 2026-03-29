import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useData, Verse, Note } from '../context/DataContext';
import { normalizeForCompare, quotesMatch } from '../../lib/typing-practice-utils';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../components/ui/utils';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { ArrowLeft, StickyNote, Trash2, Plus, Check } from 'lucide-react';
import { motion } from 'motion/react';

type PracticeMode = 'full' | 'alternating' | 'blank';

export function TypingPractice() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [searchParams] = useSearchParams();
  const verseIdParam = searchParams.get('verseId');
  const navigate = useNavigate();
  const {
    collections,
    getVersesByCollectionSubtree,
    recordPractice,
    getNotes,
    createNote,
    updateNote,
    deleteNote,
  } = useData();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('full');
  const [hasRetriedCurrentVerse, setHasRetriedCurrentVerse] = useState(false);
  const [notePanelOpen, setNotePanelOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draftContent, setDraftContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncForceKey, setSyncForceKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  // Derive practiceVerses and currentVerse early so useEffects can reference them
  const practiceVerses = verseIdParam
    ? (() => {
        const v = verses.find((x) => x.id === verseIdParam);
        return v ? [v] : verses;
      })()
    : verses;
  const currentVerse = practiceVerses[currentVerseIndex];

  const resetPractice = useCallback(() => {
    setCurrentVerseIndex(0);
    setTypedText('');
    setIsComplete(false);
    setStartTime(null);
    setHasRetriedCurrentVerse(false);
  }, []);

  useEffect(() => {
    if (collectionId) {
      setVerses(getVersesByCollectionSubtree(collectionId));
    }
  }, [collectionId, getVersesByCollectionSubtree]);

  useEffect(() => {
    resetPractice();
  }, [practiceMode, resetPractice]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [currentVerseIndex, verses.length]);

  // Refocus verse input after we force re-sync (reject spurious event)
  useEffect(() => {
    if (syncForceKey > 0) {
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [syncForceKey]);

  // Load notes when current verse changes
  useEffect(() => {
    if (!currentVerse?.id) {
      setNotes([]);
      setDraftContent('');
      setEditingContent({});
      return;
    }
    getNotes(currentVerse.id).then(setNotes).catch(() => setNotes([]));
    setDraftContent('');
    setEditingContent({});
    setEditingNoteId(null);
  }, [currentVerse?.id, getNotes]);

  // Focus note input when panel opens (mobile)
  useEffect(() => {
    if (notePanelOpen) {
      const timer = setTimeout(() => noteInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [notePanelOpen]);

  // Clear saved checkmark after 2 seconds
  useEffect(() => {
    if (savedAt === null) return;
    const timer = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const handleToggleNotePanel = () => {
    inputRef.current?.blur();
    setNotePanelOpen((prev) => !prev);
  };

  const handleSaveDraft = async () => {
    if (!currentVerse?.id || !draftContent.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const note = await createNote(currentVerse.id, draftContent.trim());
      setNotes((prev) => [...prev, note]);
      setDraftContent('');
      setSavedAt(Date.now());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    const content = editingContent[noteId];
    if (content === undefined || isSaving) return;
    setIsSaving(true);
    try {
      const updated = await updateNote(noteId, content);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingContent((prev) => {
        const next = { ...prev };
        delete next[noteId];
        return next;
      });
      setEditingNoteId(null);
      setSavedAt(Date.now());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setEditingContent((prev) => {
        const next = { ...prev };
        delete next[noteId];
        return next;
      });
      setEditingNoteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setIsSaving(false);
    }
  };

  const collection = collectionId ? collections.find(c => c.id === collectionId) : null;

  if (!collectionId || !collection) {
    return (
      <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">Collection not found</p>
              <Button onClick={() => navigate('/collections')}>Back to Collections</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (verses.length === 0) {
    return (
      <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/collections/${collectionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="mt-4">
            <CardContent className="py-8 text-center text-gray-500 text-sm sm:text-base">
              No verses in this collection. Add some verses first!
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const targetText = currentVerse?.text || '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const newText = normalizeForCompare(rawValue);

    // Reject spurious onChange: value must be valid edit (append or delete at end only).
    const isValidEdit =
      newText === typedText ||
      typedText.startsWith(newText) ||
      newText.startsWith(typedText);

    if (!isValidEdit) {
      setSyncForceKey((k) => k + 1);
      return;
    }

    if (isComposingRef.current) {
      return;
    }

    if (!startTime && newText.length === 1) {
      setStartTime(Date.now());
    }

    if (newText.length <= targetText.length) {
      setTypedText(newText);
    }

    if (newText.length !== targetText.length) return;

    const correctCount = [...newText].filter((c, i) => quotesMatch(c, targetText[i])).length;
    const correctPercent = (correctCount / targetText.length) * 100;

    if (correctPercent < 90) {
      toast.error('You did not meet the 90% mark. Please retry this verse.');
      setTypedText('');
      setHasRetriedCurrentVerse(true);
      return;
    }

    const endTime = Date.now();
    const elapsedSeconds = startTime ? (endTime - startTime) / 1000 : 0;
    const wordCount = targetText.split(' ').length;
    const success = elapsedSeconds < wordCount * 5;
    const incrementInterval = practiceMode === 'blank' && !hasRetriedCurrentVerse && success;

    recordPractice(currentVerse.id, success, incrementInterval).catch((err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save practice result');
    });

    setTimeout(() => {
      if (currentVerseIndex < practiceVerses.length - 1) {
        setCurrentVerseIndex(currentVerseIndex + 1);
        setTypedText('');
        setStartTime(null);
        setHasRetriedCurrentVerse(false);
      } else {
        setIsComplete(true);
      }
    }, 500);
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
      return 'text-muted-foreground/60';
    }
    return quotesMatch(typedText[index], targetText[index]) ? 'text-green-600' : 'text-red-600';
  };

  const renderDisplayChar = (char: string, index: number) => {
    if (index < typedText.length) {
      const isCorrect = quotesMatch(typedText[index], targetText[index]);
      return (
        <span key={index} className={getCharacterClass(index)}>
          {isCorrect ? typedText[index] : targetText[index]}
        </span>
      );
    }
    if (isCharVisible(index)) {
      return (
        <span key={index} className="text-muted-foreground/70">
          {char}
        </span>
      );
    }
    return (
      <span key={index} className="text-muted-foreground/70">
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
      <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/collections/${collectionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>

          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="text-2xl mb-4">🎉</div>
              <h2 className="text-lg sm:text-xl font-bold">Practice Complete!</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                You've completed typing {practiceVerses.length} verse{practiceVerses.length > 1 ? 's' : ''}.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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
    <div className="container mx-auto px-4 pt-4 pb-6 sm:pt-6 sm:pb-8 text-sm sm:text-base">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/collections/${collectionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg sm:text-xl font-bold">{collection.name}</h1>
        </div>

        {/* Progress - hidden on mobile, shown on sm+ */}
        <div className="max-sm:hidden block space-y-3">
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

        {/* Typing Area + Note Panel - order-1 mobile (first), order-2 desktop (below toggle) */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 flex-1 min-w-0 order-1 md:order-2">
          {/* Verse card - compresses when note open on desktop */}
          <Card className="relative flex-1 min-w-0 order-2 md:order-1">
            <div
              className={cn(
                'sm:hidden absolute top-4 right-6 text-xs font-medium z-10',
                typedText.length === 0
                  ? 'text-muted-foreground'
                  : correctPercent >= 80
                    ? 'text-green-600'
                    : correctPercent >= 50
                      ? 'text-orange-500'
                      : 'text-red-600'
              )}
            >
              {typedText.length > 0 ? `${Math.round(correctPercent)}%` : '0%'}
            </div>
            <CardContent className="pt-4 sm:pt-6 space-y-4">
              {/* Header: note icon (left) + verse title (center) */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
                  onClick={handleToggleNotePanel}
                  aria-label={notePanelOpen ? 'Close notes' : 'Open notes'}
                >
                  <StickyNote className={cn('h-4 w-4', notePanelOpen && 'fill-current')} />
                  {notes.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {notes.length}
                    </span>
                  )}
                </Button>
                <h2 className="flex-1 text-base font-semibold text-blue-600 dark:text-blue-400 text-center">
                  {currentVerse?.reference}
                </h2>
                <div className="w-8 shrink-0" aria-hidden />
              </div>
              <div
                className="font-mono text-sm sm:text-base leading-relaxed p-4 bg-muted dark:bg-muted/50 rounded-lg min-h-[120px] max-h-[300px] overflow-auto relative cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                {targetText.split('').map((char, index) => (
                  <span key={index}>
                    {index === typedText.length && (
                      <span className="inline-block w-0.5 h-4 bg-blue-600 animate-pulse mr-0.5 align-middle -translate-y-1 translate-x-0.5" />
                    )}
                    {renderDisplayChar(char, index)}
                  </span>
                ))}
                <input
                  ref={inputRef}
                  key={syncForceKey}
                  type="text"
                  value={typedText}
                  onChange={handleInputChange}
                  onCompositionStart={() => { isComposingRef.current = true; }}
                  onCompositionEnd={(e: React.CompositionEvent<HTMLInputElement>) => {
                    isComposingRef.current = false;
                    const finalText = normalizeForCompare((e.target as HTMLInputElement).value);
                    if (finalText.length <= targetText.length) {
                      setTypedText(finalText);
                    }
                  }}
                  onBlur={() => {
                    isComposingRef.current = false;
                  }}
                  onKeyDown={(e) => {
                    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace'].includes(e.key)) {
                      e.preventDefault();
                      return;
                    }
                    const nextChar = targetText[typedText.length];
                    if (nextChar === ' ' && e.key !== ' ') {
                      e.preventDefault();
                    }
                  }}
                  maxLength={targetText.length}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text bg-transparent text-transparent"
                  aria-label="Type the verse"
                />
              </div>

              <div className="text-xs sm:text-sm text-muted-foreground text-center">
                Click above and type the verse. Green = correct, red = mistake.
              </div>
            </CardContent>
          </Card>

          {/* Note panel - above on mobile, right on desktop */}
          {notePanelOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="order-1 md:order-2 w-full md:w-80 md:shrink-0"
            >
              <Card className="h-full border-input bg-background dark:bg-background dark:border-input gap-2 md:gap-6">
                <CardContent className="px-3 pt-2 pb-2 space-y-2 md:px-6 md:pt-4 md:pb-4 md:space-y-4 [&:last-child]:pb-2 md:[&:last-child]:pb-6">
                  <div className="flex items-center justify-between gap-2 min-h-0">
                    <h3 className="text-xs font-semibold text-foreground dark:text-foreground md:text-sm shrink-0">Notes</h3>
                    {savedAt !== null && (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400 md:text-xs shrink-0">
                        <Check className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        Saved
                      </span>
                    )}
                  </div>

                  {/* Add note - draft */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => noteInputRef.current?.focus()}
                      className="h-7 px-2 text-xs shrink-0 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 md:h-8 md:px-3"
                    >
                      <Plus className="h-3.5 w-3.5 mr-0.5 md:h-4 md:w-4 md:mr-1" />
                      Add note
                    </Button>
                  </div>

                  {/* New note draft */}
                  <div className="space-y-1.5 md:space-y-2">
                    <Textarea
                      ref={noteInputRef}
                      placeholder="Add a note..."
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      className="min-h-[56px] md:min-h-[80px] py-2 px-2.5 text-sm bg-muted/50 dark:bg-muted/30 border-input text-foreground dark:text-foreground placeholder:text-muted-foreground"
                    />
                    <div className="flex gap-1.5 md:gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveDraft}
                        disabled={!draftContent.trim() || isSaving}
                        className="h-7 text-xs flex-1 md:h-8 md:text-sm"
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* List of saved notes */}
                  <div className="space-y-2 md:space-y-3 max-h-[140px] md:max-h-[200px] overflow-auto">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2 rounded-md border border-input bg-muted/30 dark:bg-muted/20 dark:border-input md:p-3 md:rounded-lg"
                      >
                        <Textarea
                          placeholder="Note content..."
                          value={editingContent[note.id] ?? note.content}
                          onChange={(e) => {
                            setEditingContent((prev) => ({ ...prev, [note.id]: e.target.value }));
                            setEditingNoteId(note.id);
                          }}
                          onFocus={() => setEditingNoteId(note.id)}
                          className="min-h-[44px] md:min-h-[60px] py-1.5 px-2 text-xs md:text-sm bg-background dark:bg-background border-input text-foreground dark:text-foreground"
                        />
                        <div className="flex gap-1.5 mt-1.5 md:gap-2 md:mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={isSaving || (editingContent[note.id] ?? note.content) === note.content}
                            className="h-7 text-xs flex-1 md:h-8 md:text-sm"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={isSaving}
                            className="h-7 w-7 shrink-0 p-0 md:h-8 md:w-8"
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Practice Mode Toggle - order-2 mobile (below input), order-1 desktop (above input) */}
        <Card className="order-2 md:order-1">
          <CardContent className="flex items-center justify-center py-3 !pb-3">
            <div className="relative w-full max-w-full rounded-md border border-input bg-transparent p-0.5">
              <motion.div
                className="absolute top-0.5 bottom-0.5 w-[calc(33.333%-2px)] rounded-md bg-accent z-0"
                animate={{
                  left: practiceMode === 'full' ? '2px' : practiceMode === 'alternating' ? 'calc(33.333% + 1px)' : 'calc(66.666% + 1px)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
              <ToggleGroup
                type="single"
                value={practiceMode}
                onValueChange={(value) => value && setPracticeMode(value as PracticeMode)}
                className="relative z-10 w-full border-0 bg-transparent shadow-none p-0"
              >
                <ToggleGroupItem value="full" className="flex-1 justify-center text-xs border-0 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-accent-foreground">
                  Full
                </ToggleGroupItem>
                <ToggleGroupItem value="alternating" className="flex-1 justify-center text-xs border-0 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-accent-foreground">
                  Alternating
                </ToggleGroupItem>
                <ToggleGroupItem value="blank" className="flex-1 justify-center text-xs border-0 bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-accent-foreground">
                  Blank
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
