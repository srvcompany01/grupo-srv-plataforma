'use client'

import { Check, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'

/** Inscrição na newsletter do blog (nome + e-mail). Campo escondido "website" segura robôs. */
export function Newsletter({ origem, compacta }: { origem: string; compacta?: boolean }) {
  const [estado, setEstado] = useState<'livre' | 'enviando' | 'ok' | 'erro'>('livre')
  const [erro, setErro] = useState('')
  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEstado('enviando')
    try {
      const r = await fetch('/api/blog/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: f.get('nome'), email: f.get('email'), website: f.get('website'), origem }) })
      const corpo = (await r.json()) as { ok: boolean; erro?: string }
      if (!corpo.ok) throw new Error(corpo.erro)
      setEstado('ok')
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível inscrever agora.')
      setEstado('erro')
    }
  }
  if (estado === 'ok') {
    return <p className="flex items-center gap-2 rounded-xl bg-[#e8f5ec] px-4 py-3 text-[14px] font-medium text-[#167c3a]"><Check className="h-4 w-4" /> Pronto! Você vai receber os melhores conteúdos no seu e-mail.</p>
  }
  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className={`grid gap-2 ${compacta ? '' : 'sm:grid-cols-[1fr_1.3fr_auto]'}`}>
        <input name="nome" placeholder="Seu nome" maxLength={80} autoComplete="given-name" className="h-12 rounded-full border border-[#e6e6e2] bg-white px-5 text-[14px] text-[#070707] outline-none focus:border-[#d80d12]" />
        <input name="email" type="email" required placeholder="Seu melhor e-mail" maxLength={200} autoComplete="email" className="h-12 rounded-full border border-[#e6e6e2] bg-white px-5 text-[14px] text-[#070707] outline-none focus:border-[#d80d12]" />
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button disabled={estado === 'enviando'} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#d80d12] px-6 text-[14px] font-semibold text-white transition hover:bg-[#a2070a] disabled:opacity-60">
          <Mail className="h-4 w-4" /> {estado === 'enviando' ? 'Enviando…' : 'Quero receber'}
        </button>
      </div>
      {estado === 'erro' && <p className="text-[13px] text-[#a2070a]">{erro}</p>}
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#656565]">
        <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#167c3a]" /> De graça</span>
        <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#167c3a]" /> Conteúdo prático</span>
        <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#167c3a]" /> Cancele com um clique</span>
      </p>
    </form>
  )
}

/** Conta a visita do artigo (no navegador, para não atrapalhar o cache da página). */
export function ContarVisita({ slug }: { slug: string }) {
  useEffect(() => {
    void fetch('/api/blog/visita', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }), keepalive: true }).catch(() => {})
  }, [slug])
  return null
}
