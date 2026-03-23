import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { CollectionDetail } from './CollectionDetail';

const mockAddVerse = vi.fn().mockResolvedValue(undefined);
const mockAddBulkVerses = vi.fn().mockResolvedValue({ added: 2, skipped: 0 });
const mockDeleteVerse = vi.fn().mockResolvedValue(undefined);
const mockGetVersesByCollection = vi.fn();
const mockUseData = vi.fn();

vi.mock('../context/DataContext', () => ({
  useData: () => mockUseData(),
}));

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

function renderCollectionDetail(collectionId: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/collections/:collectionId',
        Component: CollectionDetail,
      },
      {
        path: '/collections/:collectionId/practice',
        element: <div>Practice</div>,
      },
    ],
    { initialEntries: [`/collections/${collectionId}`], initialIndex: 0 }
  );
  return render(<RouterProvider router={router} />);
}

describe('CollectionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseData.mockReturnValue({
      collections: [{ id: 'c1', name: 'Romans 8', profileId: '1' }],
      getVersesByCollection: mockGetVersesByCollection,
      addVerse: mockAddVerse,
      addBulkVerses: mockAddBulkVerses,
      deleteVerse: mockDeleteVerse,
    });
    mockGetVersesByCollection.mockReturnValue([]);
  });

  it('shows Collection not found when collectionId is invalid', () => {
    mockUseData.mockReturnValue({
      collections: [{ id: 'c1', name: 'Romans 8', profileId: '1' }],
      getVersesByCollection: vi.fn(),
      addVerse: vi.fn(),
      addBulkVerses: vi.fn(),
      deleteVerse: vi.fn(),
    });
    renderCollectionDetail('invalid');

    expect(screen.getByText(/collection not found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to collections/i })).toBeInTheDocument();
  });

  it('renders verses and add verse UI when collection exists', () => {
    mockGetVersesByCollection.mockReturnValue([
      { id: 'v1', reference: 'Romans 8:1', text: 'There is therefore now no condemnation.' },
    ]);
    renderCollectionDetail('c1');

    expect(screen.getByText('Romans 8')).toBeInTheDocument();
    expect(screen.getByText('Romans 8:1')).toBeInTheDocument();
    expect(screen.getByText(/no condemnation/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., John 3:16/i)).toBeInTheDocument();
  });

  it('calls addVerse for manual add', async () => {
    const user = userEvent.setup();
    renderCollectionDetail('c1');

    await user.type(screen.getByPlaceholderText(/e.g., John 3:16/i), 'John 3:16');
    await user.type(screen.getByPlaceholderText(/enter the verse text/i), 'For God so loved the world');
    await user.click(screen.getByRole('button', { name: /add verse/i }));

    expect(mockAddVerse).toHaveBeenCalledWith('c1', 'John 3:16', 'For God so loved the world');
  });

  it('calls addBulkVerses for range add', async () => {
    const user = userEvent.setup();
    renderCollectionDetail('c1');

    await user.click(screen.getByRole('tab', { name: /from esv/i }));
    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[3]);
    await user.click(screen.getByRole('option', { name: '21' }));
    await user.click(screen.getByRole('button', { name: /add verses/i }));

    expect(mockAddBulkVerses).toHaveBeenCalledWith('c1', expect.stringMatching(/John 3:16-/));
  });

  it('calls deleteVerse when deleting', async () => {
    mockGetVersesByCollection.mockReturnValue([
      { id: 'v1', reference: 'Romans 8:1', text: 'There is therefore now no condemnation.' },
    ]);
    const user = userEvent.setup();
    renderCollectionDetail('c1');

    const verseRow = screen.getByText('Romans 8:1').closest('div');
    const iconGroup = verseRow!.querySelector('.flex.shrink-0');
    const iconButtons = within(iconGroup!).getAllByRole('button');
    await user.click(iconButtons[1]);

    expect(screen.getByText(/are you sure you want to delete this verse/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(mockDeleteVerse).toHaveBeenCalledWith('v1');
  });
});
