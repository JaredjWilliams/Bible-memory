import { api } from './api';

export interface ReaderNote {
  id: string;
  book: string;
  chapter: number;
  verseRange: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ReaderNoteDto {
  id: number;
  book: string;
  chapter: number;
  verseRange: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function toReaderNote(dto: ReaderNoteDto): ReaderNote {
  return {
    id: String(dto.id),
    book: dto.book,
    chapter: dto.chapter,
    verseRange: dto.verseRange,
    content: dto.content,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export async function fetchChapterNotes(book: string, chapter: number): Promise<ReaderNote[]> {
  const dtos = await api.get<ReaderNoteDto[]>(
    `/api/reader-notes?book=${encodeURIComponent(book)}&chapter=${chapter}`
  );
  return dtos.map(toReaderNote);
}

export async function createReaderNote(data: {
  book: string;
  chapter: number;
  verseRange: string;
  content: string;
}): Promise<ReaderNote> {
  const dto = await api.post<ReaderNoteDto>('/api/reader-notes', data);
  return toReaderNote(dto);
}

export async function updateReaderNote(id: string, content: string): Promise<ReaderNote> {
  const dto = await api.put<ReaderNoteDto>(`/api/reader-notes/${id}`, { content });
  return toReaderNote(dto);
}

export async function deleteReaderNote(id: string): Promise<void> {
  await api.delete(`/api/reader-notes/${id}`);
}
