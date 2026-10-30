'use client'

import { Check, ChevronRight, Copy, Film, ImagePlus, Pencil, Trash2, X } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { alterarAnuncioAcao, decidirPropostaAcao, enviarCriativoAcao, registrarCriativoAcao, removerCriativoAcao } from '@/app/(app)/anuncios/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { NomeCliente } from '@/componentes/NomeCliente'
import { ROTULO_STATUS } from '@/dominio/controle-anuncios'
import type { CampanhaControle } from '@/servicos/google-agencia'
import type { ObjetoMeta as ObjetoMetaTela, Proposta as PropostaTela } from '@/servicos/controle-anuncios'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo } from '@/lib/ui'

const reais = (n: number | null) => (n === null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
const NIVEL = { campanha: 'campanha', conjunto: 'conjunto', anuncio: 'anúncio' } as const
type Plataforma = 'meta' | 'google'
type Nivel = keyof typeof NIVEL

function useAlterar(clienteId: string) {
  const [pendente, iniciar] = useTransition()
  const alterar = (p: { plataforma: Plataforma; nivel: Nivel; objetoId: string; acao: 'pausar' | 'ativar' | 'orcamento'; valor?: number }) =>
    iniciar(async () => { avisar(await alterarAnuncioAcao(clienteId, p), true) })
  return { pendente, alterar }
}

/** Liga/desliga. Ligar começa a gastar: pede confirmação. */
function Interruptor({ ligado, nome, desabilitado, aoMudar }: { ligado: boolean; nome: string; desabilitado: boolean; aoMudar: (ligar: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={`${ligado ? 'Pausar' : 'Ativar'} ${nome}`}
      title={desabilitado ? 'Só admin e gestor alteram' : ligado ? 'Pausar' : 'Ativar'}
      disabled={desabilitado}
      onClick={() => (ligado || confirm(`Ativar "${nome}"? Ele volta a gastar.`)) && aoMudar(!ligado)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${ligado ? 'bg-sucesso' : 'bg-borda-forte'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${ligado ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

/** Orçamento com edição na própria linha. */
function Orcamento({ valor, total, desabilitado, aoSalvar }: { valor: number | null; total?: boolean; desabilitado: boolean; aoSalvar: (v: number) => void }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  if (valor === null) return <span className="text-texto-3">—</span>
  if (!editando)
    return (
      <span className="inline-flex items-center gap-1">
        <span className="tabular-nums">{reais(valor)}<span className="text-micro text-texto-3">{total ? ' total' : '/dia'}</span></span>
        {!desabilitado && <button type="button" aria-label="Editar orçamento" title="Editar orçamento" onClick={() => { setTexto(String(valor).replace('.', ',')); setEditando(true) }} className="rounded p-0.5 text-texto-3 hover:bg-hover hover:text-texto"><Pencil className="h-3 w-3" /></button>}
      </span>
    )
  const salvar = () => {
    const v = Number(texto.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(v) || v <= 0) return avisar({ erro: 'Valor inválido.' })
    if (confirm(`Mudar o orçamento de ${reais(valor)} para ${reais(v)}?`)) {
      aoSalvar(v)
      setEditando(false)
    }
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input autoFocus inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false) }} className={`${campo} h-7 w-24 px-2 text-right`} aria-label="Novo orçamento em reais" />
      <button type="button" aria-label="Salvar" onClick={salvar} className="rounded p-1 text-sucesso hover:bg-hover"><Check className="h-3.5 w-3.5" /></button>
      <button type="button" aria-label="Cancelar" onClick={() => setEditando(false)} className="rounded p-1 text-texto-3 hover:bg-hover"><X className="h-3.5 w-3.5" /></button>
    </span>
  )
}

function SeloStatus({ status }: { status: string }) {
  const cor = status === 'ACTIVE' || status === 'ENABLED' ? 'bg-sucesso-fundo text-sucesso-forte' : ['DISAPPROVED', 'WITH_ISSUES'].includes(status) ? 'bg-perigo-fundo text-perigo-forte' : status === 'PENDING_REVIEW' || status === 'IN_PROCESS' ? 'bg-aviso-fundo text-aviso-forte' : 'bg-fundo text-texto-3'
  return <span className={`rounded-md px-1.5 py-0.5 text-micro font-semibold ${cor}`}>{ROTULO_STATUS[status] ?? status}</span>
}

function LinhaMeta({ o, clienteId, podeGerir, nivel, abertos, alternar }: { o: ObjetoMetaTela; clienteId: string; podeGerir: boolean; nivel: number; abertos: Set<string>; alternar: (id: string) => void }) {
  const { pendente, alterar } = useAlterar(clienteId)
  const aberto = abertos.has(o.id)
  return (
    <>
      <tr className={`border-b border-borda/60 ${pendente ? 'opacity-50' : ''} ${nivel === 0 ? 'bg-white' : 'bg-fundo/40'}`}>
        <td className="py-1.5 pr-3">
          <div className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: nivel * 20 }}>
            {o.filhos.length > 0 ? (
              <button type="button" onClick={() => alternar(o.id)} aria-expanded={aberto} aria-label={aberto ? 'Recolher' : 'Expandir'} className="rounded p-0.5 text-texto-3 hover:bg-hover"><ChevronRight className={`h-3.5 w-3.5 transition-transform ${aberto ? 'rotate-90' : ''}`} /></button>
            ) : <span className="w-4.5" />}
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura da Meta */}
            {o.miniatura && <img src={o.miniatura} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />}
            <div className="min-w-0">
              <p className={`truncate ${nivel === 0 ? 'font-semibold' : ''}`} title={o.nome}>{o.nome}</p>
              <p className="flex items-center gap-1.5 text-micro text-texto-3">
                {NIVEL[o.nivel]} <SeloStatus status={o.status} />
                {o.filhos.length > 0 && <span>· {o.filhos.length} {o.nivel === 'campanha' ? 'conjunto(s)' : 'anúncio(s)'}</span>}
              </p>
            </div>
          </div>
        </td>
        <td className="py-1.5 pr-3 text-right"><Orcamento valor={o.diario ?? o.total} total={!o.diario && !!o.total} desabilitado={!podeGerir || pendente} aoSalvar={(v) => alterar({ plataforma: 'meta', nivel: o.nivel, objetoId: o.id, acao: 'orcamento', valor: v })} /></td>
        <td className="py-1.5 pr-3 text-right tabular-nums">{reais(o.gasto)}</td>
        <td className="py-1.5 pr-3 text-right tabular-nums">{o.leads || '—'}</td>
        <td className="py-1.5 pr-3 text-right tabular-nums">{o.leads ? reais(o.gasto / o.leads) : '—'}</td>
        <td className="py-1.5 text-right"><Interruptor ligado={o.ligado} nome={o.nome} desabilitado={!podeGerir || pendente} aoMudar={(ligar) => alterar({ plataforma: 'meta', nivel: o.nivel, objetoId: o.id, acao: ligar ? 'ativar' : 'pausar' })} /></td>
      </tr>
      {aberto && o.filhos.map((f) => <LinhaMeta key={f.id} o={f} clienteId={clienteId} podeGerir={podeGerir} nivel={nivel + 1} abertos={abertos} alternar={alternar} />)}
    </>
  )
}

const Cabecalho = ({ resultado }: { resultado: string }) => (
  <thead>
    <tr className="border-b border-borda text-left text-legenda text-texto-3">
      <th className="py-2 pr-3 font-medium">Nome</th>
      <th className="py-2 pr-3 text-right font-medium">Orçamento</th>
      <th className="py-2 pr-3 text-right font-medium">Gasto no período</th>
      <th className="py-2 pr-3 text-right font-medium">{resultado}</th>
      <th className="py-2 pr-3 text-right font-medium">Custo por {resultado.toLowerCase().replace(/s$/, '')}</th>
      <th className="py-2 text-right font-medium">Ligado</th>
    </tr>
  </thead>
)

/** Campanhas › conjuntos › anúncios da Meta, com liga/desliga e orçamento editável. */
export function ArvoreMeta({ clienteId, campanhas, podeGerir }: { clienteId: string; campanhas: ObjetoMetaTela[]; podeGerir: boolean }) {
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [todas, setTodas] = useState(false)
  const alternar = (id: string) => setAbertos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const visiveis = todas ? campanhas : campanhas.filter((c) => c.ligado || c.gasto > 0)
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-rotulo">
          <Cabecalho resultado="Leads" />
          <tbody>{visiveis.map((c) => <LinhaMeta key={c.id} o={c} clienteId={clienteId} podeGerir={podeGerir} nivel={0} abertos={abertos} alternar={alternar} />)}</tbody>
        </table>
      </div>
      {visiveis.length === 0 && <p className="py-4 text-center text-rotulo text-texto-3">Nenhuma campanha ativa ou com gasto no período.</p>}
      {campanhas.length > visiveis.length || todas ? (
        <button type="button" onClick={() => setTodas(!todas)} className={`${botaoFantasma} h-8 text-legenda`}>{todas ? 'Mostrar só as ativas e com gasto' : `Mostrar todas (${campanhas.length - visiveis.length} pausadas sem gasto)`}</button>
      ) : null}
    </div>
  )
}

