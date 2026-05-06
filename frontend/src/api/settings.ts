/**
 * Settings API calls.
 */
import apiClient from './client';

export interface ThemeConfig {
  app_name: string;
  primary_color: string;
  secondary_color: string;
  dark_mode_default: boolean;
  logo_path: string | null;
  favicon_path: string | null;
}

export interface ThemeUpdateRequest {
  app_name?: string;
  primary_color?: string;
  secondary_color?: string;
  dark_mode_default?: boolean;
}

export async function getTheme(): Promise<ThemeConfig> {
  const response = await apiClient.get<ThemeConfig>('/settings/theme');
  return response.data;
}

export async function updateTheme(data: ThemeUpdateRequest): Promise<ThemeConfig> {
  const response = await apiClient.put<ThemeConfig>('/settings/theme', data);
  return response.data;
}


// SMTP
export interface SMTPConfigResponse {
  host: string | null;
  port: number;
  username: string | null;
  password_set: boolean;
  use_tls: boolean;
  from_email: string;
}

export interface SMTPConfigRequest {
  host?: string | null;
  port?: number;
  username?: string | null;
  password?: string | null;
  use_tls?: boolean;
  from_email?: string;
}

export async function getSMTPConfig(): Promise<SMTPConfigResponse> {
  const response = await apiClient.get<SMTPConfigResponse>('/settings/smtp');
  return response.data;
}

export async function updateSMTPConfig(data: SMTPConfigRequest): Promise<SMTPConfigResponse & { message: string }> {
  const response = await apiClient.put<SMTPConfigResponse & { message: string }>('/settings/smtp', data);
  return response.data;
}

export async function testSMTP(): Promise<{ status: string; message: string }> {
  const response = await apiClient.post<{ status: string; message: string }>('/settings/smtp/test');
  return response.data;
}
