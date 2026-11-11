'use client'

import { useState, useSyncExternalStore, useTransition } from 'react'
import { acaoResponder } from '@/app/c/[token]/acoes'
import type { Decisao } from '@/dominio/tipos'
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
    <div>
      {!nomeSalvo && (
        <label>
          <span>Seu nome</span>
          <input value={nomeDigitado} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
        </label>
      )}
      {nomeSalvo && (
        <p>
          Respondendo como <strong>{nomeSalvo}</strong>{' '}
          <button type="button" onClick={() => setTrocando(true)}>
            trocar
          </button>
        </p>
      )}

      {decisao === 'ajuste' && (
        <label>
          <span>O que precisa ser ajustado?</span>
          <textarea
            rows={4}
            autoFocus
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ex.: na 3ª imagem, trocar a cor do fundo"
          />
        </label>
      )}
      {erro && <p>{erro}</p>}

      {decisao === 'ajuste' ? (
        <div>
          <button type="button" disabled={enviando} onClick={() => setDecisao(null)}>
            Voltar
          </button>
          <button type="button" disabled={enviando} onClick={() => enviar('ajuste')}>
            {enviando ? 'Enviando…' : 'Enviar ajuste'}
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            disabled={enviando}
            onClick={() => setDecisao('ajuste')}
          >
            <Icone nome="mensagem" /> Pedir ajuste
          </button>
          <button type="button" disabled={enviando} onClick={() => enviar('aprovado')}>
            {enviando ? 'Enviando…' : (
              <>
                <Icone nome="check" /> Aprovar
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
