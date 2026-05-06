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
