import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '@/stores/auth';

function renderWithRouter(isAuthenticated: boolean) {
  if (isAuthenticated) {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'token', refreshToken: 'refresh', user: null });
  } else {
    useAuthStore.setState({ isAuthenticated: false, accessToken: null, refreshToken: null, user: null });
  }

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children when authenticated', () => {
    renderWithRouter(true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderWithRouter(false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
