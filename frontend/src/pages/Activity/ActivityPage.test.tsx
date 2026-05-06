import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import ActivityPage from './ActivityPage';
import { ThemeContextProvider } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/auth';

beforeAll(() => {
  server.listen();
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'test', refreshToken: 'test', user: { id: '1', username: 'admin', email: 'a@b.com', role: 'admin' } });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderActivity() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <MemoryRouter>
          <ActivityPage />
        </MemoryRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

describe('ActivityPage', () => {
  it('renders the page heading', () => {
    renderActivity();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('shows filter dropdown', () => {
    renderActivity();
    expect(screen.getByLabelText(/filter/i)).toBeInTheDocument();
  });

  it('shows audit trail description', () => {
    renderActivity();
    expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
  });

  it('shows table headers', async () => {
    renderActivity();
    await waitFor(() => {
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('File Path')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
    });
  });
});
