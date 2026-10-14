import type { DefinicaoCampo, TipoCampoPersonalizado } from './personalizacao'

/** Um campo pedido pelo formulário: 'title', 'description' ou o id de um campo personalizado da lista. */
export type CampoFormulario = { key: string; label: string; required: boolean }

/** Tipos que uma pessoa de fora consegue preencher num formulário simples. */
export const TIPOS_NO_FORMULARIO: ReadonlySet<TipoCampoPersonalizado> = new Set([
  'text', 'long_text', 'number', 'money', 'date', 'dropdown', 'checkbox', 'email', 'phone', 'site',
])

const NUMERICOS = new Set<TipoCampoPersonalizado>(['number', 'money'])

/** Campos que o formulário pode oferecer: título, descrição e os personalizados compatíveis da lista. */
export function camposOferecidos(personalizados: DefinicaoCampo[]): CampoFormulario[] {
  return [
    { key: 'title', label: 'Título', required: true },
    { key: 'description', label: 'Descrição', required: false },
    ...personalizados.filter((c) => TIPOS_NO_FORMULARIO.has(c.tipo)).map((c) => ({ key: c.id, label: c.nome, required: false })),
  ]
}

/** Converte o que veio do navegador (tudo texto) para o JSON que a função do banco espera. Vazio é omitido. */
export function respostasDoForm(
  campos: CampoFormulario[],
  tipos: Record<string, TipoCampoPersonalizado | undefined>,
  lerValor: (chave: string) => string | null,
): Record<string, string | number | boolean> {
  const saida: Record<string, string | number | boolean> = {}
  for (const { key } of campos) {
    const bruto = lerValor(key)
    const tipo = tipos[key]
    if (tipo === 'checkbox') {
      saida[key] = bruto === 'on'
      continue
    }
    const texto = (bruto ?? '').trim()
    if (!texto) continue
    if (tipo && NUMERICOS.has(tipo)) {
      const n = Number(texto.replace(',', '.'))
      if (Number.isFinite(n)) saida[key] = n
    } else {
      saida[key] = texto
    }
  }
  return saida
}
