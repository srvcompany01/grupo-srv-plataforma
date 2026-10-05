'use client'

import { useCallback, useState, useTransition } from 'react'
import { acaoSalvar } from '@/app/admin/(protegido)/acoes'
import { ROTULO_FORMATO } from '@/dominio/formatar'
import { FORMATOS, type CamposPost, type MidiaEntrada, type Status } from '@/dominio/tipos'
import { botaoPrimario, botaoSecundario, campo } from '@/lib/ui'
import { EditorMidias, type MidiaInicial } from './EditorMidias'

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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Formato
          <select value={campos.formato} onChange={set('formato')} className={campo}>
            {FORMATOS.map((f) => (
              <option key={f} value={f}>
                {ROTULO_FORMATO[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Data prevista
          <input type="date" value={campos.dataPrevista} onChange={set('dataPrevista')} className={campo} />
        </label>
      </div>
      <label className="block text-sm">
        Ideia do post
        <textarea rows={3} value={campos.ideia} onChange={set('ideia')} className={campo} />
      </label>
      <label className="block text-sm">
        Objetivo
        <textarea rows={2} value={campos.objetivo} onChange={set('objetivo')} className={campo} />
      </label>
      <label className="block text-sm">
        Legenda
        <textarea rows={8} value={campos.legenda} onChange={set('legenda')} className={campo} />
      </label>

      <EditorMidias postId={postId} iniciais={midiasIniciais} onChange={aoMudarMidias} />

      {respondido && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Salvar cria a versão {proximaVersao} e envia de novo para o cliente.
        </p>
      )}
      {erro && <p className="text-sm text-rose-700">{erro}</p>}

      <div className="flex flex-wrap gap-2">
        {status === 'rascunho' ? (
          <>
            <button disabled={salvando || pendentes} onClick={() => salvar(false)} className={botaoSecundario}>
              Salvar rascunho
            </button>
            <button disabled={salvando || pendentes} onClick={() => salvar(true)} className={botaoPrimario}>
              Enviar para aprovação
            </button>
          </>
        ) : (
          <button disabled={salvando || pendentes} onClick={() => salvar(false)} className={botaoPrimario}>
            {respondido ? `Salvar versão ${proximaVersao}` : 'Salvar'}
          </button>
        )}
        {pendentes && <span className="self-center text-sm text-neutral-500">Aguardando envio das mídias…</span>}
      </div>
    </div>
  )
}
