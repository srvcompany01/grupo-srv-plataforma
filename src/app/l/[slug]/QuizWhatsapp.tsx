'use client'

import { useState } from 'react'
import type { QuizDaPagina } from '@/dominio/bio-quiz'

type Estado = { etapa: number; escolhas: number[]; enviando: boolean; url: string | null; erro: string | null }
const INICIO: Estado = { etapa: 0, escolhas: [], enviando: false, url: null, erro: null }

/** Caminho do quiz no endereço atual: funciona no domínio dedicado (/cliente) e no do aplicativo (/l/cliente). */
const caminhoQuiz = () => `${location.pathname.replace(/\/$/, '')}/quiz`

const botaoBase = 'block w-full rounded-full border border-black px-5 py-3.5 text-center text-base font-medium transition-colors'

/** O botão do WhatsApp da bio: abre um quiz curto e só libera a conversa (e conta o lead) depois da última resposta. */
export function QuizWhatsapp({ rotulo, quiz, origem, destaque }: { rotulo: string; quiz: QuizDaPagina; origem: string; destaque: boolean }) {
  const { perguntas, aparencia } = quiz
  // Cores escolhidas pelo cliente; sem elas, o padrão preto e branco da página.
  const cores = aparencia.botaoFundo ? { backgroundColor: aparencia.botaoFundo, color: aparencia.botaoLetra, borderColor: aparencia.botaoFundo } : undefined
  const [aberto, setAberto] = useState(false)
  const [s, setS] = useState<Estado>(INICIO)

  const abrir = () => {
    setS(INICIO)
    setAberto(true)
    void fetch(caminhoQuiz(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'iniciar' }), keepalive: true }).catch(() => undefined)
  }

  const concluir = async (escolhas: number[]) => {
    setS((x) => ({ ...x, escolhas, enviando: true, erro: null }))
    try {
      const r = await fetch(caminhoQuiz(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'concluir', escolhas, origem }) })
      const d = (await r.json().catch(() => ({}))) as { url?: string; erro?: string }
      if (!r.ok || !d.url) throw new Error(d.erro ?? 'Não foi possível abrir o WhatsApp.')
      setS((x) => ({ ...x, enviando: false, url: d.url! }))
      window.location.href = d.url
    } catch (e) {
      setS((x) => ({ ...x, enviando: false, erro: e instanceof Error ? e.message : 'Tente de novo.' }))
    }
  }

  const escolher = (opcao: number) => {
    const escolhas = [...s.escolhas.slice(0, s.etapa), opcao]
    if (s.etapa + 1 < perguntas.length) setS({ ...s, escolhas, etapa: s.etapa + 1 })
    else void concluir(escolhas)
  }

  const q = perguntas[s.etapa]
  return (
    <>
      <button type="button" onClick={abrir} style={cores} className={`${botaoBase} ${cores ? 'hover:opacity-85' : destaque ? 'bg-black text-white hover:bg-white hover:text-black' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
        {rotulo}
      </button>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" role="dialog" aria-modal="true" onClick={() => !s.enviando && setAberto(false)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-black sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            {s.url ? (
              <div className="space-y-4 text-center">
                <p className="text-lg font-semibold">Tudo certo!</p>
                <p className="text-sm text-black/70">Abrindo o WhatsApp…</p>
                <a href={s.url} style={cores} className={`${botaoBase} ${cores ? '' : 'bg-black text-white'}`}>Abrir o WhatsApp</a>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-sm text-black/60">
                  <span>{s.etapa + 1} de {perguntas.length}</span>
                  <button type="button" onClick={() => setAberto(false)} disabled={s.enviando} className="underline-offset-2 hover:underline">Fechar</button>
                </div>
                {s.etapa === 0 && (aparencia.titulo || aparencia.descricao) && (
                  <div className="space-y-1.5">
                    {aparencia.titulo && <h2 className="text-2xl font-semibold leading-tight">{aparencia.titulo}</h2>}
                    {aparencia.descricao && <p className="text-sm text-black/70">{aparencia.descricao}</p>}
                  </div>
                )}
                <p className="text-xl font-semibold leading-snug">{q.pergunta}</p>
                <div className="flex flex-col gap-2.5">
                  {q.opcoes.map((o, i) => (
                    <button key={o} type="button" disabled={s.enviando} onClick={() => escolher(i)} className={`${botaoBase} bg-white text-black hover:bg-black hover:text-white disabled:opacity-50`}>{o}</button>
                  ))}
                </div>
                {s.etapa > 0 && !s.enviando && <button type="button" onClick={() => setS({ ...s, etapa: s.etapa - 1 })} className="block w-full text-center text-sm text-black/60 underline-offset-2 hover:underline">Voltar</button>}
                {s.enviando && <p className="text-center text-sm text-black/60">Um instante…</p>}
                {s.erro && <p className="text-center text-sm text-black">{s.erro}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