type CampanhaGoogleTela = CampanhaControle

function LinhaGoogle({ c, clienteId, podeGerir }: { c: CampanhaGoogleTela; clienteId: string; podeGerir: boolean }) {
  const { pendente, alterar } = useAlterar(clienteId)
  return (
    <tr className={`border-b border-borda/60 ${pendente ? 'opacity-50' : ''}`}>
      <td className="py-1.5 pr-3">
        <p className="truncate font-semibold" title={c.nome}>{c.nome}</p>
        <p className="flex items-center gap-1.5 text-micro text-texto-3"><SeloStatus status={c.status} /> {c.tipo.toLowerCase().replace(/_/g, ' ')}{c.orcamento?.compartilhado && ' · orçamento compartilhado'}</p>
      </td>
      <td className="py-1.5 pr-3 text-right"><Orcamento valor={c.orcamento?.diario ?? null} desabilitado={!podeGerir || pendente} aoSalvar={(v) => alterar({ plataforma: 'google', nivel: 'campanha', objetoId: c.id, acao: 'orcamento', valor: v })} /></td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{reais(c.custo)}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{c.conversoes ? c.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{c.conversoes ? reais(c.custo / c.conversoes) : '—'}</td>
      <td className="py-1.5 text-right"><Interruptor ligado={c.status === 'ENABLED'} nome={c.nome} desabilitado={!podeGerir || pendente} aoMudar={(ligar) => alterar({ plataforma: 'google', nivel: 'campanha', objetoId: c.id, acao: ligar ? 'ativar' : 'pausar' })} /></td>
    </tr>
  )
}

export function TabelaGoogle({ clienteId, campanhas, podeGerir }: { clienteId: string; campanhas: CampanhaGoogleTela[]; podeGerir: boolean }) {
  const [todas, setTodas] = useState(false)
  const visiveis = todas ? campanhas : campanhas.filter((c) => c.status === 'ENABLED' || c.custo > 0)
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-rotulo">
          <Cabecalho resultado="Conversões" />
          <tbody>{visiveis.map((c) => <LinhaGoogle key={c.id} c={c} clienteId={clienteId} podeGerir={podeGerir} />)}</tbody>
        </table>
      </div>
      {visiveis.length === 0 && <p className="py-4 text-center text-rotulo text-texto-3">Nenhuma campanha ativa ou com gasto no período.</p>}
      {campanhas.length > visiveis.length || todas ? <button type="button" onClick={() => setTodas(!todas)} className={`${botaoFantasma} h-8 text-legenda`}>{todas ? 'Mostrar só as ativas e com gasto' : `Mostrar todas (${campanhas.length - visiveis.length} pausadas sem gasto)`}</button> : null}
    </div>
  )
}

