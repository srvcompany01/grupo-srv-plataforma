'use client'

import { FolderPlus, Layers3, ListPlus, MoreHorizontal, Plus } from 'lucide-react'
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
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'

type Opcao = { id: string; nome: string }

const GatilhoPadrao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { rotulo: string }>(function GatilhoPadrao(
  { children, rotulo: aria, ...props },
  ref,
) {
  return (
    <button ref={ref} type="button" aria-label={aria} title={aria} className="rounded-[5px] p-1 text-[#8a8b90] opacity-0 transition hover:bg-[#dedee0] hover:text-[#303136] group-hover:opacity-100 focus:opacity-100" {...props}>
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
  const [visual, setVisual] = useState<EstadoVisual>({ cor: '#6647f0', icone: 'layers-3', emoji: null })

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
  espaco: Opcao
  pastas: Opcao[]
  clientes: Opcao[]
  pastaInicial?: string | null
  modoInicial?: 'pasta' | 'lista'
  trigger?: ReactNode
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
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

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{trigger ?? <GatilhoPadrao rotulo={`Adicionar em ${espaco.nome}`}><Plus className="h-3.5 w-3.5" /></GatilhoPadrao>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Adicionar em {espaco.nome}</DialogTitle><DialogDescription>Crie a estrutura sem sair da navegação lateral.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-fundo p-1">
          <button type="button" onClick={() => trocarModo('pasta')} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${modo === 'pasta' ? 'bg-white shadow-sm' : 'text-texto-2'}`}><FolderPlus className="h-4 w-4" /> Pasta</button>
          <button type="button" onClick={() => trocarModo('lista')} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${modo === 'lista' ? 'bg-white shadow-sm' : 'text-texto-2'}`}><ListPlus className="h-4 w-4" /> Lista</button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            iniciar(async () => {
              const resultado = modo === 'pasta'
                ? await criarPastaNavegacao({ espacoId: espaco.id, nome, visual })
                : await criarListaNavegacao({ espacoId: espaco.id, pastaId: pastaId || null, clienteId, nome, mes, visual })
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
            <label className="space-y-1"><span className={rotulo}>Cliente</span><select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={campo}><option value="">Escolha…</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
            <label className="space-y-1"><span className={rotulo}>Pasta</span><select value={pastaId} onChange={(e) => setPastaId(e.target.value)} className={campo}><option value="">Sem pasta</option>{pastas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            <label className="space-y-1 sm:col-span-2"><span className={rotulo}>Mês de referência</span><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={campo} /></label>
          </div>}
          <SeletorVisual valor={visual} onChange={setVisual} />
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setAberto(false)} className={botaoSecundario}>Cancelar</button><button disabled={pendente || !nome.trim() || (modo === 'lista' && !clienteId)} className={botaoPrimario}>{pendente ? 'Criando…' : `Criar ${modo}`}</button></div>
        </form>
      </DialogContent>
    </Dialog>
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
