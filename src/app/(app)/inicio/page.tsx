import { exigirEquipe } from '@/infra/supabase/sessao'

export default async function MinhasTarefas() {
  const eu = await exigirEquipe()
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Minhas tarefas</h1>
      <p className="mt-1 text-sm text-texto-2">Olá, {eu.nome}. As tarefas atribuídas a você aparecerão aqui.</p>
    </div>
  )
}
