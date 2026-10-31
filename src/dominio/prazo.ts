/** Vencimento de tarefa: data + dia da semana abreviado + horário opcional. Horários são de Belém, sem fuso. */
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** '2026-10-31' → 'sáb'. */
export function diaDaSemana(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]
}

/** '10:00' → '10h'; '10:30' → '10h30'; '09:05' → '9h05'. */
export function formatarHorario(horario: string): string {
  const [h, m] = horario.split(':')
  return m && m !== '00' ? `${Number(h)}h${m}` : `${Number(h)}h`
}

export const horarioValido = (h: unknown): h is string => typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h)

/**
 * 31/10 (sáb), ou 31/10 (sáb) · 10h quando há horário. `ano: true` mostra 31/10/2026 (sáb).
 * O layout acompanha o que a pessoa escolheu: só a data, ou data e horário.
 */
export function formatarPrazo(prazo: string, horario?: string | null, opcoes: { ano?: boolean } = {}): string {
  const [a, m, d] = prazo.split('-')
  const data = opcoes.ano ? `${d}/${m}/${a}` : `${d}/${m}`
  return `${data} (${diaDaSemana(prazo)})${horario ? ` · ${formatarHorario(horario)}` : ''}`
}

/** Um instante (UTC) em data e horário de Belém: { data: '2026-10-31', horario: '10:00' }. */
export function dataEHoraEmBelem(instante: Date | string): { data: string; horario: string } {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Belem', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(instante)).map((x) => [x.type, x.value]))
  return { data: `${p.year}-${p.month}-${p.day}`, horario: `${p.hour}:${p.minute}` }
}
