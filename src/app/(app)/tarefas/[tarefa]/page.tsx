import { CarregarTarefa } from '@/componentes/tarefas/CarregarTarefa'

export default async function PaginaTarefa({ params }: PageProps<'/tarefas/[tarefa]'>) {
  const { tarefa } = await params
  return (
    <div className="h-[calc(100dvh-2.5rem)]">
      <CarregarTarefa id={tarefa} emJanela={false} />
    </div>
  )
}
