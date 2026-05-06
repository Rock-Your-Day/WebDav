/**
 * SLA policy API calls.
 */
import apiClient from './client';

export interface SLAPolicy {
  id: string;
  name: string;
  user_id: string | null;
  storage_id: string;
  expected_frequency_hours: number;
  alert_webhook: string | null;
  alert_email: string | null;
  is_active: boolean;
}

export interface SLAPolicyListResponse {
  policies: SLAPolicy[];
  total: number;
}

export interface CreateSLAPolicyRequest {
  name: string;
  storage_id: string;
  user_id?: string | null;
  expected_frequency_hours: number;
  alert_webhook?: string | null;
  alert_email?: string | null;
  is_active?: boolean;
}

export interface UpdateSLAPolicyRequest {
  name?: string;
  expected_frequency_hours?: number;
  alert_webhook?: string | null;
  alert_email?: string | null;
  is_active?: boolean;
}

export async function listSLAPolicies(): Promise<SLAPolicyListResponse> {
  const response = await apiClient.get<SLAPolicyListResponse>('/sla/policies');
  return response.data;
}

export async function createSLAPolicy(data: CreateSLAPolicyRequest): Promise<SLAPolicy> {
  const response = await apiClient.post<SLAPolicy>('/sla/policies', data);
  return response.data;
}

export async function updateSLAPolicy(id: string, data: UpdateSLAPolicyRequest): Promise<SLAPolicy> {
  const response = await apiClient.put<SLAPolicy>(`/sla/policies/${id}`, data);
  return response.data;
}

export async function deleteSLAPolicy(id: string): Promise<void> {
  await apiClient.delete(`/sla/policies/${id}`);
}
