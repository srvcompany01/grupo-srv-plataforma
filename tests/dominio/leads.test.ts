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

import { LANDINGS } from '@/dominio/landings'
import { rotaPublica } from '@/dominio/acesso'

describe('landing pages no app', () => {
  it('toda landing responde sem login, com seus arquivos e a API de leads', () => {
    for (const slug of LANDINGS) {
      expect(rotaPublica(`/${slug}`), slug).toBe(true)
      expect(rotaPublica(`/lp/${slug}/index.html`), slug).toBe(true)
    }
    expect(rotaPublica('/api/leads')).toBe(true)
    expect(rotaPublica('/inicio')).toBe(false)
  })
})
