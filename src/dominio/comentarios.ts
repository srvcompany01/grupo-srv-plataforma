/**
 * Comentários do Instagram e do Facebook: classificação do tom (positivo, neutro, negativo, agressivo) por regras,
 * em português, sem depender da IA. A IA da plataforma, quando configurada, refina os que as regras não decidem bem.
 */

export type TomComentario = 'positivo' | 'neutro' | 'negativo' | 'agressivo'
export const ROTULO_TOM: Record<TomComentario, string> = { positivo: 'Positivo', neutro: 'Neutro', negativo: 'Negativo', agressivo: 'Agressivo' }
export const ALERTA = (t: TomComentario) => t === 'negativo' || t === 'agressivo'

const sem = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Ofensas, palavrões e acusações graves (golpe, processo): pedem decisão rápida.
const AGRESSIVO = [
  /\b(merda|porra|caralho|puta|put[ao]s?|fdp|vsf|vtnc|pqp|cacete|bosta|desgraca(do|da)?|arrombad[ao]|cuzao|babaca|otari[ao]s?|idiota|imbecil|retardad[ao]|lixo|nojent[ao]|vagabund[ao]|safad[ao]|canalha|corno|filh[ao] da puta|vai se f[ou]der|vai tomar)\b/,
  /\b(golpe|golpista|golpistas|estelionat|ladr[ao]o?es|ladrao|ladra|fraude|fraudulent|enganacao|pilantra|picaret)/,
  /\b(vou (te )?processar|processo judicial|vou denunciar|denunciem|procon|reclame aqui|policia)\b/,
]
// Reclamação e insatisfação: merece resposta cuidadosa.
const NEGATIVO = [
  /\b(pessim[ao]|horrivel|horroros[ao]|ruim|decepcion|decepcao|nao recomendo|pior|absurd[ao]|vergonha|descaso|insatisfeit|desrespeito|nunca mais|enganad[ao]|caro demais|muito caro|caro pra caramba|nao vale)\b/,
  /\b(nao (me )?respond|ninguem respond|sem resposta|nao atend|atendimento (ruim|pessimo|horrivel)|demor(a|ou|ando)|atras(o|ou|ado)|nao chegou|nao funciona|nao funcionou|defeito|quebrad[ao]|reembolso|devolu(cao|cao)|cancelar|cancelei|cobranca indevida|cobraram)\b/,
  /(👎|😡|🤬|😠|💩|🤮)/u,
]
const POSITIVO = [
  /\b(otim[ao]|excelente|maravilh|perfeit[ao]|amei|amo|adorei|lind[ao]|incrivel|sensacional|top|parabens|recomendo|show|nota 10|melhor|obrigad[ao]|gratidao|satisfeit)\b/,
  /(❤️|😍|🥰|👏|🙌|💯|🔥|😊|💖|♥️)/u,
]

/** Tom do comentário pelas regras e o motivo (a palavra que pesou). */
export function classificarComentario(texto: string): { tom: TomComentario; motivo: string } {
  const t = sem(texto)
  for (const r of AGRESSIVO) {
    const m = t.match(r)
    if (m) return { tom: 'agressivo', motivo: `Termo agressivo: "${m[0]}"` }
  }
  for (const r of NEGATIVO) {
    const m = t.match(r)
    if (m) return { tom: 'negativo', motivo: `Reclamação: "${m[0]}"` }
  }
  if (POSITIVO.some((r) => r.test(t))) return { tom: 'positivo', motivo: '' }
  return { tom: 'neutro', motivo: '' }
}

/** Texto do aviso do sino para um comentário em alerta. */
export function textoDoAlerta(c: { tom: TomComentario; cliente: string; plataforma: string; origem: string; autor: string; texto: string }): string {
  const onde = `${c.plataforma === 'instagram' ? 'Instagram' : 'Facebook'}${c.origem === 'anuncio' ? ' (anúncio)' : ''}`
  const trecho = c.texto.length > 90 ? `${c.texto.slice(0, 90)}…` : c.texto
  return `${c.tom === 'agressivo' ? '🔴 Comentário agressivo' : '⚠️ Comentário negativo'} · ${c.cliente} · ${onde} · @${c.autor || 'alguém'}: "${trecho}"`.slice(0, 300)
}
