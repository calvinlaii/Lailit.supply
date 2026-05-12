import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export function getMediaBucket(): R2Bucket {
  const { env } = getCloudflareContext()
  return env.MEDIA
}

export async function putMedia(
  key: string,
  body: ReadableStream | ArrayBuffer | Blob | string,
  options?: R2PutOptions,
): Promise<R2Object> {
  const result = await getMediaBucket().put(key, body, options)
  if (!result) throw new Error(`R2 put failed for key: ${key}`)
  return result
}

export function getMedia(key: string): Promise<R2ObjectBody | null> {
  return getMediaBucket().get(key)
}

export function deleteMedia(key: string): Promise<void> {
  return getMediaBucket().delete(key)
}

export function listMedia(options?: R2ListOptions): Promise<R2Objects> {
  return getMediaBucket().list(options)
}
