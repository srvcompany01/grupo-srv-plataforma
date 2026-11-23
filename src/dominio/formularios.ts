import { z } from 'zod'
import type { DefinicaoCampo, TipoCampoPersonalizado } from './personalizacao'
import { LANDINGS_COM_FORMULARIO } from './landings'

export const TIPOS_PERGUNTA = ['text', 'name', 'long_text', 'email', 'phone', 'date', 'site', 'number', 'money', 'dropdown', 'multiple_choice', 'rating', 'checkbox', 'terms', 'cpf', 'cnpj', 'address', 'statement'] as const
export type TipoPergunta = typeof TIPOS_PERGUNTA[number]
export const CATALOGO_PERGUNTAS: { tipo: TipoPergunta; nome: string }[] = [
  { tipo: 'text', nome: 'Resposta curta' }, { tipo: 'name', nome: 'Nome próprio' }, { tipo: 'email', nome: 'E-mail' }, { tipo: 'long_text', nome: 'Texto longo' }, { tipo: 'phone', nome: 'Telefone' }, { tipo: 'date', nome: 'Data' }, { tipo: 'site', nome: 'Link' }, { tipo: 'cpf', nome: 'CPF' }, { tipo: 'cnpj', nome: 'CNPJ' }, { tipo: 'number', nome: 'Número' }, { tipo: 'money', nome: 'Valor monetário' }, { tipo: 'address', nome: 'Endereço' }, { tipo: 'multiple_choice', nome: 'Múltipla escolha' }, { tipo: 'dropdown', nome: 'Seleção de lista' }, { tipo: 'rating', nome: 'Escala de satisfação' }, { tipo: 'checkbox', nome: 'Sim / não' }, { tipo: 'terms', nome: 'Termos de uso' }, { tipo: 'statement', nome: 'Mensagem' },
]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const uuid = z.string().regex(UUID, 'A chave do campo é inválida. Retire esse campo e adicione-o novamente.')
const chave = z.union([z.literal('title'), z.literal('description'), uuid, z.string().regex(/^q_[a-zA-Z0-9-]{8,60}$/)])
const url = z.string().trim().max(2000).refine((v) => !v || /^https:\/\//i.test(v), 'Use um endereço HTTPS.')
const cor = z.string().regex(/^#[0-9a-f]{6}$/i)
const ConfigSchema = z.object({
  modo: z.enum(['conversa', 'pagina']).default('pagina'),
  corBotao: cor.default('#111113'), corTexto: cor.default('#18181b'), corResposta: cor.default('#1d6fe0'), corFundo: cor.default('#ffffff'),
  logo: url.default(''), imagemFundo: url.default(''), fonte: z.enum(['sistema', 'serif', 'mono']).default('sistema'), bordas: z.number().int().min(0).max(28).default(12),
  boasVindas: z.boolean().default(false), tituloBoasVindas: z.string().max(200).default('Vamos começar?'), textoBoasVindas: z.string().max(2000).default(''), botaoInicio: z.string().trim().min(1).max(50).default('Começar'),
  tituloFinal: z.string().trim().min(1).max(200).default('Recebemos o seu pedido'), textoFinal: z.string().max(2000).default('Suas respostas foram registradas. Obrigado!'), botaoFinal: z.string().max(50).default(''), linkFinal: url.default(''), mostrarPontuacao: z.boolean().default(false),
  textoEnvio: z.string().trim().min(1).max(50).default('Enviar respostas'), duplicadoPor: z.string().max(80).default(''), capturarUtm: z.boolean().default(true),
})
export type ConfigFormulario = z.infer<typeof ConfigSchema>
export function configuracaoFormulario(valor?: unknown): ConfigFormulario { return ConfigSchema.parse(valor ?? {}) }
export const PerguntaSchema = z.object({
  key: chave, label: z.string().trim().min(1, 'Preencha o nome de cada campo.').max(120, 'O nome de cada campo deve ter até 120 caracteres.'), required: z.boolean(),
  tipo: z.enum(TIPOS_PERGUNTA).optional(), descricao: z.string().max(2000).optional(), placeholder: z.string().max(200).optional(),
  opcoes: z.array(z.string().trim().min(1).max(200)).max(100).optional(), multipla: z.boolean().optional(),
  minimo: z.number().finite().optional(), maximo: z.number().finite().optional(), limite: z.number().int().min(1).max(20000).optional(),
  imagem: url.optional(), pontos: z.record(z.string(), z.number().int().min(-10000).max(10000)).optional(),
  condicao: z.object({ campo: chave, operador: z.enum(['igual', 'diferente', 'contem', 'preenchido']), valor: z.string().max(200).default('') }).optional(),
})
export type CampoFormulario = z.infer<typeof PerguntaSchema>
export const CamposFormulario = z.array(PerguntaSchema).min(1, 'Selecione os campos do formulário.').max(40, 'O formulário aceita até 40 campos.').superRefine((campos, ctx) => {
  if (!campos.some((c) => c.key === 'title')) ctx.addIssue({ code: 'custom', message: 'O formulário precisa pedir o título.' })
  if (new Set(campos.map((c) => c.key)).size !== campos.length) ctx.addIssue({ code: 'custom', message: 'Há campos repetidos no formulário.' })
  campos.forEach((c, i) => {
    if (c.key === 'title' && (c.condicao || (c.tipo && !['text', 'name'].includes(c.tipo)))) ctx.addIssue({ code: 'custom', message: 'O título precisa ser uma pergunta de texto sempre visível.' })
    if (c.condicao && !campos.slice(0, i).some((a) => a.key === c.condicao?.campo)) ctx.addIssue({ code: 'custom', message: 'A condição deve usar uma pergunta anterior.' })
    if (c.key.startsWith('q_') && ['dropdown', 'multiple_choice'].includes(c.tipo ?? '') && !c.opcoes?.length) ctx.addIssue({ code: 'custom', message: `Adicione opções em: ${c.label}.` })
    if (c.opcoes && new Set(c.opcoes).size !== c.opcoes.length) ctx.addIssue({ code: 'custom', message: `Há opções repetidas em: ${c.label}.` })
    if (c.tipo === 'rating' && ((c.minimo !== undefined && c.minimo !== 1) || (c.maximo !== undefined && (!Number.isInteger(c.maximo) || c.maximo < 2 || c.maximo > 10)))) ctx.addIssue({ code: 'custom', message: 'A escala começa em 1 e termina entre 2 e 10.' })
    if (c.minimo !== undefined && c.maximo !== undefined && c.minimo > c.maximo) ctx.addIssue({ code: 'custom', message: `O mínimo deve ser menor que o máximo em: ${c.label}.` })
  })
}).transform((campos) => campos.map((c) => ({ ...c, required: c.key === 'title' || (c.tipo !== 'statement' && c.required) })))
export const EntradaFormularioSchema = z.object({
  listaId: z.string().regex(UUID, 'Escolha a lista de destino em Opções para receber as tarefas.'),
  clienteId: z.string().regex(UUID, 'Escolha um cliente válido em Opções ou use o cliente padrão da lista.').nullable(),
  responsavelId: z.string().regex(UUID, 'Escolha o responsável pelas tarefas em Opções.'),
  nome: z.string().trim().min(1, 'Informe o nome do formulário.').max(120, 'O nome deve ter até 120 caracteres.'), descricao: z.string().trim(),
  landing: z.string().refine((v) => LANDINGS_COM_FORMULARIO.some((l) => l.slug === v), 'Landing page inválida.').nullable(),
  campos: CamposFormulario, configuracao: ConfigSchema.optional(),
})
export type EntradaFormulario = Omit<z.input<typeof EntradaFormularioSchema>, 'campos'> & { campos: CampoFormulario[] }
export const TIPOS_NO_FORMULARIO: ReadonlySet<TipoCampoPersonalizado> = new Set(['text', 'long_text', 'number', 'money', 'date', 'dropdown', 'checkbox', 'email', 'phone', 'site', 'rating'])
export function camposOferecidos(personalizados: DefinicaoCampo[]): CampoFormulario[] {
  return [{ key: 'title', label: 'Título', required: true, tipo: 'text' }, { key: 'description', label: 'Descrição', required: false, tipo: 'long_text' }, ...personalizados.filter((c) => TIPOS_NO_FORMULARIO.has(c.tipo)).map((c) => ({ key: c.id, label: c.nome, required: false, tipo: c.tipo as TipoPergunta, opcoes: c.configuracao.options ?? [] }))]
}
export type ValorResposta = string | number | boolean | string[]
export type RespostasFormulario = Record<string, ValorResposta>
export function perguntasVisiveis(campos: CampoFormulario[], respostas: RespostasFormulario): CampoFormulario[] {
  const vistas = new Set<string>()
  return campos.filter((c) => {
    const regra = c.condicao
    if (regra) {
      if (!vistas.has(regra.campo)) return false
      const bruto = respostas[regra.campo]
      const valores = Array.isArray(bruto) ? bruto : [String(bruto ?? '')]
      const igual = valores.includes(regra.valor)
      if (!(regra.operador === 'igual' ? igual : regra.operador === 'diferente' ? !igual : regra.operador === 'contem' ? valores.some((v) => v.includes(regra.valor)) : valores.some((v) => v.trim() !== ''))) return false
    }
    vistas.add(c.key)
    return true
  })
}
export function validarResposta(c: CampoFormulario, valor: ValorResposta | undefined): string | null {
  if (c.tipo === 'statement') return null
  const vazio = valor === undefined || valor === '' || (Array.isArray(valor) && !valor.length)
  if (c.required && (vazio || (c.tipo === 'terms' && valor !== true))) return `Preencha: ${c.label}.`
  if (vazio) return null
  const texto = String(valor)
  if (['number', 'money', 'rating'].includes(c.tipo ?? '')) {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) return `Informe um número em: ${c.label}.`
    const min = c.minimo ?? (c.tipo === 'rating' ? 1 : undefined), max = c.maximo ?? (c.tipo === 'rating' ? 5 : undefined)
    if ((min !== undefined && valor < min) || (max !== undefined && valor > max)) return `Valor fora dos limites em: ${c.label}.`
  }
  if (c.tipo === 'email' && !z.email().safeParse(texto).success) return `E-mail inválido em: ${c.label}.`
  if (c.tipo === 'site' && !/^https?:\/\//i.test(texto)) return `Use um link com http:// ou https:// em: ${c.label}.`
  if (c.tipo === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(texto) || Number.isNaN(Date.parse(texto)) || (!Number.isNaN(Date.parse(texto)) && new Date(texto).toISOString().slice(0, 10) !== texto))) return `Data inválida em: ${c.label}.`
  if (c.tipo === 'cpf' && !documentoValido(texto, 'cpf')) return `CPF inválido em: ${c.label}.`
  if (c.tipo === 'cnpj' && !documentoValido(texto, 'cnpj')) return `CNPJ inválido em: ${c.label}.`
  if (['dropdown', 'multiple_choice'].includes(c.tipo ?? '') && c.opcoes?.length && (Array.isArray(valor) ? valor : [texto]).some((v) => !c.opcoes?.includes(v))) return `Escolha uma opção válida em: ${c.label}.`
  if (texto.length > (c.key === 'title' ? 200 : c.limite ?? 20000)) return `Resposta muito longa em: ${c.label}.`
  return null
}
function documentoValido(valor: string, tipo: 'cpf' | 'cnpj'): boolean {
  const n = valor.replace(/\D/g, '')
  if (n.length !== (tipo === 'cpf' ? 11 : 14) || /^(\d)\1+$/.test(n)) return false
  const digito = (base: string, pesos: number[]) => { const resto = base.split('').reduce((s, d, i) => s + Number(d) * pesos[i], 0) % 11; return resto < 2 ? 0 : 11 - resto }
  if (tipo === 'cpf') return Number(n[9]) === digito(n.slice(0, 9), [10,9,8,7,6,5,4,3,2]) && Number(n[10]) === digito(n.slice(0, 10), [11,10,9,8,7,6,5,4,3,2])
  return Number(n[12]) === digito(n.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]) && Number(n[13]) === digito(n.slice(0, 13), [6,5,4,3,2,9,8,7,6,5,4,3,2])
}
export function pontuacaoFormulario(campos: CampoFormulario[], respostas: RespostasFormulario): number {
  return perguntasVisiveis(campos, respostas).reduce((s, c) => s + (c.tipo === 'rating' ? Number(respostas[c.key] ?? 0) : (Array.isArray(respostas[c.key]) ? respostas[c.key] as string[] : [String(respostas[c.key] ?? '')]).reduce((n, v) => n + (c.pontos?.[v] ?? 0), 0)), 0)
}
/** Compatibilidade com formulários e integrações anteriores. */
export function respostasDoForm(campos: CampoFormulario[], tipos: Record<string, TipoCampoPersonalizado | undefined>, lerValor: (chave: string) => string | null): Record<string, string | number | boolean> {
  const saida: Record<string, string | number | boolean> = {}
  for (const { key } of campos) {
    const bruto = lerValor(key), tipo = tipos[key]
    if (tipo === 'checkbox') { saida[key] = bruto === 'on'; continue }
    const texto = (bruto ?? '').trim()
    if (!texto) continue
    if (tipo === 'number' || tipo === 'money' || tipo === 'rating') { const n = Number(texto.replace(',', '.')); if (Number.isFinite(n)) saida[key] = n } else saida[key] = texto
  }
  return saida
}
export function valorCsv(valor: unknown): string {
  const texto = Array.isArray(valor) ? valor.join(', ') : String(valor ?? '')
  return `"${(/^[\s]*[=+\-@\t\r]/.test(texto) ? "'" : '') + texto.replaceAll('"', '""')}"`
}
