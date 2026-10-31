/**
 * Catálogo dos serviços que a plataforma usa e do que cada um cobra. Os limites são valores de REFERÊNCIA de cada fornecedor:
 * eles mudam, então a página manda conferir no painel oficial (`painel`) antes de decidir qualquer coisa.
 */
export type SituacaoCusto = 'gratis' | 'gratis_ate_limite' | 'pago' | 'depende_do_plano'

export type ServicoCusto = {
  id: string
  nome: string
  paraQue: string
  situacao: SituacaoCusto
  /** O que é grátis (e até onde). */
  gratis: string
  /** O que passa a custar depois do limite, ou o custo fixo. */
  depois: string
  /** Onde ver o consumo e o plano de verdade. */
  painel: string
}

export const ROTULO_SITUACAO: Record<SituacaoCusto, string> = {
  gratis: 'Grátis',
  gratis_ate_limite: 'Grátis até um limite',
  pago: 'Pago',
  depende_do_plano: 'Depende do plano',
}

export const SERVICOS_DE_CUSTO: ServicoCusto[] = [
  { id: 'vercel', nome: 'Vercel', paraQue: 'Hospeda a plataforma, o blog e as páginas; roda o ffmpeg que extrai o áudio dos vídeos', situacao: 'depende_do_plano', gratis: 'O plano Hobby é grátis, mas é só para uso pessoal e sem fins comerciais, com limites de tempo (funções), banda e execuções.', depois: 'O plano Pro (cerca de US$ 20 por usuário ao mês) é o indicado para empresa; passando do que ele inclui, a banda e as execuções são cobradas à parte.', painel: 'https://vercel.com/dashboard' },
  { id: 'supabase', nome: 'Supabase', paraQue: 'Banco de dados, login e permissões de tudo (tarefas, clientes, chat, caixa de entrada)', situacao: 'depende_do_plano', gratis: 'O plano Free inclui cerca de 500 MB de banco e 1 GB de arquivos, e pausa o projeto após uma semana sem uso.', depois: 'O plano Pro (cerca de US$ 25 ao mês) não pausa e inclui bem mais espaço; o que passar do incluído é cobrado.', painel: 'https://supabase.com/dashboard' },
  { id: 'r2', nome: 'Cloudflare R2', paraQue: 'Guarda os vídeos, imagens, anexos e o áudio extraído', situacao: 'gratis_ate_limite', gratis: 'Cerca de 10 GB de armazenamento por mês e uma cota mensal de operações; a saída de dados (download) não é cobrada.', depois: 'Cerca de US$ 0,015 por GB ao mês acima dos 10 GB, mais as operações que passarem da cota.', painel: 'https://dash.cloudflare.com' },
  { id: 'github-actions', nome: 'GitHub Actions', paraQue: 'Roda o Whisper que transcreve o áudio dos vídeos', situacao: 'gratis_ate_limite', gratis: 'Cerca de 2.000 minutos por mês em repositório privado (Linux); em repositório público não há limite.', depois: 'Minutos extras são cobrados por minuto. Um vídeo de 10 minutos consome em torno de 10 a 15 minutos.', painel: 'https://github.com/settings/billing' },
  { id: 'whisper', nome: 'Whisper (transcrição)', paraQue: 'Transforma a fala dos vídeos em texto para o Codex escrever as legendas', situacao: 'gratis', gratis: 'Código aberto (licença MIT), sem assinatura e sem chave. O modelo é baixado uma vez.', depois: 'Só consome os minutos do GitHub Actions (acima).', painel: 'https://github.com/openai/whisper' },
  { id: 'ffmpeg', nome: 'ffmpeg', paraQue: 'Extrai o áudio dos vídeos dentro da Vercel', situacao: 'gratis', gratis: 'Programa de código aberto, sem custo próprio. Usa o tempo de execução da Vercel.', depois: 'Nenhum.', painel: 'https://ffmpeg.org' },
  { id: 'meta', nome: 'Meta (Instagram, Facebook e anúncios)', paraQue: 'Publicar posts, ler insights e comentários, e criar e editar campanhas', situacao: 'gratis_ate_limite', gratis: 'O uso das APIs é grátis, com limites de chamadas por hora; o que você investe em anúncios é cobrado pela Meta, em cada conta de anúncios.', depois: 'A API em si não cobra. A verba dos anúncios é cobrada pela Meta de cada cliente.', painel: 'https://business.facebook.com' },
  { id: 'google-ads', nome: 'Google Ads', paraQue: 'Ler e criar campanhas de Pesquisa e puxar relatórios', situacao: 'gratis_ate_limite', gratis: 'A API é grátis, com limite diário de operações conforme o nível de acesso do token de desenvolvedor.', depois: 'A API não cobra. A verba das campanhas é cobrada pelo Google de cada cliente.', painel: 'https://ads.google.com' },
  { id: 'google-negocio', nome: 'Google Meu Negócio (Business Profile)', paraQue: 'Métricas e posts dos perfis locais dos clientes', situacao: 'gratis', gratis: 'A API é grátis, mas exige aprovação do Google (pedido já enviado).', depois: 'Nenhum custo previsto.', painel: 'https://business.google.com' },
  { id: 'google-places', nome: 'Google Places', paraQue: 'Buscar lugares, geogrid de ranking e avaliações na aba GMN', situacao: 'gratis_ate_limite', gratis: 'Há uma cota grátis por mês para cada tipo de chamada.', depois: 'Passando da cota, o Google cobra por mil chamadas. O geogrid 9×9 faz até 243 buscas por varredura, então consome rápido.', painel: 'https://console.cloud.google.com/billing' },
  { id: 'google-drive', nome: 'Google Drive e Agenda', paraQue: 'Importar vídeos do Drive para a caixa de entrada e sincronizar a agenda', situacao: 'gratis', gratis: 'As APIs são grátis, dentro de cotas generosas por dia. O espaço do Drive é o da sua conta Google.', depois: 'Espaço extra no Google One, se faltar no Drive.', painel: 'https://console.cloud.google.com' },
  { id: 'deepseek', nome: 'DeepSeek (IA da plataforma)', paraQue: 'O assistente Emma e as tarefas de texto', situacao: 'pago', gratis: 'Normalmente não há plano grátis contínuo.', depois: 'Cobrado por volume de texto (tokens) lido e escrito; costuma ser baixo.', painel: 'https://platform.deepseek.com' },
  { id: 'gemini', nome: 'Gemini (Google AI)', paraQue: 'Análise de posts e resumo de reuniões', situacao: 'gratis_ate_limite', gratis: 'A camada gratuita tem limites por minuto e por dia, que variam conforme o modelo.', depois: 'Cobrado por volume de texto, imagem e vídeo se você ativar o faturamento.', painel: 'https://aistudio.google.com' },
  { id: 'unsplash', nome: 'Unsplash', paraQue: 'Banco de imagens no editor do blog', situacao: 'gratis_ate_limite', gratis: 'Cerca de 50 pedidos por hora no modo de demonstração; mais depois da aprovação do app.', depois: 'Não cobra, só limita.', painel: 'https://unsplash.com/developers' },
  { id: 'indexnow', nome: 'IndexNow', paraQue: 'Avisar os buscadores quando um artigo do blog é publicado', situacao: 'gratis', gratis: 'Protocolo aberto e grátis.', depois: 'Nenhum.', painel: 'https://www.indexnow.org' },
  { id: 'dominio', nome: 'Domínio gruposrv.com.br', paraQue: 'O endereço da plataforma, do blog e dos e-mails', situacao: 'pago', gratis: 'Não há plano grátis.', depois: 'Renovação anual no registrador do domínio (no Brasil, em geral algumas dezenas de reais por ano).', painel: 'https://registro.br' },
]
