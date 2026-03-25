/**
 * Folders API functions
 */
import { apiRequest, getAuthHeaders } from './client'
import type { Folder, FolderListResponse, CreateFolderData, UpdateFolderData } from '@/types/folder'

/**
 * Fetch all folders for the current user
 */
export async function fetchFolders(token: string): Promise<FolderListResponse> {
  return apiRequest<FolderListResponse>('/api/folders', {
    headers: getAuthHeaders(token),
  })
}

/**
 * Create a new folder
 */
export async function createFolder(token: string, data: CreateFolderData): Promise<Folder> {
  return apiRequest<Folder>('/api/folders', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  })
}

/**
 * Update (rename) a folder
 */
export async function updateFolder(token: string, id: string, data: UpdateFolderData): Promise<Folder> {
  return apiRequest<Folder>(`/api/folders/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  })
}

/**
 * Delete a folder
 */
export async function deleteFolder(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/api/folders/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  })
}

/**
 * Add a prompt to a folder
 */
export async function addPromptToFolder(
  token: string,
  folderId: string,
  promptId: string
): Promise<void> {
  return apiRequest<void>(`/api/folders/${folderId}/prompts`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ prompt_id: promptId }),
  })
}

/**
 * Remove a prompt from a folder
 */
export async function removePromptFromFolder(
  token: string,
  folderId: string,
  promptId: string
): Promise<void> {
  return apiRequest<void>(`/api/folders/${folderId}/prompts/${promptId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  })
}

/**
 * Toggle favorite status of a prompt
 */
export async function toggleFavorite(
  token: string,
  promptId: string
): Promise<{ is_favorited: boolean }> {
  return apiRequest<{ is_favorited: boolean }>(`/api/prompts/${promptId}/favorite`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
  })
}
