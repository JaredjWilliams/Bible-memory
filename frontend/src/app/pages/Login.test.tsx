import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Login } from './Login';

const mockLogin = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function renderLogin() {
  const router = createMemoryRouter(
    [
      { path: '/login', Component: Login },
      { path: '/read', element: <div>Read Page</div> },
    ],
    { initialEntries: ['/login'], initialIndex: 0 }
  );
  return render(<RouterProvider router={router} />);
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      user: null,
    });
  });

  it('renders Login form with username and password inputs', () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation message when submitting empty', async () => {
    const { toast } = await import('sonner');
    renderLogin();

    await userEvent.setup().click(screen.getByRole('button', { name: /login/i }));

    expect(toast.error).toHaveBeenCalledWith('Please enter both username and password');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with credentials on submit', async () => {
    mockLogin.mockResolvedValue(true);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
  });

  it('navigates to /read on successful login', async () => {
    mockLogin.mockResolvedValue(true);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Read Page')).toBeInTheDocument();
  });

  it('shows error toast on failed login', async () => {
    const { toast } = await import('sonner');
    mockLogin.mockResolvedValue(false);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/username/i), 'baduser');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(toast.error).toHaveBeenCalledWith('Invalid username or password');
  });
});
