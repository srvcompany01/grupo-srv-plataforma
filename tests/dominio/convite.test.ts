import { describe, expect, it } from 'vitest'
import { validarConvite } from '@/dominio/convite'

const base = { email: 'ana@x.com', nome: 'Ana', papel: 'membro' as const, espacos: [{ id: 'e1', papel: 'membro' as const }] }

describe('validarConvite', () => {
  it('aceita membro com departamento', () => {
    expect(validarConvite(base)).toEqual({ ok: true, dados: { ...base, email: 'ana@x.com', clienteId: undefined } })
  })

  it('normaliza e-mail e nome', () => {
    const r = validarConvite({ ...base, email: '  Ana@X.com ', nome: '  Ana Souza ' })
    expect(r).toMatchObject({ ok: true, dados: { email: 'ana@x.com', nome: 'Ana Souza' } })
  })

  it.each([
    [{ ...base, email: 'ana' }, 'Informe um e-mail válido.'],
    [{ ...base, nome: '  ' }, 'Informe o nome.'],
    [{ ...base, papel: 'cliente' as const, espacos: [] }, 'Escolha o cliente deste usuário.'],
    [{ ...base, papel: 'cliente' as const, clienteId: 'c1' }, 'Usuário de cliente não participa de departamentos.'],
    [{ ...base, clienteId: 'c1' }, 'Só usuários de cliente são vinculados a um cliente.'],
    [{ ...base, papel: 'chefe' as never }, 'Papel inválido.'],
  ])('rejeita %#', (entrada, erro) => {
    expect(validarConvite(entrada)).toEqual({ ok: false, erro })
  })

  it('cliente sem departamentos é válido', () => {
    expect(validarConvite({ email: 'c@x.com', nome: 'C', papel: 'cliente', clienteId: 'c1', espacos: [] })).toMatchObject({ ok: true })
  })

  it('admin pode vir sem departamentos', () => {
    expect(validarConvite({ ...base, papel: 'admin', espacos: [] })).toMatchObject({ ok: true })
  })
})

describe('opcoesResponsaveis', () => {
  it('inclui responsáveis atuais que saíram da equipe, marcados como inativos', async () => {
    const { opcoesResponsaveis } = await import('@/dominio/convite')
    const equipe = [{ id: 'a', nome: 'Ana', avatar: null }]
    const atuais = [
      { id: 'a', nome: 'Ana', avatar: null },
      { id: 'z', nome: 'Zé', avatar: null },
    ]
    expect(opcoesResponsaveis(equipe, atuais)).toEqual([
      { id: 'a', nome: 'Ana', avatar: null, inativo: false },
      { id: 'z', nome: 'Zé', avatar: null, inativo: true },
    ])
  })
})

describe('destinoAposConfirmar', () => {
  it('convite e recuperação vão definir a senha; o resto vai para o início', async () => {
    const { destinoAposConfirmar } = await import('@/dominio/convite')
    expect(destinoAposConfirmar('invite')).toBe('/login/nova-senha')
    expect(destinoAposConfirmar('recovery')).toBe('/login/nova-senha')
    expect(destinoAposConfirmar('magiclink')).toBe('/')
    expect(destinoAposConfirmar(null)).toBe('/')
  })
})
