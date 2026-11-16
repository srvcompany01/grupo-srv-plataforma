import { describe, expect, it } from 'vitest'
import { partesEmBelem, proximasJanelas, ranquearHorarios, type PostHistorico } from '@/dominio/horarios-postagem'

// Belém = UTC-3: 15:00Z = 12:00 em Belém; 21:00Z = 18:00.
const post = (iso: string, alcance: number): PostHistorico => ({ publicadoEm: iso, alcance })

describe('partesEmBelem', () => {
  it('converte para o horário de Belém (e o dia da semana)', () => {
    expect(partesEmBelem('2026-11-03T15:00:00Z')).toEqual({ diaSemana: 2, hora: 12, data: '2026-11-03' }) // terça
    expect(partesEmBelem('2026-11-04T01:30:00Z')).toEqual({ diaSemana: 2, hora: 22, data: '2026-11-03' }) // ainda terça à noite
  })
})

describe('ranquearHorarios', () => {
  it('com pouco histórico usa os horários padrão e avisa', () => {
    const r = ranquearHorarios([post('2026-11-03T15:00:00Z', 100)])
    expect(r.baseadoEmDados).toBe(false)
    expect(r.horarios.length).toBeGreaterThan(0)
  })

  it('com histórico, o horário que mais alcança vem primeiro', () => {
    const em = (base: string, dias: number, hora: string) => { const d = new Date(`${base}T${hora}Z`); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString() }
    const posts: PostHistorico[] = []
    for (let s = 0; s < 6; s++) posts.push(post(em('2026-10-06', s * 7, '21:00:00'), 1000)) // terças 18h: alto
    for (let s = 0; s < 4; s++) posts.push(post(em('2026-10-08', s * 7, '12:00:00'), 200)) // quintas 9h: baixo
    const r = ranquearHorarios(posts)
    expect(r.baseadoEmDados).toBe(true)
    expect(r.horarios[0]).toMatchObject({ diaSemana: 2, hora: 18 })
  })
})

describe('proximasJanelas', () => {
  const ranking = { baseadoEmDados: true, totalPosts: 20, horarios: [{ diaSemana: 2, hora: 18, pontuacao: 1.4, amostras: 6 }, { diaSemana: 4, hora: 12, pontuacao: 1.2, amostras: 5 }] }

  it('um post por dia, só nos dias com horário bom, em ordem', () => {
    const j = proximasJanelas(ranking, { agoraIso: '2026-11-02T12:00:00Z', quantidade: 3 }) // segunda
    expect(j.map((x) => `${x.data} ${x.hora}`)).toEqual(['2026-11-03 18:00', '2026-11-05 12:00', '2026-11-10 18:00'])
  })

  it('pula dias que já têm post agendado e horários que já passaram', () => {
    const j = proximasJanelas(ranking, { agoraIso: '2026-11-03T22:00:00Z', quantidade: 2, ocupados: ['2026-11-05T15:00:00Z'] }) // terça 19h (18h já passou); quinta ocupada
    expect(j.map((x) => x.data)).toEqual(['2026-11-10', '2026-11-12'])
  })
})