/** Pedidos da IA que gastam dinheiro: admin ou gestor aprova (executa na hora) ou recusa. */
export function Propostas({ propostas, podeGerir, mostrarCliente }: { propostas: PropostaTela[]; podeGerir: boolean; mostrarCliente: boolean }) {
  const [pendente, iniciar] = useTransition()
  const decidir = (id: string, aprovar: boolean) => iniciar(async () => { avisar(await decidirPropostaAcao(id, aprovar), true) })
  return (
    <ul className="space-y-2">
      {propostas.map((p) => (
        <li key={p.id} className={`flex flex-wrap items-center gap-3 rounded-lg border border-aviso-fundo bg-aviso-fundo/30 px-3 py-2 ${pendente ? 'opacity-60' : ''}`}>
          <div className="min-w-0 flex-1 text-rotulo">
            <p className="font-semibold text-texto">
              {p.acao === 'ativar' ? 'Ativar' : 'Orçamento'} · {p.plataforma === 'meta' ? 'Meta' : 'Google Ads'} · {NIVEL[p.nivel as Nivel] ?? p.nivel} &quot;{p.nome}&quot;
              {p.acao === 'orcamento' && <span className="ml-1.5 tabular-nums">{reais(p.valorAtual)} → <strong className={(p.valorNovo ?? 0) > (p.valorAtual ?? 0) ? 'text-aviso-forte' : 'text-sucesso-forte'}>{reais(p.valorNovo)}</strong></span>}
            </p>
            <p className="text-legenda text-texto-2">
              {mostrarCliente && <><NomeCliente nome={p.cliente} href={`/anuncios?cliente=${p.clienteId}`} /> · </>}
              {p.motivo || 'Sem motivo informado'} <span className="text-texto-3">· pedido por {p.por || 'IA'} em {new Date(p.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </p>
          </div>
          {podeGerir ? (
            <div className="flex gap-2">
              <button type="button" disabled={pendente} onClick={() => decidir(p.id, false)} className={`${botaoSecundario} h-8`}>Recusar</button>
              <button type="button" disabled={pendente} onClick={() => confirm('Aprovar e executar agora na plataforma de anúncios?') && decidir(p.id, true)} className={`${botaoPrimario} h-8`}>Aprovar</button>
            </div>
          ) : <span className="text-legenda text-texto-3">Aguardando admin ou gestor</span>}
        </li>
      ))}
    </ul>
  )
}

export type CriativoTela = { id: string; nome: string; tipo: 'imagem' | 'video'; url: string }

/** Biblioteca de criativos do cliente: a IA usa estes arquivos para montar as campanhas na Meta. */
export function Criativos({ clienteId, criativos }: { clienteId: string; criativos: CriativoTela[] }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(0)
  const [pendente, iniciar] = useTransition()
  const enviar = async (arquivos: FileList | null) => {
    for (const f of Array.from(arquivos ?? [])) {
      setEnviando((n) => n + 1)
      try {
        const preparo = await enviarCriativoAcao(clienteId, f.type, f.size)
        if ('erro' in preparo) { avisar(preparo); continue }
        const r = await fetch(preparo.url, { method: 'PUT', headers: { 'Content-Type': f.type }, body: f })
        if (!r.ok) { avisar({ erro: `Falha ao enviar ${f.name}.` }); continue }
        avisar(await registrarCriativoAcao(clienteId, { nome: f.name.replace(/\.[^.]+$/, ''), chave: preparo.chave, mime: f.type, tamanho: f.size }), true)
      } finally {
        setEnviando((n) => n - 1)
      }
    }
    if (entrada.current) entrada.current.value = ''
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" multiple hidden onChange={(e) => enviar(e.target.files)} />
        <button type="button" disabled={enviando > 0} onClick={() => entrada.current?.click()} className={botaoPrimario}><ImagePlus className="h-4 w-4" /> {enviando ? `Enviando ${enviando}…` : 'Subir criativos'}</button>
        <p className="text-legenda text-texto-3">JPG, PNG, WEBP, MP4 ou MOV. Depois peça à IA: &quot;crie uma campanha de WhatsApp com o criativo …&quot;.</p>
      </div>
      {criativos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-borda py-8 text-center text-rotulo text-texto-3">Nenhum criativo ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {criativos.map((c) => (
            <li key={c.id} className={`overflow-hidden rounded-lg border border-borda bg-white ${pendente ? 'opacity-60' : ''}`}>
              <div className="flex aspect-square items-center justify-center bg-fundo">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2 */}
                {c.tipo === 'imagem' ? <img src={c.url} alt={c.nome} className="h-full w-full object-cover" /> : <video src={c.url} className="h-full w-full object-cover" muted preload="metadata" />}
              </div>
              <div className="flex items-center gap-1 px-2 py-1.5">
                {c.tipo === 'video' && <Film className="h-3.5 w-3.5 shrink-0 text-texto-3" aria-label="Vídeo" />}
                <p className="min-w-0 flex-1 truncate text-legenda font-medium" title={c.nome}>{c.nome}</p>
                <button type="button" aria-label="Copiar id do criativo" title="Copiar id (para a IA)" onClick={() => navigator.clipboard.writeText(c.id).then(() => avisar({ ok: 'Id copiado.' }, true))} className="rounded p-1 text-texto-3 hover:bg-hover"><Copy className="h-3.5 w-3.5" /></button>
                <button type="button" aria-label="Remover criativo" title="Remover da biblioteca" onClick={() => confirm(`Remover "${c.nome}" da biblioteca? (anúncios já criados continuam)`) && iniciar(async () => { avisar(await removerCriativoAcao(c.id), true) })} className="rounded p-1 text-texto-3 hover:bg-hover hover:text-perigo"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
