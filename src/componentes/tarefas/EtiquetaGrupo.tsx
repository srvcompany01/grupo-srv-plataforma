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
    <span>
      <span
        style={claro ? { background: `${cor}29`, color: texto } : { background: cor, color: texto }}
      >
        {icone && <IconeStatus info={icone} cor={claro ? cor : texto} fundo={claro ? '#ffffff' : cor} />}
        <span>{nome}</span>
      </span>
      {contagem !== undefined && <span>{contagem}</span>}
    </span>
  )
}
