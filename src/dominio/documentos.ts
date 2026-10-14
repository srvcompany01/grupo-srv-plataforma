/** Tipos e regras puras dos documentos (sem banco). */

export const VISIBILIDADES = ['team', 'private', 'people'] as const
export type Visibilidade = (typeof VISIBILIDADES)[number]
export const ROTULO_VISIBILIDADE: Record<Visibilidade, string> = {
  team: 'Equipe toda',
  private: 'Só eu',
  people: 'Pessoas escolhidas',
}

export const ABAS_DOCUMENTOS = ['todos', 'meus', 'compartilhados', 'privados', 'favoritos', 'arquivados'] as const
export type AbaDocumentos = (typeof ABAS_DOCUMENTOS)[number]
export const ROTULO_ABA: Record<AbaDocumentos, string> = {
  todos: 'Todos os documentos',
  meus: 'Meus documentos',
  compartilhados: 'Compartilhado comigo',
  privados: 'Privados',
  favoritos: 'Favoritos',
  arquivados: 'Arquivados',
}

export type ListaVinculada = { id: string; nome: string }

export type ResumoDocumento = {
  id: string
  titulo: string
  icone: string | null
  donoId: string
  donoNome: string
  visibilidade: Visibilidade
  clienteId: string | null
  clienteNome: string | null
  clienteVisivel: boolean
  wiki: boolean
  arquivadoEm: string | null
  atualizadoEm: string
  visualizadoEm: string | null
  favorito: boolean
  listas: ListaVinculada[]
}

export type PaginaDocumento = {
  id: string
  paiId: string | null
  titulo: string
  icone: string | null
  posicao: string
}

export type PessoaDocumento = { id: string; nome: string; podeEditar: boolean }

export const lerAba = (valor: string | undefined): AbaDocumentos =>
  (ABAS_DOCUMENTOS as readonly string[]).includes(valor ?? '') ? (valor as AbaDocumentos) : 'todos'

/** Filtra e ordena (mais recente primeiro) conforme a aba e a busca. `euId` é quem está olhando. */
export function filtrarDocumentos(docs: ResumoDocumento[], aba: AbaDocumentos, euId: string, busca = ''): ResumoDocumento[] {
  const termo = busca.trim().toLowerCase()
  return docs
    .filter((d) => {
      if (aba === 'arquivados') return d.arquivadoEm !== null
      if (d.arquivadoEm !== null) return false
      if (aba === 'meus') return d.donoId === euId
      if (aba === 'compartilhados') return d.donoId !== euId
      if (aba === 'privados') return d.visibilidade !== 'team'
      if (aba === 'favoritos') return d.favorito
      return true
    })
    .filter((d) => !termo || d.titulo.toLowerCase().includes(termo) || d.listas.some((l) => l.nome.toLowerCase().includes(termo)) || (d.clienteNome ?? '').toLowerCase().includes(termo))
    .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
}

/** Páginas em ordem de leitura (pai antes dos filhos, irmãs por posição), com a profundidade de cada uma. */
export function arvoreDePaginas(paginas: PaginaDocumento[]): (PaginaDocumento & { nivel: number })[] {
  const filhos = new Map<string | null, PaginaDocumento[]>()
  for (const p of paginas) {
    const lista = filhos.get(p.paiId) ?? []
    lista.push(p)
    filhos.set(p.paiId, lista)
  }
  const saida: (PaginaDocumento & { nivel: number })[] = []
  const visitar = (paiId: string | null, nivel: number) => {
    for (const p of (filhos.get(paiId) ?? []).sort((a, b) => (a.posicao < b.posicao ? -1 : a.posicao > b.posicao ? 1 : 0))) {
      saida.push({ ...p, nivel })
      visitar(p.id, nivel + 1)
    }
  }
  visitar(null, 0)
  // Página cujo pai sumiu do conjunto (não deveria acontecer) ainda aparece, na raiz.
  const vistos = new Set(saida.map((p) => p.id))
  for (const p of paginas) if (!vistos.has(p.id)) saida.push({ ...p, nivel: 0 })
  return saida
}

/** Texto do aviso de quem pode ver, para o cabeçalho do documento. */
export function resumoAcesso(d: Pick<ResumoDocumento, 'visibilidade' | 'clienteNome' | 'clienteVisivel'>, pessoas: number): string {
  const base = d.visibilidade === 'team' ? 'Equipe toda' : d.visibilidade === 'private' ? 'Só você' : `Você e mais ${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'}`
  return d.clienteVisivel && d.clienteNome ? `${base} · cliente ${d.clienteNome}` : base
}
