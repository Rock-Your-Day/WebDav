/**
 * OIDC configuration API calls.
 */
import apiClient from './client';

export interface OIDCConfigResponse {
  enabled: boolean;
  provider_url: string | null;
  client_id: string | null;
  client_secret_set: boolean;
  scopes: string;
  redirect_uri: string | null;
}

export interface OIDCConfigRequest {
  enabled: boolean;
  provider_url?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  scopes?: string;
  redirect_uri?: string | null;
}

export interface RoleMappingResponse {
  admin_groups: string[];
  user_groups: string[];
  readonly_groups: string[];
  default_role: string;
}

export interface RoleMappingRequest {
  admin_groups: string[];
  user_groups: string[];
  readonly_groups: string[];
  default_role: string;
}

export async function getOIDCConfig(): Promise<OIDCConfigResponse> {
  const response = await apiClient.get<OIDCConfigResponse>('/oidc/config');
  return response.data;
}

export async function updateOIDCConfig(data: OIDCConfigRequest): Promise<OIDCConfigResponse & { message: string }> {
  const response = await apiClient.put<OIDCConfigResponse & { message: string }>('/oidc/config', data);
  return response.data;
}

export async function getRoleMapping(): Promise<RoleMappingResponse> {
  const response = await apiClient.get<RoleMappingResponse>('/oidc/role-mapping');
  return response.data;
}

export async function updateRoleMapping(data: RoleMappingRequest): Promise<RoleMappingResponse & { message: string }> {
  const response = await apiClient.put<RoleMappingResponse & { message: string }>('/oidc/role-mapping', data);
  return response.data;
}
