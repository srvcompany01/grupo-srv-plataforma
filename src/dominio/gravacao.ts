export const MIMES_AUDIO = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
export const MIMES_VIDEO = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']

/** Primeiro mime que o navegador sabe gravar (`MediaRecorder.isTypeSupported`), ou null. */
export function escolherMime(lista: string[], suportado: (mime: string) => boolean): string | null {
  return lista.find((m) => suportado(m)) ?? null
}

/** `audio-AAAA-MM-DD-HHmm.webm|m4a` / `video-….webm|mp4`. */
export function nomeGravacao(modo: 'audio' | 'video', mime: string, quando: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const base = mime.split(';')[0].trim().toLowerCase()
  const ext = base === 'audio/mp4' ? 'm4a' : base === 'video/mp4' ? 'mp4' : 'webm'
  return `${modo}-${quando.getFullYear()}-${p(quando.getMonth() + 1)}-${p(quando.getDate())}-${p(quando.getHours())}${p(quando.getMinutes())}.${ext}`
}
