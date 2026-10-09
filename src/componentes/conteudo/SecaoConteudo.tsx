'use client'

import { ImagePlus, Trash2, TriangleAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { removerMidiaAcao, salvarConteudoAcao } from '@/app/(app)/conteudo/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { corDoFormato, edicaoCriaNovaVersao, ROTULO_APROVACAO, ROTULO_FORMATO } from '@/dominio/conteudo'
import { TIPOS_ACEITOS } from '@/dominio/midias'
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import type { ConteudoDaTarefa, VersaoDoPost } from '@/servicos/conteudo'
import { enviarMidia } from './enviarMidia'

const COR_APROVACAO = { rascunho: 'bg-hover text-texto-2', aguardando: 'bg-aviso-fundo text-aviso-forte', aprovado: 'bg-sucesso-fundo text-sucesso-forte', ajuste: 'bg-perigo-fundo text-perigo-forte' } as const

function Midias({ tarefaId, versao, editavel }: { tarefaId: string; versao: VersaoDoPost; editavel: boolean }) {
  const confirmar = useConfirmar()
  const router = useRouter()
  const entrada = useRef<HTMLInputElement>(null)
  const [pendente, iniciar] = useTransition()
  const [progresso, setProgresso] = useState<number | null>(null)

  const enviar = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return
    for (const arquivo of Array.from(arquivos)) {
      try {
        setProgresso(0)
        await enviarMidia(tarefaId, arquivo, setProgresso)
      } catch (e) {
        avisar({ erro: (e as Error).message })
      }
    }
    setProgresso(null)
    if (entrada.current) entrada.current.value = ''
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {versao.midias.map((m) => (
          <div key={m.id} className="group relative overflow-hidden rounded-lg border border-borda bg-hover">
            {m.tipo === 'imagem' ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
              <img src={m.url} alt={m.nome} className="aspect-square w-full object-cover" />
            ) : (
              <video src={m.url} controls className="aspect-square w-full bg-black object-cover" />
            )}
            <p className="truncate px-2 py-1 text-legenda text-texto-2">{m.nome}</p>
            {editavel && (
              <button
                type="button"
                disabled={pendente}
                aria-label={`Remover ${m.nome}`}
                onClick={async () => {
                  if (!(await confirmar({ titulo: 'Remover esta mídia?', confirmar: 'Remover', perigo: true }))) return
                  iniciar(async () => {
                    if (avisar(await removerMidiaAcao(m.id), true)) router.refresh()
                  })
                }}
                className="absolute right-1 top-1 rounded-md bg-black/55 p-1.5 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {editavel && (
          <button type="button" onClick={() => entrada.current?.click()} disabled={progresso !== null} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-borda-forte text-rotulo text-texto-3 transition hover:bg-hover disabled:opacity-60">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            {progresso === null ? 'Adicionar mídia' : `Enviando ${progresso}%`}
          </button>
        )}
      </div>
      {versao.midias.length === 0 && !editavel && <p className="text-rotulo text-texto-3">Nenhuma mídia nesta versão.</p>}
      <input ref={entrada} type="file" multiple accept={Object.keys(TIPOS_ACEITOS).join(',')} className="hidden" onChange={(e) => enviar(e.target.files)} />
    </div>
  )
}

/** Editor do post dentro da tarefa: ideia, objetivo, legenda, mídias e o histórico de versões. */
export function SecaoConteudo({ tarefaId, conteudo, podeEditar }: { tarefaId: string; conteudo: ConteudoDaTarefa; podeEditar: boolean }) {
  const router = useRouter()
  const atual = conteudo.versoes[0]
  const [ideia, setIdeia] = useState(atual.ideia)
  const [objetivo, setObjetivo] = useState(atual.objetivo)
  const [legenda, setLegenda] = useState(atual.legenda)
  const [pendente, iniciar] = useTransition()
  const congelada = edicaoCriaNovaVersao(conteudo.aprovacao)
  const alterado = ideia !== atual.ideia || objetivo !== atual.objetivo || legenda !== atual.legenda

  const salvar = () =>
    iniciar(async () => {
      const r = await salvarConteudoAcao(tarefaId, { ideia, objetivo, legenda })
      if (avisar(r, true)) router.refresh()
    })

  return (
    <section className="space-y-4 rounded-2xl border border-borda bg-white p-4 shadow-cartao" aria-label="Conteúdo do post">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-corpo font-semibold">Conteúdo do post</h2>
        <span className="rounded-full px-2 py-0.5 text-legenda font-semibold text-white" style={{ background: corDoFormato(conteudo.formato) }}>{ROTULO_FORMATO[conteudo.formato]}</span>
        <span className={`rounded-full px-2 py-0.5 text-legenda font-semibold ${COR_APROVACAO[conteudo.aprovacao]}`}>{ROTULO_APROVACAO[conteudo.aprovacao]}</span>
        <span className="ml-auto text-legenda text-texto-3">Versão {conteudo.versaoAtual}</span>
      </div>

      {congelada && (
        <p className="flex items-start gap-2 rounded-lg bg-aviso-fundo px-3 py-2 text-rotulo text-aviso-forte" role="note">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          O cliente já respondeu a esta versão. Ao salvar uma alteração, nasce a versão {conteudo.versaoAtual + 1} e o post volta a aguardar aprovação.
        </p>
      )}

      <label className="block space-y-1"><span className={rotulo}>Ideia</span><textarea disabled={!podeEditar} value={ideia} onChange={(e) => setIdeia(e.target.value)} rows={2} className={campo} /></label>
      <label className="block space-y-1"><span className={rotulo}>Objetivo</span><textarea disabled={!podeEditar} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={2} className={campo} /></label>
      <label className="block space-y-1"><span className={rotulo}>Legenda</span><textarea disabled={!podeEditar} value={legenda} onChange={(e) => setLegenda(e.target.value)} rows={6} className={campo} /></label>
      {podeEditar && (
        <div className="flex justify-end gap-2">
          {alterado && <button type="button" className={botaoSecundario} onClick={() => { setIdeia(atual.ideia); setObjetivo(atual.objetivo); setLegenda(atual.legenda) }}>Descartar</button>}
          <button type="button" disabled={pendente || !alterado} onClick={salvar} className={botaoPrimario}>{pendente ? 'Salvando…' : congelada ? 'Salvar como nova versão' : 'Salvar'}</button>
        </div>
      )}

      <div className="space-y-1">
        <span className={rotulo}>Mídias da versão {atual.numero}</span>
        <Midias tarefaId={tarefaId} versao={atual} editavel={podeEditar && !atual.resposta} />
        {atual.resposta && <p className="text-legenda text-texto-3">Esta versão já foi respondida; as mídias dela estão congeladas.</p>}
      </div>

      {conteudo.versoes.some((v) => v.resposta || v.numero < conteudo.versaoAtual) && (
        <div className="space-y-2">
          <span className={rotulo}>Histórico</span>
          <ul className="space-y-2">
            {conteudo.versoes.map((v) => (
              <li key={v.id} className="rounded-lg border border-borda px-3 py-2 text-rotulo">
                <p className="font-semibold">Versão {v.numero}{v.resposta ? ` · ${v.resposta.decisao === 'aprovado' ? 'Aprovada' : 'Ajuste pedido'} por ${v.resposta.nome}` : ' · sem resposta'}</p>
                {v.resposta?.comentario && <p className="mt-1 text-texto-2">“{v.resposta.comentario}”</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
