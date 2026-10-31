/** Etapas do campo personalizado "Etapa" que acompanham o andamento do post. */
export type EtapaDoPost = 'aprovacao_cliente' | 'agendado' | 'postado'

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/**
 * Como reconhecer a opção de cada etapa pelo nome (sem acento e sem diferenciar maiúsculas), da mais específica para a mais geral:
 * "Aprovação cliente" (ou, se não houver, "Aprovação"), "Agendado", "Postado"/"Publicado".
 */
const PADROES: Record<EtapaDoPost, RegExp[]> = {
  aprovacao_cliente: [/aprova\w*\s*(do\s*)?cliente|cliente\s*aprova/, /^aprova/],
  agendado: [/agendad/],
  postado: [/postad|publicad/],
}

/** A opção do campo que corresponde à etapa, ou null se o campo não tem uma opção com esse nome. */
export function opcaoDaEtapa(opcoes: string[], etapa: EtapaDoPost): string | null {
  for (const padrao of PADROES[etapa]) {
    const achada = opcoes.find((o) => padrao.test(semAcento(o)))
    if (achada) return achada
  }
  return null
}

export const ehCampoEtapa = (nome: string) => semAcento(nome) === 'etapa'
