/**
 * Optimization API functions
 */
import { apiRequest } from './client'

export type OptimizationScenario = 'general' | 'content_creation' | 'code_generation' | 'data_analysis' | 'conversation'

export interface OptimizationRequest {
  scenario: OptimizationScenario
  custom_requirements?: string
}

export interface OptimizationResponse {
  optimized_content: string
  suggestions: string[]
  token_count: number
  estimated_cost: number
}

/**
 * Optimize a prompt
 */
export async function optimizePrompt(
  token: string,
  promptId: string,
  request: OptimizationRequest
): Promise<OptimizationResponse> {
  return apiRequest<OptimizationResponse>(`/api/prompts/${promptId}/optimize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
}
