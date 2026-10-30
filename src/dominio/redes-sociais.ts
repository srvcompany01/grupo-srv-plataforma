import type { Cliente } from '@/servicos/clientes-plataforma'

/** Redes e canais que a agência trabalha, com as funções de cada uma. `conectada: false` = a estrutura já existe, a integração ainda não. */

export type FuncaoRede = { id: string; rotulo: string; descricao: string; icone: string; href?: string; externo?: boolean }
export type SlugRede = 'instagram' | 'x' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest' | 'gmn' | 'blog'
export type Rede = { slug: SlugRede; nome: string; cor: string; conectada: boolean; resumo: string; funcoes: FuncaoRede[] }

const FUTURAS = (nome: string): FuncaoRede[] => [
  { id: 'perfil', rotulo: 'Perfil do cliente', descricao: `Ver o perfil de cada cliente no ${nome}`, icone: 'account_circle' },
  { id: 'agendar', rotulo: 'Agendar publicações', descricao: 'Programar posts de forma manual', icone: 'event_available' },
  { id: 'insights', rotulo: 'Insights e relatórios', descricao: 'Alcance, crescimento e melhores conteúdos', icone: 'insights' },
  { id: 'panorama', rotulo: 'Panorama de todos os clientes', descricao: 'Comparar os perfis lado a lado', icone: 'grid_view' },
]

export const REDES: Rede[] = [
  {
    slug: 'instagram', nome: 'Instagram', cor: '#e1306c', conectada: true,
    resumo: 'Posts, Reels e Stories dos clientes: agendamento, insights e comentários.',
    funcoes: [
      { id: 'agendar', rotulo: 'Agendar posts', descricao: 'Agende e publique de forma manual, e acompanhe a fila', icone: 'event_available', href: '/agendamentos' },
      { id: 'insights', rotulo: 'Insights', descricao: 'Alcance, seguidores e os melhores posts de cada cliente', icone: 'insights', href: '/insights' },
      { id: 'comentarios', rotulo: 'Comentários', descricao: 'Ler, responder e moderar os comentários dos posts', icone: 'forum', href: '/insights?aba=organico' },
      { id: 'caixa', rotulo: 'Caixa de entrada de vídeos', descricao: 'Vídeos que chegam e viram posts agendados', icone: 'move_to_inbox', href: '/caixa-de-entrada' },
      { id: 'performance', rotulo: 'Relatório do orgânico', descricao: 'Resultados mês a mês, com projeção', icone: 'trending_up', href: '/performance' },
      { id: 'bio', rotulo: 'Link da bio', descricao: 'Página da bio e quiz de cada cliente', icone: 'link', href: '/biolytics' },
    ],
  },
  { slug: 'x', nome: 'X (Twitter)', cor: '#111111', conectada: false, resumo: 'Posts e conversas em tempo real.', funcoes: FUTURAS('X') },
  { slug: 'linkedin', nome: 'LinkedIn', cor: '#0a66c2', conectada: false, resumo: 'Conteúdo profissional e páginas de empresa.', funcoes: FUTURAS('LinkedIn') },
  { slug: 'youtube', nome: 'YouTube', cor: '#ff0000', conectada: false, resumo: 'Vídeos, Shorts e o canal de cada cliente.', funcoes: FUTURAS('YouTube') },
  { slug: 'tiktok', nome: 'TikTok', cor: '#111111', conectada: false, resumo: 'Vídeos curtos e o perfil de cada cliente.', funcoes: FUTURAS('TikTok') },
  { slug: 'pinterest', nome: 'Pinterest', cor: '#e60023', conectada: false, resumo: 'Pins e painéis que levam tráfego.', funcoes: FUTURAS('Pinterest') },
  {
    slug: 'gmn', nome: 'Google Meu Negócio', cor: '#4285f4', conectada: true,
    resumo: 'Perfil local dos clientes: presença, métricas e posts.',
    funcoes: [
      { id: 'presenca', rotulo: 'Presença e métricas', descricao: 'Ligações, rotas, buscas e a posição no mapa', icone: 'location_on', href: '/gmn' },
      { id: 'posts', rotulo: 'Posts no Google', descricao: 'Agende posts do Meu Negócio junto com os das outras redes', icone: 'event_available', href: '/agendamentos' },
      { id: 'relatorio', rotulo: 'Relatórios', descricao: 'Resultados do perfil local no mês', icone: 'trending_up', href: '/performance' },
    ],
  },
  {
    slug: 'blog', nome: 'Blog', cor: '#18181b', conectada: true,
    resumo: 'O blog da agência para atrair clientes pelo Google.',
    funcoes: [
      { id: 'editor', rotulo: 'Editor do blog', descricao: 'Escrever, validar SEO e publicar artigos', icone: 'edit_note', href: '/editor-blog' },
      { id: 'publico', rotulo: 'Ver o blog publicado', descricao: 'Abrir o blog no site', icone: 'open_in_new', href: 'https://www.gruposrv.com.br/blog', externo: true },
    ],
  },
]

export const redePorSlug = (slug: string): Rede | undefined => REDES.find((r) => r.slug === slug)

/** Quais redes cada cliente já tem ligadas na plataforma. As demais entram quando a integração existir. */
export const ligadaNoCliente = (c: Pick<Cliente, 'metaPaginaId' | 'googlePerfil' | 'status' | 'interno'>, rede: SlugRede): boolean =>
  rede === 'instagram' ? !!c.metaPaginaId : rede === 'gmn' ? !!c.googlePerfil : rede === 'blog' ? c.status === 'ativo' && !c.interno : false

