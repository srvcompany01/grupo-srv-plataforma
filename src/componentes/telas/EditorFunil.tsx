'use client'

import { CalendarCheck, FileText, Filter, LayoutTemplate, Mail, Megaphone, MessageCircle, ShoppingCart, Square, Trash2, UserPlus, Wallet, Wand2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as EventoPonteiro } from 'react'
import {
  INFO_NO,
  MAX_LIGACOES,
  MAX_NOS,
  NOVO_NO_PADRAO,
  NO_ALTURA,
  NO_LARGURA,
  TIPOS_NO,
  calcularFunil,
  caixaDoNo,
  organizarFunil,
  type DadosFunil,
  type LigacaoFunil,
  type NoFunil,
  type TipoNo,
} from '@/dominio/funil'
import { CAMERA_INICIAL, desfazer, enquadrar, iniciarHistorico, novoId, refazer, registrar, uniao } from '@/dominio/tela'
import { formatarReais } from '@/dominio/financeiro'
import { BarraTela } from './BarraTela'
import { arrastar, useAutosave, useCamera } from './hooks'

const ICONE: Record<TipoNo, typeof Square> = { trafego: Megaphone, pagina: LayoutTemplate, formulario: UserPlus, email: Mail, whatsapp: MessageCircle, reuniao: CalendarCheck, checkout: ShoppingCart, venda: Wallet, outro: FileText }
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const percentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, style: 'percent' })
const ehCampo = (alvo: EventTarget | null) => alvo instanceof HTMLElement && !!alvo.closest('input, textarea, select, [role="dialog"]')
const lerNumero = (v: string, max: number) => Math.min(max, Math.max(0, Number(v.replace(',', '.')) || 0))

type Selecao = { tipo: 'no' | 'ligacao'; id: string } | null

function Metrica({ rotulo, valor, tom }: { rotulo: string; valor: string; tom?: 'bom' | 'ruim' }) {
  return (
    <div className="min-w-24 px-3 py-1">
      <p className="text-micro font-medium uppercase text-texto-3">{rotulo}</p>
      <p className={`text-corpo font-bold tabular-nums ${tom === 'bom' ? 'text-sucesso' : tom === 'ruim' ? 'text-perigo' : 'text-texto'}`}>{valor}</p>
    </div>
  )
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-legenda text-texto-3">{rotulo}{children}</label>
}
const entrada = 'h-8 w-full rounded-lg border border-borda bg-white px-2 text-rotulo text-texto outline-none focus:border-marca'

