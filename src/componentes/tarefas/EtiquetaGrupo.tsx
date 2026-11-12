import { textoSobreCor, type IconeStatusInfo } from '@/dominio/status-icone'

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
        className="etiqueta-grupo"
        style={claro ? { background: 'var(--bg-active)', color: 'var(--text-2)' } : { background: cor, color: texto }}
      >
        <span className="etiqueta-grupo-aro" aria-hidden="true" />
        <span>{nome}</span>
      </span>
      {contagem !== undefined && <span className="etiqueta-grupo-n">{contagem}</span>}
    </span>
  )
}
