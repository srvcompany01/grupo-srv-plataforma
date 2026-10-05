import { expect, it } from 'vitest'
import { criarDbTeste } from '../ajuda/db'
import { campos, midia } from '../ajuda/fabrica'
import { criarCliente } from '@/servicos/clientes'
import { criarPost, enviarParaAprovacao, salvarEdicao } from '@/servicos/posts'

// O PGlite serializa tudo, então a corrida "agência salva enquanto cliente aprova"
// não acontece aqui. Checamos que o post é lido com trava de linha, que é o que a
// impede no Neon: sem ela, uma edição sobrescreveria a versão recém-aprovada.

it('salvarEdicao lê o post com FOR UPDATE', async () => {
  const consultas: string[] = []
  const db = await criarDbTeste(consultas)
  const id = await criarPost(db, (await criarCliente(db, 'C')).id, 'feed', '2026-10-07')
  consultas.length = 0
  await salvarEdicao(db, id, campos(), [midia(id)])
  expect(consultas.find((q) => /from "posts"/i.test(q) && /^select/i.test(q))).toMatch(/for update/i)
})

it('enviarParaAprovacao lê o post com FOR UPDATE', async () => {
  const consultas: string[] = []
  const db = await criarDbTeste(consultas)
  const id = await criarPost(db, (await criarCliente(db, 'C')).id, 'feed', '2026-10-07')
  await salvarEdicao(db, id, campos(), [midia(id)])
  consultas.length = 0
  await enviarParaAprovacao(db, id)
  expect(consultas.find((q) => /from "posts"/i.test(q) && /^select/i.test(q))).toMatch(/for update/i)
})
