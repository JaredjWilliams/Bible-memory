import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Signup } from './Signup';

const mockSignup = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function renderSignup() {
  const router = createMemoryRouter(
    [
      { path: '/signup', Component: Signup },
      { path: '/read', element: <div>Read Page</div> },
    ],
    { initialEntries: ['/signup'], initialIndex: 0 }
  );
  return render(<RouterProvider router={router} />);
}

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signup: mockSignup,
      user: null,
    });
  });

  it('renders signup form', () => {
    renderSignup();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const { toast } = await import('sonner');
    renderSignup();

    await userEvent.setup().click(screen.getByRole('button', { name: /sign up/i }));

    expect(toast.error).toHaveBeenCalledWith('Please fill in all fields');
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('validates password match', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByPlaceholderText('Choose a password'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'different');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByPlaceholderText('Choose a password'), '12345');
    await user.type(screen.getByPlaceholderText('Confirm your password'), '12345');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters');
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('calls signup on submit', async () => {
    mockSignup.mockResolvedValue(true);
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByPlaceholderText('Choose a password'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(mockSignup).toHaveBeenCalledWith('newuser', 'password123');
  });

  it('navigates to /read on success', async () => {
    mockSignup.mockResolvedValue(true);
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByPlaceholderText('Choose a password'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText('Read Page')).toBeInTheDocument();
  });

  it('shows error on failure', async () => {
    const { toast } = await import('sonner');
    mockSignup.mockResolvedValue(false);
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/username/i), 'existing');
    await user.type(screen.getByPlaceholderText('Choose a password'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(toast.error).toHaveBeenCalledWith('Username already exists');
  });
});
