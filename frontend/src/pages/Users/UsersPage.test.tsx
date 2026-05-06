import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import UsersPage from './UsersPage';
import { ThemeContextProvider } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/auth';

beforeAll(() => {
  server.listen();
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'test', refreshToken: 'test', user: { id: '1', username: 'admin', email: 'a@b.com', role: 'admin' } });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderUsers() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <MemoryRouter>
          <UsersPage />
        </MemoryRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

describe('UsersPage', () => {
  it('renders the page heading and add button', () => {
    renderUsers();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
  });

  it('loads and displays users from API', async () => {
    renderUsers();
    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('bob@test.com')).toBeInTheDocument();
    });
  });

  it('shows role chips', async () => {
    renderUsers();
    await waitFor(() => {
      // Check that role chips are rendered (they appear as Chip components)
      expect(screen.getByText('bob@test.com')).toBeInTheDocument();
      expect(screen.getAllByText('user').length).toBeGreaterThan(0);
    });
  });

  it('opens create user dialog', async () => {
    renderUsers();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /add user/i }));
    await waitFor(() => {
      expect(screen.getByText('Create New User')).toBeInTheDocument();
    });
  });
});
