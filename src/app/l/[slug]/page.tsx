import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { ehRobo, origemDaBio, slugValido } from '@/dominio/bio'
import { urlLeitura } from '@/infra/r2'
import { Visualizacao } from './Visualizacao'
import { criarClientePublico } from '@/infra/supabase/publico'

export const dynamic = 'force-dynamic'

const FAVICON_VAZIO = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22/%3E'

const ler = cache(async (slug: string) => {
  if (!slugValido(slug)) return null
  const { data } = await criarClientePublico().rpc('bio_pagina', { p_slug: slug })
  const d = data?.[0]
  if (!d) return null
  const logo = d.logo ? await urlLeitura(d.logo).catch(() => null) : null
  return { ...d, logo, links: (d.links ?? []) as { id: string; rotulo: string }[] }
})

export async function generateMetadata({ params }: PageProps<'/l/[slug]'>): Promise<Metadata> {
  const p = await ler((await params).slug)
  return { title: p?.nome ?? 'Link', icons: { icon: p?.logo ?? FAVICON_VAZIO }, robots: { index: false, follow: false } }
}

/** Página da bio do cliente: preto e branco, só o nome e a logo do cliente e os botões. Nada da agência. */
export default async function PaginaBio({ params, searchParams }: PageProps<'/l/[slug]'>) {
  const { slug } = await params
  const p = await ler(slug)
  if (!p) notFound()
  const o = (await searchParams).o
  const origem = origemDaBio(Array.isArray(o) ? o[0] : o)
  const humano = !ehRobo((await headers()).get('user-agent'))
  // O clique conta ao pedir a página; a visualização, quando ela abre no aparelho (Visualizacao).
  if (humano) await criarClientePublico().rpc('bio_visita', { p_slug: slug, p_origem: origem })
  const base = `/l/${slug}/ir`
  const botoes = [...(p.whatsapp ? [{ id: 'whatsapp', rotulo: 'Chamar no WhatsApp' }] : []), ...p.links]
  return (
    <main className="flex min-h-dvh flex-col items-center bg-white px-5 py-14 text-black">
      {humano && <Visualizacao origem={origem} />}
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {p.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logo} alt="" className="h-28 w-28 rounded-full border border-black/10 object-cover" />
          ) : (
            <span className="flex h-28 w-28 items-center justify-center rounded-full bg-black text-4xl font-semibold text-white">{p.nome.trim().charAt(0).toUpperCase()}</span>
          )}
          <h1 className="text-xl font-semibold tracking-tight">{p.nome}</h1>
        </div>
        <nav className="flex w-full flex-col gap-3">
          {botoes.map((b, i) => (
            <a key={b.id} href={`${base}/${b.id}`} rel="nofollow noopener" className={`block w-full rounded-full border border-black px-5 py-3.5 text-center text-base font-medium transition-colors ${i === 0 ? 'bg-black text-white hover:bg-white hover:text-black' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
              {b.rotulo}
            </a>
          ))}
        </nav>
      </div>
    </main>
  )
}
