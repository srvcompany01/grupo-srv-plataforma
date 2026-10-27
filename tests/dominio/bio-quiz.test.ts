import { describe, expect, it } from 'vitest'
import { lerPerguntas, mensagemComRespostas, perguntasDaPagina, QUIZ_PADRAO, resolverRespostas, resumirQuiz } from '@/dominio/bio-quiz'

const quiz = [{ pergunta: 'O que procura?', opcoes: ['Anel', 'Colar'] }, { pergunta: 'Quando?', opcoes: ['Hoje', 'Mês que vem', 'Só olhando'] }]

describe('quiz da bio', () => {
  it('editor: ignora linhas vazias, tira duplicadas e exige 2 a 4 opções e até 3 perguntas', () => {
    expect(lerPerguntas([{ pergunta: ' Serviço? ', opcoes: 'A\n\n B \nA' }, { pergunta: '', opcoes: '' }])).toEqual([{ pergunta: 'Serviço?', opcoes: ['A', 'B'] }])
    expect(lerPerguntas([{ pergunta: 'X', opcoes: 'só uma' }])).toHaveProperty('erro')
    expect(lerPerguntas([{ pergunta: 'X', opcoes: 'a\nb\nc\nd\ne' }])).toHaveProperty('erro')
    expect(lerPerguntas([{ pergunta: '', opcoes: 'a\nb' }])).toHaveProperty('erro')
    expect(lerPerguntas([{ pergunta: 'X', opcoes: `a\n${'b'.repeat(41)}` }])).toHaveProperty('erro')
    expect(lerPerguntas(Array.from({ length: 4 }, (_, i) => ({ pergunta: `P${i}`, opcoes: 'a\nb' })))).toHaveProperty('erro')
    expect(lerPerguntas([])).toEqual([])
  })

  it('página: sem perguntas (ou lixo) usa o quiz padrão', () => {
    expect(perguntasDaPagina([])).toEqual(QUIZ_PADRAO)
    expect(perguntasDaPagina(null)).toEqual(QUIZ_PADRAO)
    expect(perguntasDaPagina([{ pergunta: 1, opcoes: [] }])).toEqual(QUIZ_PADRAO)
    expect(perguntasDaPagina(quiz)).toEqual(quiz)
  })

  it('só vale o quiz completo e com opções que existem', () => {
    expect(resolverRespostas(quiz, [1, 2])).toEqual([{ p: 'O que procura?', o: 'Colar' }, { p: 'Quando?', o: 'Só olhando' }])
    expect(resolverRespostas(quiz, [1])).toBeNull()
    expect(resolverRespostas(quiz, [1, 3])).toBeNull()
    expect(resolverRespostas(quiz, [1, -1])).toBeNull()
    expect(resolverRespostas(quiz, [1, '2'])).toBeNull()
    expect(resolverRespostas(quiz, 'x')).toBeNull()
  })

  it('a mensagem do WhatsApp leva as respostas', () => {
    expect(mensagemComRespostas('Olá! Vim pelo Instagram', [{ p: 'O que procura?', o: 'Anel' }])).toBe('Olá! Vim pelo Instagram\n\n• O que procura? Anel')
  })

  it('resumo das respostas por pergunta, da mais escolhida para a menos', () => {
    const l = (...o: string[]) => ({ respostas: o.map((x, i) => ({ p: i ? 'Quando?' : 'O que procura?', o: x })) })
    const r = resumirQuiz([l('Anel', 'Hoje'), l('Colar', 'Hoje'), l('Anel', 'Só olhando'), { respostas: 'lixo' }])
    expect(r[0]).toEqual({ pergunta: 'O que procura?', total: 3, opcoes: [{ opcao: 'Anel', n: 2 }, { opcao: 'Colar', n: 1 }] })
    expect(r[1].opcoes[0]).toEqual({ opcao: 'Hoje', n: 2 })
  })
})
