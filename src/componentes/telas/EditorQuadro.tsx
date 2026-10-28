'use client'

import { ArrowUpToLine, Circle, Copy, Diamond, Eraser, Hand, MousePointer2, MoveUpRight, Pencil, Square, StickyNote, Trash2, Type } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as EventoPonteiro, type ReactNode } from 'react'
import {
  CORES_NOTA,
  CORES_TRACO,
  MAX_ELEMENTOS,
  caixaDe,
  caixaDoArrasto,
  deslocar,
  elementoSob,
  elementosNaArea,
  simplificarTraco,
  temCaixa,
  type DadosQuadro,
  type ElementoComCaixa,
  type ElementoQuadro,
} from '@/dominio/quadro'
import { CAMERA_INICIAL, desfazer, enquadrar, iniciarHistorico, novoId, refazer, registrar, uniao, type Caixa } from '@/dominio/tela'
import { BarraTela } from './BarraTela'
import { arrastar, useAutosave, useCamera } from './hooks'

type Ferramenta = 'selecionar' | 'mao' | 'nota' | 'texto' | 'retangulo' | 'elipse' | 'losango' | 'seta' | 'caneta'

const FERRAMENTAS: { id: Ferramenta; rotulo: string; tecla: string; Icone: typeof Square }[] = [
  { id: 'selecionar', rotulo: 'Selecionar', tecla: 'V', Icone: MousePointer2 },
  { id: 'mao', rotulo: 'Mover a tela', tecla: 'H', Icone: Hand },
  { id: 'nota', rotulo: 'Nota adesiva', tecla: 'N', Icone: StickyNote },
  { id: 'texto', rotulo: 'Texto', tecla: 'T', Icone: Type },
  { id: 'retangulo', rotulo: 'Retângulo', tecla: 'R', Icone: Square },
  { id: 'elipse', rotulo: 'Elipse', tecla: 'O', Icone: Circle },
  { id: 'losango', rotulo: 'Losango', tecla: 'D', Icone: Diamond },
  { id: 'seta', rotulo: 'Seta', tecla: 'A', Icone: MoveUpRight },
  { id: 'caneta', rotulo: 'Caneta', tecla: 'P', Icone: Pencil },
]
const TECLAS = Object.fromEntries(FERRAMENTAS.map((f) => [f.tecla.toLowerCase(), f.id])) as Record<string, Ferramenta>
const CURSOR: Record<Ferramenta, string> = { selecionar: 'default', mao: 'grab', nota: 'copy', texto: 'text', retangulo: 'crosshair', elipse: 'crosshair', losango: 'crosshair', seta: 'crosshair', caneta: 'crosshair' }
const TAMANHOS_TEXTO = [14, 20, 32, 48]
const CABO = 10

const naCaixa = (e: ElementoQuadro): e is ElementoComCaixa => temCaixa(e)
const trocar = (lista: ElementoQuadro[], id: string, fn: (e: ElementoQuadro) => ElementoQuadro) => lista.map((e) => (e.id === id ? fn(e) : e))
const ehCampo = (alvo: EventTarget | null) => alvo instanceof HTMLElement && !!alvo.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')

function criarElemento(ferramenta: Ferramenta, x: number, y: number): ElementoQuadro | null {
  const id = novoId()
  if (ferramenta === 'nota') return { id, tipo: 'nota', x: x - 80, y: y - 80, w: 160, h: 160, texto: '', cor: CORES_NOTA[0] }
  if (ferramenta === 'texto') return { id, tipo: 'texto', x, y, w: 220, h: 40, texto: '', cor: CORES_TRACO[0], tamanho: 20 }
  if (ferramenta === 'retangulo' || ferramenta === 'elipse' || ferramenta === 'losango') return { id, tipo: ferramenta, x, y, w: 160, h: 100, texto: '', cor: '#ffffff', borda: CORES_TRACO[0] }
  return null
}

