/**
 * Limite de pedidos por IP nas rotas públicas que gravam (leads, newsletter, eventos do blog, visitas e quiz da bio).
 * ponytail: contagem em memória, por instância do servidor — segura o script simples, não um ataque distribuído.
 * Se precisar de limite firme, criar uma regra de rate limit no firewall da Vercel para os mesmos caminhos.
 */

const JANELA_MS = 60_000
const MAX_CHAVES = 5000

/** Pedidos por minuto, por IP, em cada grupo de rotas; null = rota sem limite. */
export function limiteDaRota(metodo: string, caminho: string): { grupo: string; max: number } | null {
  if (metodo !== 'POST') return null
  if (caminho === '/api/leads' || caminho === '/api/blog/newsletter') return { grupo: 'formulario', max: 10 }
  if (caminho === '/api/blog/eventos' || /^\/l\/[^/]+\/(v|quiz)$/.test(caminho)) return { grupo: 'contagem', max: 60 }
  return null
}

const janelas = new Map<string, { inicio: number; n: number }>()

/** true = pode seguir; false = passou do limite na janela de 1 minuto. */
export function permitir(chave: string, max: number, agora: number): boolean {
  const j = janelas.get(chave)
  if (!j || agora - j.inicio >= JANELA_MS) {
    if (janelas.size >= MAX_CHAVES) for (const [k, v] of janelas) if (agora - v.inicio >= JANELA_MS) janelas.delete(k)
    if (janelas.size >= MAX_CHAVES) janelas.clear()
    janelas.set(chave, { inicio: agora, n: 1 })
    return true
  }
  j.n += 1
  return j.n <= max
}

// ---------------------------------------------------------------- comentários públicos da prova visual (limite compartilhado no banco)

export type LimiteCompartilhado = { chave: string; max: number; janelaSegundos: number }

/** Máximo de comentários por janela de 10 minutos: por link+post e por IP. O contador mora no banco (função consumir_limite), então vale para todas as instâncias. */
export const LIMITE_PROVA_POR_POST = { max: 30, janelaSegundos: 600 }
export const LIMITE_PROVA_POR_IP = { max: 40, janelaSegundos: 600 }

/** Primeiro IP do `x-forwarded-for`, sem lixo: vira parte da chave do limite. */
export function ipDoPedido(xForwardedFor: string | null): string {
  const ip = (xForwardedFor ?? '').split(',')[0].trim().slice(0, 64)
  return /^[0-9a-fA-F:.]+$/.test(ip) ? ip : 'sem-ip'
}

export function limitesDoComentario(slug: string, tarefaId: string, ip: string): LimiteCompartilhado[] {
  return [
    { chave: `prova|post|${slug}|${tarefaId}`, ...LIMITE_PROVA_POR_POST },
    { chave: `prova|ip|${ip}`, ...LIMITE_PROVA_POR_IP },
  ]
}

/** Filtro de página por cursor (created_at, id): estável mesmo com comentários novos chegando durante a leitura. */
export function filtroDeCursor(cursor: { criadoEm: string; id: string } | null): string | null {
  if (!cursor) return null
  return `created_at.gt.${cursor.criadoEm},and(created_at.eq.${cursor.criadoEm},id.gt.${cursor.id})`
}
