'use client'

import { useState } from 'react'
import type { QuizDaPagina } from '@/dominio/bio-quiz'

type Estado = { etapa: number; escolhas: number[]; enviando: boolean; url: string | null; erro: string | null }
const INICIO: Estado = { etapa: 0, escolhas: [], enviando: false, url: null, erro: null }

/** Caminho do quiz no endereço atual: funciona no domínio dedicado (/cliente) e no do aplicativo (/l/cliente). */
const caminhoQuiz = () => `${location.pathname.replace(/\/$/, '')}/quiz`


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
      <button type="button" onClick={abrir} style={cores}>
        {rotulo}
      </button>
      {aberto && (
        <div role="dialog" aria-modal="true" onClick={() => !s.enviando && setAberto(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            {s.url ? (
              <div>
                <p>Tudo certo!</p>
                <p>Abrindo o WhatsApp…</p>
                <a href={s.url} style={cores}>Abrir o WhatsApp</a>
              </div>
            ) : (
              <div>
                <div>
                  <span>{s.etapa + 1} de {perguntas.length}</span>
                  <button type="button" onClick={() => setAberto(false)} disabled={s.enviando}>Fechar</button>
                </div>
                {s.etapa === 0 && (aparencia.titulo || aparencia.descricao) && (
                  <div>
                    {aparencia.titulo && <h2>{aparencia.titulo}</h2>}
                    {aparencia.descricao && <p>{aparencia.descricao}</p>}
                  </div>
                )}
                <p>{q.pergunta}</p>
                <div>
                  {q.opcoes.map((o, i) => (
                    <button key={o} type="button" disabled={s.enviando} onClick={() => escolher(i)}>{o}</button>
                  ))}
                </div>
                {s.etapa > 0 && !s.enviando && <button type="button" onClick={() => setS({ ...s, etapa: s.etapa - 1 })}>Voltar</button>}
                {s.enviando && <p>Um instante…</p>}
                {s.erro && <p>{s.erro}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
