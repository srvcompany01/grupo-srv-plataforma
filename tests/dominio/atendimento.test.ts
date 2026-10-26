import { describe, expect, it } from 'vitest'
import { duracao, metricasDeAtendimento, type MensagemAtendimento } from '@/dominio/atendimento'
import { mascararTexto } from '@/dominio/privacidade'

const t0 = Date.parse('2026-10-26T12:00:00Z')
const m = (conversa: string, papel: MensagemAtendimento['papel'], seg: number): MensagemAtendimento => ({ conversa, papel, em: t0 + seg * 1000 })

describe('métricas de atendimento', () => {
  it('primeira resposta humana, mediana, faixas e rodadas; o robô não conta como atendente', () => {
    const msgs = [
      m('a', 'cliente', 0), m('a', 'robo', 5), m('a', 'atendente', 120), m('a', 'cliente', 600), m('a', 'atendente', 660), // 120 s e 60 s
      m('b', 'cliente', 0), m('b', 'atendente', 1800), // 30 min
      m('c', 'cliente', 0), m('c', 'robo', 3), // só robô
      m('d', 'cliente', 0), // sem resposta (há mais de 1 h)
      m('e', 'atendente', 0), // a equipe começou: não é lead que escreveu
    ]
    const r = metricasDeAtendimento(msgs, t0 + 7200 * 1000)
    // semResposta inclui a que só o robô respondeu: o cliente segue esperando uma pessoa.
    expect(r).toMatchObject({ conversas: 4, respondidas: 2, soRobo: 1, semResposta: 2 })
    expect(r.taxaDeResposta).toBe(50)
    expect(r.primeiraResposta.mediana).toBe(960)
    expect(r.primeiraResposta.media).toBe(960)
    expect(r.primeiraResposta.ate5min).toBe(25)
    expect(r.primeiraResposta.ate60min).toBe(50)
    expect(r.tempoMedioDeResposta).toBeCloseTo((120 + 60 + 1800) / 3)
  })

  it('sem mensagens: tudo vazio, sem dividir por zero', () => {
    expect(metricasDeAtendimento([], t0)).toMatchObject({ conversas: 0, taxaDeResposta: null, tempoMedioDeResposta: null, primeiraResposta: { mediana: null } })
  })

  it('cliente que acabou de escrever ainda não conta como sem resposta', () => {
    expect(metricasDeAtendimento([m('x', 'cliente', 0)], t0 + 600 * 1000).semResposta).toBe(0)
  })

  it('duração legível', () => {
    expect([null, 30, 95, 4000, 90000].map(duracao)).toEqual(['—', '30 s', '1 min 35 s', '1 h 6 min', '1 d 1 h'])
  })
})

describe('mascarar dados pessoais', () => {
  it('telefone, CPF, CNPJ, e-mail e cartão saem; preço e texto comum ficam', () => {
    const r = mascararTexto('Meu zap é (91) 98817-4486, outro +55 91 98817-4486 e 91988174486. CPF 123.456.789-09 ou 12345678909. CNPJ 12.345.678/0001-95. maria.silva+x@gmail.com. Cartão 4111 1111 1111 1111. O colar custa R$ 1.250,00 em 10x de 125,00')
    expect(r).not.toMatch(/98817|123\.456|12345678909|0001-95|maria\.silva|4111/)
    // Número de 11 dígitos sem pontuação pode ser telefone ou CPF: o importante é não sobrar nenhum dígito.
    expect(r).toMatch(/\[telefone\].*\[telefone\]/)
    expect(r).toContain('[cpf]')
    expect(r.match(/\[cpf ou telefone\]/g)?.length).toBe(2)
    expect(r).toContain('[cnpj]')
    expect(r).toContain('[e-mail]')
    expect(r).toContain('[cartão]')
    expect(r).toContain('R$ 1.250,00 em 10x de 125,00')
  })

  it('não mexe em número curto, ano nem quantidade', () => {
    expect(mascararTexto('Quero 2 peças, tamanho 38, para 2027. Sai às 18:30 do dia 12/10.')).toBe('Quero 2 peças, tamanho 38, para 2027. Sai às 18:30 do dia 12/10.')
  })
})
