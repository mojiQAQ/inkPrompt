const POST_AUTH_REDIRECT_KEY = 'inkprompt.post_auth_redirect'

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
