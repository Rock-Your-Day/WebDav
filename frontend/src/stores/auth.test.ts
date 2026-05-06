import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth';

describe('AuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it('sets tokens and marks authenticated', () => {
    useAuthStore.getState().setTokens('access-123', 'refresh-456');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access-123');
    expect(state.refreshToken).toBe('refresh-456');
    expect(localStorage.getItem('access_token')).toBe('access-123');
  });

  it('sets user info', () => {
    useAuthStore.getState().setUser({ id: '1', username: 'admin', email: 'a@b.com', role: 'admin' });
    const state = useAuthStore.getState();
    expect(state.user?.username).toBe('admin');
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toHaveProperty('username', 'admin');
  });

  it('logout clears everything', () => {
    useAuthStore.getState().setTokens('access', 'refresh');
    useAuthStore.getState().setUser({ id: '1', username: 'admin', email: 'a@b.com', role: 'admin' });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
