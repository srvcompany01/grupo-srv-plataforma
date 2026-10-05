import type { Midia } from '@/db/schema'
import type { TipoMidia } from '@/dominio/tipos'
import { urlLeitura } from '@/infra/r2'

export interface MidiaParaVer {
  tipo: TipoMidia
  url: string
  urlDownload: string
  nome: string
}

export function midiasParaVer(lista: Midia[]): Promise<MidiaParaVer[]> {
  return Promise.all(
    lista.map(async (m) => ({
      tipo: m.tipo,
      nome: m.nomeOriginal,
      url: await urlLeitura(m.chaveR2),
      urlDownload: await urlLeitura(m.chaveR2, { download: m.nomeOriginal }),
    })),
  )
}
