import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { api } from '../../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Play } from 'lucide-react';
import { BOOKS, CHAPTERS_PER_BOOK } from '../../lib/bible-books';

const VERSE_NUMBERS = Array.from({ length: 176 }, (_, i) => i + 1);

export function CollectionDetail() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { collections, getVersesByCollection, addVerse, addBulkVerses, deleteVerse } = useData();

  const [activeAddTab, setActiveAddTab] = useState('manual');
  const [manualReference, setManualReference] = useState('');
  const [manualText, setManualText] = useState('');
  const [esvBook, setEsvBook] = useState('John');
  const [esvChapter, setEsvChapter] = useState('3');
  const [esvStartVerse, setEsvStartVerse] = useState('16');
  const [esvEndVerse, setEsvEndVerse] = useState('16');
  const [isLoadingESV, setIsLoadingESV] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [verseToDelete, setVerseToDelete] = useState<string | null>(null);

  const collection = collectionId ? collections.find(c => c.id === collectionId) : null;
  const verses = collectionId ? getVersesByCollection(collectionId) : [];

  if (!collectionId || !collection) {
    return (
      <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">Collection not found</p>
            <Button onClick={() => navigate('/collections')}>Back to Collections</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleManualAdd = async () => {
    if (!manualReference.trim() || !manualText.trim()) {
      toast.error('Please enter both reference and text');
      return;
    }
    try {
      await addVerse(collectionId, manualReference, manualText);
      setManualReference('');
      setManualText('');
      toast.success('Verse added');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add verse');
    }
  };

  const handleESVAdd = async () => {
    const start = parseInt(esvStartVerse, 10);
    const end = parseInt(esvEndVerse, 10);
    if (start > end) {
      toast.error('Start verse must be less than or equal to end verse');
      return;
    }

    const isRange = start < end;
    const rangeStr = isRange
      ? `${esvBook} ${esvChapter}:${start}-${end}`
      : `${esvBook} ${esvChapter}:${start}`;

    setIsLoadingESV(true);
    try {
      if (isRange) {
        const { added, skipped } = await addBulkVerses(collectionId, rangeStr);
        if (added > 0) {
          toast.success(`Added ${added} verse${added !== 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} skipped (already in collection)` : ''}`);
        } else if (skipped > 0) {
          toast.info('All verses in that range are already in the collection');
        }
      } else {
        const res = await api.get<{ text: string; reference: string }>(
          `/api/passages?q=${encodeURIComponent(rangeStr)}`
        );
        if (res?.text && res?.reference) {
          try {
            await addVerse(collectionId, res.reference, res.text, 'ESV');
            toast.success('Verse added from ESV');
          } catch (addErr) {
            toast.error(addErr instanceof Error ? addErr.message : 'Failed to add verse');
          }
        } else {
          toast.error('Verse not found. Check the reference and try again.');
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      const userMsg =
        msg?.toLowerCase().includes('api key') || msg?.toLowerCase().includes('not configured')
          ? 'Bible text unavailable. Please contact the administrator.'
          : msg || 'Failed to fetch verse from ESV';
      toast.error(userMsg);
    } finally {
      setIsLoadingESV(false);
    }
  };

  const handleDeleteVerse = async () => {
    if (verseToDelete) {
      try {
        await deleteVerse(verseToDelete);
        setShowDeleteDialog(false);
        setVerseToDelete(null);
        toast.success('Verse deleted');
      } catch (e) {
        toast.error('Failed to delete verse');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Header: mobile = back row, then title+play row (play right); desktop = back | title left, play right */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/collections')} className="order-1 sm:order-1 self-start">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center justify-between w-full gap-4 order-2 sm:order-2">
              <h1 className="text-lg sm:text-xl font-bold">{collection.name}</h1>
              {verses.length > 0 && (
                <Button size="icon" className="sm:hidden shrink-0" onClick={() => navigate(`/collections/${collectionId}/practice`)} title="Typing">
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {verses.length > 0 && (
            <Button size="icon" className="max-sm:hidden shrink-0" onClick={() => navigate(`/collections/${collectionId}/practice`)} title="Typing">
              <Play className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Two-column layout on desktop: Add Verses (left) | Verses list (right) */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* Add Verses - compact on left for desktop */}
        <Card className="md:w-80 md:shrink-0">
          <CardHeader className="pb-0 md:py-4 md:pb-0">
            <CardTitle className="text-base">Add Verses</CardTitle>
          </CardHeader>
          <CardContent className="md:py-4 md:pt-0">
            <Tabs value={activeAddTab} onValueChange={setActiveAddTab}>
              <TabsList className="relative grid w-full grid-cols-2">
                <motion.div
                  layout
                  className="absolute top-[3px] bottom-[3px] rounded-xl bg-card shadow-sm dark:bg-input/30 z-0"
                  initial={false}
                  animate={{
                    left: activeAddTab === 'manual' ? '3px' : 'calc(50% + 1.5px)',
                    width: 'calc(50% - 4.5px)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
                <TabsTrigger value="manual" className="relative z-10 data-[state=active]:bg-transparent">Manual Entry</TabsTrigger>
                <TabsTrigger value="esv" className="relative z-10 data-[state=active]:bg-transparent">From ESV</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    placeholder="e.g., John 3:16"
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text">Verse Text</Label>
                  <Textarea
                    id="text"
                    placeholder="Enter the verse text..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleManualAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Verse
                </Button>
              </TabsContent>
              
              <TabsContent value="esv" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Book</Label>
                    <Select
                      value={esvBook}
                      onValueChange={(book) => {
                        setEsvBook(book);
                        const maxCh = CHAPTERS_PER_BOOK[book] ?? 1;
                        if (parseInt(esvChapter, 10) > maxCh) setEsvChapter('1');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOKS.map((book) => (
                          <SelectItem key={book} value={book}>
                            {book}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chapter</Label>
                    <Select value={esvChapter} onValueChange={setEsvChapter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: CHAPTERS_PER_BOOK[esvBook] ?? 1 },
                          (_, i) => i + 1
                        ).map((ch) => (
                          <SelectItem key={ch} value={String(ch)}>
                            {ch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Verse</Label>
                    <Select value={esvStartVerse} onValueChange={(v) => {
                      setEsvStartVerse(v);
                      if (parseInt(esvEndVerse, 10) < parseInt(v, 10)) setEsvEndVerse(v);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VERSE_NUMBERS.map((v) => (
                          <SelectItem key={v} value={String(v)}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Verse</Label>
                    <Select value={esvEndVerse} onValueChange={(v) => {
                      setEsvEndVerse(v);
                      if (parseInt(esvStartVerse, 10) > parseInt(v, 10)) setEsvStartVerse(v);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VERSE_NUMBERS.map((v) => (
                          <SelectItem key={v} value={String(v)}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select Book, Chapter, and verse(s). Use Start/End verse for a range (e.g., John 3:16–21). Requires ESV_API_KEY.
                </p>
                <Button onClick={handleESVAdd} disabled={isLoadingESV}>
                  {isLoadingESV ? 'Loading...' : parseInt(esvStartVerse) === parseInt(esvEndVerse) ? 'Add Verse' : 'Add Verses'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Verse List - right side on desktop */}
        <Card className="md:flex-1 md:min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Verses ({verses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {verses.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                No verses yet. Add some to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {verses.map(verse => (
                  <div
                    key={verse.id}
                    className="p-4 border rounded-lg space-y-2 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/collections/${collectionId}/practice?verseId=${verse.id}`)}
                        className="text-left"
                      >
                        <span className="text-sm sm:text-base font-semibold text-blue-600">{verse.reference}</span>
                      </button>
                      <div className="flex shrink-0 items-center gap-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/collections/${collectionId}/practice?verseId=${verse.id}`)}
                          title="Practice this verse"
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setVerseToDelete(verse.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/collections/${collectionId}/practice?verseId=${verse.id}`)}
                      className="block w-full text-left"
                    >
                      <div className="space-y-2">
                        {verse.text
                          .split(/\n\n+/)
                          .map((para) => para.trim())
                          .filter(Boolean)
                          .map((para, i) => (
                            <p key={i} className="text-foreground leading-relaxed text-sm sm:text-base break-words">
                              {para}
                            </p>
                          ))}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Delete Verse Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Verse</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this verse? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteVerse}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}