function Seta({ e, selecionado }: { e: Extract<ElementoQuadro, { tipo: 'seta' }>; selecionado: boolean }) {
  const ang = Math.atan2(e.y2 - e.y1, e.x2 - e.x1)
  const t = 14
  const ponta = [
    [e.x2, e.y2],
    [e.x2 - t * Math.cos(ang - 0.45), e.y2 - t * Math.sin(ang - 0.45)],
    [e.x2 - t * Math.cos(ang + 0.45), e.y2 - t * Math.sin(ang + 0.45)],
  ]
  return (
    <g>
      <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.cor} strokeWidth={3} strokeLinecap="round" />
      <polygon points={ponta.map((p) => p.join(',')).join(' ')} fill={e.cor} />
      {selecionado && (
        <>
          <circle cx={e.x1} cy={e.y1} r={6} fill="#fff" stroke="#2563eb" strokeWidth={2} />
          <circle cx={e.x2} cy={e.y2} r={6} fill="#fff" stroke="#2563eb" strokeWidth={2} />
        </>
      )}
    </g>
  )
}

function Forma({ e, children }: { e: Extract<ElementoQuadro, { tipo: 'retangulo' | 'elipse' | 'losango' }>; children: ReactNode }) {
  return (
    <div className="absolute" style={{ left: e.x, top: e.y, width: e.w, height: e.h }}>
      <svg width={e.w} height={e.h} className="absolute inset-0 overflow-visible" aria-hidden="true">
        {e.tipo === 'retangulo' && <rect x={1.5} y={1.5} width={e.w - 3} height={e.h - 3} rx={8} fill={e.cor} stroke={e.borda} strokeWidth={3} />}
        {e.tipo === 'elipse' && <ellipse cx={e.w / 2} cy={e.h / 2} rx={e.w / 2 - 1.5} ry={e.h / 2 - 1.5} fill={e.cor} stroke={e.borda} strokeWidth={3} />}
        {e.tipo === 'losango' && <polygon points={`${e.w / 2},1.5 ${e.w - 1.5},${e.h / 2} ${e.w / 2},${e.h - 1.5} 1.5,${e.h / 2}`} fill={e.cor} stroke={e.borda} strokeWidth={3} strokeLinejoin="round" />}
      </svg>
      {children}
    </div>
  )
}

function CampoTexto({ valor, editando, aoMudar, aoSair, className, style }: { valor: string; editando: boolean; aoMudar: (v: string) => void; aoSair: () => void; className: string; style?: CSSProperties }) {
  if (!editando) return <div className={`${className} whitespace-pre-wrap break-words`} style={style}>{valor}</div>
  return (
    <textarea
      autoFocus
      value={valor}
      maxLength={2000}
      onChange={(ev) => aoMudar(ev.target.value)}
      onBlur={aoSair}
      onKeyDown={(ev) => ev.key === 'Escape' && ev.currentTarget.blur()}
      onFocus={(ev) => ev.currentTarget.setSelectionRange(ev.currentTarget.value.length, ev.currentTarget.value.length)}
      className={`${className} resize-none border-0 bg-transparent outline-none`}
      style={style}
      aria-label="Texto do elemento"
    />
  )
}

