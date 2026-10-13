export type LimiteColuna = { largura: number; minima: number; maxima: number }

/** Colunas nativas da lista (além de Nome). `padrao` = aparece sem configurar; as demais começam ocultas. */
export const COLUNAS_PADRAO = [
  { id: 'responsavel', nome: 'Responsável', padrao: true, largura: 110, minima: 80, maxima: 320 },
  { id: 'prazo', nome: 'Prazo', padrao: true, largura: 78, minima: 62, maxima: 240 },
  { id: 'prioridade', nome: 'Prioridade', padrao: true, largura: 44, minima: 36, maxima: 120 },
  { id: 'status', nome: 'Status', padrao: false, largura: 150, minima: 110, maxima: 320 },
  { id: 'tagcliente', nome: 'Tag do cliente', padrao: false, largura: 150, minima: 100, maxima: 320 },
  { id: 'etiquetas', nome: 'Etiquetas', padrao: false, largura: 180, minima: 100, maxima: 480 },
] as const

export const COLUNA_NOME = { id: 'nome', largura: 360, minima: 160, maxima: 800 } as const
export const COLUNAS_BASE: readonly ({ id: string } & LimiteColuna)[] = [COLUNA_NOME, ...COLUNAS_PADRAO]

export const LIMITE_CAMPO: LimiteColuna = { largura: 180, minima: 120, maxima: 600 }

/**
 * Preferência do usuário por lista. Campos personalizados entram pelo id do campo (sem prefixo) e as colunas
 * nativas pelo id delas. `ocultas` vale para tudo que aparece por padrão; `mostrar` para as nativas que começam ocultas.
 */
export type ConfigColunas = { ocultas: string[]; mostrar: string[]; ordem: string[] }
export const CONFIG_COLUNAS_VAZIA: ConfigColunas = { ocultas: [], mostrar: [], ordem: [] }

const ehNativa = (id: string) => COLUNAS_PADRAO.some((c) => c.id === id)

export function visivel(id: string, config: ConfigColunas): boolean {
  const nativa = COLUNAS_PADRAO.find((c) => c.id === id)
  if (nativa && !nativa.padrao) return config.mostrar.includes(id)
  return !config.ocultas.includes(id)
}

/** Ids das colunas exibidas, na ordem salva: nativas como `status`, campos como `campo:<id>`. */
export function colunasVisiveis(idsCampos: string[], config: ConfigColunas): string[] {
  const posicao = (id: string) => {
    const i = config.ordem.indexOf(id)
    return i < 0 ? config.ordem.length : i
  }
  return [...COLUNAS_PADRAO.map((c) => c.id), ...idsCampos]
    .filter((id) => visivel(id, config))
    .sort((a, b) => posicao(a) - posicao(b))
    .map((id) => (ehNativa(id) ? id : `campo:${id}`))
}

/** `campo:<id>` → `<id>`; ids nativos passam direto. */
export const idBruto = (colunaId: string) => (colunaId.startsWith('campo:') ? colunaId.slice(6) : colunaId)

export function ocultarColuna(config: ConfigColunas, id: string): ConfigColunas {
  const nativa = COLUNAS_PADRAO.find((c) => c.id === id)
  if (nativa && !nativa.padrao) return { ...config, mostrar: config.mostrar.filter((x) => x !== id) }
  return config.ocultas.includes(id) ? config : { ...config, ocultas: [...config.ocultas, id] }
}

export function mostrarColuna(config: ConfigColunas, id: string): ConfigColunas {
  const nativa = COLUNAS_PADRAO.find((c) => c.id === id)
  if (nativa && !nativa.padrao) return config.mostrar.includes(id) ? config : { ...config, mostrar: [...config.mostrar, id] }
  return { ...config, ocultas: config.ocultas.filter((x) => x !== id) }
}

/** Move a coluna para o início ou o fim entre as hoje visíveis. */
export function moverColuna(config: ConfigColunas, visiveis: string[], id: string, para: 'inicio' | 'final'): ConfigColunas {
  const outras = visiveis.map(idBruto).filter((x) => x !== id)
  return { ...config, ordem: para === 'inicio' ? [id, ...outras] : [...outras, id] }
}
