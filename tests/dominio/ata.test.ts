import { describe, expect, it } from 'vitest'
import { CHAVE_REUNIAO, conteudoDaAta, extensaoDaGravacao, lerAta, mimeDaGravacao } from '@/dominio/ata'

describe('notetaker', () => {
  it('aceita só áudio/vídeo de reunião e tira os parâmetros do tipo', () => {
    expect(mimeDaGravacao('audio/webm;codecs=opus')).toBe('audio/webm')
    expect(mimeDaGravacao('video/mp4')).toBe('video/mp4')
    expect(mimeDaGravacao('application/pdf')).toBeNull()
    expect(extensaoDaGravacao('audio/x-m4a')).toBe('m4a')
    expect(CHAVE_REUNIAO.test('reunioes/0b8c1f7e-3a2d-4c1b-9e0f-1234567890ab.webm')).toBe(true)
    expect(CHAVE_REUNIAO.test('tarefas/x/0b8c1f7e-3a2d-4c1b-9e0f-1234567890ab.webm')).toBe(false)
    expect(CHAVE_REUNIAO.test('reunioes/../segredo.webm')).toBe(false)
  })

  it('lê o JSON da IA, mesmo com cerca de código e campos ruins', () => {
    const ata = lerAta('```json\n{"titulo":"Planejamento","resumo":"Falamos do lançamento.","participantes":["Ana",3],"topicos":[{"titulo":"Mídia","pontos":["Subir verba"]}],"decisoes":["Aprovar orçamento"],"proximosPassos":[{"acao":"Enviar proposta","responsavel":"Bia","prazo":"2026-10-30"},{"acao":"Revisar","prazo":"sexta"},{"acao":""}],"transcricao":"Ana: oi\\nBia: olá"}\n```')
    expect(ata).toMatchObject({ titulo: 'Planejamento', participantes: ['Ana'], decisoes: ['Aprovar orçamento'] })
    expect(ata!.proximosPassos).toEqual([{ acao: 'Enviar proposta', responsavel: 'Bia', prazo: '2026-10-30' }, { acao: 'Revisar', responsavel: null, prazo: null }])
    expect(lerAta('não é json')).toBeNull()
    expect(lerAta('{"titulo":"x"}')).toBeNull()
  })

  it('monta a página da ata com títulos e listas', () => {
    const ata = lerAta('{"resumo":"Ok.","decisoes":[],"proximosPassos":[{"acao":"Ligar","responsavel":"Ana","prazo":"2026-11-02"}],"transcricao":"a"}')!
    const doc = conteudoDaAta(ata, { data: '2026-10-22', duracaoMin: 35, cliente: 'Padaria' }) as { content: { type: string; content?: unknown[] }[] }
    const tipos = doc.content.map((n) => n.type)
    expect(tipos.filter((x) => x === 'heading')).toHaveLength(3) // Resumo, Decisões, Próximos passos
    expect(JSON.stringify(doc)).toContain('Reunião de 22/10/2026 · 35 min · Cliente: Padaria')
    expect(JSON.stringify(doc)).toContain('Ligar — Ana (até 02/11/2026)')
  })
})
