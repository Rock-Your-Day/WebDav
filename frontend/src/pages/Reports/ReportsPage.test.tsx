import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import ReportsPage from './ReportsPage';
import { ThemeContextProvider } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/auth';

beforeAll(() => {
  server.listen();
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'test', refreshToken: 'test', user: { id: '1', username: 'admin', email: 'a@b.com', role: 'admin' } });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderReports() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

describe('ReportsPage', () => {
  it('renders the page heading', () => {
    renderReports();
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
  });

  it('shows activity chart section', () => {
    renderReports();
    expect(screen.getByText(/Activity/)).toBeInTheDocument();
  });

  it('shows storage usage section', () => {
    renderReports();
    expect(screen.getByText('Storage Usage')).toBeInTheDocument();
  });

  it('shows SLA compliance section', () => {
    renderReports();
    expect(screen.getByText('SLA Compliance')).toBeInTheDocument();
  });

  it('loads SLA data and shows violation count', async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('1 Violations')).toBeInTheDocument();
      expect(screen.getByText('1 Compliant')).toBeInTheDocument();
    });
  });
});
