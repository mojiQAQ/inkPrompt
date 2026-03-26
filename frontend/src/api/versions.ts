/**
 * Version history API
 */
import { apiRequest, getAuthHeaders } from './client'
import type { PromptVersion, VersionListResponse } from '@/types/prompt'

/**
 * Get all versions of a prompt
 */
export async function getPromptVersions(token: string, promptId: string): Promise<VersionListResponse> {
  return apiRequest<VersionListResponse>(`/api/prompts/${promptId}/versions`, {
    headers: getAuthHeaders(token),
  })
}

/**
 * Get details of a specific version
 */
export async function getVersionDetail(token: string, promptId: string, versionId: string): Promise<PromptVersion> {
  return apiRequest<PromptVersion>(`/api/prompts/${promptId}/versions/${versionId}`, {
    headers: getAuthHeaders(token),
  })
}

/**
 * Restore a prompt to a specific version
 */
export async function restoreVersion(token: string, promptId: string, versionId: string): Promise<any> {
  return apiRequest(`/api/prompts/${promptId}/versions/${versionId}/restore`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  })
}
