import { ROTULO_CATEGORIA, type Categoria } from '@/dominio/tarefas'

export const CATEGORIAS: { id: Categoria; nome: string; cor: string }[] = [
  { id: 'todo', nome: ROTULO_CATEGORIA.todo, cor: '#87909e' },
  { id: 'in_progress', nome: ROTULO_CATEGORIA.in_progress, cor: '#5b8def' },
  { id: 'done', nome: ROTULO_CATEGORIA.done, cor: '#2fa36b' },
]
