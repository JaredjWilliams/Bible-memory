// Data context for managing profiles, collections, and verses
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../../lib/api';

export interface Profile {
  id: string;
  name: string;
  userId: string;
}

export interface Collection {
  id: string;
  name: string;
  profileId: string;
}

export interface Verse {
  id: string;
  reference: string;
  text: string;
  collectionId: string;
  order: number;
  nextReview?: Date;
  reviewCount: number;
}

interface DataContextType {
  profiles: Profile[];
  currentProfile: Profile | null;
  createProfile: (name: string) => Promise<void>;
  selectProfile: (profileId: string) => void;
  deleteProfile: (profileId: string) => Promise<void>;
  collections: Collection[];
  createCollection: (name: string) => Promise<void>;
  deleteCollection: (collectionId: string) => Promise<void>;
  getVersesByCollection: (collectionId: string) => Verse[];
  addVerse: (collectionId: string, reference: string, text: string, source?: string) => Promise<void>;
  deleteVerse: (verseId: string) => Promise<void>;
  recordPractice: (verseId: string, success: boolean) => Promise<void>;
  getDueVerses: (collectionId: string) => number;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

// Backend DTOs
interface ProfileDto {
  id: number;
  name: string;
  createdAt: string;
}

interface CollectionDto {
  id: number;
  name: string;
  createdAt: string;
}

interface VerseDto {
  id: number;
  reference: string;
  text: string;
  orderIndex: number;
  source: string | null;
  createdAt: string;
}

interface DueVerseDto {
  id: number;
  collectionId: number;
  reference: string;
  text: string;
  orderIndex: number;
  source: string | null;
  createdAt: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function toProfile(dto: ProfileDto, userId: string): Profile {
  return {
    id: String(dto.id),
    name: dto.name,
    userId,
  };
}

function toCollection(dto: CollectionDto, profileId: string): Collection {
  return {
    id: String(dto.id),
    name: dto.name,
    profileId,
  };
}

function toVerse(dto: VerseDto, collectionId: string): Verse {
  return {
    id: String(dto.id),
    reference: dto.reference,
    text: dto.text,
    collectionId,
    order: dto.orderIndex,
    reviewCount: 0,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [dueVerses, setDueVerses] = useState<DueVerseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (!user) return;
    const dtos = await api.get<ProfileDto[]>('/api/profiles');
    const list = dtos.map((d) => toProfile(d, user.id));
    setProfiles(list);

    // Auto-create default profile if none exist
    if (list.length === 0) {
      const created = await api.post<ProfileDto>('/api/profiles', {
        name: `${user.username}'s Profile`,
      });
      const newProfile = toProfile(created, user.id);
      setProfiles([newProfile]);
      setCurrentProfile(newProfile);
      localStorage.setItem(`bible-memory-current-profile-${user.id}`, newProfile.id);
      return;
    }

    // Restore current profile selection
    const stored = localStorage.getItem(`bible-memory-current-profile-${user.id}`);
    const selected = stored ? list.find((p) => p.id === stored) ?? list[0] : list[0];
    setCurrentProfile(selected);
    if (!stored) {
      localStorage.setItem(`bible-memory-current-profile-${user.id}`, selected.id);
    }
  }, [user]);

  const loadCollections = useCallback(async () => {
    if (!user || !currentProfile) return;
    const dtos = await api.get<CollectionDto[]>(`/api/collections?profileId=${currentProfile.id}`);
    const list = dtos.map((d) => toCollection(d, currentProfile.id));
    setCollections(list);
  }, [user, currentProfile]);

  const loadVerses = useCallback(async () => {
    if (!user || collections.length === 0) return;
    const allVerses: Verse[] = [];
    for (const col of collections) {
      const dtos = await api.get<VerseDto[]>(`/api/verses?collectionId=${col.id}`);
      allVerses.push(...dtos.map((d) => toVerse(d, col.id)));
    }
    setVerses(allVerses);
  }, [user, collections]);

  const loadDueVerses = useCallback(async () => {
    if (!user) return;
    const dtos = await api.get<DueVerseDto[]>('/api/practice/due');
    setDueVerses(dtos);
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await loadProfiles();
    } finally {
      setIsLoading(false);
    }
  }, [user, loadProfiles]);

