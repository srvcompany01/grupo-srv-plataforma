/**
 * Landing pages que moram dentro do app (arquivos estáticos em public/lp/<slug>/index.html).
 * Para criar outra: ponha a pasta em public/lp/<slug>/ e acrescente uma linha aqui. Ela passa a responder em /<slug>, sem login.
 * `source`: o texto que a página manda em `payload.source` ao enviar o formulário; é ele que liga a página ao formulário
 * escolhido na aba Formulários (Configurações). Páginas sem formulário (como a calculadora) ficam com `source: null`.
 */
export const LANDINGS = [
  { slug: 'maquinadevendas', nome: 'Máquina de Vendas', source: 'landing_page_maquina_de_vendas' },
  { slug: 'calculadora', nome: 'Calculadora de ROI', source: null },
] as const

export type Landing = (typeof LANDINGS)[number]
export const SLUGS_DAS_LANDINGS: string[] = LANDINGS.map((l) => l.slug)

/** Landings que enviam formulário (as que podem ser ligadas a um formulário). */
export const LANDINGS_COM_FORMULARIO = LANDINGS.filter((l) => l.source !== null)

export const landingDoSource = (source: string): string | null => LANDINGS.find((l) => l.source === source)?.slug ?? null
