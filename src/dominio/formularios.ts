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

/** Aceita DDI explícito ou um número brasileiro com DDD. O link usa apenas os dígitos. */
export function numeroWhatsappFormulario(valor: string): string | null {
  const texto = valor.trim()
  if (!texto || !/^\+?[\d\s().-]+$/.test(texto)) return null
  const internacional = texto.startsWith('+') || texto.startsWith('00')
  let numero = texto.replace(/\D/g, '')
  if (texto.startsWith('00')) numero = numero.slice(2)
  if (/^(\d)\1+$/.test(numero)) return null
  if (!internacional && (numero.length === 10 || numero.length === 11)) {
    if (!/^[1-9]{2}[2-9]\d{7,8}$/.test(numero)) return null
    numero = `55${numero}`
  }
  if (numero.startsWith('55') && !/^55[1-9]{2}[2-9]\d{7,8}$/.test(numero)) return null
  return /^[1-9]\d{9,14}$/.test(numero) && !/^(\d)\1+$/.test(numero) ? numero : null
}

export const ConfigFormularioSchema = z.object({
  usarDominioBiolytics: z.boolean().default(false).describe('Usa o endereço Biolytics do cliente selecionado; requer cliente com página da bio.'),
  modo: z.enum(['conversa', 'pagina']).default('pagina'),
  corBotao: cor.default('#111113'), corTexto: cor.default('#18181b'), corResposta: cor.default('#1d6fe0'), corFundo: cor.default('#ffffff'),
  logo: url.default(''), imagemFundo: url.default(''), fonte: z.enum(['sistema', 'serif', 'mono']).default('sistema'), bordas: z.number().int().min(0).max(28).default(12),
  boasVindas: z.boolean().default(false), tituloBoasVindas: z.string().max(200).default('Vamos começar?'), textoBoasVindas: z.string().max(2000).default(''), botaoInicio: z.string().trim().min(1).max(50).default('Começar'),
  tituloFinal: z.string().trim().min(1).max(200).default('Recebemos o seu pedido'), textoFinal: z.string().max(2000).default('Suas respostas foram registradas. Obrigado!'), botaoFinal: z.string().max(50).default(''), linkFinal: url.default(''), mostrarPontuacao: z.boolean().default(false),
  destinoFinal: z.enum(['link', 'whatsapp']).default('link').describe('whatsapp abre o número cadastrado com um resumo completo das respostas, depois de salvar o envio.'),
  whatsappFinal: z.string().trim().max(40, 'O número de WhatsApp está muito longo.').default('').describe('Número do botão final com DDI ou DDD brasileiro.'),
  protocoloFinal: z.string().trim().max(120, 'O protocolo deve ter até 120 caracteres.').refine((v) => !/[\r\n]/.test(v), 'Informe o protocolo em uma única linha.').default('').describe('Texto opcional no rodapé da mensagem, por exemplo Meta Ads.'),
  textoEnvio: z.string().trim().min(1).max(50).default('Enviar respostas'), duplicadoPor: z.string().max(80).default(''), capturarUtm: z.boolean().default(true),
}).superRefine((c, ctx) => {
  if (c.destinoFinal === 'whatsapp' && !numeroWhatsappFormulario(c.whatsappFinal)) ctx.addIssue({ code: 'custom', path: ['whatsappFinal'], message: 'Informe um WhatsApp válido com DDD (Brasil) ou DDI, por exemplo +55 (91) 99999-9999.' })
})
export type ConfigFormulario = z.infer<typeof ConfigFormularioSchema>
export function configuracaoFormulario(valor?: unknown): ConfigFormulario { return ConfigFormularioSchema.parse(valor ?? {}) }

/** A base vem do cadastro do cliente, nunca de um domínio digitado no formulário. */
export function urlFormularioBiolytics(token: string, urlBiolytics: string | null | undefined): string | null {
  return token && urlBiolytics ? `${urlBiolytics.replace(/\/$/, '')}/f/${encodeURIComponent(token)}` : null
}
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
  campos: CamposFormulario, configuracao: ConfigFormularioSchema.optional(),
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

export type MensagemWhatsappFormulario = { numero: string; mensagem: string }
const textoDaMensagem = (v: string) => v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim()
const tituloDaMensagem = (v: string) => textoDaMensagem(v).replace(/[*_~`]/g, '').replace(/\s+/g, ' ')

function respostaParaWhatsapp(c: CampoFormulario, valor: ValorResposta | undefined): string {
  if (valor === undefined || valor === '' || (Array.isArray(valor) && !valor.length)) return 'Não informado'
  if (Array.isArray(valor)) return valor.map((v) => `• ${textoDaMensagem(v)}`).join('\n')
  if (typeof valor === 'boolean') return c.tipo === 'terms' ? valor ? 'Aceito' : 'Não aceito' : valor ? 'Sim' : 'Não'
  if (typeof valor === 'number') return c.tipo === 'money' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 20 }).format(valor)
  if (c.tipo === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor.split('-').reverse().join('/')
  return textoDaMensagem(valor)
}

/** Perguntas na ordem do formulário; condições ocultas e textos sem resposta não entram. Não corta respostas. */
export function whatsappDoFormulario(nome: string, campos: CampoFormulario[], respostas: RespostasFormulario, config: ConfigFormulario, origem: Record<string, string> = {}): MensagemWhatsappFormulario | null {
  const numero = numeroWhatsappFormulario(config.whatsappFinal)
  if (config.destinoFinal !== 'whatsapp' || !numero) return null
  const blocos = [`*${tituloDaMensagem(nome)}*`, 'Respostas do formulário']
  for (const c of perguntasVisiveis(campos, respostas)) {
    if (c.tipo !== 'statement') blocos.push(`*${tituloDaMensagem(c.label)}*\n${respostaParaWhatsapp(c, respostas[c.key])}`)
  }
  if (config.mostrarPontuacao) blocos.push(`*Pontuação:* ${pontuacaoFormulario(campos, respostas)}`)
  if (config.capturarUtm) {
    const rotulos = { utm_source: 'Origem', utm_medium: 'Meio', utm_campaign: 'Campanha', utm_term: 'Termo', utm_content: 'Conteúdo', gclid: 'GCLID', fbclid: 'FBCLID' }
    const linhas = Object.entries(rotulos).flatMap(([chave, rotulo]) => origem[chave] ? [`${rotulo}: ${textoDaMensagem(origem[chave])}`] : [])
    if (linhas.length) blocos.push(`*Origem do contato*\n${linhas.join('\n')}`)
  }
  if (config.protocoloFinal) blocos.push(`───────────────\n*Protocolo:* ${tituloDaMensagem(config.protocoloFinal)}`)
  return { numero, mensagem: blocos.join('\n\n') }
}

export function destinoWhatsappFormulario({ numero, mensagem }: MensagemWhatsappFormulario): { url: string; copiarAntes: boolean } {
  const base = `https://wa.me/${numero}`
  const url = `${base}?text=${encodeURIComponent(mensagem)}`
  // Evita depender de links enormes em navegadores e apps: a mensagem completa continua disponível para copiar.
  return url.length <= 8000 ? { url, copiarAntes: false } : { url: base, copiarAntes: true }
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
