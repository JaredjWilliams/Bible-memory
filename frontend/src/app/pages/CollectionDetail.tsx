import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useData } from '../context/DataContext';
import { api } from '../../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Play } from 'lucide-react';

export function CollectionDetail() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { collections, getVersesByCollection, addVerse, deleteVerse } = useData();

  const [manualReference, setManualReference] = useState('');
  const [manualText, setManualText] = useState('');
  const [esvReference, setEsvReference] = useState('');
  const [isLoadingESV, setIsLoadingESV] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [verseToDelete, setVerseToDelete] = useState<string | null>(null);

  const collection = collectionId ? collections.find(c => c.id === collectionId) : null;
  const verses = collectionId ? getVersesByCollection(collectionId) : [];

  if (!collectionId || !collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-4">Collection not found</p>
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
      toast.error('Failed to add verse');
    }
  };

  const handleESVAdd = async () => {
    if (!esvReference.trim()) {
      toast.error('Please enter a verse reference');
      return;
    }

    setIsLoadingESV(true);
    try {
      const res = await api.get<{ text: string; reference: string }>(
        `/api/passages?q=${encodeURIComponent(esvReference.trim())}`
      );
      if (res?.text && res?.reference) {
        await addVerse(collectionId, res.reference, res.text, 'ESV');
        setEsvReference('');
        toast.success('Verse added from ESV');
      } else {
        toast.error('Verse not found. Check the reference and try again.');
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/collections')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">{collection.name}</h1>
          </div>
          {verses.length > 0 && (
            <Button onClick={() => navigate(`/collections/${collectionId}/practice`)}>
              <Play className="h-4 w-4 mr-2" />
              Practice Typing
            </Button>
          )}
        </div>

        {/* Add Verses */}
        <Card>
          <CardHeader>
            <CardTitle>Add Verses</CardTitle>
            <CardDescription>
              Add verses manually or fetch them from the ESV Bible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="esv">From ESV</TabsTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="esvReference">Reference</Label>
                  <Input
                    id="esvReference"
                    placeholder="e.g., John 3:16 or Matthew 1:1-3"
                    value={esvReference}
                    onChange={(e) => setEsvReference(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleESVAdd();
                    }}
                  />
                  <p className="text-sm text-gray-500">
                    Enter a reference (e.g., John 3:16 or Matthew 1:1-3). Requires ESV_API_KEY on the backend.
                  </p>
                </div>
                <Button onClick={handleESVAdd} disabled={isLoadingESV}>
                  {isLoadingESV ? 'Loading...' : 'Fetch from ESV'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Verse List */}
        <Card>
          <CardHeader>
            <CardTitle>Verses ({verses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {verses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No verses yet. Add some to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {verses.map(verse => (
                  <div
                    key={verse.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-blue-600 mb-2">
                          {verse.reference}
                        </div>
                        <p className="text-gray-700">{verse.text}</p>
                      </div>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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