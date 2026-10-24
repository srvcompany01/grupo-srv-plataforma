import 'server-only'
import { apagarGravacao } from './ciclo-arquivos'
import { CHAVE_REUNIAO, PROMPT_ATA, conteudoDaAta, conteudoDaTranscricao, extensaoDaGravacao, lerAta, type Ata } from '@/dominio/ata'
import { dataDeHoje } from '@/dominio/filtros'
import { apagarDoGemini, configGemini as configGeminiBase, enviarAoGemini, gerarJsonGemini } from '@/ia/gemini'
import { urlLeitura, urlUpload } from '@/infra/r2'
import type { Supabase } from '@/infra/supabase/servidor'
import { buscarCliente } from './clientes-plataforma'
import { criarDocumento } from './documentos'
import * as tarefas from './tarefas'

/**
 * Notetaker: a gravação vai para o R2, o servidor manda o áudio para a API de arquivos do Gemini (aceita reuniões
 * longas) e pede a ata em JSON. Chave: GEMINI_API_KEY ou a IA_API_KEY quando a IA da plataforma já é o Gemini.
 */
const configGemini = () => configGeminiBase('NOTETAKER_MODELO')
export const notetakerConfigurado = () => configGemini() !== null

/** URL para o navegador enviar a gravação direto ao armazenamento. */
export async function urlEnvioReuniao(mime: string, tamanho: number): Promise<{ chave: string; url: string }> {
  const chave = `reunioes/${crypto.randomUUID()}.${extensaoDaGravacao(mime)}`
  return { chave, url: await urlUpload(chave, mime, tamanho) }
}

export type EntradaReuniao = { chave: string; mime: string; titulo: string; clienteId: string | null; listaId: string | null; criarTarefas: boolean; duracaoMin: number | null }

/** Gera a ata da gravação e cria o documento (e, se pedido, as tarefas dos próximos passos na lista). */
export async function processarReuniao(sb: Supabase, euId: string, e: EntradaReuniao): Promise<{ documentoId: string; tarefasCriadas: number }> {
  if (!CHAVE_REUNIAO.test(e.chave)) throw new Error('Gravação inválida.')
  const cfg = configGemini()
  if (!cfg) throw new Error('O notetaker precisa de uma chave do Gemini (GEMINI_API_KEY).')
  const audio = await fetch(await urlLeitura(e.chave))
  if (!audio.ok) throw new Error('Não encontrei a gravação enviada.')
  const bytes = await audio.arrayBuffer()
  const data = dataDeHoje(new Date())
  const arquivo = await enviarAoGemini(cfg.chave, bytes, e.mime, 'reuniao')
  let ata: Ata
  try {
    ata = await gerarJsonGemini(cfg, { uri: arquivo.uri, mime: e.mime }, `${PROMPT_ATA}\nData da reunião: ${data}.`, lerAta).catch((x: Error) => {
      throw new Error(x.message.replace('O Gemini não respondeu', 'O Gemini não gerou a ata'))
    })
  } finally {
    await apagarDoGemini(cfg.chave, arquivo.nome)
  }
  const cliente = e.clienteId ? await buscarCliente(sb, e.clienteId) : null
  const titulo = `Ata — ${e.titulo.trim() || ata.titulo || 'Reunião'} — ${data.split('-').reverse().slice(0, 2).join('/')}`
  const documentoId = await criarDocumento(sb, euId, {
    titulo,
    clienteId: cliente?.id ?? null,
    listaId: e.listaId ?? undefined,
    paginas: [
      { titulo: 'Ata', conteudo: conteudoDaAta(ata, { data, duracaoMin: e.duracaoMin, cliente: cliente?.nome ?? null }) },
      { titulo: 'Transcrição', conteudo: conteudoDaTranscricao(ata.transcricao) },
    ],
  })
  let tarefasCriadas = 0
  if (e.criarTarefas && e.listaId) {
    for (const p of ata.proximosPassos) {
      const id = await tarefas.criarTarefa(sb, { listaId: e.listaId, titulo: p.responsavel ? `${p.acao} (${p.responsavel})` : p.acao, responsaveis: [euId] })
      if (p.prazo) await tarefas.atualizarTarefa(sb, id, { prazo: p.prazo })
      if (cliente) await tarefas.definirTagCliente(sb, id, cliente.id)
      tarefasCriadas++
    }
  }
  // A ata e a transcrição ficaram no documento: a gravação não é mais necessária.
  await apagarGravacao(e.chave, bytes.byteLength).catch((x) => console.error('apagar gravação', x))
  return { documentoId, tarefasCriadas }
}
