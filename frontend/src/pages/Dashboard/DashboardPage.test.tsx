import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import DashboardPage from './DashboardPage';
import { ThemeContextProvider } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/auth';

beforeAll(() => {
  server.listen();
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'test', refreshToken: 'test', user: { id: '1', username: 'admin', email: 'a@b.com', role: 'admin' } });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  it('renders the page heading', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows stat card labels', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Storage Destinations')).toBeInTheDocument();
      expect(screen.getByText('Transfers Today')).toBeInTheDocument();
      expect(screen.getByText('SLA Violations')).toBeInTheDocument();
    });
  });

  it('loads and displays stat values from API', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // total_users
      expect(screen.getByText('42')).toBeInTheDocument(); // transfers_today
    });
  });

  it('shows chart sections', () => {
    renderDashboard();
    expect(screen.getByText('Weekly Activity')).toBeInTheDocument();
    expect(screen.getByText('Transfer Trend')).toBeInTheDocument();
  });
});
