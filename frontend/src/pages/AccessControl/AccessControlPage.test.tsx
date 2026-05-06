import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import AccessControlPage from './AccessControlPage';
import { ThemeContextProvider } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/auth';

beforeAll(() => {
  server.listen();
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'test', refreshToken: 'test', user: { id: '1', username: 'admin', email: 'a@b.com', role: 'admin' } });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderAccessControl() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <MemoryRouter>
          <AccessControlPage />
        </MemoryRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

describe('AccessControlPage', () => {
  it('renders the page heading and grant button', () => {
    renderAccessControl();
    expect(screen.getByText('Access Control')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /grant access/i })).toBeInTheDocument();
  });

  it('shows info alert about access control', () => {
    renderAccessControl();
    expect(screen.getByText(/configure which users/i)).toBeInTheDocument();
  });

  it('loads and displays access rules', async () => {
    renderAccessControl();
    await waitFor(() => {
      expect(screen.getByText('write')).toBeInTheDocument();
    });
  });

  it('opens grant access dialog', async () => {
    renderAccessControl();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /grant access/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
