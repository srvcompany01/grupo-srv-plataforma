import * as Y from 'yjs'
import { deBase64, paraBase64 } from '@/dominio/base64'
import { criarClienteNavegador } from '@/infra/supabase/navegador'

export type StatusConexao = 'conectando' | 'conectado' | 'sem-conexao'
export type PessoaOnline = { id: string; nome: string }

const REMOTO = 'remoto'
const ESPERA_ENVIO_MS = 250

/**
 * Liga um Y.Doc ao banco: cada alteração local vira uma linha em document_updates (agrupadas a cada ~250 ms)
 * e as dos outros chegam pelo Realtime (a RLS decide quem escuta). Também mostra quem está online na página.
 * `ultimoId()` é o maior id de alteração já incorporado — vai junto na gravação do estado.
 */
export function conectarDocumento(opcoes: {
  paginaId: string
  ydoc: Y.Doc
  baseUpdate: number
  eu: PessoaOnline
  podeEditar: boolean
  aoStatus: (s: StatusConexao) => void
  aoPresenca: (pessoas: PessoaOnline[]) => void
  aoAlterar: () => void
}) {
  const { paginaId, ydoc, eu, podeEditar } = opcoes
  const sb = criarClienteNavegador()
  let maior = opcoes.baseUpdate
  let pendentes: Uint8Array[] = []
  let envio: ReturnType<typeof setTimeout> | null = null
  let fechado = false

  const aplicar = (id: number, dados: string) => {
    maior = Math.max(maior, id)
    Y.applyUpdate(ydoc, deBase64(dados), REMOTO)
  }

  const enviar = async () => {
    envio = null
    if (fechado || !pendentes.length) return
    const lote = Y.mergeUpdates(pendentes)
    pendentes = []
    const { data, error } = await sb.from('document_updates').insert({ page_id: paginaId, data: paraBase64(lote), created_by: eu.id }).select('id').single()
    if (error) {
      pendentes.unshift(lote)
      opcoes.aoStatus('sem-conexao')
      envio = setTimeout(enviar, 3000)
      return
    }
    maior = Math.max(maior, data.id)
    opcoes.aoStatus('conectado')
  }

  const aoAtualizar = (alteracao: Uint8Array, origem: unknown) => {
    if (origem === REMOTO) return
    opcoes.aoAlterar()
    if (!podeEditar) return
    pendentes.push(alteracao)
    envio ??= setTimeout(enviar, ESPERA_ENVIO_MS)
  }
  ydoc.on('update', aoAtualizar)

  // Busca o que passou enquanto a conexão não estava de pé (abertura, queda e volta).
  const recuperar = async () => {
    const { data } = await sb.from('document_updates').select('id, data').eq('page_id', paginaId).gt('id', maior).order('id')
    for (const linha of data ?? []) aplicar(linha.id, linha.data)
  }

  const canal = sb
    .channel(`doc-${paginaId}-${Math.random().toString(36).slice(2)}`, { config: { presence: { key: `${eu.id}-${Math.random().toString(36).slice(2, 8)}` } } })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'document_updates', filter: `page_id=eq.${paginaId}` }, (evento) => {
      // Aplicar de novo o que já está no texto não muda nada (Yjs é idempotente); assim nada vindo de fora (ex.: IA) se perde.
      const nova = evento.new as { id: number; data: string }
      aplicar(nova.id, nova.data)
    })
    .on('presence', { event: 'sync' }, () => {
      const vistos = new Map<string, PessoaOnline>()
      for (const lista of Object.values(canal.presenceState<PessoaOnline>())) for (const p of lista) vistos.set(p.id, { id: p.id, nome: p.nome })
      opcoes.aoPresenca([...vistos.values()])
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        opcoes.aoStatus('conectado')
        await recuperar()
        await canal.track({ id: eu.id, nome: eu.nome })
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        if (!fechado) opcoes.aoStatus('sem-conexao')
      }
    })

  return {
    ultimoId: () => maior,
    /** Envia o que ainda está na fila (antes de gravar o estado ou sair). */
    descarregar: async () => {
      if (envio) clearTimeout(envio)
      await enviar()
    },
    fechar: () => {
      if (envio) clearTimeout(envio)
      void enviar()
      fechado = true
      ydoc.off('update', aoAtualizar)
      void sb.removeChannel(canal)
    },
  }
}
