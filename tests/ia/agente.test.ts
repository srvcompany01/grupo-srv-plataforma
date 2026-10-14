import { describe, expect, it } from 'vitest'
import { conversar, ferramentasDaIA, type ChamarModelo } from '@/ia/agente'
import { esquemaDaFerramenta } from '@/ia/esquema'
import type { Contexto } from '@/mcp/ferramentas'

const ctx = { sb: {} as Contexto['sb'], userId: 'u1', nome: 'Ana', papel: 'admin', escopo: 'read' } satisfies Contexto

describe('assistente (fase 1)', () => {
  it('só oferece ferramentas de leitura e com esquema simples', () => {
    const f = ferramentasDaIA()
    expect(f.length).toBeGreaterThan(3)
    expect(f.every((x) => !x.escrita)).toBe(true)
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
    expect(r).toBe('Pro'.concat('nto: você é admin.'))
    expect(vistos[0]).toContain('"papel":"admin"')
  })

  it('recusa ferramenta de escrita e argumentos inválidos sem executar', async () => {
    const respostas: string[] = []
    const chamar: ChamarModelo = async (mensagens) => {
      const ultima = mensagens.at(-1)!
      if (ultima.role === 'tool') {
        respostas.push(ultima.content)
        return mensagens.filter((m) => m.role === 'tool').length >= 2 ? { content: 'ok' } : { content: null, tool_calls: [{ id: 'c2', type: 'function', function: { name: 'buscar_tarefa', arguments: '{"tarefaId":"nao-e-uuid"}' } }] }
      }
      return { content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'criar_tarefa', arguments: '{}' } }] }
    }
    await conversar({ mensagens: [{ role: 'user', content: 'crie' }], ctx, caminho: '/', hoje: '2026-10-14', chamar })
    expect(respostas[0]).toContain('Ferramenta inexistente')
    expect(respostas[1]).toContain('Argumentos inválidos')
  })

  it('para depois de muitas rodadas', async () => {
    const chamar: ChamarModelo = async () => ({ content: null, tool_calls: [{ id: 'x', type: 'function', function: { name: 'descrever_plataforma', arguments: '{}' } }] })
    expect(await conversar({ mensagens: [{ role: 'user', content: 'x' }], ctx, caminho: '/', hoje: '2026-10-14', chamar })).toContain('longa demais')
  })
})
