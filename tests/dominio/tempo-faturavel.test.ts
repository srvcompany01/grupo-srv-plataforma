import { describe, expect, it } from 'vitest'
import {
  SEM_CLIENTE,
  agrupar,
  argumentosSql,
  celulaCsv,
  duracaoPorExtenso,
  gerarCsvTempo,
  horasDecimais,
  lerFiltrosTempo,
  escreverFiltrosTempo,
  mesDe,
  moverPeriodo,
  nomeArquivoCsvTempo,
  semanaDe,
  somar,
  type LinhaResumo,
} from '@/dominio/tempo-faturavel'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const U1 = '33333333-3333-4333-8333-333333333333'
const U2 = '44444444-4444-4444-8444-444444444444'

describe('período e filtros na URL', () => {
  it('semana começa na segunda e mês vai do dia 1 ao último', () => {
    expect(semanaDe('2026-11-15')).toEqual({ de: '2026-11-09', ate: '2026-11-15' }) // domingo
    expect(semanaDe('2026-11-16')).toEqual({ de: '2026-11-16', ate: '2026-11-22' }) // segunda
    expect(mesDe('2026-02-10')).toEqual({ de: '2026-02-01', ate: '2026-02-28' })
  })

  it('sem parâmetros usa o mês atual; datas inválidas e invertidas são corrigidas', () => {
    expect(lerFiltrosTempo({}, '2026-11-16')).toMatchObject({ periodo: 'mes', de: '2026-11-01', ate: '2026-11-30', clientes: [], pessoas: [], faturavel: 'todos' })
    expect(lerFiltrosTempo({ de: '2026-13-40', ate: 'x' }, '2026-11-16')).toMatchObject({ de: '2026-11-01', ate: '2026-11-30' })
    expect(lerFiltrosTempo({ de: '2026-11-20', ate: '2026-11-10', periodo: 'intervalo' }, '2026-11-16')).toMatchObject({ de: '2026-11-10', ate: '2026-11-20' })
  })

  it('ida e volta, ignorando ids que não são uuid', () => {
    const f = lerFiltrosTempo({ periodo: 'semana', de: '2026-11-09', ate: '2026-11-15', cliente: `${A},${SEM_CLIENTE},xyz`, pessoa: `${U1},nope`, faturavel: 'sim' }, '2026-11-16')
    expect(f.clientes).toEqual([A, SEM_CLIENTE])
    expect(f.pessoas).toEqual([U1])
    expect(lerFiltrosTempo(Object.fromEntries(escreverFiltrosTempo(f)), '2026-11-16')).toEqual(f)
  })

  it('anda uma semana, um mês ou o mesmo número de dias', () => {
    const base = lerFiltrosTempo({ periodo: 'semana', de: '2026-11-09', ate: '2026-11-15' }, '2026-11-16')
    expect(moverPeriodo(base, 1)).toEqual({ de: '2026-11-16', ate: '2026-11-22' })
    expect(moverPeriodo({ ...base, periodo: 'mes', de: '2026-11-01', ate: '2026-11-30' }, -1)).toEqual({ de: '2026-10-01', ate: '2026-10-31' })
    expect(moverPeriodo({ ...base, periodo: 'mes', de: '2026-12-01', ate: '2026-12-31' }, 1)).toEqual({ de: '2027-01-01', ate: '2027-01-31' })
    expect(moverPeriodo({ ...base, periodo: 'intervalo', de: '2026-11-10', ate: '2026-11-12' }, 1)).toEqual({ de: '2026-11-13', ate: '2026-11-15' })
  })

  it('argumentos das funções do banco', () => {
    const f = lerFiltrosTempo({ cliente: `${A},${SEM_CLIENTE}`, faturavel: 'nao' }, '2026-11-16')
    expect(argumentosSql(f)).toEqual({ p_de: '2026-11-01', p_ate: '2026-11-30', p_clientes: [A], p_sem_cliente: true, p_pessoas: undefined, p_faturavel: false })
  })
})

