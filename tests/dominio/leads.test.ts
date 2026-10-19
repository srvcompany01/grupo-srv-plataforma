import { describe, expect, it } from 'vitest'
import { PedidoLead, resumirLead } from '@/dominio/leads'

const payload = (extra: Record<string, unknown> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  submittedAt: '2026-10-19T12:00:00.000Z',
  source: 'landing_page_maquina_de_vendas',
  contact: { fullName: 'Fabrício Saraiva', phone: '91999999999', email: 'Fabricio@Empresa.com.br ', role: 'Fundador' },
  company: { name: 'Grupo SRV', cityState: 'Belém, PA', monthlyRevenue: 'De R$100 mil a R$299 mil' },
  diagnosis: { completed: true, answers: [{ questionId: 'offer', optionId: 'c', label: 'Oferta clara', value: 2 }], overallScore: 61, priorityVertex: 'Demanda', primaryPain: 'Leads frios', urgency: 'Alta' },
  attribution: { utmSource: 'instagram', utmCampaign: 'novembro' },
  consent: { accepted: true, acceptedAt: '2026-10-19T12:00:00.000Z', privacyPolicyVersion: '1.0' },
  ...extra,
})

describe('leads das landing pages', () => {
  it('aceita o envio da página, ajusta o e-mail e guarda campos extras', () => {
    const r = PedidoLead.safeParse({ payload: payload({ novo: 'campo' }), website: '' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.payload.contact.email).toBe('fabricio@empresa.com.br')
      expect((r.data.payload as Record<string, unknown>).novo).toBe('campo')
    }
  })

  it('recusa e-mail inválido, id que não é uuid, sem consentimento e texto gigante', () => {
    expect(PedidoLead.safeParse({ payload: payload({ contact: { fullName: 'Ana', phone: '91999999999', email: 'nao-e-email' } }) }).success).toBe(false)
    expect(PedidoLead.safeParse({ payload: payload({ id: 'abc' }) }).success).toBe(false)
    expect(PedidoLead.safeParse({ payload: payload({ consent: { accepted: false } }) }).success).toBe(false)
    expect(PedidoLead.safeParse({ payload: payload({ company: { name: 'x'.repeat(500) } }) }).success).toBe(false)
  })

  it('o resumo vira título e descrição legíveis para a tarefa', () => {
    const p = PedidoLead.parse({ payload: payload() }).payload
    const { titulo, descricao } = resumirLead(p)
    expect(titulo).toBe('[Lead] Grupo SRV — Fabrício Saraiva')
    expect(descricao).toContain('Telefone: 91999999999')
    expect(descricao).toContain('Pontuação geral: 61')
    expect(descricao).toContain('offer: Oferta clara')
    expect(descricao).toContain('utmSource=instagram')
  })
})

import { landingDoSource, SLUGS_DAS_LANDINGS } from '@/dominio/landings'
import { rotaPublica } from '@/dominio/acesso'

describe('landing pages no app', () => {
  it('toda landing responde sem login, com seus arquivos e a API de leads', () => {
    for (const slug of SLUGS_DAS_LANDINGS) {
      expect(rotaPublica(`/${slug}`), slug).toBe(true)
      expect(rotaPublica(`/lp/${slug}/index.html`), slug).toBe(true)
    }
    expect(rotaPublica('/api/leads')).toBe(true)
    expect(rotaPublica('/inicio')).toBe(false)
  })

  it('o source que a página manda aponta para a landing certa', () => {
    expect(landingDoSource('landing_page_maquina_de_vendas')).toBe('maquinadevendas')
    expect(landingDoSource('qualquer-outra-coisa')).toBeNull()
  })
})

import { CAMPOS_RECONHECIDOS, montarRespostas, normalizarRotulo, respostasBasicas } from '@/dominio/leads-campos'

describe('lead → campos do formulário (CRM & Vendas)', () => {
  const p = PedidoLead.parse({ payload: payload() }).payload
  const campo = (key: string, label: string, tipo: string | null, opcoes: string[] = [], required = false) => ({ key, label, tipo, opcoes, required })

  it('reconhece o campo pelo nome, sem acento nem maiúscula, e converte para o tipo do campo', () => {
    const r = montarRespostas(p, [
      campo('title', 'Título', null),
      campo('c1', 'TELEFONE', 'phone'),
      campo('c2', 'e-mail', 'email'),
      campo('c3', 'Pontuação', 'number'),
      campo('c4', 'Faturamento mensal', 'dropdown', ['Até R$50 mil', 'De R$100 mil a R$299 mil']),
      campo('c5', 'Data do lead', 'date'),
      campo('c6', 'Diagnóstico concluído', 'checkbox'),
      campo('c7', 'Origem', 'text'),
    ])
    expect(r.c1).toBe('91999999999')
    expect(r.c2).toBe('fabricio@empresa.com.br')
    expect(r.c3).toBe(61)
    expect(r.c4).toBe('De R$100 mil a R$299 mil')
    expect(r.c5).toBe('2026-10-19')
    expect(r.c6).toBe(true)
    expect(r.c7).toBe('instagram')
    expect(String(r.description)).toContain('Telefone: 91999999999')
  })

  it('valor que o campo não aceita (opção inexistente) é pulado e campos desconhecidos ficam vazios', () => {
    const r = montarRespostas(p, [campo('c4', 'Faturamento mensal', 'dropdown', ['Só estas', 'Opções']), campo('c9', 'Prioridade interna', 'text')])
    expect(r.c4).toBeUndefined()
    expect(r.c9).toBeUndefined()
    expect(r.title).toBe('[Lead] Grupo SRV — Fabrício Saraiva')
  })

  it('campo de texto obrigatório sem dado recebe "—" para o banco não recusar o lead', () => {
    const sem = { ...p, company: { ...p.company, websiteOrInstagram: undefined } }
    const r = respostasBasicas(sem, [campo('c8', 'Site ou Instagram', 'text', [], true), campo('c4', 'Faturamento', 'dropdown', ['x'], true)])
    expect(r.c8).toBe('—')
    expect(r.c4).toBeUndefined()
  })

  it('os nomes reconhecidos não se repetem entre campos diferentes', () => {
    const vistos = new Map<string, string>()
    for (const c of CAMPOS_RECONHECIDOS) for (const n of [c.nome, ...c.apelidos].map(normalizarRotulo)) {
      expect(vistos.get(n) ?? c.nome, n).toBe(c.nome)
      vistos.set(n, c.nome)
    }
  })
})
