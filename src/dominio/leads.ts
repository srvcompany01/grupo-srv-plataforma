import * as z from 'zod'

const texto = (max: number) => z.string().trim().max(max)
const opcional = (max: number) => texto(max).optional()

/** O que a landing manda (a página é só um navegador: tudo é conferido de novo aqui). Campos extras são aceitos e guardados. */
export const PayloadLead = z.looseObject({
  id: z.string().uuid(),
  submittedAt: opcional(40),
  source: texto(80).min(1),
  contact: z.looseObject({ fullName: texto(120).min(2), phone: texto(30).min(8), email: z.string().trim().toLowerCase().email().max(160), role: opcional(120) }),
  company: z.looseObject({
    name: texto(160).min(1),
    websiteOrInstagram: opcional(200),
    cityState: opcional(120),
    monthlyRevenue: opcional(120),
    employees: opcional(120),
    marketingInvestment: opcional(120),
    opportunityCapacity: opcional(120),
    decisionRole: opcional(120),
    context: opcional(2000),
  }),
  diagnosis: z
    .looseObject({
      completed: z.boolean().optional(),
      answers: z.array(z.looseObject({ questionId: texto(60), optionId: texto(60), label: opcional(400) })).max(40).optional(),
      overallScore: z.number().optional(),
      priorityVertex: opcional(80),
      priorityGear: opcional(80),
      primaryPain: opcional(200),
      urgency: opcional(120),
      generatedSummary: opcional(3000),
    })
    .optional(),
  attribution: z.record(z.string(), z.unknown()).optional(),
  consent: z.looseObject({ accepted: z.literal(true), acceptedAt: opcional(40), privacyPolicyVersion: opcional(40) }),
})
export type PayloadLead = z.infer<typeof PayloadLead>

/** Corpo do POST. `website` é um campo escondido (isca para robôs): preenchido = é robô. */
export const PedidoLead = z.object({ payload: PayloadLead, website: z.string().optional() })

const linha = (rotulo: string, valor: unknown) => (valor === undefined || valor === null || valor === '' ? null : `${rotulo}: ${String(valor)}`)

/** Título e descrição (texto simples, uma linha por item) da tarefa que representa o lead na plataforma. */
export function resumirLead(p: PayloadLead): { titulo: string; descricao: string } {
  const d = p.diagnosis
  const atribuicao = Object.entries(p.attribution ?? {}).filter(([, v]) => typeof v === 'string' && v).map(([k, v]) => `${k}=${v}`).join(' · ')
  const respostas = (d?.answers ?? []).map((a) => `${a.questionId}: ${a.label ?? a.optionId}`)
  const bloco = (titulo: string, itens: (string | null)[]) => [titulo, ...itens.filter((x): x is string => !!x)].join('\n')
  const partes = [
    bloco('Contato', [linha('Nome', p.contact.fullName), linha('Telefone', p.contact.phone), linha('E-mail', p.contact.email), linha('Cargo', p.contact.role)]),
    bloco('Empresa', [
      linha('Empresa', p.company.name), linha('Site/Instagram', p.company.websiteOrInstagram), linha('Cidade/UF', p.company.cityState),
      linha('Faturamento mensal', p.company.monthlyRevenue), linha('Funcionários', p.company.employees), linha('Investimento em marketing', p.company.marketingInvestment),
      linha('Capacidade de atender oportunidades', p.company.opportunityCapacity), linha('Papel na decisão', p.company.decisionRole), linha('Contexto', p.company.context),
    ]),
    d?.completed
      ? bloco('Pré-diagnóstico', [linha('Pontuação geral', d.overallScore), linha('Vértice prioritário', d.priorityVertex), linha('Engrenagem prioritária', d.priorityGear), linha('Dor principal', d.primaryPain), linha('Urgência', d.urgency), linha('Resumo', d.generatedSummary), ...respostas])
      : 'Pré-diagnóstico: não concluído',
    bloco('Origem', [linha('Página', p.source), linha('Parâmetros', atribuicao), linha('Enviado em', p.submittedAt)]),
  ]
  return { titulo: `[Lead] ${p.company.name} — ${p.contact.fullName}`.slice(0, 200), descricao: partes.join('\n\n').slice(0, 20000) }
}
