'use client'

import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { ArvoreMeta, Interruptor, Orcamento, TabelaGoogle, useAlterar } from '@/componentes/anuncios/ControleAnuncios'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { ROTULO_STATUS } from '@/dominio/controle-anuncios'
import type { ObjetoMeta } from '@/servicos/controle-anuncios'
import type { CampanhaControle } from '@/servicos/google-agencia'

export type ContaCampanhas = { id: string; nome: string; meta: ObjetoMeta[]; google: CampanhaControle[] }
type CampanhaTela = { id: string; clienteId: string; cliente: string; nome: string; canal: 'meta' | 'google'; status: string; ligada: boolean; gasto: number; resultados: number; diario: number | null; total: number | null; meta?: ObjetoMeta; google?: CampanhaControle }
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function LinhaCampanha({ c, podeGerir, aoAbrir }: { c: CampanhaTela; podeGerir: boolean; aoAbrir: () => void }) {
  const { pendente, alterar } = useAlterar(c.clienteId)
  return <tr>
    <td><button className="an-campaign-name" type="button" onClick={aoAbrir}>{c.nome}</button><span className="an-cell-sub">{c.cliente}</span></td>
    <td><span className="an-channel-label" data-canal={c.canal}><i />{c.canal === 'meta' ? 'Meta' : 'Google'}</span></td>
    <td><span className="an-status" data-ativa={c.ligada}>{ROTULO_STATUS[c.status] ?? c.status}</span></td>
    <td className="an-number an-budget"><Orcamento valor={c.diario ?? c.total} total={!c.diario && !!c.total} desabilitado={!podeGerir || pendente} aoSalvar={valor => alterar({ plataforma: c.canal, nivel: 'campanha', objetoId: c.id, acao: 'orcamento', valor })} />{c.canal === 'meta' && c.diario === null && c.total === null && <span className="an-cell-sub">Nos conjuntos</span>}{c.google?.orcamento?.compartilhado && <span className="an-cell-sub">Compartilhado</span>}</td>
    <td className="an-number">{reais(c.gasto)}</td>
    <td className="an-number">{c.resultados.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<span className="an-cell-sub">{c.canal === 'meta' ? 'leads e mensagens' : 'conversões'}</span></td>
    <td><div className="an-row-actions"><Interruptor ligado={c.ligada} nome={c.nome} desabilitado={!podeGerir || pendente} aoMudar={ligar => alterar({ plataforma: c.canal, nivel: 'campanha', objetoId: c.id, acao: ligar ? 'ativar' : 'pausar' })} /><button className="an-icon-btn" type="button" onClick={aoAbrir} aria-label={`Detalhes de ${c.nome}`}><ChevronRight /></button></div></td>
  </tr>
}

export function CampanhasAnuncios({ contas, podeGerir }: { contas: ContaCampanhas[]; podeGerir: boolean }) {
  const [todas, setTodas] = useState(false)
  const [aberta, setAberta] = useState<Pick<CampanhaTela, 'id' | 'clienteId' | 'canal'> | null>(null)
  const campanhas: CampanhaTela[] = contas.flatMap(conta => [
    ...conta.meta.map(c => ({ id: c.id, clienteId: conta.id, cliente: conta.nome, nome: c.nome, canal: 'meta' as const, status: c.status, ligada: c.ligado, gasto: c.gasto, resultados: c.leads, diario: c.diario, total: c.total, meta: c })),
    ...conta.google.map(c => ({ id: c.id, clienteId: conta.id, cliente: conta.nome, nome: c.nome, canal: 'google' as const, status: c.status, ligada: c.status === 'ENABLED', gasto: c.custo, resultados: c.conversoes, diario: c.orcamento?.diario ?? null, total: null, google: c })),
  ]).sort((a, b) => Number(b.ligada) - Number(a.ligada) || b.gasto - a.gasto)
  const visiveis = todas ? campanhas : campanhas.filter(c => c.ligada || c.gasto > 0)
  const detalhe = aberta ? campanhas.find(c => c.id === aberta.id && c.clienteId === aberta.clienteId && c.canal === aberta.canal) : null
  return <>
    <section className="an-panel" aria-label="Campanhas">
      <div className="an-panel-head"><div><h2>Campanhas</h2><p>{visiveis.length} campanhas · orçamento e status atuais</p></div><SlidersHorizontal aria-hidden /></div>
      {visiveis.length ? <div className="an-table-wrap"><table className="an-campaign-table"><thead><tr><th>Campanha</th><th>Canal</th><th>Status</th><th className="an-number">Orçamento</th><th className="an-number">Investido</th><th className="an-number">Resultado</th><th>Ações</th></tr></thead><tbody>{visiveis.map(c => <LinhaCampanha key={`${c.clienteId}:${c.canal}:${c.id}`} c={c} podeGerir={podeGerir} aoAbrir={() => setAberta(c)} />)}</tbody></table></div> : <div className="an-empty"><h3>Nenhuma campanha ativa ou com gasto</h3><p>Troque o período ou confira as campanhas pausadas.</p></div>}
      <div className="an-table-bottom"><span>{podeGerir ? 'Ativações e mudanças de orçamento pedem confirmação.' : 'Somente admin e gestor podem alterar campanhas.'}</span>{(campanhas.length > visiveis.length || todas) && <button className="an-text-btn" type="button" onClick={() => setTodas(v => !v)}>{todas ? 'Somente ativas e com gasto' : `Ver todas (${campanhas.length})`}</button>}</div>
    </section>
    <Dialog open={!!detalhe} onOpenChange={v => { if (!v) setAberta(null) }}><DialogContent className="an-dialog an-campaign-dialog"><DialogHeader><DialogTitle>{detalhe?.nome}</DialogTitle><DialogDescription>{detalhe?.cliente} · {detalhe?.canal === 'meta' ? 'Meta Ads · campanha, conjuntos e anúncios' : 'Google Ads'}</DialogDescription></DialogHeader>{detalhe && <div className="an-legacy-control">{detalhe.meta ? <ArvoreMeta key={detalhe.id} clienteId={detalhe.clienteId} campanhas={[detalhe.meta]} podeGerir={podeGerir} /> : detalhe.google ? <TabelaGoogle clienteId={detalhe.clienteId} campanhas={[detalhe.google]} podeGerir={podeGerir} /> : null}</div>}</DialogContent></Dialog>
  </>
}
