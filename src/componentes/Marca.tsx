import Image from 'next/image'

/** Símbolo da marca (PNG transparente em /public/marca). O tamanho vem em classes: ex. "h-8 w-8". */
export function Marca({ tamanho = 'h-8 w-8' }: { tamanho?: string }) {
  const caixa = tamanho.split(/\s+/).filter((c) => /^(h|w|size)-/.test(c)).join(' ')
  return <Image src="/marca/simbolo.png" alt="Grupo SRV" width={192} height={192} priority className={`${caixa} shrink-0 object-contain`} />
}

/** Nome "GRUPO SRV" (SVG, proporção 578:81). Altura em classes, ex.: "h-4". Largura acompanha. */
export function LogoGrupo({ altura = 'h-4' }: { altura?: string }) {
  return <Image src="/marca/grupo-srv.svg" alt="Grupo SRV" width={578} height={81} unoptimized priority className={`${altura} w-auto shrink-0`} />
}
