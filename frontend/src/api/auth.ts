/**
 * Authentication API calls.
 */
import apiClient from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: string;
  auth_provider: string;
}

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/login', data);
  return response.data;
}

export async function getMe(): Promise<UserInfo> {
  const response = await apiClient.get<UserInfo>('/auth/me');
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
