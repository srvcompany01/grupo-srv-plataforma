import { describe, expect, it } from 'vitest'
import {
  aprovacaoAposEdicao,
  aprovacaoAposResposta,
  chaveDeMidiaValida,
  corDoFormato,
  edicaoCriaNovaVersao,
  FORMATOS,
  podeEnviarParaAprovacao,
  ROTULO_APROVACAO,
} from '@/dominio/conteudo'

const TAREFA = '3cb205fc-3e8a-4d0e-9f11-aaaaaaaaaaaa'
const OUTRA = '3cb205fc-3e8a-4d0e-9f11-bbbbbbbbbbbb'
const UUID = '0b9c6d36-1d8e-4f43-8d5c-123456789abc'

describe('transições de aprovação', () => {
  it('só rascunho pode ser enviado ao cliente', () => {
    expect(podeEnviarParaAprovacao('rascunho')).toBe(true)
    for (const a of ['aguardando', 'aprovado', 'ajuste'] as const) expect(podeEnviarParaAprovacao(a)).toBe(false)
  })

  it('editar depois da resposta do cliente cria nova versão', () => {
    expect(edicaoCriaNovaVersao('aprovado')).toBe(true)
    expect(edicaoCriaNovaVersao('ajuste')).toBe(true)
    expect(edicaoCriaNovaVersao('rascunho')).toBe(false)
    expect(edicaoCriaNovaVersao('aguardando')).toBe(false)
  })

  it('depois de editar: rascunho continua rascunho, o resto volta a aguardar', () => {
    expect(aprovacaoAposEdicao('rascunho')).toBe('rascunho')
    for (const a of ['aguardando', 'aprovado', 'ajuste'] as const) expect(aprovacaoAposEdicao(a)).toBe('aguardando')
  })

  it('a resposta do cliente vira o estado de aprovação', () => {
    expect(aprovacaoAposResposta('aprovado')).toBe('aprovado')
    expect(aprovacaoAposResposta('ajuste')).toBe('ajuste')
  })

  it('todo estado tem rótulo em português', () => {
    expect(ROTULO_APROVACAO).toEqual({ rascunho: 'Rascunho', aguardando: 'Aguardando aprovação', aprovado: 'Aprovado', ajuste: 'Ajuste solicitado' })
  })
})

describe('chaveDeMidiaValida', () => {
  it('aceita a chave gerada para a própria tarefa', () => {
    expect(chaveDeMidiaValida(`conteudo/${TAREFA}/${UUID}.png`, TAREFA)).toBe(true)
    expect(chaveDeMidiaValida(`conteudo/${TAREFA}/${UUID}.mp4`, TAREFA)).toBe(true)
  })

  it('rejeita chave de outra tarefa, travessia de pasta e extensão desconhecida', () => {
    expect(chaveDeMidiaValida(`conteudo/${OUTRA}/${UUID}.png`, TAREFA)).toBe(false)
    expect(chaveDeMidiaValida(`conteudo/${TAREFA}/../${OUTRA}/${UUID}.png`, TAREFA)).toBe(false)
    expect(chaveDeMidiaValida(`conteudo/${TAREFA}/${UUID}.exe`, TAREFA)).toBe(false)
    expect(chaveDeMidiaValida(`tarefas/${TAREFA}/${UUID}.png`, TAREFA)).toBe(false)
    expect(chaveDeMidiaValida('', TAREFA)).toBe(false)
  })
})

describe('formatos', () => {
  it('são os quatro formatos fixos e cada um tem uma cor', () => {
    expect(FORMATOS).toEqual(['feed', 'reels', 'stories', 'tiktok'])
    const cores = FORMATOS.map(corDoFormato)
    for (const c of cores) expect(c).toMatch(/^#[0-9a-f]{6}$/)
    expect(new Set(cores).size).toBe(4)
  })
})
