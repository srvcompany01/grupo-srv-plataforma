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

/** De onde veio a visita (só a categoria: Google, ChatGPT, Instagram…), pela UTM ou pelo site anterior. */
function origemDaVisita(): string {
  const utm = new URLSearchParams(window.location.search).get('utm_source')?.toLowerCase() ?? ''
  let ref = ''
  try {
    ref = document.referrer ? new URL(document.referrer).hostname : ''
  } catch {}
  const fonte = `${utm} ${ref}`
  if (/chatgpt|openai/.test(fonte)) return 'chatgpt'
  if (/perplexity/.test(fonte)) return 'perplexity'
  if (/gemini|bard/.test(fonte)) return 'gemini'
  if (/copilot/.test(fonte)) return 'copilot'
  if (/google/.test(fonte)) return 'google'
  if (/bing/.test(fonte)) return 'bing'
  if (/instagram/.test(fonte)) return 'instagram'
  if (/facebook|fb\./.test(fonte)) return 'facebook'
  if (/linkedin|lnkd/.test(fonte)) return 'linkedin'
  if (/whatsapp|wa\.me/.test(fonte)) return 'whatsapp'
  if (!fonte.trim() || ref === window.location.hostname) return 'direto'
  return 'outro'
}

/**
 * Medição do artigo (no navegador, para não atrapalhar o cache da página): visita e origem, rolagem 25/50/75/90,
 * leitura engajada (30 s na página e metade lida), cliques no CTA ([data-cta]) e em links internos.
 * Os eventos vão juntos ao sair da página (sendBeacon). Nada de dado pessoal.
 */
export function MedirLeitura({ slug }: { slug: string }) {
  useEffect(() => {
    const fila = new Set<string>(['page_view', `origem:${origemDaVisita()}`])
    const enviados = new Set<string>()
    const inicio = Date.now()
    let maior = 0
    const enviar = () => {
      const novos = [...fila].filter((e) => !enviados.has(e))
      if (!novos.length) return
      novos.forEach((e) => enviados.add(e))
      const corpo = JSON.stringify({ slug, eventos: novos })
      if (!navigator.sendBeacon?.('/api/blog/eventos', corpo)) void fetch('/api/blog/eventos', { method: 'POST', body: corpo, keepalive: true }).catch(() => {})
    }
    const rolar = () => {
      const artigo = document.querySelector('[data-artigo]')
      if (!artigo) return
      const r = artigo.getBoundingClientRect()
      const lido = Math.min(1, Math.max(0, (window.innerHeight - r.top) / Math.max(1, r.height)))
      maior = Math.max(maior, lido)
      for (const p of [25, 50, 75, 90]) if (maior * 100 >= p) fila.add(`scroll_${p}`)
      if (maior >= 0.5 && Date.now() - inicio >= 30_000) fila.add('engaged_view')
    }
    const clicar = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const cta = a.getAttribute('data-cta')
      if (cta === '2') fila.add('cta2_click')
      else if (cta) fila.add('cta_click')
      else if (a.getAttribute('href')?.startsWith('/blog/')) fila.add('internal_link_click')
      enviar()
    }
    const sair = () => {
      if (document.visibilityState === 'hidden') {
        rolar()
        enviar()
      }
    }
    enviar()
    window.addEventListener('scroll', rolar, { passive: true })
    document.addEventListener('click', clicar)
    document.addEventListener('visibilitychange', sair)
    window.addEventListener('pagehide', enviar)
    const relogio = setInterval(rolar, 10_000)
    return () => {
      window.removeEventListener('scroll', rolar)
      document.removeEventListener('click', clicar)
      document.removeEventListener('visibilitychange', sair)
      window.removeEventListener('pagehide', enviar)
      clearInterval(relogio)
      enviar()
    }
  }, [slug])
  return null
}
