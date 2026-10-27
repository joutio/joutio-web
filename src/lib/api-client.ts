import i18n from "@/lib/i18n"
import type { ApiError } from "@/shared/types/api"

interface ApiClientConfig {
  baseUrl: string
  defaultHeaders?: Record<string, string>
  /** Délai maximal par défaut d'une requête (ms). Un délai dépassé produit une `ApiError` 408. */
  defaultTimeoutMs?: number
  onError?: (error: ApiError, options: RequestOptions) => void
  getAuthToken?: () => string | null
  /**
   * Renouvellement de session déclenché sur `401` (retourne le nouvel access token, ou
   * `null` si le refresh échoue). Le single-flight est porté par l'implémentation.
   */
  onUnauthorized?: () => Promise<string | null>
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
  /** Corps multipart (upload de fichier) : prioritaire sur `body`, pas de Content-Type JSON. */
  formData?: FormData
  absolute?: boolean
  skipErrorBus?: boolean
  /** Délai maximal de la requête (ms), prioritaire sur `defaultTimeoutMs`. */
  timeoutMs?: number
  /** Ne pas tenter de refresh sur 401 (ex. endpoints `/api/auth/*`). */
  skipAuthRefresh?: boolean
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

/**
 * Client fetch typé : base URL, sérialisation JSON, gestion d'erreur centralisée
 * et injection optionnelle du Bearer token. Cf. best-practices/.frontend/api-integration.md.
 */
export function createApiClient(clientConfig: ApiClientConfig) {
  const {
    baseUrl,
    defaultHeaders = {},
    defaultTimeoutMs,
    onError,
    getAuthToken,
    onUnauthorized,
  } = clientConfig

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      params,
      body,
      headers: reqHeaders,
      absolute,
      skipErrorBus,
      timeoutMs,
      skipAuthRefresh,
      signal: externalSignal,
      formData,
      ...fetchOptions
    } = options

    const url = absolute ? new URL(path) : new URL(path, baseUrl)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    const buildHeaders = (token: string | null): Record<string, string> => {
      const headers: Record<string, string> = {
        // Le navigateur pose lui-même le Content-Type multipart (boundary) pour un FormData.
        ...(formData ? {} : { "Content-Type": "application/json" }),
        ...defaultHeaders,
        ...(reqHeaders as Record<string, string> | undefined),
      }
      if (token) headers["Authorization"] = `Bearer ${token}`
      return headers
    }

    const timeout = timeoutMs ?? defaultTimeoutMs
    const controller = new AbortController()
    let timedOut = false
    const abortFromExternal = () => controller.abort()
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort()
      } else {
        externalSignal.addEventListener("abort", abortFromExternal, {
          once: true,
        })
      }
    }
    const timer =
      timeout != null
        ? setTimeout(() => {
            timedOut = true
            controller.abort()
          }, timeout)
        : undefined

    const send = (token: string | null) =>
      fetch(url, {
        method,
        headers: buildHeaders(token),
        body:
          formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
        ...fetchOptions,
        signal: controller.signal,
      })

    try {
      let response = await send(getAuthToken?.() ?? null)

      // 401 → tentative de renouvellement unique puis rejeu de la requête.
      if (response.status === 401 && onUnauthorized && !skipAuthRefresh) {
        const refreshedToken = await onUnauthorized()
        if (refreshedToken) {
          response = await send(refreshedToken)
        }
      }

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          message: response.statusText,
          statusCode: response.status,
        }))
        error.statusCode = error.statusCode ?? response.status
        if (!skipErrorBus) onError?.(error, options)
        throw error
      }

      if (response.status === 204 || response.status === 205)
        return undefined as T

      const text = await response.text()
      if (!text) return undefined as T
      return JSON.parse(text) as T
    } catch (error) {
      // Un abort d'origine externe (annulation appelante) n'est pas un timeout.
      if (isAbortError(error) && !externalSignal?.aborted) {
        const apiError: ApiError = {
          message: timedOut
            ? i18n.t("shared.errors.timeout")
            : i18n.t("shared.errors.interrupted"),
          statusCode: 408,
        }
        if (!skipErrorBus) onError?.(apiError, options)
        throw apiError
      }
      throw error
    } finally {
      if (timer !== undefined) clearTimeout(timer)
      externalSignal?.removeEventListener("abort", abortFromExternal)
    }
  }

  return {
    get<T>(path: string, opts?: RequestOptions) {
      return request<T>("GET", path, opts)
    },
    post<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("POST", path, { ...opts, body })
    },
    put<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("PUT", path, { ...opts, body })
    },
    patch<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("PATCH", path, { ...opts, body })
    },
    delete<T>(path: string, opts?: RequestOptions) {
      return request<T>("DELETE", path, opts)
    },
    /** Upload multipart (FormData) — le Content-Type est posé par le navigateur. */
    upload<T>(path: string, formData: FormData, opts?: RequestOptions) {
      return request<T>("POST", path, { ...opts, formData })
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
