import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:8080';

test.describe('WebDAV E2E', () => {
  test('admin can upload and download files', async ({ request }) => {
    // Upload a file
    const putResponse = await request.put(`${BASE}/dav/admin/e2e-test.txt`, {
      data: 'E2E test content',
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
        'Content-Type': 'text/plain',
      },
    });
    expect([201, 204]).toContain(putResponse.status());

    // Download the file
    const getResponse = await request.get(`${BASE}/dav/admin/e2e-test.txt`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
      },
    });
    expect(getResponse.status()).toBe(200);
    expect(await getResponse.text()).toBe('E2E test content');

    // Delete the file
    const deleteResponse = await request.delete(`${BASE}/dav/admin/e2e-test.txt`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
      },
    });
    expect(deleteResponse.status()).toBe(204);
  });

  test('WebDAV requires authentication', async ({ request }) => {
    const response = await request.fetch(`${BASE}/dav/`, {
      method: 'PROPFIND',
      headers: { Depth: '0' },
    });
    expect(response.status()).toBe(401);
  });

  test('user cannot access other user directories', async ({ request }) => {
    // First create a user via API
    const loginResp = await request.post(`${BASE}/api/v1/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    });
    const { access_token } = await loginResp.json();

    // Create bob user
    await request.post(`${BASE}/api/v1/users/`, {
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      data: { username: 'e2ebob', email: 'e2ebob@test.com', password: 'bobpass123', role: 'user' },
    });

    // Admin uploads a file
    await request.put(`${BASE}/dav/admin/secret.txt`, {
      data: 'admin secret',
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
      },
    });

    // Bob tries to read admin's file — should get 403
    const bobResponse = await request.get(`${BASE}/dav/admin/secret.txt`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from('e2ebob:bobpass123').toString('base64'),
      },
    });
    expect(bobResponse.status()).toBe(403);

    // Bob can write to own directory
    const bobPut = await request.put(`${BASE}/dav/e2ebob/myfile.txt`, {
      data: 'bob data',
      headers: {
        Authorization: 'Basic ' + Buffer.from('e2ebob:bobpass123').toString('base64'),
      },
    });
    expect([201, 204]).toContain(bobPut.status());
  });

  test('PROPFIND returns valid XML', async ({ request }) => {
    const response = await request.fetch(`${BASE}/dav/admin/`, {
      method: 'PROPFIND',
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
        Depth: '0',
      },
    });
    expect(response.status()).toBe(207);
    const body = await response.text();
    expect(body).toContain('multistatus');
    expect(body).toContain('response');
  });

  test('MKCOL creates directory', async ({ request }) => {
    const response = await request.fetch(`${BASE}/dav/admin/e2e-subdir/`, {
      method: 'MKCOL',
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
      },
    });
    expect([201, 405]).toContain(response.status()); // 405 if already exists
  });
});
