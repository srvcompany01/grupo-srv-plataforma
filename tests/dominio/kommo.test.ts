import { describe, expect, it } from 'vitest'
import { classificacoesDasMensagens, contaDoEvento, formaDe, lerFormularioKommo, temTexto } from '@/dominio/kommo'

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

  it('temTexto avisa se o evento traz o texto da mensagem, sem devolvê-lo', () => {
    expect(temTexto({ message: { add: [{ id: '1', text: 'Oi, quero saber o preço' }] } })).toBe(true)
    expect(temTexto({ message: { add: [{ id: '1', text: '' }] } })).toBe(false)
    expect(temTexto({ leads: { status: [{ id: '1', status_id: '142' }] }, account: { subdomain: 'a' } })).toBe(false)
    expect(temTexto({ text: 'fora de mensagem' })).toBe(false)
  })

  it('classifica as mensagens por tipo, autor e canal, sem devolver nome nem texto', () => {
    const r = classificacoesDasMensagens([
      { message: { add: [{ text: 'Oi', message_type: 'incoming', origin: 'waba', element_type: 'lead', author: { id: '1', name: 'Maria', type: 'contact' } }] } },
      { message: { add: [{ text: 'Olá!', message_type: 'outgoing', origin: 'waba', element_type: 'lead', author: { id: '2', name: 'Ana', type: 'user' } }, { text: 'Bot', message_type: 'outgoing', origin: 'waba', author: { type: 'bot' } }] } },
      { talk: { update: [{ talk_id: '1' }] } },
    ])
    expect(r).toEqual({ message_type: { incoming: 1, outgoing: 2 }, author_type: { contact: 1, user: 1, bot: 1 }, origin: { waba: 3 }, element_type: { lead: 2, sem: 1 } })
    expect(JSON.stringify(r)).not.toMatch(/Maria|Ana|Oi|Olá/)
  })
})
