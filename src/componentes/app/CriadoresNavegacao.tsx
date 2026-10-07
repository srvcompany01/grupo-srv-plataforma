'use client'

import {
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  FileInput,
  FileText,
  FolderPlus,
  Layers3,
  ListPlus,
  MoreHorizontal,
  PenTool,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { forwardRef, useState, useTransition, type ButtonHTMLAttributes, type ReactNode } from 'react'
import {
  criarEspacoNavegacao,
  criarListaNavegacao,
  criarPastaNavegacao,
  personalizarItemNavegacao,
} from '@/app/(app)/acoes-navegacao'
import { IconeVisual } from '@/componentes/IconeVisual'
import { SeletorVisual, type EstadoVisual } from '@/componentes/SeletorVisual'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'

type Opcao = { id: string; nome: string }

function OpcaoCriacao({ icone: Icone, nome, descricao, cor, onClick, seta = false, indisponivel = false }: {
  icone: LucideIcon
  nome: string
  descricao?: string
  cor: string
  onClick?: () => void
  seta?: boolean
  indisponivel?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={indisponivel}
      className="group/opcao flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#f2f2f3] disabled:cursor-default disabled:opacity-55"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" style={{ color: cor }}><Icone className="h-[18px] w-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-destaque font-medium text-[#292a2d]">{nome}{indisponivel && <span className="rounded bg-[#ececef] px-1.5 py-0.5 text-legenda font-semibold uppercase tracking-wide text-[#8b8c91]">Em breve</span>}</span>
        {descricao && <span className="mt-0.5 block text-legenda leading-[1.45] text-[#77787d]">{descricao}</span>}
      </span>
      {seta && <ChevronRight className="mt-0.5 h-4 w-4 text-[#98999d]" />}
    </button>
  )
}

const GatilhoPadrao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { rotulo: string }>(function GatilhoPadrao(
  { children, rotulo: aria, ...props },
  ref,
) {
  return (
    <button ref={ref} type="button" aria-label={aria} title={aria} className="rounded-[5px] p-1 text-lat-3 opacity-0 transition hover:bg-lat-hover hover:text-lat-fg group-hover:opacity-100 focus:opacity-100" {...props}>
      {children}
    </button>
  )
})

export function CriarEspacoDialog({ pais, trigger }: { pais: Opcao[]; trigger?: ReactNode }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [pendente, iniciar] = useTransition()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [paiId, setPaiId] = useState('')
  const [visual, setVisual] = useState<EstadoVisual>({ cor: '#70262d', icone: 'layers-3', emoji: null })

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{trigger ?? <GatilhoPadrao rotulo="Novo espaço"><Plus className="h-3.5 w-3.5" /></GatilhoPadrao>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Criar novo espaço</DialogTitle>
          <DialogDescription>Defina a identidade e a posição do novo departamento na plataforma.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            iniciar(async () => {
              const resultado = await criarEspacoNavegacao({ nome, descricao, paiId: paiId || null, visual })
              if (!avisar(resultado)) return
              setAberto(false)
              setNome('')
              router.refresh()
              if (resultado?.id) router.push(`/espacos/${resultado.id}`)
            })
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-[72px_1fr]">
            <div className="flex h-[72px] items-center justify-center rounded-2xl text-white" style={{ background: visual.cor }}>
              <IconeVisual icone={visual.icone} emoji={visual.emoji} className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <label className="block space-y-1"><span className={rotulo}>Nome do espaço</span><input autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} className={campo} placeholder="Ex.: Marketing" /></label>
              <label className="block space-y-1"><span className={rotulo}>Dentro de</span><select value={paiId} onChange={(e) => setPaiId(e.target.value)} className={campo}><option value="">Nível principal</option>{pais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            </div>
          </div>
          <label className="block space-y-1"><span className={rotulo}>Descrição</span><textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className={`${campo} min-h-20`} placeholder="Qual é a finalidade deste espaço?" /></label>
          <SeletorVisual valor={visual} onChange={setVisual} />
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setAberto(false)} className={botaoSecundario}>Cancelar</button><button disabled={pendente || !nome.trim()} className={botaoPrimario}>{pendente ? 'Criando…' : 'Criar espaço'}</button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CriarEstruturaDialog({
  espaco,
  pastas,
  clientes,
  pastaInicial = null,
  modoInicial = 'pasta',
  trigger,
}: {
  espaco: Opcao | null
  pastas: Opcao[]
  clientes: Opcao[]
  pastaInicial?: string | null
  modoInicial?: 'pasta' | 'lista'
  trigger?: ReactNode
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [pendente, iniciar] = useTransition()
  const [modo, setModo] = useState<'pasta' | 'lista'>(modoInicial)
  const [nome, setNome] = useState('')
  const [pastaId, setPastaId] = useState(pastaInicial ?? '')
  const [clienteId, setClienteId] = useState('')
  const [mes, setMes] = useState('')
  const [visual, setVisual] = useState<EstadoVisual>({ cor: '#3b82f6', icone: modoInicial === 'pasta' ? 'folder' : 'list', emoji: null })

  const trocarModo = (novo: 'pasta' | 'lista') => {
    setModo(novo)
    setVisual((atual) => ({ ...atual, icone: novo === 'pasta' ? 'folder' : 'list', emoji: null }))
  }

  const abrirCriador = (novo: 'pasta' | 'lista') => {
    trocarModo(novo)
    setMenuAberto(false)
    setAberto(true)
  }

  return (
    <>
      <Popover open={menuAberto} onOpenChange={setMenuAberto}>
        <PopoverTrigger asChild>{trigger ?? <GatilhoPadrao rotulo={`Adicionar em ${espaco?.nome ?? 'Itens soltos'}`}><Plus className="h-3.5 w-3.5" /></GatilhoPadrao>}</PopoverTrigger>
        <PopoverContent side="right" align="start" sideOffset={9} className="w-[300px] gap-0 overflow-hidden rounded-2xl border border-[#dedee1] bg-white p-0 shadow-[0_12px_36px_rgba(0,0,0,0.16)]">
          <div className="px-4 pb-2 pt-4"><p className="text-rotulo font-medium text-[#77787d]">Criar em {espaco?.nome ?? 'Itens soltos'}</p></div>
          <div className="px-2 pb-2">
            <OpcaoCriacao icone={ListPlus} nome="Lista" descricao="Acompanhe tarefas, projetos, pessoas e muito mais" cor="#5f6368" onClick={() => abrirCriador('lista')} />
            <OpcaoCriacao icone={FolderPlus} nome="Pasta" descricao="Agrupe listas, documentos e muito mais" cor="#5f6368" onClick={() => abrirCriador('pasta')} />
          </div>
          <div className="border-t border-[#ececef] px-2 py-2">
            <OpcaoCriacao icone={FileText} nome="Documento" cor="#168ff5" indisponivel />
            <OpcaoCriacao icone={BarChart3} nome="Painéis" cor="#ae48ca" indisponivel />
            <OpcaoCriacao icone={PenTool} nome="Quadro branco" cor="#eaaa16" indisponivel />
            <OpcaoCriacao icone={ClipboardCheck} nome="Formulário" cor="#7058eb" indisponivel />
          </div>
          <div className="border-t border-[#ececef] px-2 py-2">
            <OpcaoCriacao icone={FileInput} nome="Importações" cor="#77787d" seta indisponivel />
            <OpcaoCriacao icone={Sparkles} nome="Modelos" cor="#77787d" indisponivel />
          </div>
        </PopoverContent>
      </Popover>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Adicionar em {espaco?.nome ?? 'Itens soltos'}</DialogTitle><DialogDescription>Crie a estrutura sem sair da navegação lateral.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-fundo p-1">
          <button type="button" onClick={() => trocarModo('pasta')} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${modo === 'pasta' ? 'bg-white shadow-sm' : 'text-texto-2'}`}><FolderPlus className="h-4 w-4" /> Pasta</button>
          <button type="button" onClick={() => trocarModo('lista')} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${modo === 'lista' ? 'bg-white shadow-sm' : 'text-texto-2'}`}><ListPlus className="h-4 w-4" /> Lista</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            iniciar(async () => {
              const resultado = modo === 'pasta'
                ? await criarPastaNavegacao({ espacoId: espaco?.id ?? null, nome, visual })
                : await criarListaNavegacao({ espacoId: espaco?.id ?? null, pastaId: pastaId || null, clienteId, nome, mes, visual })
              if (!avisar(resultado)) return
              setAberto(false)
              setNome('')
              router.refresh()
              if (resultado?.id) router.push(`/listas/${resultado.id}`)
            })
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: visual.cor }}><IconeVisual icone={visual.icone} emoji={visual.emoji} className="h-5 w-5" /></div>
            <label className="block flex-1 space-y-1"><span className={rotulo}>Nome da {modo}</span><input autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} className={campo} /></label>
          </div>
          {modo === 'lista' && <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1"><span className={rotulo}>Tag do cliente</span><select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={campo}><option value="">Escolha a tag…</option>{clientes.map((c) => <option key={c.id} value={c.id}>@{c.nome}</option>)}</select></label>
            <label className="space-y-1"><span className={rotulo}>Pasta</span><select value={pastaId} onChange={(e) => setPastaId(e.target.value)} className={campo}><option value="">Sem pasta</option>{pastas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            <label className="space-y-1 sm:col-span-2"><span className={rotulo}>Mês de referência</span><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={campo} /></label>
          </div>}
          <SeletorVisual valor={visual} onChange={setVisual} />
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setAberto(false)} className={botaoSecundario}>Cancelar</button><button disabled={pendente || !nome.trim() || (modo === 'lista' && !clienteId)} className={botaoPrimario}>{pendente ? 'Criando…' : `Criar ${modo}`}</button></div>
        </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PersonalizarItemDialog({
  tipo,
  id,
  nomeInicial,
  visualInicial,
}: {
  tipo: 'spaces' | 'folders' | 'lists'
  id: string
  nomeInicial: string
  visualInicial: EstadoVisual
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [pendente, iniciar] = useTransition()
  const [nome, setNome] = useState(nomeInicial)
  const [visual, setVisual] = useState(visualInicial)

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild><GatilhoPadrao rotulo={`Personalizar ${nomeInicial}`}><MoreHorizontal className="h-3.5 w-3.5" /></GatilhoPadrao></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Personalizar</DialogTitle><DialogDescription>Escolha o nome, a cor e um ícone Lucide ou emoji.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); iniciar(async () => { const resultado = await personalizarItemNavegacao({ tipo, id, nome, visual }); if (!avisar(resultado)) return; setAberto(false); router.refresh() }) }} className="space-y-5">
          <div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-xl text-white" style={{ background: visual.cor }}><IconeVisual icone={visual.icone} emoji={visual.emoji} className="h-6 w-6" /></div><label className="flex-1 space-y-1"><span className={rotulo}>Nome</span><input value={nome} onChange={(e) => setNome(e.target.value)} className={campo} /></label></div>
          <SeletorVisual valor={visual} onChange={setVisual} />
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setAberto(false)} className={botaoSecundario}>Cancelar</button><button disabled={pendente || !nome.trim()} className={botaoPrimario}>Salvar</button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function IconeAdicionarEstrutura() {
  return <Layers3 className="h-3.5 w-3.5" />
}
