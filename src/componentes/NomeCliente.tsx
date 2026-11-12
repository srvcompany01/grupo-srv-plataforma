import Link from 'next/link'

/** Azul das @menções do chat: o nome do cliente usa a mesma cor, para chamar atenção em qualquer tela. */
export const COR_CLIENTE = '#1d6fe0'

/**
 * Nome do cliente em destaque (negrito e azul), em toda a plataforma onde ele aparece como texto.
 * Tags de cliente (chips coloridos) continuam com a cor da tag, também em negrito. `href` vira link.
 */
export function NomeCliente({ nome, href, arroba, className = '' }: { nome: string; href?: string; arroba?: boolean; className?: string }) {
  const texto = `${arroba ? '@' : ''}${nome}`
  return href ? <Link href={href}>{texto}</Link> : <span>{texto}</span>
}

const iniciais = (nome: string) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?'

/** Cliente em "bolinha + pílula": avatar redondo de 22px (iniciais sobre a cor do cliente; no futuro, a logo) e a pílula com o nome em negrito azul. */
export function ChipCliente({ nome, cor = '#87909e', className = '' }: { nome: string; cor?: string; className?: string }) {
  return (
    <span className={`chip-cliente ${className}`}>
      <span title={nome} aria-hidden="true" style={{ width: 22, height: 22, flex: 'none', borderRadius: '50%', background: cor, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--bg), 0 0 0 3px var(--border-soft)' }}>{iniciais(nome)}</span>
      <span style={{ height: 22, display: 'inline-flex', alignItems: 'center', padding: '0 10px', borderRadius: 999, background: 'var(--client-soft)', color: 'var(--client)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</span>
    </span>
  )
}
