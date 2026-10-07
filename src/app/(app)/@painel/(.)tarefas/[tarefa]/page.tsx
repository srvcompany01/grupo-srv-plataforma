import { CarregarTarefa } from '@/componentes/tarefas/CarregarTarefa'
import { JanelaTarefa } from '@/componentes/tarefas/tela/JanelaTarefa'

export default async function PainelTarefa({ params }: PageProps<'/tarefas/[tarefa]'>) {
  const { tarefa } = await params
  return (
    <JanelaTarefa>
      <CarregarTarefa id={tarefa} emJanela />
    </JanelaTarefa>
  )
}
