import { describe, expect, it } from 'vitest'
import { contaDoEvento, formaDe, lerFormularioKommo } from '@/dominio/kommo'

describe('webhook do Kommo', () => {
  it('formulário aninhado vira objeto, com listas pelos índices', () => {
    const r = lerFormularioKommo('account%5Bsubdomain%5D=aurum&account%5Bid%5D=77&leads%5Bstatus%5D%5B0%5D%5Bid%5D=111&leads%5Bstatus%5D%5B0%5D%5Bstatus_id%5D=142&leads%5Bstatus%5D%5B0%5D%5Bpipeline_id%5D=9&leads%5Bstatus%5D%5B1%5D%5Bid%5D=222')
    expect(r).toEqual({ account: { subdomain: 'aurum', id: '77' }, leads: { status: [{ id: '111', status_id: '142', pipeline_id: '9' }, { id: '222' }] } })
    expect(contaDoEvento(r)).toBe('aurum')
    expect(contaDoEvento({})).toBe('')
  })

  it('corpo vazio ou sem estrutura não quebra', () => {
    expect(lerFormularioKommo('')).toEqual({})
    expect(lerFormularioKommo('a=1&b=2')).toEqual({ a: '1', b: '2' })
  })

  it('formaDe mostra só chaves e tipos, nunca valores de clientes', () => {
    const forma = formaDe({ id: 1, name: 'Maria Silva', price: 1250, custom_fields_values: [{ field_name: 'Telefone', values: [{ value: '5591999999999' }] }], loss_reason: null })
    expect(JSON.stringify(forma)).not.toMatch(/Maria|5591999999999|1250/)
    expect(forma).toMatchObject({ id: 'number', name: 'string', price: 'number', loss_reason: 'null' })
  })
})
