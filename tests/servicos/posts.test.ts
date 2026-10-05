import { beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { criarDbTeste } from '../ajuda/db'
import { campos, midia } from '../ajuda/fabrica'
import type { Db } from '@/db/conexao'
import { posts } from '@/db/schema'
import type { Status } from '@/dominio/tipos'
import { criarCliente } from '@/servicos/clientes'
import { criarPost, detalhePost, enviarParaAprovacao, listarPosts, salvarEdicao } from '@/servicos/posts'

let db: Db
let clienteId: string
beforeEach(async () => {
  db = await criarDbTeste()
  clienteId = (await criarCliente(db, 'Cliente')).id
})

const forcarStatus = (id: string, status: Status) => db.update(posts).set({ status }).where(eq(posts.id, id))

describe('posts', () => {
  it('cria post em rascunho com versão 1 vazia', async () => {
    const id = await criarPost(db, clienteId, 'reels', '2026-10-07')
    const d = await detalhePost(db, id)
    expect(d.post.status).toBe('rascunho')
    expect(d.post.formato).toBe('reels')
    expect(d.versoes.map((v) => v.numero)).toEqual([1])
    expect(d.versoes[0].legenda).toBe('')
    expect(d.cliente.id).toBe(clienteId)
  })

  it('editar rascunho altera a versão 1 e preserva a legenda exata', async () => {
    const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
    const legenda = 'Linha 1\n\n🔥 #ouro  com espaço'
    await salvarEdicao(db, id, campos({ legenda, formato: 'stories', dataPrevista: '2026-11-01' }), [midia(id)])
    const d = await detalhePost(db, id)
    expect(d.versoes).toHaveLength(1)
    expect(d.versoes[0].legenda).toBe(legenda)
    expect(d.post.status).toBe('rascunho')
    expect(d.post.formato).toBe('stories')
    expect(d.post.dataPrevista).toBe('2026-11-01')
    expect(d.versoes[0].midias).toHaveLength(1)
  })

  it('editar aguardando altera a versão atual sem criar outra', async () => {
    const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
    await salvarEdicao(db, id, campos(), [midia(id)])
    await enviarParaAprovacao(db, id)
    await salvarEdicao(db, id, campos({ ideia: 'Nova' }), [midia(id, 'imagem', 'b.jpg')])
    const d = await detalhePost(db, id)
    expect(d.versoes).toHaveLength(1)
    expect(d.versoes[0].ideia).toBe('Nova')
    expect(d.versoes[0].midias.map((m) => m.nomeOriginal)).toEqual(['b.jpg'])
    expect(d.post.status).toBe('aguardando')
  })

  for (const status of ['ajuste', 'aprovado'] as const) {
    it(`editar em ${status} cria versão 2 e congela a 1`, async () => {
      const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
      await salvarEdicao(db, id, campos({ ideia: 'V1' }), [midia(id, 'imagem', 'v1.jpg')])
      await enviarParaAprovacao(db, id)
      await forcarStatus(id, status)
      await salvarEdicao(db, id, campos({ ideia: 'V2' }), [midia(id, 'video', 'v2.mp4')])
      const d = await detalhePost(db, id)
      expect(d.post.status).toBe('aguardando')
      expect(d.versoes.map((v) => [v.numero, v.ideia])).toEqual([
        [2, 'V2'],
        [1, 'V1'],
      ])
      expect(d.versoes[0].midias.map((m) => m.nomeOriginal)).toEqual(['v2.mp4'])
      expect(d.versoes[1].midias.map((m) => m.nomeOriginal)).toEqual(['v1.jpg'])
    })
  }

  it('recusa chave de mídia de outro post', async () => {
    const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
    const outro = await criarPost(db, clienteId, 'feed', '2026-10-07')
    await expect(salvarEdicao(db, id, campos(), [midia(outro)])).rejects.toMatchObject({ codigo: 'chave_invalida' })
    await expect(
      salvarEdicao(db, id, campos(), [{ ...midia(id), chave: `posts/${id}/../${outro}/a.jpg` }]),
    ).rejects.toMatchObject({ codigo: 'chave_invalida' })
  })

  it('rascunho pode ficar sem mídia, mas não pode ser enviado assim', async () => {
    const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
    await salvarEdicao(db, id, campos(), [])
    await expect(enviarParaAprovacao(db, id)).rejects.toMatchObject({ codigo: 'sem_midia' })
    expect((await detalhePost(db, id)).post.status).toBe('rascunho')
  })

  for (const status of ['aguardando', 'ajuste', 'aprovado'] as const) {
    it(`em ${status} não aceita salvar sem mídia`, async () => {
      const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
      await salvarEdicao(db, id, campos(), [midia(id)])
      await forcarStatus(id, status)
      await expect(salvarEdicao(db, id, campos(), [])).rejects.toMatchObject({ codigo: 'sem_midia' })
    })
  }

  it('recusa conjunto de mídias inválido', async () => {
    const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
    await expect(
      salvarEdicao(db, id, campos(), [midia(id, 'video', 'a.mp4'), midia(id, 'imagem', 'b.jpg')]),
    ).rejects.toMatchObject({ codigo: 'midias_invalidas' })
  })

  it('só envia a partir de rascunho', async () => {
    const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
    await salvarEdicao(db, id, campos(), [midia(id)])
    await enviarParaAprovacao(db, id)
    expect((await detalhePost(db, id)).post.status).toBe('aguardando')
    await expect(enviarParaAprovacao(db, id)).rejects.toMatchObject({ codigo: 'status_invalido' })
  })

  it('preserva a ordem do carrossel', async () => {
    const id = await criarPost(db, clienteId, 'feed', '2026-10-07')
    const nomes = ['c.jpg', 'a.jpg', 'b.jpg']
    await salvarEdicao(db, id, campos(), nomes.map((n) => midia(id, 'imagem', n)))
    const d = await detalhePost(db, id)
    expect(d.versoes[0].midias.map((m) => [m.ordem, m.nomeOriginal])).toEqual([
      [0, 'c.jpg'],
      [1, 'a.jpg'],
      [2, 'b.jpg'],
    ])
  })

  it('lista por data com filtro de status e ideia da versão atual', async () => {
    const tarde = await criarPost(db, clienteId, 'feed', '2026-12-01')
    const cedo = await criarPost(db, clienteId, 'feed', '2026-10-01')
    const rasc = await criarPost(db, clienteId, 'feed', '2026-09-01')
    for (const [id, dataPrevista] of [[tarde, '2026-12-01'], [cedo, '2026-10-01']]) {
      await salvarEdicao(db, id, campos({ ideia: `ideia ${id}`, dataPrevista }), [midia(id)])
      await enviarParaAprovacao(db, id)
    }
    expect((await listarPosts(db, clienteId)).map((p) => p.id)).toEqual([rasc, cedo, tarde])
    const aguardando = await listarPosts(db, clienteId, 'aguardando')
    expect(aguardando.map((p) => p.id)).toEqual([cedo, tarde])
    expect(aguardando[0]).toMatchObject({ ideia: `ideia ${cedo}`, versaoAtual: 1, status: 'aguardando' })
  })

  it('detalhePost lança nao_encontrado', async () => {
    await expect(detalhePost(db, '00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
      codigo: 'nao_encontrado',
    })
  })
})

it('salvarEdicao recusa mídia com tipo que não bate com o arquivo', async () => {
  const db = await criarDbTeste()
  const id = await criarPost(db, (await criarCliente(db, 'X')).id, 'feed', '2026-10-07')
  await expect(salvarEdicao(db, id, campos(), [{ ...midia(id, 'imagem', 'a.mp4') }])).rejects.toMatchObject({
    codigo: 'midias_invalidas',
  })
  await expect(salvarEdicao(db, id, campos(), [{ ...midia(id), tamanhoBytes: -1 }])).rejects.toMatchObject({
    codigo: 'midias_invalidas',
  })
})
