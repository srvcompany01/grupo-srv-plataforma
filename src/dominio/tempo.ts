export type RegistroSomavel = { inicio: string; fim: string | null; segundos: number | null; faturavel?: boolean }

export function segundosDecorridos(inicioIso: string, agoraMs: number): number {
  return Math.max(0, Math.floor((agoraMs - Date.parse(inicioIso)) / 1000))
}

/** Soma os segundos gravados; registro sem duração (cronômetro rodando) conta o tempo corrido até agora. */
export function totalTempo(registros: RegistroSomavel[], agoraMs: number): number {
  return registros.reduce((s, r) => s + (r.segundos ?? (r.fim === null ? segundosDecorridos(r.inicio, agoraMs) : 0)), 0)
}

/** Só a parte faturável do total (registro sem a marca conta como faturável, o padrão). */
export function totalFaturavel(registros: RegistroSomavel[], agoraMs: number): number {
  return totalTempo(registros.filter((r) => r.faturavel !== false), agoraMs)
}
