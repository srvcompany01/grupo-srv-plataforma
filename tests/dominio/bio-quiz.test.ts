import { describe, expect, it } from 'vitest'
import { urlDoWhatsapp, lerAparencia, lerPerguntas, lerQuizDaPagina, mensagemComRespostas, perguntasDaPagina, QUIZ_PADRAO, resolverRespostas, resumirQuiz } from '@/dominio/bio-quiz'

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
    const m = mensagemComRespostas('Olá! Vim pelo Instagram', [{ p: 'O que procura?', o: 'Anel' }, { p: 'Quando?', o: 'Hoje' }])
    expect(m).toBe('Olá! Vim pelo Instagram\n\n*O que procura?*\nAnel\n\n*Quando?*\nHoje')
    // As quebras de linha seguem no endereço (%0A), que é o que o WhatsApp lê.
    expect(urlDoWhatsapp('5591999999999', m)).toBe('https://api.whatsapp.com/send?phone=5591999999999&text=Ol%C3%A1!%20Vim%20pelo%20Instagram%0A%0A*O%20que%20procura%3F*%0AAnel%0A%0A*Quando%3F*%0AHoje')
  })

  it('resumo das respostas por pergunta, da mais escolhida para a menos', () => {
    const l = (...o: string[]) => ({ respostas: o.map((x, i) => ({ p: i ? 'Quando?' : 'O que procura?', o: x })) })
    const r = resumirQuiz([l('Anel', 'Hoje'), l('Colar', 'Hoje'), l('Anel', 'Só olhando'), { respostas: 'lixo' }])
    expect(r[0]).toEqual({ pergunta: 'O que procura?', total: 3, opcoes: [{ opcao: 'Anel', n: 2 }, { opcao: 'Colar', n: 1 }] })
    expect(r[1].opcoes[0]).toEqual({ opcao: 'Hoje', n: 2 })
  })

  it('aparência: cores #rrggbb sempre em par, textos dentro do limite', () => {
    expect(lerAparencia({ botaoTexto: ' Fale conosco ', botaoFundo: '#25D366', botaoLetra: '#ffffff', titulo: ' Oi ' })).toEqual({ botaoTexto: 'Fale conosco', botaoFundo: '#25D366', botaoLetra: '#ffffff', titulo: 'Oi', descricao: '' })
    expect(lerAparencia({})).toEqual({ botaoTexto: '', botaoFundo: '', botaoLetra: '', titulo: '', descricao: '' })
    expect(lerAparencia({ botaoFundo: '#25D366' })).toHaveProperty('erro')
    expect(lerAparencia({ botaoFundo: 'verde', botaoLetra: '#fff' })).toHaveProperty('erro')
    expect(lerAparencia({ botaoFundo: '#111111', botaoLetra: '#111111' })).toHaveProperty('erro')
    expect(lerAparencia({ botaoTexto: 'a'.repeat(41) })).toHaveProperty('erro')
    expect(lerAparencia({ titulo: 'a'.repeat(81) })).toHaveProperty('erro')
    expect(lerAparencia({ descricao: 'a'.repeat(201) })).toHaveProperty('erro')
  })

  it('o que a página recebe: perguntas + aparência; formato antigo (lista) e lixo viram padrão', () => {
    const q = lerQuizDaPagina({ perguntas: quiz, titulo: 'Oi', descricao: null, botaoTexto: 'Fale', botaoFundo: '#25D366', botaoLetra: '#fff' })
    expect(q.perguntas).toEqual(quiz)
    expect(q.aparencia).toEqual({ botaoTexto: 'Fale', botaoFundo: '', botaoLetra: '', titulo: 'Oi', descricao: '' }) // cor inválida (#fff) descarta o par
    expect(lerQuizDaPagina([...quiz]).perguntas).toEqual(quiz)
    expect(lerQuizDaPagina(null).perguntas).toEqual(QUIZ_PADRAO)
    expect(lerQuizDaPagina({ botaoFundo: '#25D366', botaoLetra: '#ffffff' }).aparencia).toMatchObject({ botaoFundo: '#25D366', botaoLetra: '#ffffff' })
  })
})
