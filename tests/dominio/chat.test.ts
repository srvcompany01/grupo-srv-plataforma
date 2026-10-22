import { describe, expect, it } from 'vitest'
import { continuacao, nomeDeCanal, referenciasInternas, rotuloDia, trechosDoTexto, validarAnexosChat } from '@/dominio/chat'

const ID = '0b8c1f7e-3a2d-4c1b-9e0f-1234567890ab'

describe('chat', () => {
  it('nome do canal', () => {
    expect(nomeDeCanal('Área de Vendas!')).toBe('area-de-vendas')
    expect(nomeDeCanal('  #Tráfego  pago ')).toBe('trafego-pago')
    expect(nomeDeCanal('---')).toBe('')
  })

  it('anexos só da pasta do canal', () => {
    expect(validarAnexosChat('c1', [{ chave: `chat/c1/${ID}.png`, mime: 'image/png', tamanho: 10 }])).toBeNull()
    expect(validarAnexosChat('c1', [{ chave: `chat/c2/${ID}.png`, mime: 'image/png', tamanho: 10 }])).toBe('Anexo inválido')
    expect(validarAnexosChat('c1', [{ chave: `chat/c1/${ID}.exe`, mime: 'application/x-msdownload', tamanho: 10 }])).toMatch(/não permitido/)
  })

  it('links externos e internos (tarefa/documento)', () => {
    const t = trechosDoTexto(`segue a ata: https://app.gruposrv.com.br/documentos/${ID}. E o site https://exemplo.com/a?b=1, ok`)
    expect(t.map((x) => x.tipo)).toEqual(['texto', 'interno', 'texto', 'link', 'texto'])
    expect(t[1]).toMatchObject({ recurso: 'documento', id: ID })
    expect(t[3]).toEqual({ tipo: 'link', url: 'https://exemplo.com/a?b=1' })
    expect(referenciasInternas([`https://x.com/tarefas/${ID}`, 'nada'])).toEqual({ tarefas: [ID], documentos: [] })
  })

  it('dia e continuação', () => {
    expect(rotuloDia('2026-10-22', '2026-10-22')).toBe('Hoje')
    expect(rotuloDia('2026-10-21', '2026-10-22')).toBe('Ontem')
    expect(rotuloDia('2026-10-19', '2026-10-22')).toMatch(/segunda-feira, 19 de outubro/)
    const a = { autorId: 'ana', criadoEm: '2026-10-22T10:00:00Z' }
    expect(continuacao(a, { autorId: 'ana', criadoEm: '2026-10-22T10:03:00Z' })).toBe(true)
    expect(continuacao(a, { autorId: 'ana', criadoEm: '2026-10-22T10:06:00Z' })).toBe(false)
    expect(continuacao(a, { autorId: 'bia', criadoEm: '2026-10-22T10:01:00Z' })).toBe(false)
  })
})
