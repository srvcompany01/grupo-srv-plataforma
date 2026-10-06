import { CarregarTarefa } from '@/componentes/tarefas/CarregarTarefa'

export default async function PaginaTarefa({ params }: PageProps<'/tarefas/[tarefa]'>) {
  const { tarefa } = await params
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <CarregarTarefa id={tarefa} />
    </div>
  )
}
