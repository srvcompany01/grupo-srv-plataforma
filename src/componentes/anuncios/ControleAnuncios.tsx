'use client'

import { Check, ChevronRight, Copy, Film, ImagePlus, Pencil, Trash2, X } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { alterarAnuncioAcao, decidirPropostaAcao, enviarCriativoAcao, registrarCriativoAcao, removerCriativoAcao } from '@/app/(app)/anuncios/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { NomeCliente } from '@/componentes/NomeCliente'
import { ROTULO_STATUS } from '@/dominio/controle-anuncios'
import type { CampanhaControle } from '@/servicos/google-agencia'
import type { ObjetoMeta as ObjetoMetaTela, Proposta as PropostaTela } from '@/servicos/controle-anuncios'

const reais = (n: number | null) => (n === null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
const NIVEL = { campanha: 'campanha', conjunto: 'conjunto', anuncio: 'anúncio' } as const
type Plataforma = 'meta' | 'google'
type Nivel = keyof typeof NIVEL

export function useAlterar(clienteId: string) {
  const [pendente, iniciar] = useTransition()
  const alterar = (p: { plataforma: Plataforma; nivel: Nivel; objetoId: string; acao: 'pausar' | 'ativar' | 'orcamento'; valor?: number }) =>
    iniciar(async () => { avisar(await alterarAnuncioAcao(clienteId, p), true) })
  return { pendente, alterar }
}

/** Liga/desliga. Ligar começa a gastar: pede confirmação. */
export function Interruptor({ ligado, nome, desabilitado, aoMudar }: { ligado: boolean; nome: string; desabilitado: boolean; aoMudar: (ligar: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={`${ligado ? 'Pausar' : 'Ativar'} ${nome}`}
      title={desabilitado ? 'Só admin e gestor alteram' : ligado ? 'Pausar' : 'Ativar'}
      disabled={desabilitado}
      onClick={() => (ligado || confirm(`Ativar "${nome}"? Ele volta a gastar.`)) && aoMudar(!ligado)}
    >
      <span />
    </button>
  )
}

/** Orçamento com edição na própria linha. */
function Orcamento({ valor, total, desabilitado, aoSalvar }: { valor: number | null; total?: boolean; desabilitado: boolean; aoSalvar: (v: number) => void }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  if (valor === null) return <span>—</span>
  if (!editando)
    return (
      <span>
        <span>{reais(valor)}<span>{total ? ' total' : '/dia'}</span></span>
        {!desabilitado && <button type="button" aria-label="Editar orçamento" title="Editar orçamento" onClick={() => { setTexto(String(valor).replace('.', ',')); setEditando(true) }}><Pencil /></button>}
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
    <span>
      <input autoFocus inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false) }} aria-label="Novo orçamento em reais" />
      <button type="button" aria-label="Salvar" onClick={salvar}><Check /></button>
      <button type="button" aria-label="Cancelar" onClick={() => setEditando(false)}><X /></button>
    </span>
  )
}

function SeloStatus({ status }: { status: string }) {
  return <span>{ROTULO_STATUS[status] ?? status}</span>
}

