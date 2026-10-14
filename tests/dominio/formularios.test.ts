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
