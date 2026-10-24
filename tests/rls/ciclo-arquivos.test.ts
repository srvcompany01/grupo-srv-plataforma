import { describe, expect, it } from 'vitest'
import { criarBanco, ler } from '../ajuda/banco'
import { criarUsuario } from '../ajuda/cenario'

describe('ciclo de arquivos', () => {
  it('criativo enviado à Meta vence em 90 dias; o não enviado nunca; só a chave mestra consulta', async () => {
    const db = await criarBanco()
    const membro = await criarUsuario(db, { role: 'membro' })
    const { rows } = await db.query<{ id: string }>(`insert into public.clients (name) values ('Ouro') returning id`)
    const ins = (nome: string, meta: string, dias: number) => db.query(`insert into ad_creatives (client_id, nome, tipo, chave, mime, tamanho, meta, created_at) values ($1, $2, 'imagem', 'criativos/x/' || $2, 'image/jpeg', 100, $3::jsonb, now() - make_interval(days => $4))`, [rows[0].id, nome, meta, dias])
    await ins('velho', '{"1":"h"}', 95)
    await ins('quase', '{"1":"h"}', 86)
    await ins('nunca-enviado', '{}', 400)
    const nomes = async (dias: number) => (await db.query<{ nome: string }>(`select nome from arquivos_a_arquivar($1)`, [dias])).rows.map((r) => r.nome)
    expect(await nomes(0)).toEqual(['velho'])
    expect(await nomes(7)).toEqual(['velho', 'quase'])
    expect((await db.query<{ tipo: string; arquivos: number }>(`select tipo, arquivos::int from uso_armazenamento() where tipo = 'criativo'`)).rows).toEqual([{ tipo: 'criativo', arquivos: 3 }])
    await expect(ler(db, membro, `select * from arquivos_a_arquivar(0)`)).rejects.toThrow(/permission denied/)
  })
})