function LinhaMeta({ o, clienteId, podeGerir, nivel, abertos, alternar }: { o: ObjetoMetaTela; clienteId: string; podeGerir: boolean; nivel: number; abertos: Set<string>; alternar: (id: string) => void }) {
  const { pendente, alterar } = useAlterar(clienteId)
  const aberto = abertos.has(o.id)
  return (
    <>
      <tr>
        <td>
          <div style={{ paddingLeft: nivel * 20 }}>
            {o.filhos.length > 0 ? (
              <button type="button" onClick={() => alternar(o.id)} aria-expanded={aberto} aria-label={aberto ? 'Recolher' : 'Expandir'}><ChevronRight /></button>
            ) : <span />}
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura da Meta */}
            {o.miniatura && <img loading="lazy" decoding="async" src={o.miniatura} alt="" />}
            <div>
              <p title={o.nome}>{o.nome}</p>
              <p>
                {NIVEL[o.nivel]} <SeloStatus status={o.status} />
                {o.filhos.length > 0 && <span>· {o.filhos.length} {o.nivel === 'campanha' ? 'conjunto(s)' : 'anúncio(s)'}</span>}
              </p>
            </div>
          </div>
        </td>
        <td><Orcamento valor={o.diario ?? o.total} total={!o.diario && !!o.total} desabilitado={!podeGerir || pendente} aoSalvar={(v) => alterar({ plataforma: 'meta', nivel: o.nivel, objetoId: o.id, acao: 'orcamento', valor: v })} /></td>
        <td>{reais(o.gasto)}</td>
        <td>{o.leads || '—'}</td>
        <td>{o.leads ? reais(o.gasto / o.leads) : '—'}</td>
        <td><Interruptor ligado={o.ligado} nome={o.nome} desabilitado={!podeGerir || pendente} aoMudar={(ligar) => alterar({ plataforma: 'meta', nivel: o.nivel, objetoId: o.id, acao: ligar ? 'ativar' : 'pausar' })} /></td>
      </tr>
      {aberto && o.filhos.map((f) => <LinhaMeta key={f.id} o={f} clienteId={clienteId} podeGerir={podeGerir} nivel={nivel + 1} abertos={abertos} alternar={alternar} />)}
    </>
  )
}

const Cabecalho = ({ resultado }: { resultado: string }) => (
  <thead>
    <tr>
      <th>Nome</th>
      <th>Orçamento</th>
      <th>Gasto no período</th>
      <th>{resultado}</th>
      <th>Custo por {resultado.toLowerCase().replace(/s$/, '')}</th>
      <th>Ligado</th>
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
    <div>
      <div>
        <table>
          <Cabecalho resultado="Leads" />
          <tbody>{visiveis.map((c) => <LinhaMeta key={c.id} o={c} clienteId={clienteId} podeGerir={podeGerir} nivel={0} abertos={abertos} alternar={alternar} />)}</tbody>
        </table>
      </div>
      {visiveis.length === 0 && <p>Nenhuma campanha ativa ou com gasto no período.</p>}
      {campanhas.length > visiveis.length || todas ? (
        <button type="button" onClick={() => setTodas(!todas)}>{todas ? 'Mostrar só as ativas e com gasto' : `Mostrar todas (${campanhas.length - visiveis.length} pausadas sem gasto)`}</button>
      ) : null}
    </div>
  )
}

type CampanhaGoogleTela = CampanhaControle

