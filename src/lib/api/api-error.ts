import type { ApiError } from '@joutio/client-domain/api-types'

/** Types de problème RFC 7807 (`urn:joutio:*`) dont la plomberie dépend. */
export const PROBLEM = {
  accountSuspended: 'urn:joutio:authorization:accountSuspended',
  unknownUser: 'urn:joutio:authentification:unknownUser',
} as const

/** Erreur HTTP typée : porte le ProblemDetail du BFF (`ApiError` de `@joutio/client-domain`). */
export class ApiRequestError extends Error implements ApiError {
  readonly statusCode?: number
  readonly title?: string
  readonly detail?: string
  readonly type?: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.statusCode = error.statusCode
    this.title = error.title
    this.detail = error.detail
    this.type = error.type
  }

  /** Erreur réseau (pas de réponse) ou serveur : rejouable. */
  get transient(): boolean {
    return this.statusCode == null || this.statusCode === 408 || this.statusCode === 429 || this.statusCode >= 500
  }
}

export const isApiError = (error: unknown): error is ApiRequestError => error instanceof ApiRequestError

/** Lit un ProblemDetail (`application/problem+json`) ou retombe sur le statut HTTP. */
export async function toApiError(response: Response): Promise<ApiRequestError> {
  let body: Partial<{ title: string; detail: string; type: string; message: string }> = {}
  try {
    const text = await response.text()
    if (text) body = JSON.parse(text) as typeof body
  } catch {
    // Corps absent ou non JSON : le statut suffit.
  }
  return new ApiRequestError({
    message: body.detail ?? body.message ?? body.title ?? `HTTP ${response.status}`,
    statusCode: response.status,
    title: body.title,
    detail: body.detail,
    type: body.type,
  })
}
