import { NextResponse } from 'next/server'
import { usuarioAtual } from '@/infra/supabase/sessao'

type FotoUnsplash = {
  id: string
  alt_description: string | null
  urls: { small: string; regular: string }
  links: { download_location: string }
  user: { name: string }
}

// Busca de fotos para a capa dos clientes. Só equipe logada (a chave de API nunca vai ao navegador).
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel === 'cliente') return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  const chave = process.env.UNSPLASH_ACCESS_KEY
  if (!chave) return NextResponse.json({ erro: 'A busca de imagens ainda não foi configurada (UNSPLASH_ACCESS_KEY).' }, { status: 503 })
  const q = new URL(req.url).searchParams.get('q')?.trim().slice(0, 80)
  if (!q) return NextResponse.json({ fotos: [] })
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=18&orientation=landscape&content_filter=high`
  const resp = await fetch(url, { headers: { Authorization: `Client-ID ${chave}` }, next: { revalidate: 3600 } })
  if (!resp.ok) return NextResponse.json({ erro: 'Não foi possível buscar imagens agora.' }, { status: 502 })
  const corpo = (await resp.json()) as { results: FotoUnsplash[] }
  const fotos = corpo.results.map((f) => ({
    id: f.id,
    descricao: f.alt_description ?? '',
    miniatura: f.urls.small,
    url: f.urls.regular,
    credito: `Foto: ${f.user.name} / Unsplash`,
    download: f.links.download_location,
  }))
  return NextResponse.json({ fotos })
}
