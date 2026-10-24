import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { comoUsuario, criarBanco } from '../ajuda/banco'
import { criarCliente, criarUsuario } from '../ajuda/cenario'

describe('migração 61: formato publicado', () => {
  it('post "feed" publicado como Reels vira reels; os outros ficam como estão', async () => {
    const db = await criarBanco()
    const cliente = await criarCliente(db, 'Aurum')
    const ana = await criarUsuario(db, { role: 'membro' })
    const lista = (await db.query<{ id: string }>(`select id from lists where slug = 'social-conteudo'`)).rows[0].id
    const novo = () => comoUsuario(db, ana, async (tx) => (await tx.query<{ id: string }>(`select criar_post_conteudo($1, $2, 'Post', 'feed', '2026-11-05') as id`, [lista, cliente])).rows[0].id)
    const [reel, foto, rascunho] = [await novo(), await novo(), await novo()]
    await db.query(`update content_posts set publish_status = 'publicado', ig_permalink = 'https://www.instagram.com/reel/Dez-MxpCRAW/' where task_id = $1`, [reel])
    await db.query(`update content_posts set publish_status = 'publicado', ig_permalink = 'https://www.instagram.com/p/ABC/' where task_id = $1`, [foto])
    await db.query(`update content_posts set ig_permalink = 'https://www.instagram.com/reel/X/' where task_id = $1`, [rascunho])
    await db.query(readFileSync('supabase/migrations/20261024000061_formato_publicado.sql', 'utf8'))
    const f = async (id: string) => (await db.query<{ format: string }>(`select format from content_posts where task_id = $1`, [id])).rows[0].format
    expect([await f(reel), await f(foto), await f(rascunho)]).toEqual(['reels', 'feed', 'feed'])
  })
})
