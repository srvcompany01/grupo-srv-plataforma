import { createHmac } from 'node:crypto'

// Sal só deste servidor: sem ele o hash de IP + aparelho poderia ser desfeito por força bruta.
const SAL = process.env.BIO_SAL ?? process.env.SESSAO_SEGREDO ?? crypto.randomUUID()

/** Identifica a pessoa do dia sem guardar dado pessoal: hash de página + dia + IP + aparelho. */
export function hashDoVisitante(slug: string, h: Headers): string {
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim()
  const dia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Belem' })
  return createHmac('sha256', SAL).update(`${slug}|${dia}|${ip}|${h.get('user-agent')}`).digest('hex').slice(0, 32)
}
