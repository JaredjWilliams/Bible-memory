import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, FolderOpen } from 'lucide-react';

export function Collections() {
  const { user } = useAuth();
  const {
    currentProfile,
    collections,
    createCollection,
    deleteCollection,
  } = useData();
  const navigate = useNavigate();

  const [newCollectionName, setNewCollectionName] = useState('');
  const [showDeleteCollectionDialog, setShowDeleteCollectionDialog] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">Please log in to view collections</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateCollection = async () => {
    if (!currentProfile) {
      toast.error('Profile not loaded. Please refresh the page.');
      return;
    }
    if (!newCollectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }
    try {
      await createCollection(newCollectionName);
      setNewCollectionName('');
      toast.success('Collection created');
    } catch (e) {
      toast.error('Failed to create collection');
    }
  };

  const handleDeleteCollection = async () => {
    if (collectionToDelete) {
      try {
        await deleteCollection(collectionToDelete);
        setShowDeleteCollectionDialog(false);
        setCollectionToDelete(null);
        toast.success('Collection deleted');
      } catch (e) {
        toast.error('Failed to delete collection');
      }
    }
  };

  const currentCollections = collections.filter(
    c => c.profileId === currentProfile?.id
  );

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8 text-sm sm:text-base">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Collections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Collections</CardTitle>
            <CardDescription className="text-sm">
              Create collections to group verses by topic or study plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Collection name (e.g., Romans 8)"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCollection();
                }}
              />
              <Button onClick={handleCreateCollection}>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>

            {currentCollections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No collections yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentCollections.map(collection => (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <button
                      onClick={() => navigate(`/collections/${collection.id}`)}
                      className="flex-1 text-left"
                    >
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">{collection.name}</h3>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCollectionToDelete(collection.id);
                        setShowDeleteCollectionDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Collection Dialog */}
      <Dialog open={showDeleteCollectionDialog} onOpenChange={setShowDeleteCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this collection? This will also delete
              all verses in this collection. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteCollectionDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCollection}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}