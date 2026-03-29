import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { TypingPractice } from './TypingPractice';

const mockRecordPractice = vi.fn().mockResolvedValue(undefined);
const mockCreateNote = vi.fn().mockResolvedValue({ id: '1', verseId: '1', content: 'note', createdAt: '', updatedAt: '' });
const mockGetNotes = vi.fn().mockResolvedValue([]);
const mockUpdateNote = vi.fn().mockResolvedValue({});
const mockDeleteNote = vi.fn().mockResolvedValue(undefined);

const mockVerse = {
  id: '1',
  reference: 'Matthew 6:26',
  text: 'Look at the birds of the air.',
  collectionId: 'col1',
  order: 0,
  reviewCount: 0,
};

const mockUseData = vi.fn();

vi.mock('../context/DataContext', () => ({
  useData: () => mockUseData(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function renderAtPractice(collectionId: string, verseId?: string) {
  const path = verseId
    ? `/collections/${collectionId}/practice?verseId=${verseId}`
    : `/collections/${collectionId}/practice`;
  const router = createMemoryRouter(
    [
      {
        path: '/collections/:collectionId/practice',
        Component: TypingPractice,
      },
    ],
    { initialEntries: [path] }
  );
  return render(<RouterProvider router={router} />);
}

describe('TypingPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseData.mockReturnValue({
      collections: [
        { id: 'col1', name: 'Test Collection', profileId: '1', parentCollectionId: null },
      ],
      getVersesByCollectionSubtree: (id: string) => (id === 'col1' ? [mockVerse] : []),
      recordPractice: mockRecordPractice,
      getNotes: mockGetNotes,
      createNote: mockCreateNote,
      updateNote: mockUpdateNote,
      deleteNote: mockDeleteNote,
    });
  });

  it('shows Collection not found when collectionId is invalid', () => {
    mockUseData.mockReturnValue({
      collections: [],
      getVersesByCollectionSubtree: () => [],
      recordPractice: vi.fn(),
      getNotes: vi.fn(),
      createNote: vi.fn(),
      updateNote: vi.fn(),
      deleteNote: vi.fn(),
    });

    renderAtPractice('invalid');
    expect(screen.getByText(/Collection not found/i)).toBeInTheDocument();
  });

  it('shows No verses when collection has no verses', () => {
    mockUseData.mockReturnValue({
      collections: [{ id: 'col1', name: 'Test', profileId: '1', parentCollectionId: null }],
      getVersesByCollectionSubtree: () => [],
      recordPractice: vi.fn(),
      getNotes: vi.fn(),
      createNote: vi.fn(),
      updateNote: vi.fn(),
      deleteNote: vi.fn(),
    });

    renderAtPractice('col1');
    expect(screen.getByText(/No verses in this collection/i)).toBeInTheDocument();
  });

  it('renders verse reference and typing area when verses exist', () => {
    renderAtPractice('col1');
    expect(screen.getByText('Matthew 6:26')).toBeInTheDocument();
    expect(screen.getByText(/Click above and type the verse/i)).toBeInTheDocument();
  });

  it('calls recordPractice when verse is typed correctly', async () => {
    const user = userEvent.setup();
    renderAtPractice('col1');

    const typingArea = screen.getByRole('textbox', { name: /type the verse/i });
    await user.type(typingArea, 'Look at the birds of the air.');

    await vi.waitFor(() => {
      expect(mockRecordPractice).toHaveBeenCalledWith('1', expect.any(Boolean), expect.any(Boolean));
    });
  });

  it('displays completion screen when all verses completed', async () => {
    const user = userEvent.setup();
    renderAtPractice('col1');

    const typingArea = screen.getByRole('textbox', { name: /type the verse/i });
    await user.type(typingArea, 'Look at the birds of the air.');

    expect(await screen.findByText(/Practice Complete/i, {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByText(/You've completed typing 1 verse/)).toBeInTheDocument();
  }, 3000);

  it('opens notes panel when note icon clicked', async () => {
    const user = userEvent.setup();
    renderAtPractice('col1');

    const noteButton = screen.getByRole('button', { name: /open notes/i });
    await user.click(noteButton);

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add a note/i)).toBeInTheDocument();
  });

  it('calls createNote when saving a new note', async () => {
    const user = userEvent.setup();
    renderAtPractice('col1');

    await user.click(screen.getByRole('button', { name: /open notes/i }));
    await user.type(screen.getByPlaceholderText(/Add a note/i), 'My reflection');
    await user.click(screen.getByRole('button', { name: /^Save$/i }));

    await vi.waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith('1', 'My reflection');
    });
  });

  it('completes verse without restart when saving note mid-typing in blank mode (issue #38)', async () => {
    const user = userEvent.setup();
    renderAtPractice('col1');

    // Switch to blank mode
    await user.click(screen.getByRole('radio', { name: /blank/i }));

    // Type ~90% of verse (24 of 27 chars: "Look at the birds of the ")
    const verseStart = 'Look at the birds of the ';
    const verseEnd = 'air.';
    const typingArea = screen.getByRole('textbox', { name: /type the verse/i });
    await user.type(typingArea, verseStart);

    // Open notes, add and save a note
    await user.click(screen.getByRole('button', { name: /open notes/i }));
    await user.type(screen.getByPlaceholderText(/Add a note/i), 'My reflection');
    await user.click(screen.getByRole('button', { name: /^Save$/i }));

    await vi.waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith('1', 'My reflection');
    });

    // Focus verse input and type remaining characters
    await user.click(typingArea);
    await user.type(typingArea, verseEnd);

    // Verse should complete (no restart) - recordPractice called, completion screen shown
    await vi.waitFor(() => {
      expect(mockRecordPractice).toHaveBeenCalledWith('1', expect.any(Boolean), expect.any(Boolean));
    });
    expect(await screen.findByText(/Practice Complete/i, {}, { timeout: 2000 })).toBeInTheDocument();
  }, 5000);
});
