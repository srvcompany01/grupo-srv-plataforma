import { describe, expect, it } from 'vitest'
import { destinoPorPapel, rotaPublica } from '@/dominio/acesso'

describe('rotaPublica', () => {
  it.each([
    ['/login', true],
    ['/login/nova-senha', true],
    ['/auth/confirmar', true],
    ['/admin', true],
    ['/admin/posts/1', true],
    ['/c/abc', true],
    ['/cliente/padaria-abc123', true],
    ['/clientes', false],
    ['/clientes/1', false],
    ['/f/abc', true],
    ['/api/cron/recorrencias', true],
    ['/api/mcp', true],
    ['/api/dev-arquivos/x', true],
    ['/robots.txt', true],
    ['/', false],
    ['/inicio', false],
    ['/listas/1', false],
    ['/portal', false],
    ['/administrativo', false],
    ['/cadastro', false],
  ])('%s → %s', (caminho, esperado) => {
    expect(rotaPublica(caminho)).toBe(esperado)
  })
})

describe('destinoPorPapel', () => {
  it.each([
    ['/listas/1', null, false, '/login'],
    ['/listas/1', 'membro', false, '/login'],
    ['/portal', 'cliente', false, '/login'],
    ['/listas/1', 'cliente', true, '/portal'],
    ['/inicio', 'cliente', true, '/portal'],
    ['/portal', 'cliente', true, null],
    ['/portal/tarefas/1', 'cliente', true, null],
    ['/portal', 'membro', true, '/inicio'],
    ['/portal/x', 'admin', true, '/inicio'],
    ['/', 'gestor', true, '/inicio'],
    ['/', 'cliente', true, '/portal'],
    ['/listas/1', 'membro', true, null],
    ['/config/usuarios', 'admin', true, null],
    ['/login', null, false, null],
    ['/admin', null, false, null],
  ] as const)('%s como %s (ativo=%s) → %s', (caminho, papel, ativo, esperado) => {
    expect(destinoPorPapel(caminho, papel, ativo)).toBe(esperado)
  })
})
