import { describe, expect, it } from 'vitest'
import { lerFiltros } from '@/dominio/filtros'
import { enderecoDaVisao, normalizarVisao, resolverVisao, temParametrosDeVisao } from '@/dominio/visao-salva'

describe('visão salva', () => {
  it('URL limpa não tem parâmetros de visão; qualquer escolha tem', () => {
    expect(temParametrosDeVisao({})).toBe(false)
    expect(temParametrosDeVisao({ outra: 'x' })).toBe(false)
    expect(temParametrosDeVisao({ grupo: 'mes' })).toBe(true)
    expect(temParametrosDeVisao({ ed: '1' })).toBe(true)
  })

  it('normaliza: ordem, lixo e marcador não contam; padrão vira vazio', () => {
    expect(normalizarVisao('visao=kanban&lixo=1&ed=1')).toBe('visao=kanban')
    expect(normalizarVisao('ed=1')).toBe('')
    expect(normalizarVisao('grupo=status&visao=lista')).toBe('')
    expect(normalizarVisao({ visao: 'calendario', grupo: 'mes' })).toBe(normalizarVisao('grupo=mes&visao=calendario'))
  })

  it('sem salva: URL limpa é o original e não está alterada', () => {
    const r = resolverVisao({}, null)
    expect(r.alterada).toBe(false)
    expect(lerFiltros(r.spEfetivo).visao).toBe('lista')
  })

  it('com salva: URL limpa abre a salva e não está alterada', () => {
    const r = resolverVisao({}, 'visao=kanban')
    expect(lerFiltros(r.spEfetivo).visao).toBe('kanban')
    expect(r.alterada).toBe(false)
  })

  it('mudou a visualização: aparece como alterada, com ou sem salva', () => {
    expect(resolverVisao({ grupo: 'mes' }, null).alterada).toBe(true)
    expect(resolverVisao({ grupo: 'mes' }, 'visao=kanban').alterada).toBe(true)
    expect(resolverVisao({ visao: 'kanban' }, 'visao=kanban').alterada).toBe(false)
  })

  it('voltar ao padrão (ed=1) com uma salva conta como alterada e NÃO reabre a salva', () => {
    const r = resolverVisao({ ed: '1' }, 'visao=kanban')
    expect(lerFiltros(r.spEfetivo).visao).toBe('lista')
    expect(r.alterada).toBe(true)
  })

  it('endereço da visão padrão leva o marcador', () => {
    const padrao = lerFiltros({})
    expect(enderecoDaVisao('/listas/x', padrao)).toBe('/listas/x?ed=1')
    expect(enderecoDaVisao('/listas/x', lerFiltros({ visao: 'kanban' }))).toBe('/listas/x?visao=kanban')
  })
})
