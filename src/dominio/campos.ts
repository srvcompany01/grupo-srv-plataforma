import { ErroRegra } from './erros'
import { FORMATOS, type CamposPost, type Formato } from './tipos'

export function dataValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [a, m, d] = iso.split('-').map(Number)
  const data = new Date(Date.UTC(a, m - 1, d))
  return data.getUTCFullYear() === a && data.getUTCMonth() === m - 1 && data.getUTCDate() === d
}

export function formatoValido(f: unknown): f is Formato {
  return typeof f === 'string' && (FORMATOS as readonly string[]).includes(f)
}

/** Os campos chegam do navegador; nada é confiado sem passar por aqui. */
export function validarCampos(entrada: Record<string, unknown>): CamposPost {
  const texto = (v: unknown) => (typeof v === 'string' ? v : '')
  const dataPrevista = texto(entrada.dataPrevista)
  if (!dataValida(dataPrevista)) throw new ErroRegra('campos_invalidos', 'Data prevista inválida.')
  if (!formatoValido(entrada.formato)) throw new ErroRegra('campos_invalidos', 'Formato inválido.')
  return {
    dataPrevista,
    formato: entrada.formato,
    ideia: texto(entrada.ideia),
    objetivo: texto(entrada.objetivo),
    legenda: texto(entrada.legenda),
  }
}
