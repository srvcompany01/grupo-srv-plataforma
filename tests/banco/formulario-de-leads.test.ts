import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PedidoLead } from '@/dominio/leads'
import { montarRespostas } from '@/dominio/leads-campos'
import { criarBanco } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

const sqlDaMigration = readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261019000036_formulario_de_leads.sql'), 'utf8')

const lead = () =>
  PedidoLead.parse({
    payload: {
      id: '11111111-1111-4111-8111-111111111111',
      submittedAt: '2026-10-19T12:00:00.000Z',
      source: 'landing_page_maquina_de_vendas',
      contact: { fullName: 'Fabrício Saraiva', phone: '91999999999', email: 'fabricio@empresa.com.br', role: 'Fundador' },
      company: { name: 'Grupo SRV', cityState: 'Belém, PA', monthlyRevenue: 'De R$100 mil a R$299 mil', employees: 'De 5 a 8', decisionRole: 'Sou o decisor' },
      diagnosis: { completed: true, answers: [], overallScore: 61, priorityVertex: 'Demanda', primaryPain: 'Leads frios', urgency: 'Alta', generatedSummary: 'Organize a jornada.' },
      attribution: { utmSource: 'instagram' },
      consent: { accepted: true },
    },
  }).payload

describe('formulário de leads da CRM (migration 36)', () => {
  it('cria os campos na lista CRM, o formulário ligado à landing, e não duplica ao rodar de novo', async () => {
    const db = await criarBanco()
    const campos = async () => (await db.query<{ n: number }>(`select count(*)::int as n from list_custom_fields lf join lists l on l.id = lf.list_id where l.slug = 'crm'`)).rows[0].n
    expect(await campos()).toBe(26)
    // Sem administrador ainda, o formulário não é criado (precisa de um responsável).
    expect((await db.query(`select 1 from forms where landing = 'maquinadevendas'`)).rows).toHaveLength(0)

    await criarUsuario(db, { role: 'admin' })
    await db.exec(sqlDaMigration)
    await db.exec(sqlDaMigration)
    expect(await campos()).toBe(26)
    const forms = (await db.query<{ token: string; fields: unknown[]; name: string }>(`select token, fields, name from forms where landing = 'maquinadevendas'`)).rows
    expect(forms).toHaveLength(1)
    expect(forms[0].token).toMatch(/^[A-Za-z0-9]{32}$/)
    expect(forms[0].fields).toHaveLength(28) // título + descrição + 26 campos
  })

  it('o lead vira tarefa na lista CRM com os campos preenchidos pelo nome', async () => {
    const db = await criarBanco()
    await criarUsuario(db, { role: 'admin' })
    await db.exec(sqlDaMigration)
    const { token, fields } = (await db.query<{ token: string; fields: { key: string; label: string; required: boolean }[] }>(`select token, fields from forms where landing = 'maquinadevendas'`)).rows[0]
    const defs = (await db.query<{ id: string; type: string; config: { options?: string[] } }>(`select id, type, config from custom_fields`)).rows
    const porId = new Map(defs.map((d) => [d.id, d]))
    const campos = fields.map((c) => ({ ...c, tipo: porId.get(c.key)?.type ?? null, opcoes: porId.get(c.key)?.config.options ?? [] }))

    const respostas = montarRespostas(lead(), campos)
    const { rows } = await db.query<{ id: string }>(`select enviar_formulario($1, $2::jsonb) as id`, [token, JSON.stringify(respostas)])
    const valores = (await db.query<{ nome: string; valor: unknown }>(
      `select f.name as nome, v.value as valor from task_custom_field_values v join custom_fields f on f.id = v.field_id where v.task_id = $1`, [rows[0].id],
    )).rows
    const por = Object.fromEntries(valores.map((v) => [v.nome, v.valor]))
    expect(por['Telefone']).toBe('91999999999')
    expect(por['Empresa']).toBe('Grupo SRV')
    expect(por['Faturamento mensal']).toBe('De R$100 mil a R$299 mil')
    expect(por['Funcionários']).toBe('De 5 a 8')
    expect(por['Pontuação']).toBe(61)
    expect(por['Diagnóstico concluído']).toBe(true)
    expect(por['Origem']).toBe('instagram')
    expect(por['Data do lead']).toBe('2026-10-19')
    const tarefa = (await db.query<{ title: string; slug: string }>(`select t.title, l.slug from tasks t join lists l on l.id = t.list_id where t.id = $1`, [rows[0].id])).rows[0]
    expect(tarefa).toEqual({ title: '[Lead] Grupo SRV — Fabrício Saraiva', slug: 'crm' })
  })

  it('uma landing só tem um formulário ativo', async () => {
    const db = await criarBanco()
    await criarUsuario(db, { role: 'admin' })
    await db.exec(sqlDaMigration)
    await expect(db.exec(`insert into forms (list_id, assignee_id, name, token, landing) select list_id, assignee_id, 'outro', replace(gen_random_uuid()::text, '-', ''), landing from forms limit 1`)).rejects.toThrow()
  })
})
