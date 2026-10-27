/**
 * Biolytics: a área de captação e medição de cada cliente. Cada cliente usa os módulos que precisar (link da bio, quiz,
 * e os próximos, como formulário). Aqui ficam os módulos e as abas; cada módulo tem a sua tela com métricas e configuração.
 */
export type ModuloBiolytics = 'bio' | 'quiz'
export type AbaBiolytics = 'geral' | ModuloBiolytics

export const MODULOS: { id: ModuloBiolytics; nome: string; descricao: string }[] = [
  { id: 'bio', nome: 'Link da bio', descricao: 'Página com os botões do cliente, medida por clique, visualização e botão.' },
  { id: 'quiz', nome: 'Quiz do WhatsApp', descricao: 'Perguntas antes de abrir o WhatsApp: só quem responde vira lead orgânico.' },
]

/** Módulos já ligados a um cliente. O quiz vive na página da bio: sem a página, não há quiz. */
export const modulosAtivos = (temPagina: boolean): ModuloBiolytics[] => (temPagina ? ['bio', 'quiz'] : [])

/** A aba do link da bio está sempre disponível (é onde se cria a página); o quiz só com a página criada. */
export const lerAbaBiolytics = (v: string | undefined, ativos: ModuloBiolytics[]): AbaBiolytics => (v === 'bio' || ativos.includes(v as ModuloBiolytics) ? (v as ModuloBiolytics) : 'geral')
