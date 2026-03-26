/**
 * Small fetch-based SSE client for POST streaming endpoints.
 *
 * Native EventSource only supports GET, while the backend plan uses POST
 * for both optimization and test streams. This helper keeps the transport
 * browser-friendly and easy to unit test.
 */
export interface ParsedSSEEvent {
  event: string
  data: string
  id?: string
}

export interface SSEConnection {
  controller: AbortController
  done: Promise<void>
}

export interface PostSSEOptions<TBody> {
  url: string
  token: string
  body: TBody
  onEvent: (event: ParsedSSEEvent) => void
  controller?: AbortController
}

function parseSSEBlock(block: string): ParsedSSEEvent | null {
  const lines = block
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0 && !line.startsWith(':'))

  if (lines.length === 0) return null

  let event = 'message'
  let id: string | undefined
  const dataParts: string[] = []

  for (const line of lines) {
    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    let value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1)

    if (value.startsWith(' ')) value = value.slice(1)

    if (field === 'event') {
      event = value || 'message'
    } else if (field === 'data') {
      dataParts.push(value)
    } else if (field === 'id') {
      id = value
    }
  }

  return {
    event,
    data: dataParts.join('\n'),
    ...(id ? { id } : {}),
  }
}

async function readSSEStream(response: Response, onEvent: (event: ParsedSSEEvent) => void) {
  if (!response.body) {
    throw new Error('SSE response body is empty')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')

    let boundaryIndex = buffer.indexOf('\n\n')
    while (boundaryIndex !== -1) {
      const block = buffer.slice(0, boundaryIndex)
      buffer = buffer.slice(boundaryIndex + 2)

      const parsed = parseSSEBlock(block)
      if (parsed) onEvent(parsed)

      boundaryIndex = buffer.indexOf('\n\n')
    }
  }

  const remaining = buffer.trim()
  if (remaining) {
    const parsed = parseSSEBlock(remaining)
    if (parsed) onEvent(parsed)
  }
}

export function postSSE<TBody>({
  url,
  token,
  body,
  onEvent,
  controller: providedController,
}: PostSSEOptions<TBody>): SSEConnection {
  const controller = providedController ?? new AbortController()

  const done = (async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `SSE request failed with status ${response.status}`)
    }

    await readSSEStream(response, onEvent)
  })()

  return { controller, done }
}

export { parseSSEBlock }
