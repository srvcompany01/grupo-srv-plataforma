import { defineConfig } from '@playwright/test'

/**
 * Testes de navegador (só leitura: abrem as telas, não gravam nada).
 * `E2E_URL` aponta o alvo (padrão: servidor local). Com `E2E_EMAIL` e `E2E_SENHA` de um usuário da equipe,
 * rodam também as telas internas; sem eles, só as páginas públicas.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: process.env.E2E_URL ?? 'http://localhost:3000', browserName: 'chromium', trace: 'retain-on-failure' },
})
