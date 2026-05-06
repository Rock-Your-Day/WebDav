/**
 * Activity log API calls.
 */
import apiClient from './client';

export interface ActivityEntry {
  id: string;
  user_id: string | null;
  storage_id: string | null;
  action: string;
  file_path: string;
  file_size: number | null;
  timestamp: string;
}

export interface ActivityListResponse {
  entries: ActivityEntry[];
  total: number;
}

export async function listActivity(
  skip = 0,
  limit = 100,
  userId?: string,
  action?: string
): Promise<ActivityListResponse> {
  const params: Record<string, string | number> = { skip, limit };
  if (userId) params.user_id = userId;
  if (action) params.action = action;
  const response = await apiClient.get<ActivityListResponse>('/activity/', { params });
  return response.data;
}
