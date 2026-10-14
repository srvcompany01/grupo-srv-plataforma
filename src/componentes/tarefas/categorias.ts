import type { IconeStatusInfo } from '@/dominio/status-icone'
import { ROTULO_CATEGORIA, type Categoria } from '@/dominio/tarefas'

export const CATEGORIAS: { id: Categoria; nome: string; cor: string; icone: IconeStatusInfo }[] = [
  { id: 'todo', nome: ROTULO_CATEGORIA.todo, cor: '#87909e', icone: { categoria: 'todo', fracao: 0 } },
  { id: 'in_progress', nome: ROTULO_CATEGORIA.in_progress, cor: '#5b8def', icone: { categoria: 'in_progress', fracao: 0.5 } },
  { id: 'done', nome: ROTULO_CATEGORIA.done, cor: '#2fa36b', icone: { categoria: 'done', fracao: 1 } },
]
