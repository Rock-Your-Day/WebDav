/**
 * Storage destination API calls.
 */
import apiClient from './client';

export interface StorageDestination {
  id: string;
  name: string;
  provider_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface StorageListResponse {
  destinations: StorageDestination[];
  total: number;
}

export interface CreateStorageRequest {
  name: string;
  provider_type: string;
  config: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateStorageRequest {
  name?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export async function listStorage(skip = 0, limit = 50): Promise<StorageListResponse> {
  const response = await apiClient.get<StorageListResponse>('/storage/', { params: { skip, limit } });
  return response.data;
}

export async function createStorage(data: CreateStorageRequest): Promise<StorageDestination> {
  const response = await apiClient.post<StorageDestination>('/storage/', data);
  return response.data;
}

export async function updateStorage(id: string, data: UpdateStorageRequest): Promise<StorageDestination> {
  const response = await apiClient.put<StorageDestination>(`/storage/${id}`, data);
  return response.data;
}

export async function deleteStorage(id: string): Promise<void> {
  await apiClient.delete(`/storage/${id}`);
}

export async function testStorage(id: string): Promise<{ status: string; message: string }> {
  const response = await apiClient.post<{ status: string; message: string }>(`/storage/${id}/test`);
  return response.data;
}
