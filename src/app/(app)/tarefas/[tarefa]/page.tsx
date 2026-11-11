import { CarregarTarefa } from '@/componentes/tarefas/CarregarTarefa'

export default async function PaginaTarefa({ params }: PageProps<'/tarefas/[tarefa]'>) {
  const { tarefa } = await params
  return (
    <div>
      <CarregarTarefa id={tarefa} emJanela={false} />
    </div>
  )
}
