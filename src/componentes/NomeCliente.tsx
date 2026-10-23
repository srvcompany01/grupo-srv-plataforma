import Link from 'next/link'

/** Azul das @menções do chat: o nome do cliente usa a mesma cor, para chamar atenção em qualquer tela. */
export const COR_CLIENTE = '#1d6fe0'

/**
 * Nome do cliente em destaque (negrito e azul), em toda a plataforma onde ele aparece como texto.
 * Tags de cliente (chips coloridos) continuam com a cor da tag, também em negrito. `href` vira link.
 */
export function NomeCliente({ nome, href, arroba, className = '' }: { nome: string; href?: string; arroba?: boolean; className?: string }) {
  const texto = `${arroba ? '@' : ''}${nome}`
  const estilo = `font-bold text-[#1d6fe0] ${className}`
  return href ? <Link href={href} className={`${estilo} hover:underline`}>{texto}</Link> : <span className={estilo}>{texto}</span>
}
