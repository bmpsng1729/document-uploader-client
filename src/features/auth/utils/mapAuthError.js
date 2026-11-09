const GENERIC_ERROR = 'Something went wrong. Please try again.'
const FIELD_NAMES = new Set([
  'name',
  'fullName',
  'email',
  'password',
  'confirmPassword',
  'confirmationPassword',
])

export function mapAuthError(error, operation = 'generic') {
  const status = error?.response?.status

  if (status === 401 && operation === 'login') {
    return 'Invalid email or password'
  }
  if (status === 409 && operation === 'signup') {
    return 'An account with this email already exists. Try logging in.'
  }
  if (status === 429) {
    return 'Too many attempts. Please try again later.'
  }
  if (
    !error?.response &&
    (error?.isAxiosError || error?.request || error?.code)
  ) {
    return 'Cannot reach the server. Check your connection.'
  }
  return GENERIC_ERROR
}

export function mapAuthFieldErrors(error) {
  if (error?.response?.status !== 400) {
    return {}
  }

  const errors = error.response.data?.errors
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(errors)
      .filter(
        ([field, message]) =>
          FIELD_NAMES.has(field) &&
          typeof message === 'string' &&
          message.trim().length > 0,
      )
      .map(([field, message]) => [field, message.trim().slice(0, 200)]),
  )
}
