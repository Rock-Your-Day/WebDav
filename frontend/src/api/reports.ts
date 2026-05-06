/**
 * Reports and analytics API calls.
 */
import apiClient from './client';

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_storage_destinations: number;
  transfers_today: number;
}

export interface ActivityEntry {
  date: string;
  uploads: number;
  downloads: number;
  deletes: number;
}

export interface ActivityReport {
  activity: ActivityEntry[];
  period_days: number;
}

export interface StorageUsageEntry {
  id: string;
  name: string;
  provider_type: string;
  total_bytes: number;
}

export interface SLAEntry {
  user_id: string;
  username: string;
  last_activity: string | null;
}

export interface SLAReport {
  violations: SLAEntry[];
  compliant: SLAEntry[];
  total_violations: number;
  total_compliant: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>('/reports/dashboard');
  return response.data;
}

export async function getActivityReport(days = 7): Promise<ActivityReport> {
  const response = await apiClient.get<ActivityReport>('/reports/activity', { params: { days } });
  return response.data;
}

export async function getStorageUsage(): Promise<{ usage: StorageUsageEntry[] }> {
  const response = await apiClient.get<{ usage: StorageUsageEntry[] }>('/reports/storage-usage');
  return response.data;
}

export async function getSLAReport(): Promise<SLAReport> {
  const response = await apiClient.get<SLAReport>('/reports/sla-compliance');
  return response.data;
}
