import type { HttpClient, HttpQuery } from '@joutio/client/core'
import { request } from './api-client'

type Options = { body?: unknown; query?: HttpQuery; signal?: unknown }

/** Signal de la lib (`AbortSignalLike`) : celui de React Query est un `AbortSignal` du navigateur. */
const optionsOf = (options: Options | undefined) => ({ body: options?.body, query: options?.query, signal: options?.signal as AbortSignal | undefined })

/**
 * `HttpClient` de `@joutio/client` sur le client HTTP unique (`request`) : même session, mêmes erreurs RFC 7807. Remis
 * à `JoutioClientProvider` : les hooks de la lib passent tous par lui.
 */
export const http: HttpClient = {
  get: (path, options) => request(path, { ...optionsOf(options), method: 'GET' }),
  post: (path, options) => request(path, { ...optionsOf(options), method: 'POST' }),
  put: (path, options) => request(path, { ...optionsOf(options), method: 'PUT' }),
  delete: (path, options) => request(path, { ...optionsOf(options), method: 'DELETE' }),
}