describe('agregação', () => {
  const linhas: LinhaResumo[] = [
    { clienteId: A, clienteNome: 'Loja Aurora', pessoaId: U1, pessoaNome: 'Ana', total: 3600 * 10, faturavel: 3600 * 9, registros: 4 },
    { clienteId: A, clienteNome: 'Loja Aurora', pessoaId: U2, pessoaNome: 'Bruno', total: 3600 * 2, faturavel: 0, registros: 1 },
    { clienteId: B, clienteNome: 'Clínica Vida', pessoaId: U1, pessoaNome: 'Ana', total: 3600 * 6, faturavel: 3600 * 3, registros: 2 },
    { clienteId: null, clienteNome: '', pessoaId: U2, pessoaNome: 'Bruno', total: 1800, faturavel: 0, registros: 1 },
  ]

  it('totais e percentual', () => {
    expect(somar(linhas)).toEqual({ total: 3600 * 18 + 1800, faturavel: 3600 * 12, naoFaturavel: 3600 * 6 + 1800, percentual: 65 })
  })

  it('por cliente: ordena por total e coloca as pessoas dentro; sem cliente tem nome próprio', () => {
    const g = agrupar(linhas, 'cliente')
    expect(g.map((x) => x.nome)).toEqual(['Loja Aurora', 'Clínica Vida', 'Sem cliente'])
    expect(g[0]).toMatchObject({ total: 3600 * 12, faturavel: 3600 * 9, percentual: 75 })
    expect(g[0].filhos.map((f) => f.nome)).toEqual(['Ana', 'Bruno'])
  })

  it('por pessoa e ordenação por nome', () => {
    const g = agrupar(linhas, 'pessoa', { coluna: 'nome', direcao: 'asc' })
    expect(g.map((x) => x.nome)).toEqual(['Ana', 'Bruno'])
    expect(g[1].filhos.map((f) => f.nome).sort()).toEqual(['Loja Aurora', 'Sem cliente'])
  })

  it('texto por extenso para leitor de tela', () => {
    expect(duracaoPorExtenso(96 * 3600 + 15 * 60)).toBe('96 horas e 15 minutos')
    expect(duracaoPorExtenso(3600)).toBe('1 hora')
    expect(duracaoPorExtenso(60)).toBe('1 minuto')
  })
})

describe('CSV', () => {
  it('horas decimais com vírgula', () => {
    expect(horasDecimais(4500)).toBe('1,25')
    expect(horasDecimais(3600)).toBe('1')
    expect(horasDecimais(1800)).toBe('0,5')
  })

  it('protege contra fórmulas e escapa aspas e separadores', () => {
    expect(celulaCsv('=SOMA(A1)')).toBe("'=SOMA(A1)")
    expect(celulaCsv('a;b')).toBe('"a;b"')
    expect(celulaCsv('diz "oi"')).toBe('"diz ""oi"""')
    expect(celulaCsv('normal')).toBe('normal')
  })

  it('arquivo com BOM, cabeçalho, ";" e CRLF; nome com o período', () => {
    const csv = gerarCsvTempo([
      { dia: '2026-11-24', clienteNome: 'Loja Aurora', listaNome: 'Reels', tarefaTitulo: 'Roteiro', pessoaNome: 'Ana Souza', nota: null, segundos: 4200, faturavel: true },
      { dia: '2026-11-25', clienteNome: null, listaNome: 'Interno', tarefaTitulo: 'Reunião; semanal', pessoaNome: 'Bruno', nota: 'ok', segundos: 1800, faturavel: false },
    ])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Data;Cliente;Lista;Tarefa;Pessoa;Nota;Horas;Faturável',
      '24/11/2026;Loja Aurora;Reels;Roteiro;Ana Souza;;1,17;Sim',
      '25/11/2026;Sem cliente;Interno;"Reunião; semanal";Bruno;ok;0,5;Não',
      '',
    ])
    expect(nomeArquivoCsvTempo('2026-11-01', '2026-11-30')).toBe('tempo-2026-11-01_a_2026-11-30.csv')
  })
})
