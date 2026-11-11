'use client'

import { useCallback, useState, useTransition } from 'react'
import { acaoSalvar } from '@/app/admin/(protegido)/acoes'
import { ROTULO_FORMATO } from '@/dominio/formatar'
import { FORMATOS, type CamposPost, type MidiaEntrada, type Status } from '@/dominio/tipos'
import { EditorMidias, type MidiaInicial } from './EditorMidias'
import { Icone } from './Icone'
import { SeloStatus } from './SeloStatus'


export function EditorPost({
  postId,
  status,
  proximaVersao,
  iniciais,
  midiasIniciais,
}: {
  postId: string
  status: Status
  proximaVersao: number
  iniciais: CamposPost
  midiasIniciais: MidiaInicial[]
}) {
  const [campos, setCampos] = useState(iniciais)
  const [midias, setMidias] = useState<MidiaEntrada[]>([])
  const [pendentes, setPendentes] = useState(false)
  const [erro, setErro] = useState<string>()
  const [salvando, iniciar] = useTransition()

  const aoMudarMidias = useCallback((m: MidiaEntrada[], p: boolean) => {
    setMidias(m)
    setPendentes(p)
  }, [])

  const set = (k: keyof CamposPost) => (e: { target: { value: string } }) =>
    setCampos((c) => ({ ...c, [k]: e.target.value }))

  function salvar(enviar: boolean) {
    setErro(undefined)
    iniciar(async () => {
      const r = await acaoSalvar(postId, { ...campos }, midias, enviar)
      if (r && 'erro' in r) setErro(r.erro)
    })
  }

  const respondido = status === 'ajuste' || status === 'aprovado'

  return (
    <div>
      <dl>
        <div>
          <dt>
            <Icone nome="status" /> Status
          </dt>
          <dd>
            <SeloStatus status={status} />
          </dd>
        </div>
        <label>
          <span>
            <Icone nome="formato" /> Formato
          </span>
          <select value={campos.formato} onChange={set('formato')}>
            {FORMATOS.map((f) => (
              <option key={f} value={f}>
                {ROTULO_FORMATO[f]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            <Icone nome="calendario" /> Data prevista
          </span>
          <input type="date" value={campos.dataPrevista} onChange={set('dataPrevista')} />
        </label>
      </dl>

      <div>
        <label>
          <span>Ideia do post</span>
          <textarea rows={3} value={campos.ideia} onChange={set('ideia')} placeholder="Do que se trata o post?" />
        </label>
        <label>
          <span>Objetivo</span>
          <textarea rows={2} value={campos.objetivo} onChange={set('objetivo')} placeholder="O que queremos alcançar?" />
        </label>
        <label>
          <span>Legenda</span>
          <textarea rows={8} value={campos.legenda} onChange={set('legenda')} placeholder="Texto que vai na publicação" />
        </label>
        <div>
          <span>Mídia</span>
          <EditorMidias postId={postId} iniciais={midiasIniciais} onChange={aoMudarMidias} />
        </div>
      </div>

      <div>
        {respondido && (
          <p>
            <Icone nome="atualizar" />
            Salvar cria a <strong>versão {proximaVersao}</strong> e envia de novo para o cliente.
          </p>
        )}
        {erro && <p>{erro}</p>}
        <div>
          {status === 'rascunho' ? (
            <>
              <button disabled={salvando || pendentes} onClick={() => salvar(false)}>
                Salvar rascunho
              </button>
              <button disabled={salvando || pendentes} onClick={() => salvar(true)}>
                Enviar para aprovação
              </button>
            </>
          ) : (
            <button disabled={salvando || pendentes} onClick={() => salvar(false)}>
              {respondido ? `Salvar versão ${proximaVersao}` : 'Salvar'}
            </button>
          )}
          {pendentes && <span>Aguardando envio das mídias…</span>}
        </div>
      </div>
    </div>
  )
}
