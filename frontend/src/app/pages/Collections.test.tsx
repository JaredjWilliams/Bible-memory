import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Collections } from './Collections';

const mockCreateCollection = vi.fn().mockResolvedValue(undefined);
const mockDeleteCollection = vi.fn().mockResolvedValue(undefined);
const mockUseAuth = vi.fn();
const mockUseData = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../context/DataContext', () => ({
  useData: () => mockUseData(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function renderCollections() {
  const router = createMemoryRouter(
    [{ path: '/collections', Component: Collections }],
    { initialEntries: ['/collections'], initialIndex: 0 }
  );
  return render(<RouterProvider router={router} />);
}

describe('Collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    mockUseData.mockReturnValue({
      currentProfile: { id: '1', name: 'Default' },
      collections: [],
      createCollection: mockCreateCollection,
      deleteCollection: mockDeleteCollection,
    });
  });

  it('shows Please log in when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderCollections();

    expect(screen.getByText(/Please log in to view collections/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument();
  });

  it('renders collection list when authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', username: 'test' } });
    mockUseData.mockReturnValue({
      currentProfile: { id: '1', name: 'Default' },
      collections: [
        { id: 'c1', name: 'Romans 8', profileId: '1', parentCollectionId: null },
        { id: 'c2', name: 'Psalm 23', profileId: '1', parentCollectionId: null },
      ],
      createCollection: mockCreateCollection,
      deleteCollection: mockDeleteCollection,
    });
    renderCollections();

    expect(screen.getByText('Romans 8')).toBeInTheDocument();
    expect(screen.getByText('Psalm 23')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/collection name/i)).toBeInTheDocument();
  });

  it('calls createCollection when creating', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', username: 'test' } });
    const user = userEvent.setup();
    renderCollections();

    await user.type(screen.getByPlaceholderText(/collection name/i), 'New Collection');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(mockCreateCollection).toHaveBeenCalledWith('New Collection');
  });

  it('lists only root collections, not nested ones', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', username: 'test' } });
    mockUseData.mockReturnValue({
      currentProfile: { id: '1', name: 'Default' },
      collections: [
        { id: 'c1', name: 'Matthew', profileId: '1', parentCollectionId: null },
        { id: 'c2', name: 'Chapter 1', profileId: '1', parentCollectionId: 'c1' },
      ],
      createCollection: mockCreateCollection,
      deleteCollection: mockDeleteCollection,
    });
    renderCollections();

    expect(screen.getByText('Matthew')).toBeInTheDocument();
    expect(screen.queryByText('Chapter 1')).not.toBeInTheDocument();
  });

  it('opens delete dialog and calls deleteCollection on confirm', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', username: 'test' } });
    mockUseData.mockReturnValue({
      currentProfile: { id: '1', name: 'Default' },
      collections: [{ id: 'c1', name: 'Romans 8', profileId: '1', parentCollectionId: null }],
      createCollection: mockCreateCollection,
      deleteCollection: mockDeleteCollection,
    });
    const user = userEvent.setup();
    renderCollections();

    const row = screen.getByText('Romans 8').closest('div');
    const buttons = within(row!).getAllByRole('button');
    await user.click(buttons[1]);

    expect(screen.getByText(/nested sub-collections/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(mockDeleteCollection).toHaveBeenCalledWith('c1');
  });
});
