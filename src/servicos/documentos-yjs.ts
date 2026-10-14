import { getSchema, type JSONContent } from '@tiptap/core'
import { prosemirrorJSONToYDoc, yXmlFragmentToProsemirrorJSON } from '@tiptap/y-tiptap'
import * as Y from 'yjs'
import { deBase64, paraBase64 } from '@/dominio/base64'
import { CAMPO_YJS, extensoesBase } from '@/componentes/documentos/extensoes'
import type { Json } from '@/infra/supabase/tipos'
import type { Supabase } from '@/infra/supabase/servidor'
import { buscarPagina, type PaginaCompleta } from './documentos'

/** JSON do editor → estado Yjs em base64 (como se a pessoa tivesse digitado tudo de uma vez). */
export function jsonParaYjs(conteudo: unknown): string {
  const schema = getSchema(extensoesBase())
  const doc = prosemirrorJSONToYDoc(schema, (conteudo ?? { type: 'doc', content: [{ type: 'paragraph' }] }) as JSONContent, CAMPO_YJS)
  return paraBase64(Y.encodeStateAsUpdate(doc))
}

/**
 * Garante que a página tenha estado Yjs. Quem abre primeiro grava (condicional: só se ainda estiver vazio),
 * então duas pessoas abrindo juntas não duplicam o texto. Sem permissão de edição, devolve a página como está.
 */
export async function paginaComEstado(sb: Supabase, paginaId: string): Promise<PaginaCompleta | null> {
  const pagina = await buscarPagina(sb, paginaId)
  if (!pagina || pagina.ydoc) return pagina
  try {
    const ydoc = jsonParaYjs(pagina.conteudo as Json | null)
    const { data } = await sb.from('document_pages').update({ ydoc }).eq('id', paginaId).is('ydoc', null).select('id')
    if (data?.length) return { ...pagina, ydoc }
  } catch (e) {
    console.error('Não foi possível gerar o estado inicial do documento', e)
  }
  return buscarPagina(sb, paginaId) // outra pessoa chegou primeiro (ou a pessoa só pode ler)
}

/** Texto de uma página como JSON do editor, a partir do estado Yjs gravado (usado onde não há edição: portal do cliente). */
export function yjsParaJson(ydocBase64: string | null, reserva: unknown): unknown {
  if (!ydocBase64) return reserva
  const doc = new Y.Doc()
  Y.applyUpdate(doc, deBase64(ydocBase64))
  return yXmlFragmentToProsemirrorJSON(doc.getXmlFragment(CAMPO_YJS))
}

/** Estado atual da página como Y.Doc (estado gravado + alterações ainda não compactadas). */
function reconstruir(pagina: PaginaCompleta): Y.Doc {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, deBase64(pagina.ydoc ?? jsonParaYjs(pagina.conteudo)))
  for (const a of pagina.alteracoes) Y.applyUpdate(doc, deBase64(a.data))
  return doc
}

/** Texto atual da página (estado + alterações recentes) como JSON do editor. */
export function conteudoAtual(pagina: PaginaCompleta): unknown {
  return yXmlFragmentToProsemirrorJSON(reconstruir(pagina).getXmlFragment(CAMPO_YJS))
}

/** Alteração Yjs (só o que mudou) que acrescenta os parágrafos ao fim da página. */
export function alteracaoDeAnexo(pagina: PaginaCompleta, texto: string): Uint8Array {
  const doc = reconstruir(pagina)
  const antes = Y.encodeStateVector(doc)
  const paragrafos = texto.replace(/\r\n/g, '\n').split('\n').map((linha) => {
    const p = new Y.XmlElement('paragraph')
    if (linha.trim()) {
      const t = new Y.XmlText()
      t.insert(0, linha)
      p.insert(0, [t])
    }
    return p
  })
  doc.transact(() => doc.getXmlFragment(CAMPO_YJS).push(paragrafos))
  return Y.encodeStateAsUpdate(doc, antes)
}

/**
 * Acrescenta parágrafos ao fim da página como uma alteração Yjs normal: quem está com a página aberta
 * recebe na hora e nada que outras pessoas digitaram é perdido.
 */
export async function anexarTexto(sb: Supabase, euId: string, paginaId: string, texto: string): Promise<void> {
  const pagina = await buscarPagina(sb, paginaId)
  if (!pagina) throw new Error('Página não encontrada')
  const { error } = await sb.from('document_updates').insert({ page_id: paginaId, data: paraBase64(alteracaoDeAnexo(pagina, texto)), created_by: euId })
  if (error) throw error
}
