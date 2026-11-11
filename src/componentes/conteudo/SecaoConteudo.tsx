'use client'

import { ImagePlus, Trash2, TriangleAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { alterarFormatoAcao, removerMidiaAcao, salvarConteudoAcao } from '@/app/(app)/conteudo/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { corDoFormato, edicaoCriaNovaVersao, FORMATOS, ROTULO_APROVACAO, ROTULO_FORMATO } from '@/dominio/conteudo'
import { TIPOS_ACEITOS } from '@/dominio/midias'
import type { ConteudoDaTarefa, PublicacaoDoPost, VersaoDoPost } from '@/servicos/conteudo'
import { BlocoPublicacao, type ContaMeta } from './BlocoPublicacao'
import { enviarMidia } from './enviarMidia'


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
    <div>
      <div>
        {versao.midias.map((m) => (
          <div key={m.id}>
            {m.tipo === 'imagem' ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2
              <img loading="lazy" decoding="async" src={m.url} alt={m.nome} />
            ) : (
              <video src={m.url} controls />
            )}
            <p>{m.nome}</p>
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
              >
                <Trash2 />
              </button>
            )}
          </div>
        ))}
        {editavel && (
          <button type="button" onClick={() => entrada.current?.click()} disabled={progresso !== null}>
            <ImagePlus aria-hidden="true" />
            {progresso === null ? 'Adicionar mídia' : `Enviando ${progresso}%`}
          </button>
        )}
      </div>
      {versao.midias.length === 0 && !editavel && <p>Nenhuma mídia nesta versão.</p>}
      <input ref={entrada} type="file" multiple accept={Object.keys(TIPOS_ACEITOS).join(',')} className="hidden" onChange={(e) => enviar(e.target.files)} />
    </div>
  )
}

/** Editor do post dentro da tarefa: ideia, objetivo, legenda, mídias e o histórico de versões. */
export function SecaoConteudo({ tarefaId, conteudo, podeEditar, publicacao, conta, hoje, hashtagsInstagram = [] }: { tarefaId: string; conteudo: ConteudoDaTarefa; podeEditar: boolean; publicacao?: PublicacaoDoPost | null; conta?: ContaMeta; hoje: string; hashtagsInstagram?: string[] }) {
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
    <section aria-label="Conteúdo do post">
      <div>
        <h2>Conteúdo do post</h2>
        {podeEditar ? (
          <select
            aria-label="Formato do post"
            value={conteudo.formato}
            disabled={pendente}
            onChange={(e) => iniciar(async () => { if (avisar(await alterarFormatoAcao(tarefaId, e.target.value), true)) router.refresh() })}
            style={{ background: corDoFormato(conteudo.formato) }}
          >
            {FORMATOS.map((f) => <option key={f} value={f}>{ROTULO_FORMATO[f]}</option>)}
          </select>
        ) : (
          <span style={{ background: corDoFormato(conteudo.formato) }}>{ROTULO_FORMATO[conteudo.formato]}</span>
        )}
        <span>{ROTULO_APROVACAO[conteudo.aprovacao]}</span>
        <span>Versão {conteudo.versaoAtual}</span>
      </div>

      {congelada && (
        <p role="note">
          <TriangleAlert aria-hidden="true" />
          O cliente já respondeu a esta versão. Ao salvar uma alteração, nasce a versão {conteudo.versaoAtual + 1} e o post volta a aguardar aprovação.
        </p>
      )}

      <label><span>Ideia</span><textarea disabled={!podeEditar} value={ideia} onChange={(e) => setIdeia(e.target.value)} rows={2} /></label>
      <label><span>Objetivo</span><textarea disabled={!podeEditar} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={2} /></label>
      <label><span>Legenda</span><textarea disabled={!podeEditar} value={legenda} onChange={(e) => setLegenda(e.target.value)} rows={6} />{hashtagsInstagram.length > 0 && <span>Ao publicar no Instagram, as hashtags do cliente que ainda não estão na legenda entram sozinhas no fim: {hashtagsInstagram.join(' ')}</span>}</label>
      {podeEditar && (
        <div>
          {alterado && <button type="button" onClick={() => { setIdeia(atual.ideia); setObjetivo(atual.objetivo); setLegenda(atual.legenda) }}>Descartar</button>}
          <button type="button" disabled={pendente || !alterado} onClick={salvar}>{pendente ? 'Salvando…' : congelada ? 'Salvar como nova versão' : 'Salvar'}</button>
        </div>
      )}

      <div>
        <span>Mídias da versão {atual.numero}</span>
        <Midias tarefaId={tarefaId} versao={atual} editavel={podeEditar && !atual.resposta} />
        {atual.resposta && <p>Esta versão já foi respondida; as mídias dela estão congeladas.</p>}
      </div>

      {publicacao && podeEditar && <BlocoPublicacao tarefaId={tarefaId} p={publicacao} conta={conta ?? null} formato={conteudo.formato} aprovacao={conteudo.aprovacao} hoje={hoje} />}

      {conteudo.versoes.some((v) => v.resposta || v.numero < conteudo.versaoAtual) && (
        <div>
          <span>Histórico</span>
          <ul>
            {conteudo.versoes.map((v) => (
              <li key={v.id}>
                <p>Versão {v.numero}{v.resposta ? ` · ${v.resposta.decisao === 'aprovado' ? 'Aprovada' : 'Ajuste pedido'} por ${v.resposta.nome}` : ' · sem resposta'}</p>
                {v.resposta?.comentario && <p>“{v.resposta.comentario}”</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
