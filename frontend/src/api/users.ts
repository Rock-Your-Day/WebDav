/**
 * User management API calls.
 */
import apiClient from './client';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  auth_provider: string;
  quota_bytes: number | null;
  created_at: string;
  last_login: string | null;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  quota_bytes?: number | null;
}

export interface UpdateUserRequest {
  email?: string;
  role?: string;
  is_active?: boolean;
  quota_bytes?: number | null;
}

export async function listUsers(skip = 0, limit = 50): Promise<UserListResponse> {
  const response = await apiClient.get<UserListResponse>('/users/', { params: { skip, limit } });
  return response.data;
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await apiClient.post<User>('/users/', data);
  return response.data;
}

export async function updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
  const response = await apiClient.put<User>(`/users/${userId}`, data);
  return response.data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`);
}
