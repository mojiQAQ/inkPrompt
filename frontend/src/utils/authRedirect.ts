const POST_AUTH_REDIRECT_KEY = 'inkprompt.post_auth_redirect'
const POST_AUTH_ACTION_KEY = 'inkprompt.post_auth_action'

export type PostAuthAction =
  | { type: 'square-copy'; entryId: string }
  | { type: 'square-test'; entryId: string }

function canUseSessionStorage() {
  return (
    typeof window !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  )
}

export function buildRedirectTarget(input: {
  pathname: string
  search?: string
  hash?: string
}) {
  return `${input.pathname}${input.search ?? ''}${input.hash ?? ''}`
}

export function persistPostAuthRedirect(target: string) {
  if (!canUseSessionStorage()) return

  window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, target)
}

export function readPostAuthRedirect() {
  if (!canUseSessionStorage()) return null

  return window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)
}

export function clearPostAuthRedirect() {
  if (!canUseSessionStorage()) return

  window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
}

export function consumePostAuthRedirect(fallback = '/prompts') {
  const redirect = readPostAuthRedirect()
  clearPostAuthRedirect()
  return redirect || fallback
}

export function persistPostAuthAction(action: PostAuthAction) {
  if (!canUseSessionStorage()) return

  window.sessionStorage.setItem(POST_AUTH_ACTION_KEY, JSON.stringify(action))
}

export function readPostAuthAction(): PostAuthAction | null {
  if (!canUseSessionStorage()) return null

  const raw = window.sessionStorage.getItem(POST_AUTH_ACTION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<PostAuthAction>
    if (
      (parsed.type === 'square-copy' || parsed.type === 'square-test') &&
      typeof parsed.entryId === 'string' &&
      parsed.entryId
    ) {
      return {
        type: parsed.type,
        entryId: parsed.entryId,
      }
    }
  } catch {
    window.sessionStorage.removeItem(POST_AUTH_ACTION_KEY)
  }

  return null
}

export function clearPostAuthAction() {
  if (!canUseSessionStorage()) return

  window.sessionStorage.removeItem(POST_AUTH_ACTION_KEY)
}

export function consumePostAuthAction() {
  const action = readPostAuthAction()
  clearPostAuthAction()
  return action
}