/** Funil visual: etapas ligadas por setas com a taxa de conversão; calcula visitantes, leads, vendas, receita e retorno. */
export function EditorFunil({ id, titulo, dadosIniciais }: { id: string; titulo: string; dadosIniciais: DadosFunil }) {
  const { area, camera, setCamera, aproximar, paraMundo, tamanho } = useCamera(CAMERA_INICIAL)
  const [hist, setHist] = useState(() => iniciarHistorico(dadosIniciais))
  const [provisorio, setProvisorioEstado] = useState<DadosFunil | null>(null)
  const prov = useRef<DadosFunil | null>(null)
  const setProvisorio = useCallback((v: DadosFunil | null) => {
    prov.current = v
    setProvisorioEstado(v)
  }, [])
  const [selecao, setSelecao] = useState<Selecao>(null)
  const [linha, setLinha] = useState<{ de: string; x: number; y: number } | null>(null)
  const dados = provisorio ?? hist.atual
  const atual = useRef(dados)
  useEffect(() => {
    atual.current = dados
  })
  const calculo = useMemo(() => calcularFunil(dados), [dados])
  const memoDados = hist.atual
  const { situacao } = useAutosave('funil', id, memoDados, hist.passado.length > 0 || hist.futuro.length > 0)

  const confirmar = useCallback(
    (novo: DadosFunil) => {
      setProvisorio(null)
      setHist((h) => registrar(h, novo))
    },
    [setProvisorio],
  )
  const finalizar = useCallback(
    (moveu = true) => {
      const p = prov.current
      if (p && moveu) confirmar(p)
      else setProvisorio(null)
    },
    [confirmar, setProvisorio],
  )
  const enquadrarTudo = useCallback(() => {
    const { largura, altura } = tamanho()
    setCamera(enquadrar(uniao(atual.current.nos.map(caixaDoNo)), largura, altura, 80))
  }, [setCamera, tamanho])
  useEffect(() => {
    const t = setTimeout(enquadrarTudo, 0)
    return () => clearTimeout(t)
  }, [enquadrarTudo])

  const no = (idNo: string) => dados.nos.find((n) => n.id === idNo)
  const editarNo = (idNo: string, campos: Partial<NoFunil>) => confirmar({ ...atual.current, nos: atual.current.nos.map((n) => (n.id === idNo ? { ...n, ...campos } : n)) })
  const editarLigacao = (idLig: string, taxa: number) => confirmar({ ...atual.current, ligacoes: atual.current.ligacoes.map((l) => (l.id === idLig ? { ...l, taxa } : l)) })

  const adicionar = (tipo: TipoNo) => {
    if (atual.current.nos.length >= MAX_NOS) return
    const { largura, altura } = tamanho()
    const centro = paraMundo((area.current?.getBoundingClientRect().left ?? 0) + largura / 2, (area.current?.getBoundingClientRect().top ?? 0) + altura / 2)
    // Nasce no centro da tela e desce até achar um lugar livre, para não cair em cima de outra etapa.
    const x = centro.x - NO_LARGURA / 2
    let y = centro.y - NO_ALTURA / 2
    for (let i = 0; i < 50 && atual.current.nos.some((n) => Math.abs(n.x - x) < NO_LARGURA && Math.abs(n.y - y) < NO_ALTURA + 12); i++) y += NO_ALTURA + 24
    const novo: NoFunil = { ...NOVO_NO_PADRAO, id: novoId(), tipo, nome: INFO_NO[tipo].rotulo, x, y, valor: tipo === 'venda' ? 1000 : 0, visitantes: tipo === 'trafego' ? 1000 : 0 }
    confirmar({ ...atual.current, nos: [...atual.current.nos, novo] })
    setSelecao({ tipo: 'no', id: novo.id })
  }
  const apagar = useCallback(() => {
    if (!selecao) return
    const d = atual.current
    confirmar(selecao.tipo === 'no' ? { nos: d.nos.filter((n) => n.id !== selecao.id), ligacoes: d.ligacoes.filter((l) => l.de !== selecao.id && l.para !== selecao.id) } : { ...d, ligacoes: d.ligacoes.filter((l) => l.id !== selecao.id) })
    setSelecao(null)
  }, [selecao, confirmar])

  useEffect(() => {
    const aoTeclar = (ev: KeyboardEvent) => {
      if (ehCampo(ev.target)) return
      const mod = ev.ctrlKey || ev.metaKey
      if (mod && ev.key.toLowerCase() === 'z') {
        ev.preventDefault()
        setHist((h) => (ev.shiftKey ? refazer(h) : desfazer(h)))
        setSelecao(null)
      } else if (mod && ev.key.toLowerCase() === 'y') {
        ev.preventDefault()
        setHist(refazer)
      } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
        ev.preventDefault()
        apagar()
      } else if (ev.key === 'Escape') setSelecao(null)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [apagar])

  const moverNo = (ev: EventoPonteiro, alvo: NoFunil) => {
    ev.stopPropagation()
    setSelecao({ tipo: 'no', id: alvo.id })
    const base = atual.current
    arrastar(
      ev,
      (dx, dy) => setProvisorio({ ...base, nos: base.nos.map((n) => (n.id === alvo.id ? { ...n, x: alvo.x + dx / camera.z, y: alvo.y + dy / camera.z } : n)) }),
      finalizar,
    )
  }
  const ligar = (ev: EventoPonteiro, origem: NoFunil) => {
    ev.stopPropagation()
    ev.preventDefault()
    arrastar(
      ev,
      (_dx, _dy, e) => {
        const p = paraMundo(e.clientX, e.clientY)
        setLinha({ de: origem.id, x: p.x, y: p.y })
      },
      (moveu, e) => {
        setLinha(null)
        if (!moveu) return
        const p = paraMundo(e.clientX, e.clientY)
        const alvo = atual.current.nos.findLast((n) => n.id !== origem.id && p.x >= n.x && p.x <= n.x + NO_LARGURA && p.y >= n.y && p.y <= n.y + NO_ALTURA)
        const d = atual.current
        if (!alvo || d.ligacoes.length >= MAX_LIGACOES || d.ligacoes.some((l) => l.de === origem.id && l.para === alvo.id)) return
        const jaSaem = d.ligacoes.some((l) => l.de === origem.id)
        const nova: LigacaoFunil = { id: novoId(), de: origem.id, para: alvo.id, taxa: jaSaem ? 20 : 100 }
        confirmar({ ...d, ligacoes: [...d.ligacoes, nova] })
        setSelecao({ tipo: 'ligacao', id: nova.id })
      },
    )
  }
  const aoPressionarFundo = (ev: EventoPonteiro<HTMLDivElement>) => {
    if (ehCampo(ev.target) || (ev.target as HTMLElement).closest('[data-ui]')) return
    if (ev.button !== 0 && ev.button !== 1) return
    setSelecao(null)
    const c0 = camera
    arrastar(ev, (dx, dy) => setCamera({ ...c0, x: c0.x + dx, y: c0.y + dy }))
  }

  const maiorFluxo = Math.max(1, ...Object.values(calculo.fluxo))
  const selecionadoNo = selecao?.tipo === 'no' ? no(selecao.id) : undefined
  const selecionadaLigacao = selecao?.tipo === 'ligacao' ? dados.ligacoes.find((l) => l.id === selecao.id) : undefined
  const t = calculo.totais
  const recebe = (idNo: string) => dados.ligacoes.some((l) => l.para === idNo)

  return (
    <div className="flex h-[calc(100dvh-2.5rem)] flex-col">
      <BarraTela
        tipo="funil"
        id={id}
        titulo={titulo}
        situacao={situacao}
        zoom={camera.z}
        podeDesfazer={hist.passado.length > 0}
        podeRefazer={hist.futuro.length > 0}
        aoDesfazer={() => (setHist(desfazer), setSelecao(null))}
        aoRefazer={() => (setHist(refazer), setSelecao(null))}
        aoAproximar={aproximar}
        aoEnquadrar={enquadrarTudo}
        extra={
          <button type="button" onClick={() => (confirmar(organizarFunil(atual.current)), setTimeout(enquadrarTudo, 0))} disabled={dados.nos.length === 0} className="mr-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-borda px-2.5 text-rotulo font-semibold text-texto-2 hover:bg-hover disabled:opacity-40" title="Arruma as etapas em colunas, da esquerda para a direita">
            <Wand2 className="h-3.5 w-3.5" /> Organizar
          </button>
        }
      />
      <div className="flex min-h-0 flex-1">
        <div
          ref={area}
          onPointerDown={aoPressionarFundo}
          className="relative min-w-0 flex-1 touch-none overflow-hidden bg-[#f8f8f6] select-none"
          style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: `${24 * camera.z}px ${24 * camera.z}px`, backgroundPosition: `${camera.x}px ${camera.y}px` }}
          aria-label="Funil"
        >
          <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})` }}>
            <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden="true">
              <defs>
                <marker id="ponta" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#475569" /></marker>
                <marker id="ponta-sel" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2563eb" /></marker>
              </defs>
              {dados.ligacoes.map((l) => {
                const a = no(l.de)
                const b = no(l.para)
                if (!a || !b) return null
                const x1 = a.x + NO_LARGURA
                const y1 = a.y + NO_ALTURA / 2
                const x2 = b.x
                const y2 = b.y + NO_ALTURA / 2
                const curva = Math.max(60, Math.abs(x2 - x1) / 2)
                const sel = selecao?.tipo === 'ligacao' && selecao.id === l.id
                const ciclo = calculo.ciclos.includes(l.id)
                return <path key={l.id} d={`M${x1},${y1} C${x1 + curva},${y1} ${x2 - curva},${y2} ${x2},${y2}`} fill="none" stroke={sel ? '#2563eb' : ciclo ? '#ef4444' : '#475569'} strokeWidth={2 + (6 * (calculo.fluxo[l.id] ?? 0)) / maiorFluxo} strokeOpacity={0.55} strokeDasharray={ciclo ? '6 4' : undefined} markerEnd={`url(#${sel ? 'ponta-sel' : 'ponta'})`} />
              })}
              {linha && (() => {
                const a = no(linha.de)
                return a ? <line x1={a.x + NO_LARGURA} y1={a.y + NO_ALTURA / 2} x2={linha.x} y2={linha.y} stroke="#2563eb" strokeWidth={2} strokeDasharray="5 4" /> : null
              })()}
            </svg>

            {dados.ligacoes.map((l) => {
              const a = no(l.de)
              const b = no(l.para)
              if (!a || !b) return null
              const sel = selecao?.tipo === 'ligacao' && selecao.id === l.id
              return (
                <button key={l.id} type="button" data-ui onPointerDown={(ev) => ev.stopPropagation()} onClick={() => setSelecao({ tipo: 'ligacao', id: l.id })} className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border bg-white px-2 py-0.5 text-legenda font-semibold shadow-sm ${sel ? 'border-[#2563eb] text-[#2563eb]' : 'border-borda text-texto-2'}`} style={{ left: (a.x + NO_LARGURA + b.x) / 2, top: (a.y + b.y + NO_ALTURA) / 2 }} title="Clique para editar a taxa de conversão">
                  {numero.format(l.taxa)}% · {numero.format(calculo.fluxo[l.id] ?? 0)}
                </button>
              )
            })}

            {dados.nos.map((n) => {
              const info = INFO_NO[n.tipo]
              const Icone = ICONE[n.tipo]
              const r = calculo.nos[n.id]
              const sel = selecao?.tipo === 'no' && selecao.id === n.id
              return (
                <div key={n.id} data-ui onPointerDown={(ev) => moverNo(ev, n)} className={`group absolute flex cursor-grab items-stretch overflow-visible rounded-xl border bg-white shadow-sm active:cursor-grabbing ${sel ? 'border-[#2563eb] ring-2 ring-[#2563eb]/30' : 'border-borda'}`} style={{ left: n.x, top: n.y, width: NO_LARGURA, height: NO_ALTURA }}>
                  <span className="flex w-10 shrink-0 items-center justify-center rounded-l-xl text-claro" style={{ background: info.cor }}><Icone className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1 px-2 py-1.5">
                    <span className="block truncate text-rotulo font-semibold text-texto">{n.nome || info.rotulo}</span>
                    <span className="block truncate text-legenda tabular-nums text-texto-3">{numero.format(r.visitantes)} pessoas{n.tipo === 'venda' && n.valor > 0 ? ` · ${formatarReais(r.receita * 100)}` : ''}</span>
                    {r.excesso && <span className="block truncate text-micro text-perigo">Saídas somam mais de 100%</span>}
                  </span>
                  <span data-ui onPointerDown={(ev) => ligar(ev, n)} title="Arraste até outra etapa para ligar" aria-label={`Ligar ${n.nome} a outra etapa`} className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-claro bg-slate-500 opacity-70 shadow transition hover:scale-125 hover:bg-[#2563eb] hover:opacity-100 group-hover:opacity-100" />
                </div>
              )
            })}
          </div>

          <div data-ui className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1 rounded-xl border border-borda bg-white p-1 shadow-md" role="toolbar" aria-label="Adicionar etapa">
            {TIPOS_NO.map((tipo) => {
              const Icone = ICONE[tipo]
              return (
                <button key={tipo} type="button" onClick={() => adicionar(tipo)} title={`Adicionar ${INFO_NO[tipo].rotulo}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-legenda font-semibold text-texto-2 hover:bg-hover">
                  <span className="flex h-5 w-5 items-center justify-center rounded text-claro" style={{ background: INFO_NO[tipo].cor }}><Icone className="h-3 w-3" /></span>
                  <span className="hidden xl:inline">{INFO_NO[tipo].rotulo}</span>
                </button>
              )
            })}
          </div>

          {dados.nos.length === 0 && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-corpo text-texto-3">
              <Filter className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" /> Adicione etapas pela barra acima e ligue-as arrastando o ponto à direita de cada uma.
            </p>
          )}
        </div>

        <aside className="hidden w-72 shrink-0 space-y-3 overflow-y-auto border-l border-borda bg-white p-3 md:block" aria-label="Detalhes">
          {selecionadoNo ? (
            <>
              <h2 className="text-rotulo font-semibold text-texto">Etapa</h2>
              <Campo rotulo="Nome"><input className={entrada} value={selecionadoNo.nome} maxLength={80} onChange={(e) => setProvisorio({ ...atual.current, nos: atual.current.nos.map((n) => (n.id === selecionadoNo.id ? { ...n, nome: e.target.value } : n)) })} onBlur={() => finalizar()} /></Campo>
              <Campo rotulo="Tipo">
                <select className={entrada} value={selecionadoNo.tipo} onChange={(e) => editarNo(selecionadoNo.id, { tipo: e.target.value as TipoNo })}>
                  {TIPOS_NO.map((tp) => <option key={tp} value={tp}>{INFO_NO[tp].rotulo}</option>)}
                </select>
              </Campo>
              {!recebe(selecionadoNo.id) ? (
                <Campo rotulo="Visitantes que entram aqui"><input className={entrada} inputMode="numeric" defaultValue={selecionadoNo.visitantes} key={`v-${selecionadoNo.id}-${selecionadoNo.visitantes}`} onBlur={(e) => lerNumero(e.target.value, 1e9) !== selecionadoNo.visitantes && editarNo(selecionadoNo.id, { visitantes: lerNumero(e.target.value, 1e9) })} /></Campo>
              ) : (
                <p className="rounded-lg bg-fundo px-2 py-1.5 text-legenda text-texto-2">Recebe {numero.format(calculo.nos[selecionadoNo.id]?.visitantes ?? 0)} pessoas das etapas anteriores.</p>
              )}
              <Campo rotulo="Investimento nesta etapa (R$)"><input className={entrada} inputMode="decimal" defaultValue={selecionadoNo.custo} key={`c-${selecionadoNo.id}-${selecionadoNo.custo}`} onBlur={(e) => lerNumero(e.target.value, 1e9) !== selecionadoNo.custo && editarNo(selecionadoNo.id, { custo: lerNumero(e.target.value, 1e9) })} /></Campo>
              {selecionadoNo.tipo === 'venda' && (
                <Campo rotulo="Valor de cada venda (R$)"><input className={entrada} inputMode="decimal" defaultValue={selecionadoNo.valor} key={`p-${selecionadoNo.id}-${selecionadoNo.valor}`} onBlur={(e) => lerNumero(e.target.value, 1e9) !== selecionadoNo.valor && editarNo(selecionadoNo.id, { valor: lerNumero(e.target.value, 1e9) })} /></Campo>
              )}
              <button type="button" onClick={apagar} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-rotulo font-semibold text-perigo hover:bg-perigo/10"><Trash2 className="h-3.5 w-3.5" /> Excluir etapa</button>
            </>
          ) : selecionadaLigacao ? (
            <>
              <h2 className="text-rotulo font-semibold text-texto">Conversão</h2>
              <p className="text-legenda text-texto-2">{no(selecionadaLigacao.de)?.nome} → {no(selecionadaLigacao.para)?.nome}</p>
              <Campo rotulo="Taxa de conversão (%)">
                <input type="range" min={0} max={100} step={0.5} value={selecionadaLigacao.taxa} onChange={(e) => setProvisorio({ ...atual.current, ligacoes: atual.current.ligacoes.map((l) => (l.id === selecionadaLigacao.id ? { ...l, taxa: Number(e.target.value) } : l)) })} onPointerUp={() => finalizar()} onKeyUp={() => finalizar()} className="w-full" aria-label="Taxa de conversão" />
                <input className={entrada} inputMode="decimal" defaultValue={selecionadaLigacao.taxa} key={`t-${selecionadaLigacao.id}-${selecionadaLigacao.taxa}`} onBlur={(e) => lerNumero(e.target.value, 100) !== selecionadaLigacao.taxa && editarLigacao(selecionadaLigacao.id, lerNumero(e.target.value, 100))} />
              </Campo>
              <p className="rounded-lg bg-fundo px-2 py-1.5 text-legenda text-texto-2">{numero.format(calculo.fluxo[selecionadaLigacao.id] ?? 0)} pessoas passam por aqui.{calculo.ciclos.includes(selecionadaLigacao.id) ? ' Esta ligação volta a uma etapa anterior e não entra na conta.' : ''}</p>
              <button type="button" onClick={apagar} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-rotulo font-semibold text-perigo hover:bg-perigo/10"><Trash2 className="h-3.5 w-3.5" /> Excluir ligação</button>
            </>
          ) : (
            <>
              <h2 className="text-rotulo font-semibold text-texto">Como usar</h2>
              <ul className="list-disc space-y-1.5 pl-4 text-legenda text-texto-2">
                <li>Adicione etapas pela barra no topo da tela.</li>
                <li>Arraste o ponto à direita de uma etapa até outra para ligá-las.</li>
                <li>Clique no número da ligação para definir quantos % avançam.</li>
                <li>Em quem não recebe ligação, informe os visitantes; o resto é calculado.</li>
                <li>Informe o investimento e o valor da venda para ver custo por lead, por venda e o retorno.</li>
              </ul>
            </>
          )}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center divide-x divide-borda overflow-x-auto border-t border-borda bg-white" aria-label="Resultado do funil">
        <Metrica rotulo="Entradas" valor={numero.format(t.entrada)} />
        <Metrica rotulo="Leads" valor={numero.format(t.leads)} />
        <Metrica rotulo="Vendas" valor={numero.format(t.vendas)} />
        <Metrica rotulo="Conversão" valor={t.conversao === null ? '—' : percentual.format(t.conversao)} />
        <Metrica rotulo="Investimento" valor={formatarReais(t.custo * 100)} />
        <Metrica rotulo="Receita" valor={formatarReais(t.receita * 100)} tom="bom" />
        <Metrica rotulo="Lucro" valor={formatarReais(t.lucro * 100)} tom={t.lucro >= 0 ? 'bom' : 'ruim'} />
        <Metrica rotulo="Custo/lead" valor={t.cpl === null ? '—' : formatarReais(t.cpl * 100)} />
        <Metrica rotulo="Custo/venda" valor={t.cac === null ? '—' : formatarReais(t.cac * 100)} />
        <Metrica rotulo="ROAS" valor={t.roas === null ? '—' : `${numero.format(t.roas)}x`} tom={t.roas !== null && t.roas < 1 ? 'ruim' : undefined} />
      </footer>
    </div>
  )
}
