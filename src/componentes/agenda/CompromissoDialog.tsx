'use client'

import { Plus } from 'lucide-react'
import { useState, useTransition, type ReactNode } from 'react'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { excluirCompromissoAcao, salvarCompromissoAcao } from '@/app/(app)/agenda/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { REPETICOES, VISIBILIDADES, paraEntrada, type Compromisso, type EntradaCompromisso } from '@/dominio/agenda'
import { botaoFantasma, botaoPrimario, campo } from '@/lib/ui'

type Props = {
  compromisso?: Compromisso
  equipe: { id: string; nome: string }[]
  /** Admin e gestor criam para a equipe ou para pessoas escolhidas. */
  podeCompartilhar: boolean
  /** Quem criou (ou o admin) edita; os demais só veem. */
  podeEditar?: boolean
  hoje: string
  className?: string
  children?: ReactNode
}

const vazio = (hoje: string): Required<EntradaCompromisso> => ({ titulo: '', descricao: '', data: hoje, horaInicio: '09:00', horaFim: '10:00', diaInteiro: false, visibilidade: 'privado', pessoas: [], repetir: 'nunca', repetirAte: null })

export function CompromissoDialog({ compromisso, equipe, podeCompartilhar, podeEditar = true, hoje, className, children }: Props) {
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState(() => (compromisso ? paraEntrada(compromisso) : vazio(hoje)))
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const mudar = (p: Partial<EntradaCompromisso>) => setF((v) => ({ ...v, ...p }))
  const alternarPessoa = (id: string) => mudar({ pessoas: f.pessoas.includes(id) ? f.pessoas.filter((p) => p !== id) : [...f.pessoas, id] })

  const salvar = () =>
    iniciar(async () => {
      if (!avisar(await salvarCompromissoAcao(compromisso?.id ?? null, f), true)) return
      setAberto(false)
      if (!compromisso) setF(vazio(hoje))
    })
  const excluir = () =>
    iniciar(async () => {
      if (!(await confirmar({ titulo: `Excluir "${compromisso!.titulo}"?`, descricao: 'Sai da agenda de todos que o veem e do Google Agenda deles. Se for fixo, todas as repetições somem.', confirmar: 'Excluir', perigo: true }))) return
      if (avisar(await excluirCompromissoAcao(compromisso!.id), true)) setAberto(false)
    })
  // Quem não é admin/gestor ainda vê a visibilidade de um compromisso compartilhado com ela, só sem mudar.
  const visibilidades = podeCompartilhar ? VISIBILIDADES : VISIBILIDADES.filter((v) => v.valor === f.visibilidade)

  return (
    <Dialog open={aberto} onOpenChange={(a) => { setAberto(a); if (a && compromisso) setF(paraEntrada(compromisso)) }}>
      {compromisso ? (
        <DialogTrigger className={className}>{children}</DialogTrigger>
      ) : (
        <DialogTrigger className={botaoPrimario}><Plus className="h-3.5 w-3.5" /> Novo compromisso</DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{compromisso ? (podeEditar ? 'Editar compromisso' : 'Compromisso') : 'Novo compromisso'}</DialogTitle>
          <DialogDescription>{podeEditar ? 'Quem vê o compromisso também o recebe no Google Agenda, se tiver conectado.' : 'Só quem criou pode alterar este compromisso.'}</DialogDescription>
        </DialogHeader>
        <fieldset disabled={!podeEditar || pendente} className="space-y-3">
          <input className={`${campo} h-9`} value={f.titulo} onChange={(e) => mudar({ titulo: e.target.value })} placeholder="Título (ex.: Reunião de pauta)" maxLength={120} autoFocus aria-label="Título" />
          <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
            <label className="space-y-1 text-legenda text-texto-3">
              Data
              <input type="date" className={`${campo} h-9`} value={f.data} onChange={(e) => mudar({ data: e.target.value })} />
            </label>
            {!f.diaInteiro && (
              <>
                <label className="space-y-1 text-legenda text-texto-3">
                  Início
                  <input type="time" className={`${campo} h-9`} value={f.horaInicio} onChange={(e) => mudar({ horaInicio: e.target.value })} />
                </label>
                <label className="space-y-1 text-legenda text-texto-3">
                  Fim
                  <input type="time" className={`${campo} h-9`} value={f.horaFim} onChange={(e) => mudar({ horaFim: e.target.value })} />
                </label>
              </>
            )}
          </div>
          <label className="flex items-center gap-2 text-rotulo">
            <input type="checkbox" checked={f.diaInteiro} onChange={(e) => mudar({ diaInteiro: e.target.checked })} /> Dia inteiro
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-legenda text-texto-3">
              Repetir (compromisso fixo)
              <select className={`${campo} h-9`} value={f.repetir} onChange={(e) => mudar({ repetir: e.target.value as EntradaCompromisso['repetir'] })}>
                {REPETICOES.map((r) => <option key={r.valor} value={r.valor}>{r.rotulo}</option>)}
              </select>
            </label>
            {f.repetir !== 'nunca' && (
              <label className="space-y-1 text-legenda text-texto-3">
                Até (opcional)
                <input type="date" className={`${campo} h-9`} value={f.repetirAte ?? ''} min={f.data} onChange={(e) => mudar({ repetirAte: e.target.value || null })} />
              </label>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-legenda text-texto-3">Quem vê</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-fundo p-1" role="group" aria-label="Quem vê">
              {visibilidades.map((v) => (
                <button key={v.valor} type="button" onClick={() => mudar({ visibilidade: v.valor })} aria-pressed={f.visibilidade === v.valor} className={`h-8 rounded-md px-1 text-legenda font-semibold ${f.visibilidade === v.valor ? 'bg-white text-texto shadow-sm' : 'text-texto-2 hover:bg-hover'}`}>
                  {v.rotulo}
                </button>
              ))}
            </div>
            {!podeCompartilhar && !compromisso && <p className="text-legenda text-texto-3">Compromissos para a equipe são criados pelo admin ou gestor.</p>}
          </div>
          {f.visibilidade === 'selecionados' && (
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-borda p-2">
              {equipe.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-rotulo">
                  <input type="checkbox" checked={f.pessoas.includes(p.id)} onChange={() => alternarPessoa(p.id)} /> {p.nome}
                </label>
              ))}
            </div>
          )}
          <textarea className={`${campo} min-h-20 py-2`} value={f.descricao} onChange={(e) => mudar({ descricao: e.target.value })} placeholder="Descrição, link da reunião…" maxLength={2000} aria-label="Descrição" />
        </fieldset>
        {podeEditar && (
          <div className="flex items-center justify-between gap-2">
            {compromisso ? <button type="button" className={`${botaoFantasma} text-perigo`} disabled={pendente} onClick={excluir}>Excluir</button> : <span />}
            <div className="flex gap-2">
              <button type="button" className={botaoFantasma} onClick={() => setAberto(false)}>Cancelar</button>
              <button type="button" className={botaoPrimario} disabled={pendente} onClick={salvar}>Salvar</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
