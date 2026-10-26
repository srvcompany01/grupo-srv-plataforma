import { describe, expect, it } from 'vitest'
import { ignorarEvento, limparEvento, resumoDoEvento, segredoValido } from '@/dominio/whatsapp'

describe('webhook do WhatsApp (fase de teste)', () => {
  it('segredo: só aceita o mesmo valor, de qualquer tamanho', () => {
    expect(segredoValido('abc123', 'abc123')).toBe(true)
    expect(segredoValido('abc124', 'abc123')).toBe(false)
    expect(segredoValido('abc', 'abc123')).toBe(false)
    expect(segredoValido('', '')).toBe(false)
    expect(segredoValido('x', '')).toBe(false)
  })

  it('resume mensagem de texto de um contato', () => {
    const r = resumoDoEvento({ event: 'messages.upsert', instance: 'aurum', data: { key: { remoteJid: '5591988887777@s.whatsapp.net', fromMe: false, id: 'A1' }, messageType: 'conversation', message: { conversation: 'Olá! Vim pelo Instagram 😊' } } })
    expect(r).toMatchObject({ evento: 'messages.upsert', instancia: 'aurum', deMim: false, grupo: false, tipo: 'conversation', veioDeAnuncio: false, texto: 'Olá! Vim pelo Instagram 😊' })
  })

  it('reconhece mensagem que veio de anúncio (externalAdReply) e a que a própria equipe mandou', () => {
    const anuncio = resumoDoEvento({ event: 'messages.upsert', data: { key: { remoteJid: '5591988887777@s.whatsapp.net', fromMe: false }, messageType: 'extendedTextMessage', message: { extendedTextMessage: { text: 'Quero saber mais', contextInfo: { externalAdReply: { sourceId: '120254', title: 'Joias de ouro', sourceUrl: 'https://fb.me/x', ctwaClid: 'AbC', conversionSource: 'FB_Ads' } } } } } })
    expect(anuncio.veioDeAnuncio).toBe(true)
    expect(anuncio.anuncio).toEqual({ id: '120254', titulo: 'Joias de ouro', url: 'https://fb.me/x', clid: 'AbC', origem: 'FB_Ads' })
    const nossa = resumoDoEvento({ event: 'messages.upsert', data: { key: { remoteJid: '5591988887777@s.whatsapp.net', fromMe: true }, message: { conversation: '#venda 1250,00 colar' } } })
    expect(nossa).toMatchObject({ deMim: true, texto: '#venda 1250,00 colar' })
  })

  it('formatos estranhos não quebram', () => {
    expect(resumoDoEvento(null)).toMatchObject({ evento: '', texto: '', veioDeAnuncio: false })
    expect(resumoDoEvento({ data: [{ key: { remoteJid: '123@g.us' } }] })).toMatchObject({ grupo: true })
  })

  it('não guarda a chave da instância, o destino com o segredo, o servidor nem o segredo de criptografia da mensagem', () => {
    const bruto = { event: 'messages.upsert', instance: 'x', apikey: 'CHAVE', destination: 'https://app/api?segredo=ABC', server_url: 'https://evo', data: { key: { fromMe: false }, message: { conversation: 'Oi', messageContextInfo: { messageSecret: { 0: 1 } } } } }
    const limpo = limparEvento(bruto) as Record<string, unknown>
    expect(JSON.stringify(limpo)).not.toMatch(/CHAVE|segredo=ABC|https:\/\/evo|messageSecret/)
    expect(limpo).toMatchObject({ event: 'messages.upsert', instance: 'x', data: { key: { fromMe: false }, message: { conversation: 'Oi' } } })
    expect(limparEvento(null)).toEqual({})
  })

  it('tira blocos binários e de criptografia, mas mantém o texto e o contexto do anúncio', () => {
    const bruto = { event: 'messages.upsert', data: { key: { remoteJid: '5591@s.whatsapp.net' }, message: { imageMessage: { caption: 'Oi', jpegThumbnail: { 0: 1 }, mediaKey: { 0: 2 }, url: 'https://mmg.whatsapp.net/x', contextInfo: { externalAdReply: { sourceId: '9' } } } } } }
    const limpo = limparEvento(bruto)
    expect(JSON.stringify(limpo)).not.toMatch(/jpegThumbnail|mediaKey|mmg\.whatsapp/)
    expect(JSON.stringify(limpo)).toMatch(/"caption":"Oi"/)
    expect(JSON.stringify(limpo)).toMatch(/"sourceId":"9"/)
  })

  it('grupos, canais e listas de transmissão são ignorados; conversa 1:1 não', () => {
    const evento = (jid: string) => ({ event: 'messages.upsert', data: { key: { remoteJid: jid } } })
    expect(ignorarEvento(evento('1203634@g.us'))).toBe(true)
    expect(ignorarEvento(evento('status@broadcast'))).toBe(true)
    expect(ignorarEvento(evento('120363@newsletter'))).toBe(true)
    expect(ignorarEvento(evento('559184512842@s.whatsapp.net'))).toBe(false)
    expect(ignorarEvento({ event: 'connection.update', data: { state: 'open' } })).toBe(false)
  })
})
