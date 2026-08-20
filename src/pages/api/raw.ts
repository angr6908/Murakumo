import type { NextApiRequest, NextApiResponse } from 'next'

import {
  driveItemUrl,
  graphHeaders,
  normalisePathQuery,
  requireAccessToken,
  sendDriveError,
  setDefaultCacheControl,
  verifyProtectedPath,
} from '../../utils/apiRoute'
import { get, getStream } from '../../utils/http'
import { runCorsMiddleware } from '../../utils/onedriveApi'

const shouldProxyFile = (proxy: NextApiRequest['query'][string]) => proxy === 'true' || proxy === '1'
const toHeaderObject = (
  headers: Headers,
  cacheControl: ReturnType<NextApiResponse['getHeader']>,
): Record<string, string | number | string[]> => {
  const out: Record<string, string | number | string[]> = {}
  headers.forEach((value, key) => {
    out[key] = value
  })
  if (cacheControl !== undefined) out['Cache-Control'] = String(cacheControl)
  return out
}

/** Pipe a WHATWG ReadableStream into a Next.js ServerResponse (replaces axios `stream.pipe`). */
async function pipeStream(stream: ReadableStream, res: NextApiResponse): Promise<void> {
  const reader = stream.getReader()
  res.flushHeaders?.()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
    res.end()
  } catch (error) {
    reader.cancel().catch(() => {})
    res.destroy(error as Error)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = '/', odpt = '', proxy } = req.query

  const pathQuery = normalisePathQuery(path)
  if ('error' in pathQuery) {
    res.status(400).json({ error: pathQuery.error })
    return
  }

  const accessToken = await requireAccessToken(res)
  if (!accessToken) return

  const odTokenHeader = (req.headers['od-protected-token'] as string) ?? odpt
  const hasAccess = await verifyProtectedPath(res, pathQuery.path, accessToken, odTokenHeader as string)
  if (!hasAccess) return
  setDefaultCacheControl(res)

  await runCorsMiddleware(req, res)
  try {
    const { data } = await get(driveItemUrl(pathQuery.path), {
      headers: graphHeaders(accessToken),
      params: { select: 'id,size,@microsoft.graph.downloadUrl' },
    })

    const downloadUrl = data['@microsoft.graph.downloadUrl']
    if (!downloadUrl) {
      res.status(404).json({ error: 'No download url found.' })
      return
    }

    const cacheControl = res.getHeader('Cache-Control')

    if (shouldProxyFile(proxy) && 'size' in data && data.size < 4194304) {
      const { headers, data: stream } = await getStream(downloadUrl as string)
      res.writeHead(200, toHeaderObject(headers, cacheControl))
      await pipeStream(stream, res)
      return
    }

    res.redirect(downloadUrl)
    return
  } catch (error: any) {
    sendDriveError(res, error)
    return
  }
}
