import { describe, expect, it } from 'vitest'
import { classificacoesDasMensagens, classificacoesDosNegocios, contaDoEvento, ETAPA_GANHO, formaDe, lerEventoKommo, lerFormularioKommo, papelDaMensagem, planejarEvento, negocioDaApi, temTexto, type NegocioGuardado } from '@/dominio/kommo'

describe('webhook do Kommo', () => {
  it('formulário aninhado vira objeto, com listas pelos índices', () => {
    const r = lerFormularioKommo('account%5Bsubdomain%5D=aurum&account%5Bid%5D=77&leads%5Bstatus%5D%5B0%5D%5Bid%5D=111&leads%5Bstatus%5D%5B0%5D%5Bstatus_id%5D=142&leads%5Bstatus%5D%5B0%5D%5Bpipeline_id%5D=9&leads%5Bstatus%5D%5B1%5D%5Bid%5D=222')
    expect(r).toEqual({ account: { subdomain: 'aurum', id: '77' }, leads: { status: [{ id: '111', status_id: '142', pipeline_id: '9' }, { id: '222' }] } })
    expect(contaDoEvento(r)).toBe('aurum')
    expect(contaDoEvento({})).toBe('')
  })

  it('corpo vazio ou sem estrutura não quebra', () => {
    expect(lerFormularioKommo('')).toEqual({})
    expect(lerFormularioKommo('a=1&b=2')).toEqual({ a: '1', b: '2' })
  })

  it('formaDe mostra só chaves e tipos, nunca valores de clientes', () => {
    const forma = formaDe({ id: 1, name: 'Maria Silva', price: 1250, custom_fields_values: [{ field_name: 'Telefone', values: [{ value: '5591999999999' }] }], loss_reason: null })
    expect(JSON.stringify(forma)).not.toMatch(/Maria|5591999999999|1250/)
    expect(forma).toMatchObject({ id: 'number', name: 'string', price: 'number', loss_reason: 'null' })
  })

  it('temTexto avisa se o evento traz o texto da mensagem, sem devolvê-lo', () => {
    expect(temTexto({ message: { add: [{ id: '1', text: 'Oi, quero saber o preço' }] } })).toBe(true)
    expect(temTexto({ message: { add: [{ id: '1', text: '' }] } })).toBe(false)
    expect(temTexto({ leads: { status: [{ id: '1', status_id: '142' }] }, account: { subdomain: 'a' } })).toBe(false)
    expect(temTexto({ text: 'fora de mensagem' })).toBe(false)
  })

  it('classifica as mensagens por tipo, autor e canal, sem devolver nome nem texto', () => {
    const r = classificacoesDasMensagens([
      { message: { add: [{ text: 'Oi', message_type: 'incoming', origin: 'waba', element_type: 'lead', author: { id: '1', name: 'Maria', type: 'contact' } }] } },
      { message: { add: [{ text: 'Olá!', message_type: 'outgoing', origin: 'waba', element_type: 'lead', author: { id: '2', name: 'Ana', type: 'user' } }, { text: 'Bot', message_type: 'outgoing', origin: 'waba', author: { type: 'bot' } }] } },
      { talk: { update: [{ talk_id: '1' }] } },
    ])
    expect(r).toEqual({ message_type: { incoming: 1, outgoing: 2 }, author_type: { contact: 1, user: 1, bot: 1 }, origin: { waba: 3 }, element_type: { lead: 2, sem: 1 } })
    expect(JSON.stringify(r)).not.toMatch(/Maria|Ana|Oi|Olá/)
  })

  it('classifica os eventos de negócio: etapa nova, anterior, funil, etiquetas e valor, sem nomes', () => {
    const r = classificacoesDosNegocios([
      { leads: { status: [{ id: '1', name: 'Maria', price: '1250', status_id: '142', old_status_id: '107884167', pipeline_id: '13978643', tags: [{ id: '9', name: 'Meta Ads' }] }], update: [{ id: '1', name: 'Maria', price: '1250', status_id: '142', pipeline_id: '13978643' }] } },
      { leads: { delete: [{ id: '2', status_id: '107884155', pipeline_id: '13978643' }] } },
      { message: { add: [{ text: 'oi' }] } },
    ])
    expect(r).toEqual({ eventos: { status: 1, update: 1, delete: 1 }, etapaNova: { '142': 2, '107884155': 1 }, etapaAnterior: { '107884167': 1 }, funil: { '13978643': 3 }, etiquetas: { 'Meta Ads': 1 }, comValor: 2 })
    expect(JSON.stringify(r)).not.toMatch(/Maria/)
  })

  it('interpreta o webhook: mensagem do cliente, conversa e mudança de etapa com valor e etiquetas', () => {
    const form = 'account[subdomain]=aurumadsmktg&message[add][0][id]=m1&message[add][0][text]=Oi%2C%20quero%20o%20colar&message[add][0][author][id]=77&message[add][0][author][type]=external&message[add][0][origin]=waba&message[add][0][talk_id]=500&message[add][0][entity_id]=9001&message[add][0][entity_type]=lead&message[add][0][element_type]=2&message[add][0][contact_id]=33&message[add][0][created_at]=1793041302'
    const r = lerEventoKommo(lerFormularioKommo(form))
    expect(r.conta).toBe('aurumadsmktg')
    expect(r.mensagens).toEqual([{ id: 'm1', texto: 'Oi, quero o colar', autorTipo: 'external', autorId: '77', talkId: 500, leadId: 9001, contatoId: 33, criadaEm: 1793041302000, origem: 'waba' }])
    const neg = lerEventoKommo(lerFormularioKommo('leads[status][0][id]=9001&leads[status][0][status_id]=142&leads[status][0][old_status_id]=107884167&leads[status][0][pipeline_id]=13891367&leads[status][0][price]=1250&leads[status][0][responsible_user_id]=5&leads[status][0][date_create]=1793000000&leads[status][0][last_modified]=1793041400&leads[status][0][tags][0][id]=1&leads[status][0][tags][0][name]=Insta%20Org.'))
    expect(neg.negocios).toEqual([{ evento: 'status', id: 9001, pipelineId: 13891367, statusId: ETAPA_GANHO, statusAnteriorId: 107884167, valor: 1250, etiquetas: ['Insta Org.'], responsavelId: 5, criadoEm: 1793000000000, atualizadoEm: 1793041400000 }])
    const conv = lerEventoKommo(lerFormularioKommo('talk[add][0][talk_id]=500&talk[add][0][entity_id]=9001&talk[add][0][entity_type]=lead&talk[add][0][contact_id]=33&talk[add][0][origin]=waba&talk[add][0][created_at]=1793041300&talk[add][0][updated_at]=1793041302'))
    expect(conv.conversas).toEqual([{ talkId: 500, leadId: 9001, contatoId: 33, origem: 'waba', criadaEm: 1793041300000, atualizadaEm: 1793041302000 }])
  })

  it('papel da mensagem: cliente (external), atendente (com usuário) ou robô (sem usuário)', () => {
    expect(papelDaMensagem('external', '77')).toBe('cliente')
    expect(papelDaMensagem('internal', '12')).toBe('atendente')
    expect(papelDaMensagem('internal', '0')).toBe('robo')
    expect(papelDaMensagem('bot', '')).toBe('robo')
  })

  it('evento de exclusão e entradas incompletas não quebram', () => {
    expect(lerEventoKommo(lerFormularioKommo('leads[delete][0][id]=1&leads[delete][0][status_id]=142&leads[delete][0][pipeline_id]=9')).negocios[0]).toMatchObject({ evento: 'delete', id: 1, statusId: 142, valor: 0 })
    expect(lerEventoKommo({ message: { add: [{ text: 'sem id' }] } })).toMatchObject({ mensagens: [], conversas: [], negocios: [] })
    expect(lerEventoKommo(null)).toMatchObject({ conta: '' })
  })

  describe('planejar o que gravar', () => {
    const FUNIS = new Map([[13891367, 'cli-1']])
    const agora = Date.parse('2026-10-26T22:00:00Z')
    const guardado = (extra: Partial<NegocioGuardado> = {}): NegocioGuardado => ({ id: 9001, client_id: 'cli-1', pipeline_id: 13891367, status_id: 107884167, valor: 0, etiquetas: ['Insta Org.'], responsavel_id: 5, criado_em: '2026-10-26T10:00:00.000Z', ganho_em: null, perdido_em: null, excluido_em: null, ...extra })
    const status = (statusId: number, extra = '') => lerEventoKommo(lerFormularioKommo(`leads[status][0][id]=9001&leads[status][0][status_id]=${statusId}&leads[status][0][pipeline_id]=13891367&leads[status][0][price]=1250&leads[status][0][last_modified]=1793041400${extra}`))

    it('venda: ao entrar na etapa 142 guarda a data do ganho e o valor; sair da etapa desfaz a venda', () => {
      const ganho = planejarEvento(status(142), FUNIS, new Map([[9001, guardado()]]), agora).negocios[0]
      expect(ganho).toMatchObject({ status_id: 142, valor: 1250, ganho_em: '2026-10-26T19:03:20.000Z', perdido_em: null, etiquetas: ['Insta Org.'], criado_em: '2026-10-26T10:00:00.000Z' })
      const repetido = planejarEvento(status(142), FUNIS, new Map([[9001, guardado({ status_id: 142, ganho_em: '2026-10-20T09:00:00.000Z', valor: 1250 })]]), agora).negocios[0]
      expect(repetido.ganho_em).toBe('2026-10-20T09:00:00.000Z')
      expect(planejarEvento(status(107884167), FUNIS, new Map([[9001, guardado({ status_id: 142, ganho_em: '2026-10-20T09:00:00.000Z' })]]), agora).negocios[0].ganho_em).toBeNull()
      expect(planejarEvento(status(143), FUNIS, new Map([[9001, guardado()]]), agora).negocios[0]).toMatchObject({ perdido_em: '2026-10-26T19:03:20.000Z', ganho_em: null })
    })

    it('funil não ligado a cliente é ignorado; exclusão marca o negócio; negócio novo entra com a data de criação', () => {
      expect(planejarEvento(lerEventoKommo(lerFormularioKommo('leads[status][0][id]=1&leads[status][0][pipeline_id]=999&leads[status][0][status_id]=142')), FUNIS, new Map(), agora)).toMatchObject({ negocios: [], ignorados: 1 })
      const del = planejarEvento(lerEventoKommo(lerFormularioKommo('leads[delete][0][id]=9001&leads[delete][0][pipeline_id]=13891367&leads[delete][0][status_id]=142')), FUNIS, new Map([[9001, guardado()]]), agora)
      expect(del.excluidos).toEqual([{ id: 9001, excluido_em: '2026-10-26T22:00:00.000Z' }])
      const novo = planejarEvento(lerEventoKommo(lerFormularioKommo('leads[add][0][id]=7&leads[add][0][pipeline_id]=13891367&leads[add][0][status_id]=110344984&leads[add][0][date_create]=1793041000&leads[add][0][price]=0')), FUNIS, new Map(), agora).negocios[0]
      expect(novo).toMatchObject({ id: 7, client_id: 'cli-1', status_id: 110344984, criado_em: '2026-10-26T18:56:40.000Z', ganho_em: null })
    })

    it('mensagem: mascara o texto, define o papel e cria a conversa; negócio fora dos funis ligados vira "desconhecido"', () => {
      const ev = lerEventoKommo(lerFormularioKommo('message[add][0][id]=m1&message[add][0][text]=Meu%20zap%2091988174486&message[add][0][author][id]=77&message[add][0][author][type]=external&message[add][0][talk_id]=500&message[add][0][entity_id]=9001&message[add][0][entity_type]=lead&message[add][0][created_at]=1793041302'))
      const p = planejarEvento(ev, FUNIS, new Map([[9001, guardado()]]), agora)
      expect(p.mensagens[0]).toMatchObject({ id: 'm1', client_id: 'cli-1', papel: 'cliente', texto: 'Meu zap [cpf ou telefone]', criada_em: '2026-10-26T19:01:42.000Z' })
      expect(p.mensagens[0].texto).not.toMatch(/9198817/)
      expect(p.conversas).toHaveLength(1)
      const fora = planejarEvento(ev, FUNIS, new Map(), agora)
      expect(fora).toMatchObject({ mensagens: [], desconhecidos: [9001], ignorados: 1 })
    })

    it('negócio vindo da API tem o mesmo formato do webhook', () => {
      expect(negocioDaApi({ id: 9001, pipeline_id: 13891367, status_id: 142, price: 1250, responsible_user_id: 5, created_at: 1793000000, updated_at: 1793041400, _embedded: { tags: [{ id: 1, name: 'Do Dia' }] } })).toEqual({ evento: 'api', id: 9001, pipelineId: 13891367, statusId: 142, statusAnteriorId: null, valor: 1250, etiquetas: ['Do Dia'], responsavelId: 5, criadoEm: 1793000000000, atualizadoEm: 1793041400000 })
      expect(negocioDaApi(null)).toBeNull()
    })
  })
})
