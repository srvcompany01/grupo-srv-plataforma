import { expect, it } from 'vitest'
import { camposOferecidos, respostasDoForm } from '@/dominio/formularios'
import type { DefinicaoCampo } from '@/dominio/personalizacao'

const def = (id: string, tipo: DefinicaoCampo['tipo']): DefinicaoCampo => ({ id, espacoId: null, nome: id, tipo, configuracao: {}, cor: '#000000', icone: 'type' })

it('oferece título, descrição e só os tipos preenchíveis', () => {
  const chaves = camposOferecidos([def('a', 'text'), def('b', 'formula'), def('c', 'files')]).map((c) => c.key)
  expect(chaves).toEqual(['title', 'description', 'a'])
})

it('converte números, caixas e omite vazios', () => {
  const campos = ['title', 'n', 'ok', 'vazio'].map((key) => ({ key, label: key, required: false }))
  const form: Record<string, string> = { title: ' Oi ', n: '1,5', vazio: '  ' }
  const r = respostasDoForm(campos, { n: 'number', ok: 'checkbox' }, (k) => form[k] ?? null)
  expect(r).toEqual({ title: 'Oi', n: 1.5, ok: false })
})

it('valida perguntas, preserva a ordem e força o título obrigatório', async () => {
  const { EntradaFormularioSchema } = await import('@/dominio/formularios')
  const entrada = { listaId: '11111111-1111-4111-8111-111111111111', responsavelId: '22222222-2222-4222-8222-222222222222', clienteId: null, nome: ' Briefing ', descricao: ' Apoio ', landing: null,
    campos: [{ key: 'description', label: ' Detalhes ', required: false }, { key: 'title', label: ' Seu pedido ', required: false }] }
  const r = EntradaFormularioSchema.parse(entrada)
  expect(r.nome).toBe('Briefing')
  expect(r.campos).toEqual([{ key: 'description', label: 'Detalhes', required: false }, { key: 'title', label: 'Seu pedido', required: true }])
  expect(EntradaFormularioSchema.safeParse({ ...entrada, campos: [{ key: 'description', label: 'D', required: false }] }).success).toBe(false)
  expect(EntradaFormularioSchema.safeParse({ ...entrada, campos: [entrada.campos[1], entrada.campos[1]] }).success).toBe(false)
  expect(EntradaFormularioSchema.safeParse({ ...entrada, campos: [{ key: 'title', label: ' ', required: true }] }).success).toBe(false)
  expect(EntradaFormularioSchema.safeParse({ ...entrada, campos: Array.from({ length: 41 }, () => entrada.campos[1]) }).success).toBe(false)
  expect(EntradaFormularioSchema.safeParse({ ...entrada, landing: 'pagina-inexistente' }).success).toBe(false)
})
