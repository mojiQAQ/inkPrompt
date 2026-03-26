/**
 * Available model configuration API.
 */
import { apiRequest, getAuthHeaders } from './client'
import type { ModelConfig } from '@/types/prompt'

interface AvailableModelsResponse {
  items: ModelConfig[]
  max_concurrent_test_models: number
}

export async function getAvailableModels(token: string): Promise<AvailableModelsResponse> {
  return apiRequest<AvailableModelsResponse>('/api/models', {
    headers: getAuthHeaders(token),
  })
}