/** Quadro branco: notas, textos, formas, setas e desenho livre numa tela infinita, com desfazer e salvamento automático. */
export function EditorQuadro({ id, titulo, dadosIniciais }: { id: string; titulo: string; dadosIniciais: DadosQuadro }) {
  const { area, camera, setCamera, aproximar, paraMundo, tamanho } = useCamera(CAMERA_INICIAL)
  const [hist, setHist] = useState(() => iniciarHistorico(dadosIniciais.elementos))
  const [provisorio, setProvisorioEstado] = useState<ElementoQuadro[] | null>(null)
  const prov = useRef<ElementoQuadro[] | null>(null)
  // A ref é atualizada na hora: o último movimento do arrasto não pode se perder antes do render.
  const setProvisorio = useCallback((v: ElementoQuadro[] | null) => {
    prov.current = v
    setProvisorioEstado(v)
  }, [])
  const [ferramenta, setFerramenta] = useState<Ferramenta>('selecionar')
  const [selecao, setSelecao] = useState<string[]>([])
  const [editando, setEditando] = useState<string | null>(null)
  const [area_, setArea] = useState<Caixa | null>(null)
  const espaco = useRef(false)
  const elementos = provisorio ?? hist.atual
  const emEdicao = useRef(elementos)
  useEffect(() => {
    emEdicao.current = elementos
  })

  const dados = useMemo(() => ({ elementos: hist.atual }), [hist.atual])
  const { situacao } = useAutosave('quadro', id, dados, hist.passado.length > 0 || hist.futuro.length > 0)

  const confirmar = useCallback(
    (novo: ElementoQuadro[]) => {
      setProvisorio(null)
      setHist((h) => registrar(h, novo))
    },
    [setProvisorio],
  )
  /** Encerra um arrasto: o que estava provisório entra no histórico (uma única entrada de desfazer). */
  const finalizar = useCallback(
    (moveu = true) => {
      const p = prov.current
      if (p && moveu) confirmar(p)
      else setProvisorio(null)
    },
    [confirmar, setProvisorio],
  )
  const aplicar = useCallback((fn: (lista: ElementoQuadro[]) => ElementoQuadro[]) => confirmar(fn(emEdicao.current)), [confirmar])
  const limpar = () => {
    setSelecao([])
    setEditando(null)
  }
  const enquadrarTudo = useCallback(() => {
    const { largura, altura } = tamanho()
    setCamera(enquadrar(uniao(emEdicao.current.map(caixaDe)), largura, altura))
  }, [setCamera, tamanho])

  // Enquadra o conteúdo ao abrir (depois que a área tem tamanho).
  useEffect(() => {
    const t = setTimeout(enquadrarTudo, 0)
    return () => clearTimeout(t)
  }, [enquadrarTudo])

  const apagar = useCallback(() => {
    if (!selecao.length) return
    aplicar((l) => l.filter((e) => !selecao.includes(e.id)))
    limpar()
  }, [selecao, aplicar])
  const duplicar = useCallback(() => {
    const originais = emEdicao.current.filter((e) => selecao.includes(e.id))
    if (!originais.length || emEdicao.current.length + originais.length > MAX_ELEMENTOS) return
    const copias = originais.map((e) => ({ ...deslocar(e, 24, 24), id: novoId() }))
    aplicar((l) => [...l, ...copias])
    setSelecao(copias.map((c) => c.id))
  }, [selecao, aplicar])
  const paraFrente = () => aplicar((l) => [...l.filter((e) => !selecao.includes(e.id)), ...l.filter((e) => selecao.includes(e.id))])

  useEffect(() => {
    const aoTeclar = (ev: KeyboardEvent) => {
      if (ev.key === ' ') espaco.current = ev.type === 'keydown' && !ehCampo(ev.target)
      if (ev.type !== 'keydown' || ehCampo(ev.target)) return
      const mod = ev.ctrlKey || ev.metaKey
      const tecla = ev.key.toLowerCase()
      if (mod && tecla === 'z') {
        ev.preventDefault()
        setHist((h) => (ev.shiftKey ? refazer(h) : desfazer(h)))
        limpar()
      } else if (mod && tecla === 'y') {
        ev.preventDefault()
        setHist(refazer)
      } else if (mod && tecla === 'd') {
        ev.preventDefault()
        duplicar()
      } else if (mod && tecla === 'a') {
        ev.preventDefault()
        setSelecao(emEdicao.current.map((e) => e.id))
      } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
        ev.preventDefault()
        apagar()
      } else if (ev.key === 'Escape') {
        limpar()
        setFerramenta('selecionar')
      } else if (ev.key.startsWith('Arrow') && selecao.length) {
        ev.preventDefault()
        const p = ev.shiftKey ? 10 : 1
        const dx = ev.key === 'ArrowLeft' ? -p : ev.key === 'ArrowRight' ? p : 0
        const dy = ev.key === 'ArrowUp' ? -p : ev.key === 'ArrowDown' ? p : 0
        aplicar((l) => l.map((e) => (selecao.includes(e.id) ? deslocar(e, dx, dy) : e)))
      } else if (!mod && TECLAS[tecla]) setFerramenta(TECLAS[tecla])
    }
    window.addEventListener('keydown', aoTeclar)
    window.addEventListener('keyup', aoTeclar)
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      window.removeEventListener('keyup', aoTeclar)
    }
  }, [selecao, aplicar, apagar, duplicar])

  const mover = (ev: EventoPonteiro, ids: string[]) => {
    const base = emEdicao.current
    arrastar(
      ev,
      (dx, dy) => setProvisorio(base.map((e) => (ids.includes(e.id) ? deslocar(e, dx / camera.z, dy / camera.z) : e))),
      finalizar,
    )
  }
  const redimensionar = (ev: EventoPonteiro, alvo: ElementoComCaixa) => {
    ev.stopPropagation()
    const base = emEdicao.current
    arrastar(
      ev,
      (dx, dy) => setProvisorio(trocar(base, alvo.id, (e) => (naCaixa(e) ? { ...e, w: Math.max(24, alvo.w + dx / camera.z), h: Math.max(24, alvo.h + dy / camera.z) } : e))),
      finalizar,
    )
  }
  const moverPonta = (ev: EventoPonteiro, alvo: Extract<ElementoQuadro, { tipo: 'seta' }>, ponta: 1 | 2) => {
    ev.stopPropagation()
    const base = emEdicao.current
    arrastar(
      ev,
      (_dx, _dy, e) => {
        const p = paraMundo(e.clientX, e.clientY)
        setProvisorio(trocar(base, alvo.id, (s) => (s.tipo === 'seta' ? (ponta === 1 ? { ...s, x1: p.x, y1: p.y } : { ...s, x2: p.x, y2: p.y }) : s)))
      },
      finalizar,
    )
  }

  const aoPressionar = (ev: EventoPonteiro<HTMLDivElement>) => {
    if (ehCampo(ev.target) || (ev.target as HTMLElement).closest('[data-ui]')) return
    if (editando) setEditando(null)
    const p = paraMundo(ev.clientX, ev.clientY)
    const panoramica = ev.button === 1 || espaco.current || ferramenta === 'mao'
    if (panoramica) {
      ev.preventDefault()
      const c0 = camera
      arrastar(ev, (dx, dy) => setCamera({ ...c0, x: c0.x + dx, y: c0.y + dy }))
      return
    }
    if (ev.button !== 0) return

    if (ferramenta === 'selecionar') {
      const folga = 8 / camera.z
      const alvo = elementoSob(emEdicao.current, p.x, p.y, folga)
      if (alvo) {
        const ids = ev.shiftKey ? (selecao.includes(alvo.id) ? selecao.filter((s) => s !== alvo.id) : [...selecao, alvo.id]) : selecao.includes(alvo.id) ? selecao : [alvo.id]
        setSelecao(ids)
        if (ids.includes(alvo.id)) mover(ev, ids)
        return
      }
      if (!ev.shiftKey) setSelecao([])
      const inicial = ev.shiftKey ? selecao : []
      arrastar(
        ev,
        (_dx, _dy, e) => {
          const q = paraMundo(e.clientX, e.clientY)
          const caixa = caixaDoArrasto(p.x, p.y, q.x, q.y)
          setArea(caixa)
          setSelecao([...new Set([...inicial, ...elementosNaArea(emEdicao.current, caixa).map((x) => x.id)])])
        },
        () => setArea(null),
      )
      return
    }

    if (ferramenta === 'seta') {
      const novo: ElementoQuadro = { id: novoId(), tipo: 'seta', x1: p.x, y1: p.y, x2: p.x, y2: p.y, cor: CORES_TRACO[0] }
      const base = emEdicao.current
      arrastar(
        ev,
        (_dx, _dy, e) => {
          const q = paraMundo(e.clientX, e.clientY)
          setProvisorio([...base, { ...novo, x2: q.x, y2: q.y }])
        },
        (moveu) => {
          finalizar(moveu)
          if (moveu) {
            setSelecao([novo.id])
            setFerramenta('selecionar')
          }
        },
      )
      return
    }

    if (ferramenta === 'caneta') {
      const traco: ElementoQuadro = { id: novoId(), tipo: 'desenho', pontos: [p.x, p.y, p.x, p.y], cor: CORES_TRACO[0], largura: 3 }
      const base = emEdicao.current
      let pontos = traco.pontos
      arrastar(
        ev,
        (_dx, _dy, e) => {
          const q = paraMundo(e.clientX, e.clientY)
          pontos = [...pontos, q.x, q.y]
          setProvisorio([...base, { ...traco, pontos }])
        },
        (moveu) => {
          if (moveu) confirmar([...base, { ...traco, pontos: simplificarTraco(pontos) }])
          else setProvisorio(null)
        },
      )
      return
    }

    // nota, texto e formas: clique cria no tamanho padrão; formas também aceitam arrastar para escolher o tamanho
    if (emEdicao.current.length >= MAX_ELEMENTOS) return
    const novo = criarElemento(ferramenta, p.x, p.y)
    if (!novo) return
    const forma = novo.tipo === 'retangulo' || novo.tipo === 'elipse' || novo.tipo === 'losango'
    const base = emEdicao.current
    arrastar(
      ev,
      (_dx, _dy, e) => {
        if (!forma) return
        const q = paraMundo(e.clientX, e.clientY)
        const c = caixaDoArrasto(p.x, p.y, q.x, q.y)
        setProvisorio([...base, { ...novo, x: c.x, y: c.y, w: Math.max(24, c.w), h: Math.max(24, c.h) } as ElementoQuadro])
      },
      (moveu) => {
        const final = moveu && forma ? (prov.current?.find((x) => x.id === novo.id) ?? novo) : novo
        confirmar([...base, final])
        setSelecao([novo.id])
        setEditando(novo.tipo === 'nota' || novo.tipo === 'texto' || forma ? novo.id : null)
        setFerramenta('selecionar')
      },
    )
  }

  const aoDuploClique = (ev: MouseEvent<HTMLDivElement>) => {
    if (ehCampo(ev.target) || ferramenta !== 'selecionar') return
    const p = paraMundo(ev.clientX, ev.clientY)
    const alvo = elementoSob(emEdicao.current, p.x, p.y)
    if (alvo && naCaixa(alvo)) {
      setSelecao([alvo.id])
      setEditando(alvo.id)
    }
  }

  const mudarTexto = (alvo: ElementoComCaixa, texto: string) => setProvisorio(trocar(emEdicao.current, alvo.id, (e) => (naCaixa(e) ? { ...e, texto } : e)))
  const sairDaEdicao = () => {
    setEditando(null)
    finalizar()
  }

  const selecionados = elementos.filter((e) => selecao.includes(e.id))
  const unico = selecionados.length === 1 ? selecionados[0] : null
  const caixaSelecao = uniao(selecionados.map(caixaDe))
  const preencher = (cor: string) => aplicar((l) => l.map((e) => (selecao.includes(e.id) && (e.tipo === 'nota' || e.tipo === 'retangulo' || e.tipo === 'elipse' || e.tipo === 'losango') ? { ...e, cor } : e)))
  const tracar = (cor: string) =>
    aplicar((l) => l.map((e) => (!selecao.includes(e.id) ? e : e.tipo === 'seta' || e.tipo === 'desenho' || e.tipo === 'texto' ? { ...e, cor } : e.tipo === 'retangulo' || e.tipo === 'elipse' || e.tipo === 'losango' ? { ...e, borda: cor } : e)))
  const tamanhoTexto = (tamanho: number) => aplicar((l) => l.map((e) => (selecao.includes(e.id) && e.tipo === 'texto' ? { ...e, tamanho } : e)))
  const temPreenchimento = selecionados.some((e) => e.tipo === 'nota' || e.tipo === 'retangulo' || e.tipo === 'elipse' || e.tipo === 'losango')

  return (
    <div className="flex h-[calc(100dvh-2.5rem)] flex-col">
      <BarraTela
        tipo="quadro"
        id={id}
        titulo={titulo}
        situacao={situacao}
        zoom={camera.z}
        podeDesfazer={hist.passado.length > 0}
        podeRefazer={hist.futuro.length > 0}
        aoDesfazer={() => (setHist(desfazer), limpar())}
        aoRefazer={() => (setHist(refazer), limpar())}
        aoAproximar={aproximar}
        aoEnquadrar={enquadrarTudo}
      />
      <div
        ref={area}
        onPointerDown={aoPressionar}
        onDoubleClick={aoDuploClique}
        className="relative min-h-0 flex-1 touch-none overflow-hidden bg-[#f8f8f6] select-none"
        style={{ cursor: CURSOR[ferramenta], backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: `${24 * camera.z}px ${24 * camera.z}px`, backgroundPosition: `${camera.x}px ${camera.y}px` }}
        aria-label="Quadro branco"
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})` }}>
          {elementos.map((e) => {
            if (!naCaixa(e)) return null
            const edita = editando === e.id
            if (e.tipo === 'nota')
              return (
                <div key={e.id} className="absolute rounded-sm p-3 shadow-md" style={{ left: e.x, top: e.y, width: e.w, height: e.h, background: e.cor }}>
                  <CampoTexto valor={e.texto} editando={edita} aoMudar={(v) => mudarTexto(e, v)} aoSair={sairDaEdicao} className="h-full w-full overflow-hidden text-[16px] leading-snug text-gray-900" />
                </div>
              )
            if (e.tipo === 'texto')
              return (
                <div key={e.id} className="absolute" style={{ left: e.x, top: e.y, width: e.w, minHeight: e.h }}>
                  <CampoTexto valor={e.texto || (edita ? '' : 'Texto')} editando={edita} aoMudar={(v) => mudarTexto(e, v)} aoSair={sairDaEdicao} className="w-full overflow-hidden leading-tight" style={{ fontSize: e.tamanho, color: e.texto ? e.cor : '#94a3b8', height: edita ? e.h : undefined }} />
                </div>
              )
            return (
              <Forma key={e.id} e={e}>
                <CampoTexto valor={e.texto} editando={edita} aoMudar={(v) => mudarTexto(e, v)} aoSair={sairDaEdicao} className="absolute inset-0 flex items-center justify-center overflow-hidden p-3 text-center text-[16px] leading-snug text-gray-900" />
              </Forma>
            )
          })}
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden="true">
            {elementos.map((e) =>
              e.tipo === 'seta' ? (
                <Seta key={e.id} e={e} selecionado={selecao.includes(e.id) && selecao.length === 1} />
              ) : e.tipo === 'desenho' ? (
                <polyline key={e.id} points={e.pontos.reduce<string[]>((acc, v, i) => (i % 2 ? (acc[acc.length - 1] += `,${v}`, acc) : [...acc, `${v}`]), []).join(' ')} fill="none" stroke={e.cor} strokeWidth={e.largura} strokeLinecap="round" strokeLinejoin="round" />
              ) : null,
            )}
            {selecionados.map((e) => {
              const c = caixaDe(e)
              return <rect key={e.id} x={c.x - 4} y={c.y - 4} width={c.w + 8} height={c.h + 8} fill="none" stroke="#2563eb" strokeWidth={1.5 / camera.z} strokeDasharray={e.tipo === 'seta' ? '4 3' : undefined} />
            })}
            {area_ && <rect x={area_.x} y={area_.y} width={area_.w} height={area_.h} fill="#2563eb22" stroke="#2563eb" strokeWidth={1 / camera.z} />}
          </svg>
          {/* Alças: elementos HTML para receber o ponteiro (o SVG acima não recebe cliques). */}
          {unico && naCaixa(unico) && !editando && ferramenta === 'selecionar' && (
            <div data-ui onPointerDown={(ev) => redimensionar(ev, unico)} className="absolute rounded-sm border-2 border-[#2563eb] bg-white" style={{ left: unico.x + unico.w - CABO / camera.z / 2 + 4, top: unico.y + unico.h - CABO / camera.z / 2 + 4, width: CABO / camera.z, height: CABO / camera.z, cursor: 'nwse-resize' }} aria-label="Redimensionar" />
          )}
          {unico?.tipo === 'seta' && ferramenta === 'selecionar' && (
            <>
              <div data-ui onPointerDown={(ev) => moverPonta(ev, unico, 1)} className="absolute rounded-full" style={{ left: unico.x1 - 10, top: unico.y1 - 10, width: 20, height: 20, cursor: 'move' }} aria-label="Mover início da seta" />
              <div data-ui onPointerDown={(ev) => moverPonta(ev, unico, 2)} className="absolute rounded-full" style={{ left: unico.x2 - 10, top: unico.y2 - 10, width: 20, height: 20, cursor: 'move' }} aria-label="Mover ponta da seta" />
            </>
          )}
        </div>

        <div data-ui className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-0.5 rounded-lg border border-borda bg-white p-1 shadow-md" role="toolbar" aria-label="Ferramentas" aria-orientation="vertical">
          {FERRAMENTAS.map(({ id: f, rotulo, tecla, Icone }) => (
            <button key={f} type="button" onClick={() => setFerramenta(f)} aria-pressed={ferramenta === f} title={`${rotulo} (${tecla})`} aria-label={rotulo} className={`rounded-lg p-2 ${ferramenta === f ? 'bg-petroleo text-claro' : 'text-texto-2 hover:bg-hover'}`}>
              <Icone className="h-4 w-4" />
            </button>
          ))}
        </div>

        {caixaSelecao && !editando && (
          <div data-ui className="absolute left-1/2 top-3 z-10 flex max-w-[95%] -translate-x-1/2 flex-wrap items-center gap-2 rounded-lg border border-borda bg-white px-2 py-1.5 shadow-md" role="toolbar" aria-label="Propriedades">
            {temPreenchimento && (
              <div className="flex items-center gap-1" role="group" aria-label="Preenchimento">
                {CORES_NOTA.map((c) => <button key={c} type="button" onClick={() => preencher(c)} aria-label={`Preencher com ${c}`} className="h-5 w-5 rounded-full border border-borda" style={{ background: c }} />)}
              </div>
            )}
            <div className="flex items-center gap-1" role="group" aria-label="Cor do traço">
              {CORES_TRACO.map((c) => <button key={c} type="button" onClick={() => tracar(c)} aria-label={`Traço ${c}`} className="h-5 w-5 rounded-full border border-claro ring-1 ring-borda" style={{ background: c }} />)}
            </div>
            {unico?.tipo === 'texto' && (
              <div className="flex items-center gap-0.5" role="group" aria-label="Tamanho do texto">
                {TAMANHOS_TEXTO.map((t) => <button key={t} type="button" onClick={() => tamanhoTexto(t)} aria-pressed={unico.tamanho === t} className={`rounded px-1.5 py-0.5 text-legenda ${unico.tamanho === t ? 'bg-petroleo text-claro' : 'hover:bg-hover'}`}>{t}</button>)}
              </div>
            )}
            <span className="h-4 w-px bg-borda" />
            <button type="button" onClick={paraFrente} title="Trazer para a frente" aria-label="Trazer para a frente" className="rounded p-1 text-texto-2 hover:bg-hover"><ArrowUpToLine className="h-4 w-4" /></button>
            <button type="button" onClick={duplicar} title="Duplicar (Ctrl+D)" aria-label="Duplicar" className="rounded p-1 text-texto-2 hover:bg-hover"><Copy className="h-4 w-4" /></button>
            <button type="button" onClick={apagar} title="Excluir (Delete)" aria-label="Excluir" className="rounded p-1 text-texto-2 hover:bg-hover hover:text-perigo"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}

        {elementos.length === 0 && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-corpo text-texto-3">
            <Eraser className="mr-2 h-4 w-4" aria-hidden="true" /> Quadro vazio — escolha uma ferramenta à esquerda (N cria uma nota).
          </p>
        )}
      </div>
    </div>
  )
}
