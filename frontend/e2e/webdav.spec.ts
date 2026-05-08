import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:8080';

test.describe('WebDAV E2E', () => {
  test('admin can upload and download files', async ({ request }) => {
    // Upload a file to the root (proxy model — no username in path)
    const putResponse = await request.put(`${BASE}/dav/e2e-test.txt`, {
      data: 'E2E test content',
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
        'Content-Type': 'text/plain',
      },
    });
    expect([201, 204]).toContain(putResponse.status());

    // Download the file
    const getResponse = await request.get(`${BASE}/dav/e2e-test.txt`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
      },
    });
    expect(getResponse.status()).toBe(200);
    expect(await getResponse.text()).toBe('E2E test content');

    // Delete the file
    const deleteResponse = await request.delete(`${BASE}/dav/e2e-test.txt`, {
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

  test('PROPFIND returns valid XML for authenticated user', async ({ request }) => {
    const response = await request.fetch(`${BASE}/dav/`, {
      method: 'PROPFIND',
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
        Depth: '0',
      },
    });
    expect(response.status()).toBe(207);
    const body = await response.text();
    expect(body).toContain('multistatus');
  });

  test('MKCOL creates directory', async ({ request }) => {
    const response = await request.fetch(`${BASE}/dav/e2e-testdir/`, {
      method: 'MKCOL',
      headers: {
        Authorization: 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
      },
    });
    // 201 Created or 405 if already exists
    expect([201, 405]).toContain(response.status());
  });
});
