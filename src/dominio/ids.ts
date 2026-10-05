import { ErroRegra } from './erros'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Ids vêm da URL; um id malformado faria o Postgres lançar erro de cast. */
export function exigirUuid(id: string): void {
  if (!UUID.test(id)) throw new ErroRegra('nao_encontrado', 'Não encontrado.')
}
