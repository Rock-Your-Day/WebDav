import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import SLAPage from './SLAPage';
import { ThemeContextProvider } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/auth';

beforeAll(() => {
  server.listen();
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'test', refreshToken: 'test', user: { id: '1', username: 'admin', email: 'a@b.com', role: 'admin' } });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderSLA() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <MemoryRouter>
          <SLAPage />
        </MemoryRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

describe('SLAPage', () => {
  it('renders the page heading', () => {
    renderSLA();
    expect(screen.getByText('SLA Policies')).toBeInTheDocument();
  });

  it('shows add policy button', () => {
    renderSLA();
    expect(screen.getByRole('button', { name: /add policy/i })).toBeInTheDocument();
  });

  it('shows description text', () => {
    renderSLA();
    expect(screen.getByText(/monitor backup frequency/i)).toBeInTheDocument();
  });

  it('opens create policy dialog', async () => {
    renderSLA();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /add policy/i }));
    await waitFor(() => {
      expect(screen.getByText('Create SLA Policy')).toBeInTheDocument();
    });
  });
});
