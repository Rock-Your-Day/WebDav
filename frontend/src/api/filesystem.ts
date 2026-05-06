/**
 * Filesystem browser API calls.
 */
import apiClient from './client';

export interface FilesystemEntry {
  name: string;
  path: string;
  is_directory: boolean;
  size: number | null;
  modified: number;
}

export interface BrowseResponse {
  current_path: string;
  parent_path: string | null;
  entries: FilesystemEntry[];
}

export async function browseFilesystem(path = '/data'): Promise<BrowseResponse> {
  const response = await apiClient.get<BrowseResponse>('/filesystem/browse', {
    params: { path },
  });
  return response.data;
}
