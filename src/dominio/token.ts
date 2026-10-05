const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const TAMANHO = 32

/** Rejeita bytes >= 248 para não enviesar o módulo 62. */
export function gerarToken(): string {
  let saida = ''
  while (saida.length < TAMANHO) {
    for (const byte of crypto.getRandomValues(new Uint8Array(TAMANHO))) {
      if (byte < 248 && saida.length < TAMANHO) saida += ALFABETO[byte % 62]
    }
  }
  return saida
}
