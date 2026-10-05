import { beforeAll, expect, it } from 'vitest'
import { gerarChave, urlLeitura, urlUpload } from '@/infra/r2'

beforeAll(() => {
  Object.assign(process.env, {
    R2_ACCOUNT_ID: 'conta',
    R2_ACCESS_KEY_ID: 'chave',
    R2_SECRET_ACCESS_KEY: 'segredo',
    R2_BUCKET: 'srv-conteudo',
  })
})

it('gera chave dentro do post com extensão minúscula', () => {
  expect(gerarChave('p1', 'Foto Final.JPG')).toMatch(/^posts\/p1\/[0-9a-f-]{36}\.jpg$/)
  expect(gerarChave('p1', 'semextensao')).toMatch(/^posts\/p1\/[0-9a-f-]{36}$/)
})

it('URL de upload expira em 1 h e aponta para o bucket', async () => {
  const u = await urlUpload('posts/p1/a.jpg', 'image/jpeg', 100)
  expect(u).toContain('https://conta.r2.cloudflarestorage.com/srv-conteudo/posts/p1/a.jpg')
  expect(u).toContain('X-Amz-Expires=3600')
})

it('URL de leitura expira em 6 h e pode forçar download', async () => {
  expect(await urlLeitura('posts/p1/a.mp4')).toContain('X-Amz-Expires=21600')
  const d = await urlLeitura('posts/p1/a.mp4', { download: 'vídeo final.mov' })
  expect(decodeURIComponent(d)).toContain('attachment')
})

it('URL de upload não carrega checksum de corpo vazio (o R2 recusaria o arquivo real)', async () => {
  const u = await urlUpload('posts/p1/a.jpg', 'image/jpeg', 100)
  expect(u.toLowerCase()).not.toContain('x-amz-checksum')
  expect(u.toLowerCase()).not.toContain('x-amz-sdk-checksum-algorithm')
})
