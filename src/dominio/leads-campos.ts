import type { Json } from '@/infra/supabase/tipos'
import { textoParaValor } from './faixa-celulas'
import type { PayloadLead } from './leads'
import { resumirLead } from './leads'
import type { DefinicaoCampo } from './personalizacao'

/** "Faturamento mensal" ≈ "faturamento mensal ": sem acento, maiúscula, pontuação e espaços sobrando. */
export const normalizarRotulo = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

type Extrator = (p: PayloadLead) => unknown
const atr = (p: PayloadLead, ...chaves: string[]) => chaves.map((k) => (p.attribution as Record<string, unknown> | undefined)?.[k]).find((v) => typeof v === 'string' && v)

/**
 * O que cada campo do formulário recebe, pelo NOME do campo no formulário (sem acento, maiúscula ou pontuação).
 * Crie na lista (CRM & Vendas) campos com estes nomes e coloque-os no formulário: o lead já chega preenchido.
 * Nomes que não estão aqui ficam vazios para você preencher depois.
 */
export const CAMPOS_RECONHECIDOS: { nome: string; apelidos: string[]; tipo: string; valor: Extrator }[] = [
  { nome: 'Nome', apelidos: ['nome completo', 'contato', 'lead'], tipo: 'Texto', valor: (p) => p.contact.fullName },
  { nome: 'Telefone', apelidos: ['whatsapp', 'celular', 'telefone whatsapp'], tipo: 'Telefone ou texto', valor: (p) => p.contact.phone },
  { nome: 'E-mail', apelidos: ['email'], tipo: 'E-mail ou texto', valor: (p) => p.contact.email },
  { nome: 'Cargo', apelidos: ['funcao'], tipo: 'Texto', valor: (p) => p.contact.role },
  { nome: 'Empresa', apelidos: ['nome da empresa'], tipo: 'Texto', valor: (p) => p.company.name },
  { nome: 'Site ou Instagram', apelidos: ['site', 'instagram'], tipo: 'Texto', valor: (p) => p.company.websiteOrInstagram },
  { nome: 'Cidade/UF', apelidos: ['cidade', 'cidade e estado', 'cidade uf'], tipo: 'Texto', valor: (p) => p.company.cityState },
  { nome: 'Faturamento mensal', apelidos: ['faturamento'], tipo: 'Texto ou lista com as mesmas opções da página', valor: (p) => p.company.monthlyRevenue },
  { nome: 'Funcionários', apelidos: ['numero de funcionarios', 'equipe', 'tamanho da equipe'], tipo: 'Texto ou lista', valor: (p) => p.company.employees },
  { nome: 'Investimento em marketing', apelidos: ['investimento'], tipo: 'Texto ou lista', valor: (p) => p.company.marketingInvestment },
  { nome: 'Capacidade de atender', apelidos: ['capacidade', 'capacidade de oportunidades', 'capacidade de atendimento'], tipo: 'Texto ou lista', valor: (p) => p.company.opportunityCapacity },
  { nome: 'Papel na decisão', apelidos: ['decisor', 'poder de decisao'], tipo: 'Texto ou lista', valor: (p) => p.company.decisionRole },
  { nome: 'Contexto', apelidos: ['observacoes', 'mensagem'], tipo: 'Texto longo', valor: (p) => p.company.context },
  { nome: 'Pontuação', apelidos: ['pontuacao geral', 'score', 'nota do diagnostico'], tipo: 'Número', valor: (p) => p.diagnosis?.overallScore },
  { nome: 'Vértice prioritário', apelidos: ['vertice', 'vertice prioritario'], tipo: 'Texto ou lista', valor: (p) => p.diagnosis?.priorityVertex },
  { nome: 'Engrenagem prioritária', apelidos: ['engrenagem'], tipo: 'Texto ou lista', valor: (p) => p.diagnosis?.priorityGear },
  { nome: 'Dor principal', apelidos: ['dor'], tipo: 'Texto ou lista', valor: (p) => p.diagnosis?.primaryPain },
  { nome: 'Urgência', apelidos: [], tipo: 'Texto ou lista', valor: (p) => p.diagnosis?.urgency },
  { nome: 'Resumo do diagnóstico', apelidos: ['diagnostico', 'resumo'], tipo: 'Texto longo', valor: (p) => p.diagnosis?.generatedSummary },
  { nome: 'Diagnóstico concluído', apelidos: ['fez o diagnostico'], tipo: 'Caixa de marcar', valor: (p) => (p.diagnosis?.completed ? 'sim' : 'não') },
  { nome: 'Origem', apelidos: ['utm source', 'fonte', 'origem utm'], tipo: 'Texto', valor: (p) => atr(p, 'utmSource') },
  { nome: 'Meio', apelidos: ['utm medium'], tipo: 'Texto', valor: (p) => atr(p, 'utmMedium') },
  { nome: 'Campanha', apelidos: ['utm campaign'], tipo: 'Texto', valor: (p) => atr(p, 'utmCampaign') },
  { nome: 'Anúncio', apelidos: ['utm content', 'conteudo do anuncio'], tipo: 'Texto', valor: (p) => atr(p, 'utmContent') },
  { nome: 'Página', apelidos: ['landing', 'landing page'], tipo: 'Texto', valor: (p) => p.source },
  { nome: 'Data do lead', apelidos: ['data de entrada', 'data'], tipo: 'Data', valor: (p) => p.submittedAt?.slice(0, 10) },
]

const POR_NOME = new Map(CAMPOS_RECONHECIDOS.flatMap((c) => [c.nome, ...c.apelidos].map((n) => [normalizarRotulo(n), c] as const)))

type CampoDoFormulario = { key: string; label: string; required?: boolean; tipo: string | null; opcoes: string[] }

const TIPOS_DE_TEXTO = new Set(['text', 'long_text', 'email', 'phone', 'site', 'instagram', 'tiktok', 'location'])

/**
 * Só título e descrição (o resumo completo). Campo de texto obrigatório no formulário recebe "—", senão o banco recusa o envio
 * quando o lead não tem aquele dado (ex.: site em branco).
 */
export function respostasBasicas(p: PayloadLead, campos: CampoDoFormulario[]): Record<string, Json> {
  const { titulo, descricao } = resumirLead(p)
  const respostas: Record<string, Json> = { title: titulo, description: descricao }
  for (const c of campos) if (c.required && c.tipo && TIPOS_DE_TEXTO.has(c.tipo)) respostas[c.key] = '—'
  return respostas
}

/**
 * Respostas para `enviar_formulario`: título e descrição (resumo completo, sempre) e, para cada campo do formulário cujo nome é
 * reconhecido, o valor do lead já no formato do campo. Valor que o campo não aceita (ex.: opção que não existe na lista) é
 * simplesmente pulado: a informação continua na descrição, e o lead nunca é perdido por causa de um campo.
 */
export function montarRespostas(p: PayloadLead, campos: CampoDoFormulario[]): Record<string, Json> {
  const respostas = respostasBasicas(p, campos)
  for (const c of campos) {
    if (c.key === 'title' || c.key === 'description' || !c.tipo) continue
    const reconhecido = POR_NOME.get(normalizarRotulo(c.label))
    const bruto = reconhecido?.valor(p)
    if (bruto === undefined || bruto === null || bruto === '') continue
    const def = { tipo: c.tipo, configuracao: { options: c.opcoes } } as unknown as DefinicaoCampo
    const r = textoParaValor(def, String(bruto), [])
    if (r.ok && r.valor !== null) respostas[c.key] = r.valor
  }
  return respostas
}
