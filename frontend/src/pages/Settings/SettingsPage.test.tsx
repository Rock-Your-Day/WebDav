import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/mocks/server';
import SettingsPage from './SettingsPage';
import { ThemeContextProvider } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/auth';

beforeAll(() => {
  server.listen();
  useAuthStore.setState({ isAuthenticated: true, accessToken: 'test', refreshToken: 'test', user: { id: '1', username: 'admin', email: 'a@b.com', role: 'admin' } });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderSettings() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

describe('SettingsPage', () => {
  it('renders the page heading', () => {
    renderSettings();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows theme and branding section', () => {
    renderSettings();
    expect(screen.getByText('Theme & Branding')).toBeInTheDocument();
  });

  it('shows application name field', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText(/application name/i)).toBeInTheDocument();
    });
  });

  it('shows save button', () => {
    renderSettings();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows color preview sections', () => {
    renderSettings();
    expect(screen.getByText(/primary color preview/i)).toBeInTheDocument();
    expect(screen.getByText(/secondary color preview/i)).toBeInTheDocument();
  });
});
