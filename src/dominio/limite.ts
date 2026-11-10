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
