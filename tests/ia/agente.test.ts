import { describe, expect, it } from 'vitest'
import { ESCRITAS_DA_IA, conversar, ferramentasDaIA, type ChamarModelo } from '@/ia/agente'
import { esquemaDaFerramenta } from '@/ia/esquema'
import { executarConfirmada } from '@/ia/executar'
import { resumirChamada } from '@/ia/resumo'
import type { Contexto } from '@/mcp/ferramentas'

const ctx = { sb: {} as Contexto['sb'], userId: 'u1', nome: 'Ana', papel: 'admin', escopo: 'read' } satisfies Contexto

describe('assistente (fase 1)', () => {
  it('oferece leitura e só a escrita permitida, com esquema simples', () => {
    const f = ferramentasDaIA()
    expect(f.length).toBeGreaterThan(3)
    expect(f.every((x) => !x.escrita || ESCRITAS_DA_IA.has(x.nome))).toBe(true)
    expect(f.some((x) => x.nome === 'criar_tarefas_em_lote')).toBe(true)
    expect(f.some((x) => x.nome === 'criar_campo' || x.nome === 'criar_lista')).toBe(false)
    for (const x of f) expect(JSON.stringify(esquemaDaFerramenta(x.entrada))).not.toMatch(/additionalProperties|\$schema|"format"|"pattern"/)
  })

  it('executa a ferramenta pedida pelo modelo e devolve a resposta final', async () => {
    const vistos: string[] = []
    const chamar: ChamarModelo = async (mensagens) => {
      const ultima = mensagens.at(-1)!
      if (ultima.role === 'user') return { content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'descrever_plataforma', arguments: '{}' } }] }
      vistos.push(ultima.role === 'tool' ? ultima.content : '')
      return { content: 'Pronto: você é admin.' }
    }
    const r = await conversar({ mensagens: [{ role: 'user', content: 'Quem sou eu?' }], ctx, caminho: '/inicio', hoje: '2026-10-14', chamar })
    expect(r).toEqual({ tipo: 'resposta', texto: 'Pronto: você é admin.' })
    expect(vistos[0]).toContain('"papel":"admin"')
  })

  it('recusa ferramenta fora da lista e argumentos inválidos, sem executar nada', async () => {
    const respostas: string[] = []
    const chamar: ChamarModelo = async (mensagens) => {
      const ultima = mensagens.at(-1)!
      if (ultima.role === 'tool') {
        respostas.push(ultima.content)
        const n = mensagens.filter((m) => m.role === 'tool').length
        return n >= 2 ? { content: 'ok' } : { content: null, tool_calls: [{ id: 'c2', type: 'function', function: { name: 'buscar_tarefa', arguments: '{"tarefaId":"nao-e-uuid"}' } }] }
      }
      return { content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'criar_lista', arguments: '{}' } }] }
    }
    await conversar({ mensagens: [{ role: 'user', content: 'crie' }], ctx, caminho: '/', hoje: '2026-10-14', chamar })
    expect(respostas[0]).toContain('Ferramenta inexistente')
    expect(respostas[1]).toContain('Argumentos inválidos')
  })

  it('escrita vira proposta para confirmar e nada é gravado no laço', async () => {
    const lista = '11111111-1111-4111-8111-111111111111'
    const chamar: ChamarModelo = async () => ({
      content: 'Vou criar.',
      tool_calls: [{ id: 'p1', type: 'function', function: { name: 'criar_tarefas_em_lote', arguments: JSON.stringify({ listaId: lista, tarefas: [{ titulo: 'Conteúdo estratégico de novembro', serieSubtarefas: { prefixo: 'Post', de: 1, ate: 30 } }] }) } }],
    })
    // O ctx.sb é vazio: se o laço tentasse gravar, quebraria.
    const r = await conversar({ mensagens: [{ role: 'user', content: 'crie' }], ctx, caminho: '/', hoje: '2026-10-14', chamar })
    expect(r.tipo).toBe('proposta')
    if (r.tipo === 'proposta') expect(r.propostas.map((p) => p.nome)).toEqual(['criar_tarefas_em_lote'])
  })

  it('só executa, depois de confirmar, as escritas permitidas e com dados válidos', async () => {
    expect(await executarConfirmada(ctx, 'criar_lista', {})).toEqual({ ok: false, erro: 'Ação não permitida.' })
    expect(await executarConfirmada(ctx, 'listar_arvore', {})).toEqual({ ok: false, erro: 'Ação não permitida.' })
    const invalida = await executarConfirmada(ctx, 'criar_tarefa', { titulo: 'x' })
    expect(invalida.ok).toBe(false)
  })

  it('resumos descrevem o que vai ser criado', async () => {
    const nomear = async () => 'Aurum Belém'
    const texto = await resumirChamada('criar_tarefas_em_lote', { listaId: 'x', tarefas: [{ titulo: 'Novembro', serieSubtarefas: { prefixo: 'Post', de: 1, ate: 30 } }] }, nomear)
    expect(texto).toBe('Criar 1 tarefa com 30 subtarefas na lista “Aurum Belém”: “Novembro”')
  })

  it('devolve o raciocínio do provedor nas chamadas seguintes do laço (DeepSeek exige)', async () => {
    let visto: unknown
    const chamar: ChamarModelo = async (mensagens) => {
      const ultima = mensagens.at(-1)!
      if (ultima.role === 'tool') {
        visto = mensagens.find((m) => m.role === 'assistant' && 'reasoning_content' in m)
        return { content: 'ok' }
      }
      return { content: null, reasoning_content: 'pensei nisto', tool_calls: [{ id: 'c1', type: 'function', function: { name: 'descrever_plataforma', arguments: '{}' } }] }
    }
    await conversar({ mensagens: [{ role: 'user', content: 'oi' }], ctx, caminho: '/', hoje: '2026-10-14', chamar })
    expect(visto).toMatchObject({ reasoning_content: 'pensei nisto' })
  })

  it('para depois de muitas rodadas', async () => {
    const chamar: ChamarModelo = async () => ({ content: null, tool_calls: [{ id: 'x', type: 'function', function: { name: 'descrever_plataforma', arguments: '{}' } }] })
    expect(await conversar({ mensagens: [{ role: 'user', content: 'x' }], ctx, caminho: '/', hoje: '2026-10-14', chamar })).toEqual({ tipo: 'resposta', texto: expect.stringContaining('longa demais') })
  })
})

describe('botão Pensar', () => {
  it('resume a conversa anterior dentro da última pergunta (o modo pensar do DeepSeek não aceita histórico sem raciocínio)', async () => {
    const { achatarConversa } = await import('@/ia/modelo')
    expect(achatarConversa([{ role: 'user', content: 'oi' }])).toEqual([{ role: 'user', content: 'oi' }])
    const [m] = achatarConversa([
      { role: 'user' as const, content: 'liste as listas' },
      { role: 'assistant' as const, content: 'São 3.' },
      { role: 'user' as const, content: 'e a primeira?' },
    ])
    expect(m.content).toContain('Pessoa: liste as listas')
    expect(m.content).toContain('Assistente: São 3.')
    expect(m.content.endsWith('Pergunta atual: e a primeira?')).toBe(true)
  })
})
