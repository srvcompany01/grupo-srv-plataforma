import { headers } from 'next/headers'

export async function urlBase(): Promise<string> {
  if (process.env.NEXT_PUBLIC_URL_BASE) return process.env.NEXT_PUBLIC_URL_BASE
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
