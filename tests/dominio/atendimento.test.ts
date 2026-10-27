import { describe, expect, it } from 'vitest'
import { duracao, metricasDeAtendimento, segundosUteis, type MensagemAtendimento } from '@/dominio/atendimento'
import { mascararTexto } from '@/dominio/privacidade'
import { analisarQualidade, lerAnaliseDaIA, montarTranscricao, resumirQualidade, type LinhaAnalise } from '@/dominio/qualidade-atendimento'

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

describe('horário de atendimento', () => {
  const h = { abre: 8 * 60, fecha: 18 * 60, dias: [1, 2, 3, 4, 5] } // seg a sex, 8h às 18h (Belém)
  const em = (iso: string) => Date.parse(iso)
  it('conta só o expediente: sexta 17h às segunda 9h = 2 h', () => {
    expect(segundosUteis(em('2026-10-23T20:00:00Z'), em('2026-10-26T12:00:00Z'), h)).toBe(2 * 3600) // sex 17h → seg 9h (Belém)
  })
  it('dentro do mesmo expediente é o tempo corrido; sem horário também', () => {
    expect(segundosUteis(em('2026-10-26T12:00:00Z'), em('2026-10-26T12:30:00Z'), h)).toBe(1800)
    expect(segundosUteis(em('2026-10-24T12:00:00Z'), em('2026-10-24T13:00:00Z'))).toBe(3600)
  })
  it('sábado e domingo não contam; resposta de madrugada vira 0', () => {
    expect(segundosUteis(em('2026-10-24T12:00:00Z'), em('2026-10-25T20:00:00Z'), h)).toBe(0)
  })
  it('a primeira resposta usa o expediente: cliente às 23h, resposta às 8h30 = 30 min', () => {
    const msgs = [{ conversa: 'a', papel: 'cliente' as const, em: em('2026-10-27T02:00:00Z') }, { conversa: 'a', papel: 'atendente' as const, em: em('2026-10-27T11:30:00Z') }]
    expect(metricasDeAtendimento(msgs, em('2026-10-27T12:00:00Z'), 3600, h).primeiraResposta.mediana).toBe(1800)
  })
})

describe('qualidade do atendimento (IA)', () => {
  it('lê a resposta da IA, com ou sem cerca de código, limitando a nota e os textos', () => {
    const r = lerAnaliseDaIA('```json\n{"nota": 130, "resultado": "venda", "resumo": " Comprou ", "motivo_perda": "", "objecoes": ["Preço", " "], "pontos_fortes": ["rápido"], "melhorias": []}\n```')
    expect(r).toEqual({ nota: 100, resultado: 'venda', resumo: 'Comprou', motivoPerda: '', objecoes: ['Preço'], pontosFortes: ['rápido'], melhorias: [] })
    expect(lerAnaliseDaIA('não é json')).toBeNull()
    expect(lerAnaliseDaIA('{"nota": "x"}')).toBeNull()
    expect(lerAnaliseDaIA('{"nota": 50, "resultado": "talvez"}')?.resultado).toBe('em_andamento')
  })
  it('monta a conversa legível e corta o meio das muito longas', () => {
    const t = montarTranscricao([{ papel: 'cliente', texto: 'Oi\n tudo bem?', em: Date.parse('2026-10-26T12:00:00Z') }, { papel: 'atendente', texto: 'Olá!', em: Date.parse('2026-10-26T12:01:00Z') }])
    expect(t).toBe('[10-26 09:00] Cliente: Oi tudo bem?\n[10-26 09:01] Atendente: Olá!')
    expect(montarTranscricao([{ papel: 'cliente', texto: 'a'.repeat(30_000), em: 0 }])).toContain('trecho do meio omitido')
  })
  it('totais: nota média, objeção contada uma vez por conversa e motivo de perda só das perdidas', () => {
    const l = (o: Partial<LinhaAnalise>): LinhaAnalise => ({ talkId: 1, conversaEm: '', mensagens: 5, nota: 80, resultado: 'venda', resumo: '', motivoPerda: '', objecoes: [], pontosFortes: [], melhorias: [], ...o })
    const r = resumirQualidade([l({ nota: 90, objecoes: ['Preço', 'preço'] }), l({ nota: 50, resultado: 'perdido', motivoPerda: 'preço alto', objecoes: ['preço'], melhorias: ['responder mais rápido'] }), l({ nota: 40, resultado: 'sem_resposta', motivoPerda: 'ignorar' })])
    expect(r.notaMedia).toBe(60)
    expect(r.objecoes).toEqual([{ texto: 'preço', conversas: 2 }])
    expect(r.motivosDePerda).toEqual([{ texto: 'preço alto', conversas: 1 }])
    expect(r.porResultado).toMatchObject({ venda: 1, perdido: 1, sem_resposta: 1 })
    expect(analisarQualidade(r).recomendacoes.length).toBeGreaterThan(0)
  })
})
