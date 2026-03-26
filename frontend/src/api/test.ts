/**
 * Test session API functions.
 */
import { apiRequest, getAuthHeaders } from './client'
import type {
  TestSession,
  TestStreamRequest,
  TestSSEEventHandler,
} from '@/types/prompt'
import { startTestStream as startTestSSE } from './test_sse'

export async function getTestSession(
  token: string,
  versionId: string
): Promise<TestSession> {
  return apiRequest<TestSession>(`/api/prompts/${versionId}/test/session`, {
    headers: getAuthHeaders(token),
  })
}

export function startTestStream(
  token: string,
  versionId: string,
  request: TestStreamRequest,
  onEvent: TestSSEEventHandler,
  controller?: AbortController
) {
  return startTestSSE(token, versionId, request, onEvent, controller)
}

export type { TestStreamRequest, TestSSEEventHandler }
