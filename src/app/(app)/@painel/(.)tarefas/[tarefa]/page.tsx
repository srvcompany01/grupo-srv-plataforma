import { CarregarTarefa } from '@/componentes/tarefas/CarregarTarefa'
import { PainelLateral } from '@/componentes/tarefas/PainelLateral'

export default async function PainelTarefa({ params }: PageProps<'/tarefas/[tarefa]'>) {
  const { tarefa } = await params
  return (
    <PainelLateral>
      <CarregarTarefa id={tarefa} noPainel />
    </PainelLateral>
  )
}
