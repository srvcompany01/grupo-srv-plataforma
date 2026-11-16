import { expect, test } from '@playwright/test'

const local = /localhost|127\.0\.0\.1/.test(process.env.E2E_URL ?? 'http://localhost:3000')

test('login abre com o formulário da equipe', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()
})

test('tela interna sem sessão manda para o login', async ({ page }) => {
  await page.goto('/home')
  await expect(page).toHaveURL(/\/login/)
})

test('respostas levam os cabeçalhos de segurança', async ({ request }) => {
  const h = (await request.get('/login')).headers()
  expect(h['x-frame-options']).toBe('SAMEORIGIN')
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['content-security-policy']).toContain('frame-ancestors')
})

// Só no servidor local: em produção há várias instâncias e a contagem é por instância.
test('rota pública barra depois de 10 pedidos por minuto', async ({ request }) => {
  test.skip(!local, 'limite em memória: só confiável numa instância única')
  const ip = `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`
  const codigos: number[] = []
  for (let i = 0; i < 12; i++) codigos.push((await request.post('/api/blog/newsletter', { data: 'x', headers: { 'x-forwarded-for': ip, 'content-type': 'text/plain' } })).status())
  expect(codigos.slice(0, 10)).not.toContain(429)
  expect(codigos.slice(10)).toEqual([429, 429])
})