  useEffect(() => {
    if (user) {
      loadProfiles();
    } else {
      setProfiles([]);
      setCurrentProfile(null);
      setCollections([]);
      setVerses([]);
      setDueVerses([]);
    }
  }, [user]);

  useEffect(() => {
    if (currentProfile) {
      loadCollections();
    } else {
      setCollections([]);
      setVerses([]);
    }
  }, [currentProfile, loadCollections]);

  useEffect(() => {
    if (collections.length > 0) {
      loadVerses();
    } else {
      setVerses([]);
    }
  }, [collections, loadVerses]);

  useEffect(() => {
    if (user) {
      loadDueVerses();
    }
  }, [user, loadDueVerses]);

  const selectProfile = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile && user) {
      setCurrentProfile(profile);
      localStorage.setItem(`bible-memory-current-profile-${user.id}`, profileId);
    }
  };

  const createProfile = async (name: string) => {
    if (!user) return;
    const dto = await api.post<ProfileDto>('/api/profiles', { name });
    const newProfile = toProfile(dto, user.id);
    setProfiles((prev) => [...prev, newProfile]);
    if (profiles.length === 0) {
      selectProfile(newProfile.id);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!user) return;
    await api.delete(`/api/profiles/${profileId}`);
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    setCollections((prev) => prev.filter((c) => c.profileId !== profileId));
    setVerses((prev) => prev.filter((v) => {
      const col = collections.find((c) => c.id === v.collectionId);
      return col?.profileId !== profileId;
    }));
    if (currentProfile?.id === profileId) {
      const remaining = profiles.filter((p) => p.id !== profileId);
      setCurrentProfile(remaining[0] ?? null);
      if (remaining[0]) {
        localStorage.setItem(`bible-memory-current-profile-${user.id}`, remaining[0].id);
      } else {
        localStorage.removeItem(`bible-memory-current-profile-${user.id}`);
      }
    }
  };

  const createCollection = async (name: string) => {
    if (!user || !currentProfile) return;
    const dto = await api.post<CollectionDto>('/api/collections', {
      profileId: Number(currentProfile.id),
      name,
    });
    const newCollection = toCollection(dto, currentProfile.id);
    setCollections((prev) => [...prev, newCollection]);
  };

  const deleteCollection = async (collectionId: string) => {
    if (!user) return;
    await api.delete(`/api/collections/${collectionId}`);
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    setVerses((prev) => prev.filter((v) => v.collectionId !== collectionId));
  };

  const getVersesByCollection = (collectionId: string): Verse[] => {
    return verses
      .filter((v) => v.collectionId === collectionId)
      .sort((a, b) => a.order - b.order);
  };

  const addVerse = async (collectionId: string, reference: string, text: string, source?: string) => {
    if (!user) return;
    const dto = await api.post<VerseDto>('/api/verses', {
      collectionId: Number(collectionId),
      reference,
      text,
      source: source ?? null,
    });
    const newVerse = toVerse(dto, collectionId);
    setVerses((prev) => [...prev, newVerse]);
  };

  const deleteVerse = async (verseId: string) => {
    if (!user) return;
    await api.delete(`/api/verses/${verseId}`);
    setVerses((prev) => prev.filter((v) => v.id !== verseId));
  };

  const recordPractice = async (verseId: string, success: boolean) => {
    if (!user) return;
    await api.post('/api/practice/result', {
      verseIds: [Number(verseId)],
      accuracy: success ? 100 : 0,
      completed: true,
    });
    await loadDueVerses();
  };

  const getDueVerses = (collectionId: string): number => {
    return dueVerses.filter((v) => String(v.collectionId) === collectionId).length;
  };

  return (
    <DataContext.Provider
      value={{
        profiles,
        currentProfile,
        createProfile,
        selectProfile,
        deleteProfile,
        collections,
        createCollection,
        deleteCollection,
        getVersesByCollection,
        addVerse,
        deleteVerse,
        recordPractice,
        getDueVerses,
        isLoading,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
