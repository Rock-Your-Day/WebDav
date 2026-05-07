/**
 * Access control API calls.
 */
import apiClient from './client';

export interface AccessRule {
  id: string;
  user_id: string;
  storage_id: string;
  permission: string;
  path_prefix: string | null;
}

export interface AccessRuleListResponse {
  rules: AccessRule[];
  total: number;
}

export interface CreateAccessRuleRequest {
  user_id: string;
  storage_id: string;
  permission: string;
  path_prefix?: string | null;
}

export async function listAccessRules(userId?: string, storageId?: string): Promise<AccessRuleListResponse> {
  const params: Record<string, string> = {};
  if (userId) params.user_id = userId;
  if (storageId) params.storage_id = storageId;
  const response = await apiClient.get<AccessRuleListResponse>('/access/', { params });
  return response.data;
}

export async function createAccessRule(data: CreateAccessRuleRequest): Promise<AccessRule> {
  const response = await apiClient.post<AccessRule>('/access/', data);
  return response.data;
}

export async function deleteAccessRule(ruleId: string): Promise<void> {
  await apiClient.delete(`/access/${ruleId}`);
}
