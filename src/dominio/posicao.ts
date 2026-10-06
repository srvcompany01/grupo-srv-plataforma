import { generateKeyBetween } from 'fractional-indexing'

/** Chave de ordenação entre dois vizinhos (null = início/fim). Nunca perde precisão. */
export function posicaoEntre(antes: string | null, depois: string | null): string {
  return generateKeyBetween(antes, depois)
}
