'use client'

import { useState, useSyncExternalStore, useTransition } from 'react'
import { acaoResponder } from '@/app/c/[token]/acoes'
import type { Decisao } from '@/dominio/tipos'
import { botao, botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import { Icone } from './Icone'

const CHAVE_NOME = 'srv_nome'
const semAssinatura = () => () => {}

function lerNome(): string {
  try {
    return localStorage.getItem(CHAVE_NOME) ?? ''
  } catch {
    return ''
  }
}

function guardarNome(nome: string) {
  try {
    localStorage.setItem(CHAVE_NOME, nome)
  } catch {
    // sem localStorage: o nome é pedido de novo na próxima vez
  }
}

export function FormResposta({ token, postId, versaoNumero }: { token: string; postId: string; versaoNumero: number }) {
  const [decisao, setDecisao] = useState<Decisao | null>(null)
  const [comentario, setComentario] = useState('')
  const nomeGuardado = useSyncExternalStore(semAssinatura, lerNome, () => '')
  const [trocando, setTrocando] = useState(false)
  const [nomeDigitado, setNome] = useState('')
  const nomeSalvo = trocando ? '' : nomeGuardado
  const nome = nomeSalvo || nomeDigitado
  const [erro, setErro] = useState<string>()
  const [enviando, iniciar] = useTransition()

  function enviar(escolha: Decisao) {
    setErro(undefined)
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (escolha === 'ajuste' && !comentario.trim()) return setErro('Conte o que precisa ser ajustado.')
    iniciar(async () => {
      const r = await acaoResponder(token, postId, versaoNumero, escolha, comentario, nome)
      if ('erro' in r) return setErro(r.erro)
      guardarNome(nome.trim())
    })
  }

  return (
    <div className="space-y-3 rounded-xl border border-borda bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      {!nomeSalvo && (
        <label className="block space-y-1.5">
          <span className={rotulo}>Seu nome</span>
          <input value={nomeDigitado} onChange={(e) => setNome(e.target.value)} className={campo} autoComplete="name" />
        </label>
      )}
      {nomeSalvo && (
        <p className="text-corpo text-texto-2">
          Respondendo como <strong>{nomeSalvo}</strong>{' '}
          <button type="button" className="font-medium text-marca" onClick={() => setTrocando(true)}>
            trocar
          </button>
        </p>
      )}

      {decisao === 'ajuste' && (
        <label className="block space-y-1.5">
          <span className={rotulo}>O que precisa ser ajustado?</span>
          <textarea
            rows={4}
            autoFocus
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ex.: na 3ª imagem, trocar a cor do fundo"
            className={campo}
          />
        </label>
      )}
      {erro && <p className="text-corpo text-perigo">{erro}</p>}

      {decisao === 'ajuste' ? (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={enviando} onClick={() => setDecisao(null)} className={`${botaoSecundario} h-11`}>
            Voltar
          </button>
          <button type="button" disabled={enviando} onClick={() => enviar('ajuste')} className={`${botao} h-11 bg-st-ajuste text-claro hover:brightness-95`}>
            {enviando ? 'Enviando…' : 'Enviar ajuste'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={enviando}
            onClick={() => setDecisao('ajuste')}
            className={`${botaoSecundario} h-11 text-sm`}
          >
            <Icone nome="mensagem" className="h-4 w-4" /> Pedir ajuste
          </button>
          <button type="button" disabled={enviando} onClick={() => enviar('aprovado')} className={`${botaoPrimario} h-11 text-sm`}>
            {enviando ? 'Enviando…' : (
              <>
                <Icone nome="check" className="h-4 w-4" /> Aprovar
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
