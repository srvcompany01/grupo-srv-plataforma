/** Transcrição de fala (Whisper no Groq). O DeepSeek só lê texto, então o áudio passa por aqui antes. */
const LIMITE_BYTES = 24 * 1024 * 1024

export async function transcreverAudio(audio: Buffer, nome = 'audio.mp3'): Promise<string> {
  const chave = process.env.GROQ_API_KEY
  if (!chave) throw new Error('A transcrição precisa da chave do Groq (GROQ_API_KEY) na Vercel.')
  if (audio.length > LIMITE_BYTES) throw new Error('O áudio é longo demais para transcrever de uma vez (limite de cerca de 1h30 de fala).')
  const corpo = new FormData()
  corpo.set('file', new Blob([new Uint8Array(audio)], { type: 'audio/mpeg' }), nome)
  corpo.set('model', process.env.TRANSCRICAO_MODELO ?? 'whisper-large-v3-turbo')
  corpo.set('language', 'pt')
  corpo.set('response_format', 'text')
  corpo.set('temperature', '0')
  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${chave}` }, body: corpo, signal: AbortSignal.timeout(120_000) })
  if (r.status === 401 || r.status === 403) throw new Error('A chave do Groq (GROQ_API_KEY) foi recusada.')
  if (r.status === 429) throw new Error('Limite do Groq atingido. Tente de novo em alguns instantes.')
  if (!r.ok) throw new Error(`A transcrição falhou (${r.status}).`)
  return (await r.text()).trim()
}
