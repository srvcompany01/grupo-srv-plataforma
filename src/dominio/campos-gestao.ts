import type { ConfigCampo } from '@/dominio/personalizacao'

const HEX = /^#[0-9a-f]{6}$/i

/** Aceita "#abc", "abc", "#aabbcc" ou "aabbcc" e devolve "#aabbcc" em minúsculas; null se inválido. */
export function normalizarHex(valor: string): string | null {
  const v = valor.trim().replace(/^#/, '').toLowerCase()
  const cheio = v.length === 3 ? [...v].map((c) => c + c).join('') : v
  const hex = `#${cheio}`
  return HEX.test(hex) ? hex : null
}

export type Local = { id: string; nome: string }
export type ListaLocal = Local & { espacoId: string | null; pastaId: string | null }

/** "Espaço › Pasta › Lista"; listas na raiz aparecem como "Raiz". */
export function caminhoDaLista(lista: ListaLocal, espacos: Local[], pastas: (Local & { espacoId: string | null })[]): string {
  const espaco = lista.espacoId ? espacos.find((e) => e.id === lista.espacoId)?.nome : 'Raiz'
  const pasta = lista.pastaId ? pastas.find((p) => p.id === lista.pastaId)?.nome : null
  return [espaco ?? 'Espaço removido', pasta, lista.nome].filter(Boolean).join(' › ')
}

/** Remove opções vazias/repetidas e cores sem opção ou inválidas. Sem `options`, devolve a config como veio. */
export function limparOpcoes(config: ConfigCampo): ConfigCampo {
  if (!config.options) return config
  const options = [...new Set(config.options.map((o) => o.trim()).filter(Boolean))]
  const optionColors: Record<string, string> = {}
  for (const o of options) {
    const cor = normalizarHex(config.optionColors?.[o] ?? '')
    if (cor) optionColors[o] = cor
  }
  return { ...config, options, optionColors }
}
