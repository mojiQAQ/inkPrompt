/**
 * Optimization API functions
 */
import { apiRequest, getAuthHeaders } from './client'
import type {
  OptimizationSession,
  OptimizationStreamRequest,
  OptimizeSSEEvent,
  OptimizeSSEEventHandler,
} from '@/types/prompt'
import { startOptimizeStream as startOptimizeSSE } from './optimization_sse'

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

export async function getOptimizationSession(
  token: string,
  promptId: string
): Promise<OptimizationSession> {
  return apiRequest<OptimizationSession>(`/api/prompts/${promptId}/optimize/session`, {
    headers: getAuthHeaders(token),
  })
}

export function startOptimizeStream(
  token: string,
  promptId: string,
  versionId: string,
  request: OptimizationStreamRequest,
  onEvent: OptimizeSSEEventHandler,
  controller?: AbortController
) {
  return startOptimizeSSE(token, promptId, versionId, request, onEvent, controller)
}

export type { OptimizationStreamRequest, OptimizeSSEEvent, OptimizeSSEEventHandler }
