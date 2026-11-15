'use client'

import { MoreHorizontal, Pause, Repeat } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { definirRecorrenciaAcao, pausarRecorrenciaAcao } from '@/app/(app)/tarefas/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Button } from '@/componentes/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/componentes/ui/sheet'
import { resumirRecorrencia, textoProxima, type Recorrencia, type RegraRecorrencia } from '@/dominio/recorrencia'
import { avisar } from '../avisar'
import { FormularioRecorrencia } from './FormularioRecorrencia'
import { useCelular } from './useCelular'

const MENSAGEM_ERRO = 'Não foi possível salvar a repetição. Tente de novo.'

/** Linha "Repetir" da tarefa-modelo: resumo da regra, menu da série e o formulário (Popover no desktop, Sheet no celular). */
export function SecaoRecorrencia({
  tarefaId,
  prazo,
  hoje,
  regra,
  criadas,
}: {
  tarefaId: string
  prazo: string | null
  hoje: string
  regra: Recorrencia | null
  /** Cópias já criadas pela série. */
  criadas: number
}) {
  const router = useRouter()
  const celular = useCelular()
  const confirmar = useConfirmar()
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  function salvar(nova: RegraRecorrencia) {
    setErro(null)
    iniciar(async () => {
      const r = await definirRecorrenciaAcao(tarefaId, nova)
      if (r?.erro) {
        setErro(MENSAGEM_ERRO)
        avisar(r)
        return
      }
      avisar(r, true)
      setAberto(false)
      router.refresh()
    })
  }

  function pausar(pausada: boolean) {
    iniciar(async () => {
      const r = await pausarRecorrenciaAcao(tarefaId, pausada)
      if (!avisar(r)) return
      if (pausada) toast('Repetição pausada. Nenhuma tarefa nova será criada.', { action: { label: 'Desfazer', onClick: () => void pausarRecorrenciaAcao(tarefaId, false).then(() => router.refresh()) } })
      else toast.success('Repetição retomada.')
      router.refresh()
    })
  }

  async function parar() {
    const existentes = criadas === 0 ? 'Nenhuma tarefa foi criada ainda.' : criadas === 1 ? 'A tarefa já criada continua na lista.' : `As ${criadas} tarefas já criadas continuam na lista.`
    if (!(await confirmar({ titulo: 'Parar esta série?', descricao: `Nenhuma tarefa nova será criada. ${existentes}`, confirmar: 'Parar série', perigo: true }))) return
    iniciar(async () => {
      if (avisar(await definirRecorrenciaAcao(tarefaId, null), true)) router.refresh()
    })
  }

  const formulario = (
    <FormularioRecorrencia
      inicial={regra}
      geradas={regra?.geradas ?? 0}
      prazoDaTarefa={prazo}
      hoje={hoje}
      salvando={pendente}
      erro={erro}
      aoSalvar={salvar}
      aoCancelar={() => setAberto(false)}
      celular={celular}
    />
  )

  const proxima = regra ? textoProxima(regra) : null
  const valor = regra ? (
    <span className="flex flex-wrap items-center gap-x-1.5 text-corpo text-texto">
      <span>{resumirRecorrencia(regra)}</span>
      {!regra.ativa && (
        <span className="inline-flex items-center gap-1 rounded-sm border border-borda-forte px-1 text-legenda font-semibold text-texto-2"><Pause className="h-3 w-3" aria-hidden="true" />Pausada</span>
      )}
      <span className="w-full text-rotulo text-texto-2 md:w-auto">
        {[regra.ativa ? proxima : null, `${criadas} ${criadas === 1 ? 'criada' : 'criadas'}`].filter(Boolean).join(' · ')}
      </span>
    </span>
  ) : (
    <span className="text-corpo text-texto-2">Não se repete</span>
  )

  const gatilho = (
    <button type="button" onClick={() => setAberto(true)} aria-label={regra ? `Editar repetição: ${resumirRecorrencia(regra)}` : 'Repetir tarefa'} className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-left hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
      <Repeat className="h-[15px] w-[15px] shrink-0 text-texto-3" aria-hidden="true" />
      {valor}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-1">
      {celular ? (
        <>
          {gatilho}
          <Sheet open={aberto} onOpenChange={setAberto}>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[var(--r-panel)] p-4">
              <SheetTitle>Repetir tarefa</SheetTitle>
              <SheetDescription className="sr-only">Defina quando as próximas tarefas serão criadas.</SheetDescription>
              {aberto && formulario}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Popover open={aberto} onOpenChange={setAberto}>
          <PopoverTrigger asChild>{gatilho}</PopoverTrigger>
          <PopoverContent align="start" className="max-h-[80vh] w-[360px] overflow-y-auto rounded-lg p-4 shadow-[var(--shadow-pop)]">
            <p className="mb-3 text-destaque font-semibold text-texto">Repetir tarefa</p>
            {formulario}
          </PopoverContent>
        </Popover>
      )}
      {regra && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Opções da repetição" disabled={pendente}><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setAberto(true)}>Editar repetição</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => pausar(regra.ativa)}>{regra.ativa ? 'Pausar repetição' : 'Retomar repetição'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-perigo-forte" onSelect={() => void parar()}>Parar série</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

/** Linha do cabeçalho de uma cópia: "Parte de uma série semanal · Ver tarefa modelo". */
export function AvisoDaSerie({ modeloId, regra }: { modeloId: string; regra: Recorrencia | null }) {
  const tipo = regra ? ({ daily: 'diária', weekdays: 'de dias úteis', weekly: 'semanal', monthly: 'mensal' } as const)[regra.frequencia] : null
  return (
    <p className="flex items-center gap-1.5 text-rotulo text-texto-2">
      <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Parte de uma série{tipo ? ` ${tipo}` : ''} ·</span>
      <a href={`/tarefas/${modeloId}`} className="underline underline-offset-2 hover:text-texto">Ver tarefa modelo</a>
    </p>
  )
}

