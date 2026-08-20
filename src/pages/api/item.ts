import type { NextApiRequest, NextApiResponse } from 'next'
import apiConfig from '../../utils/apiConfig'
import { graphHeaders, requireAccessToken, sendDriveError, setDefaultCacheControl } from '../../utils/apiRoute'
import { get } from '../../utils/http'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id = '' } = req.query

  setDefaultCacheControl(res)

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid driveItem ID.' })
    return
  }

  const accessToken = await requireAccessToken(res)
  if (!accessToken) return

  try {
    const { data } = await get(`${apiConfig.driveApi}/items/${id}`, {
      headers: graphHeaders(accessToken),
      params: { select: 'id,name,parentReference' },
    })
    res.status(200).json(data)
  } catch (error: any) {
    sendDriveError(res, error)
  }
  return
}
