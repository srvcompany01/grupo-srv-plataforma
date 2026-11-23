import { describe, expect, it, vi } from 'vitest'
import type { Supabase } from '@/infra/supabase/servidor'
import type { EntradaFormulario } from '@/dominio/formularios'
import { alternarFormulario, arquivarFormulario, salvarFormulario } from '@/servicos/formularios'
import { mensagemErro } from '@/dominio/erros-banco'

const entrada: EntradaFormulario = {
  listaId: '11111111-1111-4111-8111-111111111111', responsavelId: '22222222-2222-4222-8222-222222222222', clienteId: null,
  nome: ' Briefing ', descricao: ' ', landing: null,
  campos: [{ key: 'description', label: ' Detalhes ', required: false }, { key: 'title', label: ' Pedido ', required: false }],
}
function banco(resultado: { data: { id: string } | null; error: unknown }) {
  const consulta = { update: vi.fn(), insert: vi.fn(), eq: vi.fn(), is: vi.fn(), select: vi.fn(), maybeSingle: vi.fn().mockResolvedValue(resultado), single: vi.fn().mockResolvedValue(resultado) }
  for (const k of ['update', 'insert', 'eq', 'is', 'select'] as const) consulta[k].mockReturnValue(consulta)
  const from = vi.fn().mockReturnValue(consulta)
  return { sb: { from } as unknown as Supabase, consulta, from }
}

describe('gestão de formulários', () => {
  it('cria com token público e mantém nomes e ordem das perguntas', async () => {
    const { sb, consulta } = banco({ data: { id: 'novo' }, error: null })
    expect(await salvarFormulario(sb, null, entrada)).toBe('novo')
    expect(consulta.insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'Briefing', description: null, token: expect.stringMatching(/^[a-zA-Z0-9]{32}$/), fields: [
      { key: 'description', label: 'Detalhes', required: false }, { key: 'title', label: 'Pedido', required: true },
    ] }))
  })
  it('recusa entrada inválida antes de consultar o banco', async () => {
    const { sb, from } = banco({ data: null, error: null })
    await expect(salvarFormulario(sb, null, { ...entrada, campos: [] })).rejects.toThrow(/campos/)
    expect(from).not.toHaveBeenCalled()
  })
  it('edição não relata sucesso quando RLS não retorna linha', async () => {
    const { sb, consulta } = banco({ data: null, error: null })
    await expect(salvarFormulario(sb, 'existente', entrada)).rejects.toThrow(/sem permissão/)
    expect(consulta.is).toHaveBeenCalledWith('archived_at', null)
  })
  it('explica conflito de landing sem expor o erro técnico', async () => {
    const { sb } = banco({ data: null, error: { code: '23505' } })
    const erro = await salvarFormulario(sb, null, { ...entrada, landing: 'maquinadevendas' }).catch((e) => e)
    expect(mensagemErro(erro)).toMatch(/landing page já está ligada/)
  })
  it('mostra validação na tela em vez da mensagem genérica', async () => {
    const { sb } = banco({ data: null, error: null })
    const erro = await salvarFormulario(sb, null, { ...entrada, nome: ' ' }).catch((e) => e)
    expect(mensagemErro(erro)).toBe('Informe o nome do formulário.')
  })
  it('alternar não reativa um formulário arquivado ou sem acesso', async () => {
    const { sb, consulta } = banco({ data: null, error: null })
    await expect(alternarFormulario(sb, 'existente', true)).rejects.toThrow(/arquivado/)
    expect(consulta.is).toHaveBeenCalledWith('archived_at', null)
  })
  it('arquiva desativando o link e confere a linha alterada', async () => {
    const { sb, consulta } = banco({ data: { id: 'existente' }, error: null })
    await arquivarFormulario(sb, 'existente')
    expect(consulta.update).toHaveBeenCalledWith({ active: false, archived_at: expect.any(String) })
    const semAcesso = banco({ data: null, error: null })
    await expect(arquivarFormulario(semAcesso.sb, 'existente')).rejects.toThrow(/sem permissão/)
  })
})
