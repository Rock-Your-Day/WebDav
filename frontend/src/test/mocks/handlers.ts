/**
 * MSW request handlers for testing.
 */
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
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

  // Dashboard / Reports
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
      violations: [{ user_id: '2', username: 'bob', last_activity: null }],
      compliant: [{ user_id: '1', username: 'admin', last_activity: '2026-05-05T10:00:00Z' }],
      total_violations: 1,
      total_compliant: 1,
    });
  }),

  http.get('/api/v1/reports/storage-usage', () => {
    return HttpResponse.json({
      usage: [
        { id: '1', name: 'Local Storage', provider_type: 'local', total_bytes: 1073741824 },
      ],
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
        {
          id: '2',
          username: 'bob',
          email: 'bob@test.com',
          role: 'user',
          is_active: true,
          auth_provider: 'local',
          quota_bytes: 5368709120,
          created_at: '2026-02-01T00:00:00Z',
          last_login: null,
        },
      ],
      total: 2,
    });
  }),

  http.post('/api/v1/users/', async ({ request }) => {
    const body = (await request.json()) as { username: string };
    if (body.username === 'admin') {
      return HttpResponse.json({ detail: 'Username or email already exists' }, { status: 409 });
    }
    return HttpResponse.json(
      { id: '3', ...body, is_active: true, auth_provider: 'local', quota_bytes: null, created_at: '2026-05-06T00:00:00Z', last_login: null },
      { status: 201 }
    );
  }),

  http.delete('/api/v1/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
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
        {
          id: '2',
          name: 'S3 Backup',
          provider_type: 's3',
          config: { bucket: 'my-bucket', region: 'us-east-1' },
          is_active: true,
          created_at: '2026-03-01T00:00:00Z',
        },
      ],
      total: 2,
    });
  }),

  http.post('/api/v1/storage/', async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json(
      { id: '3', ...body, is_active: true, created_at: '2026-05-06T00:00:00Z' },
      { status: 201 }
    );
  }),

  http.delete('/api/v1/storage/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/storage/:id/test', () => {
    return HttpResponse.json({ status: 'ok', message: 'Connection successful' });
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

  http.put('/api/v1/settings/theme', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      app_name: 'OpenWebDav',
      primary_color: '#1976d2',
      secondary_color: '#dc004e',
      dark_mode_default: false,
      logo_path: null,
      favicon_path: null,
      ...body,
    });
  }),

  // Activity Log
  http.get('/api/v1/activity/', () => {
    return HttpResponse.json({
      entries: [
        { id: '1', user_id: '1', storage_id: null, action: 'upload', file_path: 'admin/test.txt', file_size: 1024, timestamp: '2026-05-06T10:00:00Z' },
        { id: '2', user_id: '1', storage_id: null, action: 'download', file_path: 'admin/test.txt', file_size: 1024, timestamp: '2026-05-06T11:00:00Z' },
      ],
      total: 2,
    });
  }),

  // SLA Policies
  http.get('/api/v1/sla/policies', () => {
    return HttpResponse.json({
      policies: [
        { id: '1', name: 'Daily Backup', user_id: null, storage_id: '1', expected_frequency_hours: 24, alert_email: 'admin@test.com', alert_webhook: null, is_active: true },
      ],
      total: 1,
    });
  }),

  http.post('/api/v1/sla/policies', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: '2', ...body, is_active: true }, { status: 201 });
  }),

  http.delete('/api/v1/sla/policies/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // OIDC Config
  http.get('/api/v1/oidc/config', () => {
    return HttpResponse.json({
      enabled: false,
      provider_url: null,
      client_id: null,
      client_secret_set: false,
      scopes: 'openid profile email',
      redirect_uri: null,
    });
  }),

  http.get('/api/v1/oidc/role-mapping', () => {
    return HttpResponse.json({
      admin_groups: [],
      user_groups: [],
      readonly_groups: [],
      default_role: 'user',
    });
  }),
];
