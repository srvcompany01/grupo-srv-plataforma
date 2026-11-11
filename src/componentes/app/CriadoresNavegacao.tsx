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
    >
      <span style={{ color: cor }}><Icone /></span>
      <span>
        <span>{nome}{indisponivel && <span>Em breve</span>}</span>
        {descricao && <span>{descricao}</span>}
      </span>
      {seta && <ChevronRight />}
    </button>
  )
}

const GatilhoPadrao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { rotulo: string }>(function GatilhoPadrao(
  { children, rotulo: aria, ...props },
  ref,
) {
  return (
    <button ref={ref} type="button" aria-label={aria} title={aria} {...props}>
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
      <DialogTrigger asChild>{trigger ?? <GatilhoPadrao rotulo="Novo espaço"><Plus /></GatilhoPadrao>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo espaço</DialogTitle>
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
        >
          <div>
            <div style={{ background: visual.cor }}>
              <IconeVisual icone={visual.icone} emoji={visual.emoji} />
            </div>
            <div>
              <label><span>Nome do espaço</span><input autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Marketing" /></label>
              <label><span>Dentro de</span><select value={paiId} onChange={(e) => setPaiId(e.target.value)}><option value="">Nível principal</option>{pais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            </div>
          </div>
          <label><span>Descrição</span><textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Qual é a finalidade deste espaço?" /></label>
          <SeletorVisual valor={visual} onChange={setVisual} />
          <div><button type="button" onClick={() => setAberto(false)}>Cancelar</button><button disabled={pendente || !nome.trim()}>{pendente ? 'Criando…' : 'Criar espaço'}</button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CriarEstruturaDialog({
  espaco,
  pastas,
  pastaInicial = null,
  modoInicial = 'pasta',
  trigger,
}: {
  espaco: Opcao | null
  pastas: Opcao[]
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
        <PopoverTrigger asChild>{trigger ?? <GatilhoPadrao rotulo={`Adicionar em ${espaco?.nome ?? 'Itens soltos'}`}><Plus /></GatilhoPadrao>}</PopoverTrigger>
        <PopoverContent side="right" align="start" sideOffset={9}>
          <div><p>Criar em {espaco?.nome ?? 'Itens soltos'}</p></div>
          <div>
            <OpcaoCriacao icone={ListPlus} nome="Lista" descricao="Acompanhe tarefas, projetos, pessoas e muito mais" cor="var(--text-2)" onClick={() => abrirCriador('lista')} />
            <OpcaoCriacao icone={FolderPlus} nome="Pasta" descricao="Agrupe listas, documentos e muito mais" cor="var(--text-2)" onClick={() => abrirCriador('pasta')} />
          </div>
          <div>
            <OpcaoCriacao icone={FileText} nome="Documento" cor="#168ff5" indisponivel />
            <OpcaoCriacao icone={BarChart3} nome="Painéis" cor="#ae48ca" indisponivel />
            <OpcaoCriacao icone={PenTool} nome="Quadro branco" cor="#eaaa16" indisponivel />
            <OpcaoCriacao icone={ClipboardCheck} nome="Formulário" cor="#7058eb" indisponivel />
          </div>
          <div>
            <OpcaoCriacao icone={FileInput} nome="Importações" cor="var(--text-2)" seta indisponivel />
            <OpcaoCriacao icone={Sparkles} nome="Modelos" cor="var(--text-2)" indisponivel />
          </div>
        </PopoverContent>
      </Popover>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
        <DialogHeader><DialogTitle>Adicionar em {espaco?.nome ?? 'Itens soltos'}</DialogTitle><DialogDescription>Crie a estrutura sem sair da navegação lateral.</DialogDescription></DialogHeader>
        <div>
          <button type="button" onClick={() => trocarModo('pasta')}><FolderPlus /> Pasta</button>
          <button type="button" onClick={() => trocarModo('lista')}><ListPlus /> Lista</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            iniciar(async () => {
              const resultado = modo === 'pasta'
                ? await criarPastaNavegacao({ espacoId: espaco?.id ?? null, nome, visual })
                : await criarListaNavegacao({ espacoId: espaco?.id ?? null, pastaId: pastaId || null, nome, mes, visual })
              if (!avisar(resultado)) return
              setAberto(false)
              setNome('')
              router.refresh()
              if (resultado?.id) router.push(`/listas/${resultado.id}`)
            })
          }}
        >
          <div>
            <div style={{ background: visual.cor }}><IconeVisual icone={visual.icone} emoji={visual.emoji} /></div>
            <label><span>Nome da {modo}</span><input autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} /></label>
          </div>
          {modo === 'lista' && <div>
            <label><span>Pasta</span><select value={pastaId} onChange={(e) => setPastaId(e.target.value)}><option value="">Sem pasta</option>{pastas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            <label><span>Mês de referência</span><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></label>
          </div>}
          <SeletorVisual valor={visual} onChange={setVisual} />
          <div><button type="button" onClick={() => setAberto(false)}>Cancelar</button><button disabled={pendente || !nome.trim()}>{pendente ? 'Criando…' : `Criar ${modo}`}</button></div>
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
      <DialogTrigger asChild><GatilhoPadrao rotulo={`Personalizar ${nomeInicial}`}><MoreHorizontal /></GatilhoPadrao></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Personalizar</DialogTitle><DialogDescription>Escolha o nome, a cor e um ícone Lucide ou emoji.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); iniciar(async () => { const resultado = await personalizarItemNavegacao({ tipo, id, nome, visual }); if (!avisar(resultado)) return; setAberto(false); router.refresh() }) }}>
          <div><div style={{ background: visual.cor }}><IconeVisual icone={visual.icone} emoji={visual.emoji} /></div><label><span>Nome</span><input value={nome} onChange={(e) => setNome(e.target.value)} /></label></div>
          <SeletorVisual valor={visual} onChange={setVisual} />
          <div><button type="button" onClick={() => setAberto(false)}>Cancelar</button><button disabled={pendente || !nome.trim()}>Salvar</button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function IconeAdicionarEstrutura() {
  return <Layers3 />
}
