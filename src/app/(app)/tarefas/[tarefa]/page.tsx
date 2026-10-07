import { CarregarTarefa } from '@/componentes/tarefas/CarregarTarefa'

export default async function PaginaTarefa({ params }: PageProps<'/tarefas/[tarefa]'>) {
  const { tarefa } = await params
  return (
    <div className="h-[calc(100dvh-3.5rem)] md:h-dvh">
      <CarregarTarefa id={tarefa} emJanela={false} />
    </div>
  )
}
