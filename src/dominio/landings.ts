/**
 * Landing pages que moram dentro do app (arquivos estáticos em public/lp/<slug>/index.html).
 * Para criar outra: ponha a pasta em public/lp/<slug>/ e acrescente o slug aqui. Ela passa a responder em /<slug>,
 * sem login, e os formulários dela mandam os dados para /api/leads (com `payload.source` identificando a página).
 */
export const LANDINGS = ['maquinadevendas'] as const
export type Landing = (typeof LANDINGS)[number]
