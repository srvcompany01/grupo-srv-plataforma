import { textoSobreCor, type IconeStatusInfo } from '@/dominio/status-icone'
import { IconeStatus } from './IconeStatus'

/**
 * Título de um grupo (status, prioridade, mês, cliente…): pílula compacta, em maiúsculas, na cor do grupo.
 * "A fazer" (cinza) usa o estilo claro; as demais cores são cheias, com texto branco ou escuro conforme a cor.
 */
export function EtiquetaGrupo({ nome, cor, icone, contagem }: { nome: string; cor: string; icone?: IconeStatusInfo; contagem?: number }) {
  const claro = icone?.categoria === 'todo'
  const texto = claro ? '#4b5260' : textoSobreCor(cor)
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span
        className="inline-flex h-[18px] min-w-0 items-center gap-1 rounded-[5px] px-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.05em]"
        style={claro ? { background: `${cor}29`, color: texto } : { background: cor, color: texto }}
      >
        {icone && <IconeStatus info={icone} cor={claro ? cor : texto} fundo={claro ? '#ffffff' : cor} className="h-3 w-3" />}
        <span className="truncate">{nome}</span>
      </span>
      {contagem !== undefined && <span className="text-legenda tabular-nums text-texto-3">{contagem}</span>}
    </span>
  )
}
