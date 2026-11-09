export function safeRedirect(destination, fallback = '/dashboard') {
  const candidate =
    typeof destination === 'string'
      ? destination
      : destination &&
          typeof destination === 'object' &&
          typeof destination.pathname === 'string'
        ? `${destination.pathname}${destination.search ?? ''}${destination.hash ?? ''}`
        : ''

  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.startsWith('/\\')
  ) {
    return fallback
  }

  try {
    const parsed = new URL(candidate, window.location.origin)
    return parsed.origin === window.location.origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback
  } catch {
    return fallback
  }
}
