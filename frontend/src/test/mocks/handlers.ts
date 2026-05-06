/**
 * MSW request handlers for testing.
 */
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    if (body.username === 'admin' && body.password === 'admin123') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
      });
    }
    return HttpResponse.json({ detail: 'Invalid username or password' }, { status: 401 });
  }),

  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({
      id: '1',
      username: 'admin',
      email: 'admin@test.com',
      role: 'admin',
      auth_provider: 'local',
    });
  }),

  // Dashboard
  http.get('/api/v1/reports/dashboard', () => {
    return HttpResponse.json({
      total_users: 5,
      active_users: 4,
      total_storage_destinations: 3,
      transfers_today: 42,
    });
  }),

  http.get('/api/v1/reports/activity', () => {
    return HttpResponse.json({
      activity: [
        { date: '2026-05-01', uploads: 10, downloads: 5, deletes: 1 },
        { date: '2026-05-02', uploads: 15, downloads: 8, deletes: 2 },
      ],
      period_days: 7,
    });
  }),

  http.get('/api/v1/reports/sla-compliance', () => {
    return HttpResponse.json({
      violations: [],
      compliant: [{ user_id: '1', username: 'admin', last_activity: '2026-05-05T10:00:00Z' }],
      total_violations: 0,
      total_compliant: 1,
    });
  }),

  // Users
  http.get('/api/v1/users/', () => {
    return HttpResponse.json({
      users: [
        {
          id: '1',
          username: 'admin',
          email: 'admin@test.com',
          role: 'admin',
          is_active: true,
          auth_provider: 'local',
          quota_bytes: null,
          created_at: '2026-01-01T00:00:00Z',
          last_login: '2026-05-05T10:00:00Z',
        },
      ],
      total: 1,
    });
  }),

  // Storage
  http.get('/api/v1/storage/', () => {
    return HttpResponse.json({
      destinations: [
        {
          id: '1',
          name: 'Local Storage',
          provider_type: 'local',
          config: { path: '/data/storage' },
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
    });
  }),

  // Settings
  http.get('/api/v1/settings/theme', () => {
    return HttpResponse.json({
      app_name: 'OpenWebDav',
      primary_color: '#1976d2',
      secondary_color: '#dc004e',
      dark_mode_default: false,
      logo_path: null,
      favicon_path: null,
    });
  }),
];
