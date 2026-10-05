import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { armazenamentoLocal } from '@/infra/r2'

// Substituto local do R2 para desenvolvimento. Responde 404 fora do modo local.
const RAIZ = path.join(process.cwd(), '.dados', 'arquivos')

const TIPOS: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', mov: 'video/quicktime',
}

function caminho(partes: string[]): string | null {
  const alvo = path.join(RAIZ, ...partes)
  return alvo.startsWith(RAIZ + path.sep) ? alvo : null
}

export async function PUT(req: Request, ctx: RouteContext<'/api/dev-arquivos/[...chave]'>) {
  const alvo = caminho((await ctx.params).chave)
  if (!armazenamentoLocal() || !alvo) return new Response(null, { status: 404 })
  await mkdir(path.dirname(alvo), { recursive: true })
  await writeFile(alvo, Buffer.from(await req.arrayBuffer()))
  return new Response(null, { status: 200 })
}

export async function GET(req: Request, ctx: RouteContext<'/api/dev-arquivos/[...chave]'>) {
  const partes = (await ctx.params).chave
  const alvo = caminho(partes)
  if (!armazenamentoLocal() || !alvo) return new Response(null, { status: 404 })
  const dados = await readFile(alvo).catch(() => null)
  if (!dados) return new Response(null, { status: 404 })
  const ext = partes.at(-1)?.split('.').pop()?.toLowerCase() ?? ''
  const headers: Record<string, string> = { 'Content-Type': TIPOS[ext] ?? 'application/octet-stream' }
  const download = new URL(req.url).searchParams.get('download')
  if (download) headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(download)}`
  return new Response(dados, { headers })
}
