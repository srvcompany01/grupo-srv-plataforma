import type { DefinicaoCampo, TipoCampoPersonalizado } from './personalizacao'
import { z } from 'zod'
import { LANDINGS_COM_FORMULARIO } from './landings'

/** Um campo pedido pelo formulário: 'title', 'description' ou o id de um campo personalizado da lista. */
export type CampoFormulario = { key: string; label: string; required: boolean }

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Identificador inválido.')
export const CamposFormulario = z.array(z.object({
  key: z.union([z.literal('title'), z.literal('description'), uuid]),
  label: z.string().trim().min(1, 'Preencha o nome de cada campo.').max(120, 'O nome de cada campo deve ter até 120 caracteres.'),
  required: z.boolean(),
})).min(1, 'Selecione os campos do formulário.').max(40, 'O formulário aceita até 40 campos.').superRefine((campos, ctx) => {
  if (!campos.some((c) => c.key === 'title')) ctx.addIssue({ code: 'custom', message: 'O formulário precisa pedir o título.' })
  if (new Set(campos.map((c) => c.key)).size !== campos.length) ctx.addIssue({ code: 'custom', message: 'Há campos repetidos no formulário.' })
}).transform((campos) => campos.map((c) => ({ ...c, required: c.key === 'title' || c.required })))

export const EntradaFormularioSchema = z.object({
  listaId: uuid,
  clienteId: uuid.nullable(),
  responsavelId: uuid,
  nome: z.string().trim().min(1, 'Informe o nome do formulário.').max(120, 'O nome deve ter até 120 caracteres.'),
  descricao: z.string().trim(),
  landing: z.string().refine((v) => LANDINGS_COM_FORMULARIO.some((l) => l.slug === v), 'Landing page inválida.').nullable(),
  campos: CamposFormulario,
})
export type EntradaFormulario = z.input<typeof EntradaFormularioSchema>

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
