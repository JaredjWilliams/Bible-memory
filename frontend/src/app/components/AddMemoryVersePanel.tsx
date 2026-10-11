import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useAuth } from '../context/AuthContext';
import { useData, type Collection } from '../context/DataContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AddMemoryVersePanelProps {
  book: string;
  chapter: number;
  verseNum: number;
  onAdded: () => void;
}

type TargetMode = 'existing' | 'new';

function normalizeReference(reference: string): string {
  return reference.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Depth-first list so nested collections sit under their parent. */
function orderedCollections(collections: Collection[]): { collection: Collection; depth: number }[] {
  const byParent = new Map<string | null, Collection[]>();
  for (const collection of collections) {
    const parentId = collection.parentCollectionId;
    const siblings = byParent.get(parentId) ?? [];
    siblings.push(collection);
    byParent.set(parentId, siblings);
  }
  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const ordered: { collection: Collection; depth: number }[] = [];
  const seen = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    for (const collection of byParent.get(parentId) ?? []) {
      if (seen.has(collection.id)) continue;
      seen.add(collection.id);
      ordered.push({ collection, depth });
      walk(collection.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const collection of collections) {
    if (!seen.has(collection.id)) {
      seen.add(collection.id);
      ordered.push({ collection, depth: 0 });
    }
  }
  return ordered;
}

export function AddMemoryVersePanel({ book, chapter, verseNum, onAdded }: AddMemoryVersePanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collections, getVersesByCollection, createCollection, addVerse } = useData();
  const [mode, setMode] = useState<TargetMode>('existing');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reference = `${book} ${chapter}:${verseNum}`;
  const options = useMemo(() => orderedCollections(collections), [collections]);
  const selected = collections.find((collection) => collection.id === selectedId) ?? null;

  const alreadyInCollection = useMemo(() => {
    if (mode !== 'existing' || !selectedId) return false;
    const target = normalizeReference(reference);
    return getVersesByCollection(selectedId).some(
      (verse) => normalizeReference(verse.reference) === target
    );
  }, [mode, selectedId, reference, getVersesByCollection]);

  const trimmedName = newName.trim();
  const hasTarget = mode === 'existing' ? selectedId != null : trimmedName.length > 0;
  const canAdd = hasTarget && !isSaving;

  const handleAdd = async () => {
    if (!hasTarget || isSaving) return;
    if (alreadyInCollection) {
      toast.info(`This verse is already in ${selected?.name ?? 'that collection'}.`);
      return;
    }

    setIsSaving(true);
    try {
      let collectionId = selectedId;
      let collectionName = selected?.name ?? '';

      if (mode === 'new') {
        const created = await createCollection(trimmedName);
        if (!created) {
          toast.error('Could not create the collection. Try logging in again.');
          return;
        }
        collectionId = created.id;
        collectionName = created.name;
      }

      if (!collectionId) return;

      if (mode === 'existing') {
        const target = normalizeReference(reference);
        const exists = getVersesByCollection(collectionId).some(
          (verse) => normalizeReference(verse.reference) === target
        );
        if (exists) {
          toast.info(`This verse is already in ${collectionName}.`);
          return;
        }
      }

      const passage = await api.get<{ text: string; reference: string }>(
        `/api/passages?q=${encodeURIComponent(reference)}`
      );
      const text = passage?.text?.trim();
      if (!text) {
        toast.error('Could not load the verse text.');
        return;
      }

      await addVerse(collectionId, passage.reference?.trim() || reference, text, 'ESV');
      toast.success(`Added ${reference} to ${collectionName}`);
      onAdded();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add verse';
      if (message.toLowerCase().includes('already')) {
        toast.info(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Log in to save {reference} as a memory verse.
        </p>
        <Button size="sm" className="h-7 w-full text-xs" onClick={() => navigate('/login')}>
          Log in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{reference}</p>
      <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-0.5">
        <button
          type="button"
          className={`rounded px-2 py-1 text-xs font-medium ${
            mode === 'existing' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
          onClick={() => setMode('existing')}
        >
          Existing
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 text-xs font-medium ${
            mode === 'new' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
          onClick={() => setMode('new')}
        >
          New collection
        </button>
      </div>

      {mode === 'existing' ? (
        options.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">
            You don&apos;t have any collections yet. Create one to save this verse.
          </p>
        ) : (
          <div className="max-h-32 overflow-y-auto rounded-md border border-border">
            {options.map(({ collection, depth }) => {
              const isSelected = collection.id === selectedId;
              return (
                <button
                  key={collection.id}
                  type="button"
                  className={`block w-full text-left text-xs px-2 py-1.5 hover:bg-accent ${
                    isSelected ? 'bg-primary/10 text-foreground' : 'text-foreground'
                  }`}
                  style={{ paddingLeft: `${8 + depth * 12}px` }}
                  onClick={() => setSelectedId(collection.id)}
                >
                  {collection.name}
                </button>
              );
            })}
          </div>
        )
      ) : (
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Collection name"
          className="h-8 text-xs"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canAdd) {
              event.preventDefault();
              void handleAdd();
            }
          }}
        />
      )}

      {alreadyInCollection && (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
          This verse is already in {selected?.name ?? 'this collection'}.
        </p>
      )}

      <Button
        size="sm"
        className="h-7 w-full text-xs"
        disabled={!canAdd}
        onClick={() => void handleAdd()}
      >
        {isSaving ? 'Adding…' : 'Add'}
      </Button>
    </div>
  );
}
