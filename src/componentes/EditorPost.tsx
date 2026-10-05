'use client'

import { useCallback, useState, useTransition } from 'react'
import { acaoSalvar } from '@/app/admin/(protegido)/acoes'
import { ROTULO_FORMATO } from '@/dominio/formatar'
import { FORMATOS, type CamposPost, type MidiaEntrada, type Status } from '@/dominio/tipos'
import { botaoPrimario, botaoSecundario, rotulo } from '@/lib/ui'
import { EditorMidias, type MidiaInicial } from './EditorMidias'
import { Icone } from './Icone'
import { SeloStatus } from './SeloStatus'

const campoLinha =
  'h-8 rounded-md border border-transparent bg-transparent px-2 text-[13px] outline-none hover:border-borda focus:border-marca'
const areaTexto =
  'w-full resize-y rounded-lg border border-borda bg-white px-3 py-2.5 text-[14px] leading-relaxed outline-none transition placeholder:text-texto-3 hover:border-borda-forte focus:border-marca focus:ring-3 focus:ring-marca/15'

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
      <dl className="grid gap-y-1.5 text-[13px]">
        <div className="grid grid-cols-[130px_minmax(0,1fr)] items-center">
          <dt className="flex items-center gap-2 text-texto-2">
            <Icone nome="status" className="h-4 w-4 text-texto-3" /> Status
          </dt>
          <dd className="px-2">
            <SeloStatus status={status} />
          </dd>
        </div>
        <label className="grid grid-cols-[130px_minmax(0,1fr)] items-center">
          <span className="flex items-center gap-2 text-texto-2">
            <Icone nome="formato" className="h-4 w-4 text-texto-3" /> Formato
          </span>
          <select value={campos.formato} onChange={set('formato')} className={`${campoLinha} w-40`}>
            {FORMATOS.map((f) => (
              <option key={f} value={f}>
                {ROTULO_FORMATO[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid grid-cols-[130px_minmax(0,1fr)] items-center">
          <span className="flex items-center gap-2 text-texto-2">
            <Icone nome="calendario" className="h-4 w-4 text-texto-3" /> Data prevista
          </span>
          <input type="date" value={campos.dataPrevista} onChange={set('dataPrevista')} className={`${campoLinha} w-40`} />
        </label>
      </dl>

      <div className="space-y-5 border-t border-borda pt-6">
        <label className="block space-y-1.5">
          <span className={rotulo}>Ideia do post</span>
          <textarea rows={3} value={campos.ideia} onChange={set('ideia')} placeholder="Do que se trata o post?" className={areaTexto} />
        </label>
        <label className="block space-y-1.5">
          <span className={rotulo}>Objetivo</span>
          <textarea rows={2} value={campos.objetivo} onChange={set('objetivo')} placeholder="O que queremos alcançar?" className={areaTexto} />
        </label>
        <label className="block space-y-1.5">
          <span className={rotulo}>Legenda</span>
          <textarea rows={8} value={campos.legenda} onChange={set('legenda')} placeholder="Texto que vai na publicação" className={areaTexto} />
        </label>
        <div className="space-y-1.5">
          <span className={rotulo}>Mídia</span>
          <EditorMidias postId={postId} iniciais={midiasIniciais} onChange={aoMudarMidias} />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-borda bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        {respondido && (
          <p className="flex items-center gap-2 text-[13px] text-texto-2">
            <Icone nome="atualizar" className="h-3.5 w-3.5 text-marca" />
            Salvar cria a <strong className="text-texto">versão {proximaVersao}</strong> e envia de novo para o cliente.
          </p>
        )}
        {erro && <p className="text-[13px] text-rose-600">{erro}</p>}
        <div className="flex flex-wrap items-center gap-2">
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
          {pendentes && <span className="text-[13px] text-texto-3">Aguardando envio das mídias…</span>}
        </div>
      </div>
    </div>
  )
}
