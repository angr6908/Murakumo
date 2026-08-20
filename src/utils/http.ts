/**
 * Bun-native HTTP client built on the standard `fetch` Web API (the same API the
 * browser exposes), replacing `axios`. Every request goes through the platform
 * primitives bundler-compatible in both Bun and the browser, so this module is safe
 * to import from client and server code alike.
 *
 * It mirrors the small slice of `axios`'s surface Murakumo relies on:
 *   - `get(url, { headers, params })`              -> `{ data }`
 *   - `post(url, body, { headers })`               -> `{ data }`
 *   - `getStream(url, { headers })`                -> `{ data: ReadableStream, headers }`
 *   - `isHttpError(error)` and `error.response`    -> `{ status, data }`
 */

export type HttpError = {
  response: {
    status: number
    data: unknown
  }
}

export const isHttpError = (error: unknown): error is HttpError =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as HttpError).response?.status === 'number'

type QueryParams = Record<string, string | number | boolean | string[] | undefined>

const buildUrl = (url: string, params?: QueryParams): string => {
  if (!params) return url
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const v of value) searchParams.append(key, String(v))
    } else {
      searchParams.set(key, String(value))
    }
  }
  const query = searchParams.toString()
  return query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url
}

const toHttpError = async (response: Response): Promise<HttpError> => {
  let data: unknown = null
  try {
    data = await response.text()
    try {
      data = JSON.parse(data as string)
    } catch {
      // keep raw text
    }
  } catch {
    // ignore body read failures
  }
  return { response: { status: response.status, data } }
}

/**
 * Perform a GET and parse the JSON body. Throws an `HttpError` (with `.response`)
 * on non-2xx so callers can read `error.response.status` / `.data`, matching axios.
 */
export async function get(
  url: string,
  { headers, params }: { headers?: Record<string, string>; params?: QueryParams } = {},
): Promise<{ data: any; headers: Headers }> {
  const response = await fetch(buildUrl(url, params), { headers })
  if (!response.ok) throw await toHttpError(response)
  const data = await response.json().catch(() => undefined)
  return { data, headers: response.headers }
}

/**
 * Perform a POST. `body` may be a `URLSearchParams` or a JSON-serialisable object;
 * when the caller supplies `application/json` headers the object is stringified.
 * Throws an `HttpError` on non-2xx.
 */
export async function post(
  url: string,
  body: URLSearchParams | Record<string, unknown> | string,
  { headers }: { headers?: Record<string, string> } = {},
): Promise<{ data: any }> {
  let payload: BodyInit | undefined
  const requestHeaders: Record<string, string> = { ...headers }

  if (body instanceof URLSearchParams) {
    payload = body
  } else if (typeof body === 'string') {
    payload = body
  } else {
    if (!requestHeaders['Content-Type']) requestHeaders['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const response = await fetch(url, { method: 'POST', headers: requestHeaders, body: payload })
  if (!response.ok) throw await toHttpError(response)
  const data = await response.json().catch(() => undefined)
  return { data }
}

/**
 * Perform a GET and return the response body as a `ReadableStream` for proxying.
 * Used by the raw file proxy instead of axios's `responseType: 'stream'`.
 * Throws an `HttpError` on non-2xx.
 */
export async function getStream(
  url: string,
  { headers }: { headers?: Record<string, string> } = {},
): Promise<{ data: ReadableStream; headers: Headers }> {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    await response.body?.cancel()
    throw await toHttpError(response)
  }
  if (!response.body) throw new Error('Response has no body stream.')
  return { data: response.body, headers: response.headers }
}
