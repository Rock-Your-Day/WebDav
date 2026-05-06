import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import StoragePage from './StoragePage';
import { ThemeContextProvider } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/auth';

beforeAll(() => {
  server.listen();
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'test', refreshToken: 'test', user: { id: '1', username: 'admin', email: 'a@b.com', role: 'admin' } });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderStorage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <MemoryRouter>
          <StoragePage />
        </MemoryRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

describe('StoragePage', () => {
  it('renders the page heading and add button', () => {
    renderStorage();
    expect(screen.getByText('Storage Destinations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add storage/i })).toBeInTheDocument();
  });

  it('loads and displays storage destinations', async () => {
    renderStorage();
    await waitFor(() => {
      expect(screen.getByText('Local Storage')).toBeInTheDocument();
      expect(screen.getByText('S3 Backup')).toBeInTheDocument();
    });
  });

  it('shows provider type labels', async () => {
    renderStorage();
    await waitFor(() => {
      expect(screen.getByText('Provider: LOCAL')).toBeInTheDocument();
      expect(screen.getByText('Provider: S3')).toBeInTheDocument();
    });
  });

  it('opens create storage dialog', async () => {
    renderStorage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /add storage/i }));
    await waitFor(() => {
      expect(screen.getByText('Add Storage Destination')).toBeInTheDocument();
    });
  });
});
