import { expect, test, type Page } from '@playwright/test'

/**
 * Abre cada tela interna com um usuário da equipe e acusa erro de carregamento (tela "Algo deu errado",
 * resposta 4xx/5xx ou exceção no navegador). Só leitura. Precisa de E2E_EMAIL e E2E_SENHA.
 */
const EMAIL = process.env.E2E_EMAIL
const SENHA = process.env.E2E_SENHA

const TELAS = [
  '/home', '/inicio', '/novo/anuncios', '/agenda', '/agendamentos', '/anuncios', '/biolytics', '/caixa-de-entrada', '/chat', '/clientes', '/clientes/relatorio',
  '/config', '/config/armazenamento', '/config/campos', '/config/campos-clientes', '/config/custos', '/config/design', '/config/espacos',
  '/config/formularios', '/config/integracoes', '/config/personalizacao', '/config/usuarios', '/documentos', '/editor-blog', '/estrategia',
  '/financeiro', '/funis', '/gmn', '/insights', '/painel-de-gestao', '/performance', '/projetos', '/quadros', '/redes', '/reunioes', '/time',
]

test.describe('telas internas', () => {
  test.skip(!EMAIL || !SENHA, 'defina E2E_EMAIL e E2E_SENHA (usuário da equipe) para testar as telas internas')
  test.describe.configure({ mode: 'serial' })

  let page: Page
  const excecoes: string[] = []

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    page.on('pageerror', (e) => excecoes.push(e.message))
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(EMAIL!)
    await page.getByLabel('Senha').fill(SENHA!)
    await page.getByLabel('Senha').press('Enter')
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 })
  })
  test.afterAll(async () => page?.close())

  for (const tela of TELAS) {
    test(`abre ${tela}`, async () => {
      excecoes.length = 0
      const resposta = await page.goto(tela, { waitUntil: 'domcontentloaded' })
      expect(resposta?.status(), 'código da resposta').toBeLessThan(400)
      expect(new URL(page.url()).pathname, 'não deve cair no login').not.toMatch(/^\/login/)
      // Espera os blocos que chegam depois (Meta, Google) sem travar em conexões abertas (chat, presença).
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
      await expect(page.getByText('Algo deu errado')).toHaveCount(0)
      expect(excecoes, 'exceções no navegador').toEqual([])
    })
  }
})
