export type CodigoErro =
  | 'tipo_invalido'
  | 'arquivo_grande'
  | 'midias_invalidas'
  | 'sem_midia'
  | 'status_invalido'
  | 'versao_desatualizada'
  | 'comentario_obrigatorio'
  | 'nome_obrigatorio'
  | 'chave_invalida'
  | 'nao_encontrado'

export class ErroRegra extends Error {
  constructor(
    public codigo: CodigoErro,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = 'ErroRegra'
  }
}
