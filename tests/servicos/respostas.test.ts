import { beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { criarDbTeste } from '../ajuda/db'
import { campos, midia } from '../ajuda/fabrica'
import type { Db } from '@/db/conexao'
import { posts, respostas } from '@/db/schema'
import { criarCliente } from '@/servicos/clientes'
import { criarPost, detalhePost, enviarParaAprovacao, salvarEdicao } from '@/servicos/posts'
import { postParaCliente, postsDoClienteParaVer, responder } from '@/servicos/respostas'

let db: Db
let clienteId: string
beforeEach(async () => {
  db = await criarDbTeste()
  clienteId = (await criarCliente(db, 'Cliente')).id
})

async function postAguardando(cid = clienteId, data = '2026-10-07') {
  const id = await criarPost(db, cid, 'feed', data)
  await salvarEdicao(db, id, campos({ dataPrevista: data }), [midia(id)])
  await enviarParaAprovacao(db, id)
  return id
}

const entrada = (postId: string, extra: Partial<Parameters<typeof responder>[1]> = {}) => ({
  clienteId,
  postId,
  versaoNumero: 1,
  decisao: 'aprovado' as const,
  comentario: '',
  nome: 'Maria',
  ...extra,
})

describe('responder', () => {
  it('aprova sem comentário e grava nome', async () => {
    const id = await postAguardando()
    await responder(db, entrada(id))
    const d = await detalhePost(db, id)
    expect(d.post.status).toBe('aprovado')
    expect(d.versoes[0].resposta).toMatchObject({ decisao: 'aprovado', comentario: '', nomeRespondente: 'Maria' })
  })

  it('pedido de ajuste exige comentário', async () => {
    const id = await postAguardando()
    await expect(responder(db, entrada(id, { decisao: 'ajuste', comentario: '   ' }))).rejects.toMatchObject({
      codigo: 'comentario_obrigatorio',
    })
    await responder(db, entrada(id, { decisao: 'ajuste', comentario: 'A 3ª imagem está escura' }))
    expect((await detalhePost(db, id)).post.status).toBe('ajuste')
  })

  it('exige nome', async () => {
    const id = await postAguardando()
    await expect(responder(db, entrada(id, { nome: ' ' }))).rejects.toMatchObject({ codigo: 'nome_obrigatorio' })
  })

  it('recusa resposta a versão desatualizada sem gravar nada', async () => {
    const id = await postAguardando()
    await responder(db, entrada(id, { decisao: 'ajuste', comentario: 'x' }))
    await salvarEdicao(db, id, campos(), [midia(id)])
    await expect(responder(db, entrada(id, { versaoNumero: 1 }))).rejects.toMatchObject({
      codigo: 'versao_desatualizada',
    })
    expect((await detalhePost(db, id)).post.status).toBe('aguardando')
    await responder(db, entrada(id, { versaoNumero: 2 }))
    expect((await detalhePost(db, id)).post.status).toBe('aprovado')
  })

  it('recusa post em rascunho ou já respondido', async () => {
    const rascunho = await criarPost(db, clienteId, 'feed', '2026-10-07')
    await expect(responder(db, entrada(rascunho))).rejects.toMatchObject({ codigo: 'nao_encontrado' })
    const id = await postAguardando()
    await db.update(posts).set({ status: 'aprovado' }).where(eq(posts.id, id))
    await expect(responder(db, entrada(id))).rejects.toMatchObject({ codigo: 'status_invalido' })
  })

  it('duplo toque em sequência grava uma resposta só', async () => {
    const id = await postAguardando()
    await responder(db, entrada(id))
    await expect(responder(db, entrada(id))).rejects.toMatchObject({ codigo: 'status_invalido' })
    expect(await db.select().from(respostas)).toHaveLength(1)
  })

  it('duplo toque concorrente grava uma resposta só', async () => {
    const id = await postAguardando()
    const r = await Promise.allSettled([responder(db, entrada(id)), responder(db, entrada(id))])
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1)
    expect(await db.select().from(respostas)).toHaveLength(1)
  })

  it('não responde post de outro cliente', async () => {
    const outro = await criarCliente(db, 'Outro')
    const id = await postAguardando(outro.id)
    await expect(responder(db, entrada(id))).rejects.toMatchObject({ codigo: 'nao_encontrado' })
  })
})

describe('visão do cliente', () => {
  it('separa pendentes e respondidos e esconde rascunho', async () => {
    const pend = await postAguardando(clienteId, '2026-10-02')
    const resp = await postAguardando(clienteId, '2026-10-01')
    await responder(db, entrada(resp))
    await criarPost(db, clienteId, 'feed', '2026-10-03')
    const v = await postsDoClienteParaVer(db, clienteId)
    expect(v.pendentes.map((p) => p.id)).toEqual([pend])
    expect(v.respondidos.map((p) => p.id)).toEqual([resp])
  })

  it('postParaCliente esconde rascunho e posts de outros clientes', async () => {
    const outro = await criarCliente(db, 'Outro')
    const alheio = await postAguardando(outro.id)
    const rascunho = await criarPost(db, clienteId, 'feed', '2026-10-07')
    const meu = await postAguardando()
    await expect(postParaCliente(db, clienteId, alheio)).rejects.toMatchObject({ codigo: 'nao_encontrado' })
    await expect(postParaCliente(db, clienteId, rascunho)).rejects.toMatchObject({ codigo: 'nao_encontrado' })
    await expect(postParaCliente(db, clienteId, 'nao-e-uuid')).rejects.toMatchObject({ codigo: 'nao_encontrado' })
    expect((await postParaCliente(db, clienteId, meu)).post.id).toBe(meu)
  })
})
