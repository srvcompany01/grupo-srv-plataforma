import { somarDias } from './agenda'

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), AAAA-MM-DD. */
function pascoa(ano: number): string {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const g = Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Feriados nacionais e datas comemorativas do ano: data (AAAA-MM-DD) → nome. Os móveis saem da Páscoa. */
export function feriadosDoAno(ano: number): Map<string, string> {
  const p = pascoa(ano)
  const fixos: [string, string][] = [
    ['01-01', 'Confraternização Universal'],
    ['04-21', 'Tiradentes'],
    ['05-01', 'Dia do Trabalho'],
    ['09-07', 'Independência do Brasil'],
    ['10-12', 'Nossa Senhora Aparecida'],
    ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'],
    ['11-20', 'Consciência Negra'],
    ['12-25', 'Natal'],
  ]
  const moveis: [string, string][] = [
    [somarDias(p, -48), 'Carnaval (segunda)'],
    [somarDias(p, -47), 'Carnaval'],
    [somarDias(p, -2), 'Sexta-feira Santa'],
    [p, 'Páscoa'],
    [somarDias(p, 60), 'Corpus Christi'],
  ]
  return new Map<string, string>([...fixos.map(([md, nome]) => [`${ano}-${md}`, nome] as [string, string]), ...moveis].sort(([x], [y]) => x.localeCompare(y)))
}

/** Feriados entre duas datas (inclusive), em ordem. */
export function feriadosEntre(de: string, ate: string): { data: string; nome: string }[] {
  const anos = new Set([Number(de.slice(0, 4)), Number(ate.slice(0, 4))])
  return [...anos]
    .flatMap((a) => [...feriadosDoAno(a)].map(([data, nome]) => ({ data, nome })))
    .filter((f) => f.data >= de && f.data <= ate)
    .sort((a, b) => a.data.localeCompare(b.data))
}