function LinhaGoogle({ c, clienteId, podeGerir }: { c: CampanhaGoogleTela; clienteId: string; podeGerir: boolean }) {
  const { pendente, alterar } = useAlterar(clienteId)
  return (
    <tr>
      <td>
        <p title={c.nome}>{c.nome}</p>
        <p><SeloStatus status={c.status} /> {c.tipo.toLowerCase().replace(/_/g, ' ')}{c.orcamento?.compartilhado && ' · orçamento compartilhado'}</p>
      </td>
      <td><Orcamento valor={c.orcamento?.diario ?? null} desabilitado={!podeGerir || pendente} aoSalvar={(v) => alterar({ plataforma: 'google', nivel: 'campanha', objetoId: c.id, acao: 'orcamento', valor: v })} /></td>
      <td>{reais(c.custo)}</td>
      <td>{c.conversoes ? c.conversoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'}</td>
      <td>{c.conversoes ? reais(c.custo / c.conversoes) : '—'}</td>
      <td><Interruptor ligado={c.status === 'ENABLED'} nome={c.nome} desabilitado={!podeGerir || pendente} aoMudar={(ligar) => alterar({ plataforma: 'google', nivel: 'campanha', objetoId: c.id, acao: ligar ? 'ativar' : 'pausar' })} /></td>
    </tr>
  )
}

export function TabelaGoogle({ clienteId, campanhas, podeGerir }: { clienteId: string; campanhas: CampanhaGoogleTela[]; podeGerir: boolean }) {
  const [todas, setTodas] = useState(false)
  const visiveis = todas ? campanhas : campanhas.filter((c) => c.status === 'ENABLED' || c.custo > 0)
  return (
    <div>
      <div>
        <table>
          <Cabecalho resultado="Conversões" />
          <tbody>{visiveis.map((c) => <LinhaGoogle key={c.id} c={c} clienteId={clienteId} podeGerir={podeGerir} />)}</tbody>
        </table>
      </div>
      {visiveis.length === 0 && <p>Nenhuma campanha ativa ou com gasto no período.</p>}
      {campanhas.length > visiveis.length || todas ? <button type="button" onClick={() => setTodas(!todas)}>{todas ? 'Mostrar só as ativas e com gasto' : `Mostrar todas (${campanhas.length - visiveis.length} pausadas sem gasto)`}</button> : null}
    </div>
  )
}

/** Pedidos da IA que gastam dinheiro: admin ou gestor aprova (executa na hora) ou recusa. */
export function Propostas({ propostas, podeGerir, mostrarCliente }: { propostas: PropostaTela[]; podeGerir: boolean; mostrarCliente: boolean }) {
  const [pendente, iniciar] = useTransition()
  const decidir = (id: string, aprovar: boolean) => iniciar(async () => { avisar(await decidirPropostaAcao(id, aprovar), true) })
  return (
    <ul>
      {propostas.map((p) => (
        <li key={p.id}>
          <div>
            <p>
              {p.acao === 'ativar' ? 'Ativar' : 'Orçamento'} · {p.plataforma === 'meta' ? 'Meta' : 'Google Ads'} · {NIVEL[p.nivel as Nivel] ?? p.nivel} &quot;{p.nome}&quot;
              {p.acao === 'orcamento' && <span>{reais(p.valorAtual)} → <strong>{reais(p.valorNovo)}</strong></span>}
            </p>
            <p>
              {mostrarCliente && <><NomeCliente nome={p.cliente} href={`/anuncios?cliente=${p.clienteId}`} /> · </>}
              {p.motivo || 'Sem motivo informado'} <span>· pedido por {p.por || 'IA'} em {new Date(p.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </p>
          </div>
          {podeGerir ? (
            <div>
              <button type="button" disabled={pendente} onClick={() => decidir(p.id, false)}>Recusar</button>
              <button type="button" disabled={pendente} onClick={() => confirm('Aprovar e executar agora na plataforma de anúncios?') && decidir(p.id, true)}>Aprovar</button>
            </div>
          ) : <span>Aguardando admin ou gestor</span>}
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
    <div>
      <div>
        <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" multiple hidden onChange={(e) => enviar(e.target.files)} />
        <button type="button" disabled={enviando > 0} onClick={() => entrada.current?.click()}><ImagePlus /> {enviando ? `Enviando ${enviando}…` : 'Subir criativos'}</button>
        <p>JPG, PNG, WEBP, MP4 ou MOV. Depois peça à IA: &quot;crie uma campanha de WhatsApp com o criativo …&quot;.</p>
      </div>
      {criativos.length === 0 ? (
        <p>Nenhum criativo ainda.</p>
      ) : (
        <ul>
          {criativos.map((c) => (
            <li key={c.id}>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada do R2 */}
                {c.tipo === 'imagem' ? <img loading="lazy" decoding="async" src={c.url} alt={c.nome} /> : <video src={c.url} muted preload="metadata" />}
              </div>
              <div>
                {c.tipo === 'video' && <Film aria-label="Vídeo" />}
                <p title={c.nome}>{c.nome}</p>
                <button type="button" aria-label="Copiar id do criativo" title="Copiar id (para a IA)" onClick={() => navigator.clipboard.writeText(c.id).then(() => avisar({ ok: 'Id copiado.' }, true))}><Copy /></button>
                <button type="button" aria-label="Remover criativo" title="Remover da biblioteca" onClick={() => confirm(`Remover "${c.nome}" da biblioteca? (anúncios já criados continuam)`) && iniciar(async () => { avisar(await removerCriativoAcao(c.id), true) })}><Trash2 /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
