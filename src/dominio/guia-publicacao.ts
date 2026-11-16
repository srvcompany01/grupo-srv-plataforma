/**
 * Roteiro do que a IA precisa ter em mãos (e perguntar à pessoa quando faltar) antes de publicar um post ou subir um anúncio.
 * Fica num lugar só, em dados, para a IA (MCP) e os testes lerem a mesma lista.
 */

export type Pergunta = { campo: string; pergunta: string; obrigatorio: boolean; padrao?: string; dica?: string }
export type Guia = { objetivo: string; antesDeComecar: string[]; perguntas: Pergunta[]; passos: string[]; avisos: string[] }

const BOTOES_SITE = 'LEARN_MORE (Saiba mais), SHOP_NOW (Comprar), SIGN_UP (Cadastre-se), CONTACT_US (Fale conosco), GET_QUOTE (Orçamento), BOOK_TRAVEL (Reservar), ORDER_NOW (Pedir agora), APPLY_NOW (Candidatar-se), DOWNLOAD (Baixar), WATCH_MORE (Assistir mais)'
const BOTOES_FORMULARIO = 'SIGN_UP (Cadastre-se), APPLY_NOW (Candidatar-se), GET_QUOTE (Orçamento), LEARN_MORE (Saiba mais), CONTACT_US (Fale conosco), SUBSCRIBE (Inscrever-se), DOWNLOAD (Baixar)'

export const MODOS_META_GUIA = ['whatsapp', 'direct', 'formulario', 'site', 'perfil_instagram'] as const

const COMUM_META: Pergunta[] = [
  { campo: 'cliente', pergunta: 'De qual cliente é o anúncio?', obrigatorio: true },
  { campo: 'video', pergunta: 'Qual vídeo usar? (nome no Drive do cliente, ou um vídeo que já esteja na caixa de entrada)', obrigatorio: true, dica: 'buscar_videos_drive / listar_caixa_de_entrada' },
  { campo: 'nomeDaCampanha', pergunta: 'Qual o nome da campanha?', obrigatorio: true, padrao: 'Cliente | objetivo | mês' },
  { campo: 'orcamentoDiario', pergunta: 'Qual o orçamento diário (em R$)?', obrigatorio: true, dica: 'Por conjunto (padrão) ou na campanha inteira (cbo=true).' },
  { campo: 'inicio/fim', pergunta: 'Quando começa e quando termina? (datas; vazio = começa ao ativar, sem fim)', obrigatorio: false },
  { campo: 'locais', pergunta: 'Quais cidades ou estados atingir? (vazio = Brasil inteiro)', obrigatorio: false, dica: 'buscar_locais_meta; raioKm opcional por cidade.' },
  { campo: 'idades', pergunta: 'Faixa etária? (idadeMin e idadeMax, de 13 a 65)', obrigatorio: false, padrao: '18 a 65' },
  { campo: 'generos', pergunta: 'Gênero: todos, homens ou mulheres?', obrigatorio: false, padrao: 'todos' },
  { campo: 'interesses', pergunta: 'Algum interesse para segmentar? (opcional)', obrigatorio: false, dica: 'buscar_interesses_meta' },
  { campo: 'advantage', pergunta: 'Deixar a Meta ampliar o público (Advantage+)?', obrigatorio: false, padrao: 'não' },
  { campo: 'texto', pergunta: 'Qual o texto principal (legenda) do anúncio?', obrigatorio: true, dica: 'Até 2.200 caracteres; só as primeiras ~125 aparecem sem "ver mais". Use o tom da ficha_conteudo_cliente.' },
  { campo: 'titulo', pergunta: 'Qual o título (headline)?', obrigatorio: false, dica: 'Até 80 caracteres; o ideal é ~40.' },
  { campo: 'descricao', pergunta: 'Qual a descrição (linha abaixo do título)?', obrigatorio: false, dica: 'Até 120 caracteres.' },
]

export function guiaDePost(): Guia {
  return {
    objetivo: 'Publicar vídeos como posts orgânicos (Instagram, Facebook, Google Meu Negócio), agendados na Meta.',
    antesDeComecar: ['ficha_conteudo_cliente (tom de voz, hashtags, chamada para ação)', 'listar_caixa_de_entrada ou buscar_videos_drive + importar_video_drive', 'audio_do_video_caixa (baixe o áudio extraído e transcreva para saber o que o vídeo fala)', 'A lista de conteúdo do cliente (use listar_arvore para achar o id)'],
    perguntas: [
      { campo: 'cliente', pergunta: 'De qual cliente são os vídeos?', obrigatorio: true },
      { campo: 'videos', pergunta: 'Quais vídeos postar? (todos da caixa, ou os que tiverem certo nome)', obrigatorio: true },
      { campo: 'listaDeConteudo', pergunta: 'Em qual lista de conteúdo criar os posts?', obrigatorio: true },
      { campo: 'formato', pergunta: 'Formato: Reels, Feed, Stories ou TikTok?', obrigatorio: true, padrao: 'reels (vídeo vertical)' },
      { campo: 'legenda', pergunta: 'Alguma instrução para a legenda além do tom e das hashtags da ficha?', obrigatorio: false },
      { campo: 'redes', pergunta: 'Publicar em quais redes? (instagram, facebook, google)', obrigatorio: true, padrao: 'instagram' },
      { campo: 'quando', pergunta: 'Qual frequência ou janela? (ex.: 1 por dia útil nas próximas 2 semanas) — ou prefere que eu escolha os melhores horários?', obrigatorio: true, dica: 'sugerir_horarios_publicacao' },
      { campo: 'modo', pergunta: 'Cliente aprova no portal antes de publicar, ou publicar direto?', obrigatorio: true, padrao: 'aprovacao' },
      { campo: 'collab', pergunta: 'Convidar alguém para collab no Instagram? (até 3 @)', obrigatorio: false },
    ],
    passos: ['criar_post_da_caixa (um por vídeo, com a legenda e as hashtags)', 'sugerir_horarios_publicacao', 'MOSTRAR a tabela (vídeo, legenda, dia, hora, redes) e esperar o OK da pessoa', 'agendar_post para cada post aprovado', 'situacao_publicacao_post para acompanhar'],
    avisos: ['Nunca agende sem a confirmação da pessoa.', 'Vídeo acima de 1 GB: a plataforma não comprime, mas a Meta pode recusar ou recomprimir; peça a confirmação.', 'Se for usar o mesmo vídeo em post e em anúncio, crie o criativo (criativo_da_caixa) ANTES do post: criar o post tira o arquivo da caixa.'],
  }
}

export function guiaDeAnuncioMeta(modo?: (typeof MODOS_META_GUIA)[number]): Guia {
  const perguntas: Pergunta[] = [
    { campo: 'modo', pergunta: 'Qual o objetivo? whatsapp (conversas no WhatsApp), direct (conversas no Direct), formulario (cadastro na Meta), site (cliques para o link) ou perfil_instagram (visitas ao perfil — papel MARCA)', obrigatorio: true, padrao: modo },
    ...COMUM_META,
  ]
  if (modo === 'site' || !modo) perguntas.push({ campo: 'link', pergunta: 'Qual o link de destino (https)?', obrigatorio: modo === 'site', dica: 'Só para o objetivo site.' })
  if (modo === 'formulario' || !modo) perguntas.push({ campo: 'formularioId', pergunta: 'Qual formulário de cadastro usar?', obrigatorio: modo === 'formulario', dica: 'listar_formularios_meta. Só para o objetivo formulario.' })
  const botao: Pergunta | null = modo === 'whatsapp' ? null : modo === 'direct' ? null : modo === 'perfil_instagram' ? null
    : { campo: 'botao', pergunta: 'Qual botão (chamada para ação)?', obrigatorio: false, padrao: modo === 'formulario' ? 'SIGN_UP' : 'LEARN_MORE', dica: `Opções: ${modo === 'formulario' ? BOTOES_FORMULARIO : BOTOES_SITE}` }
  if (botao) perguntas.push(botao)
  const fixo = modo === 'whatsapp' ? 'O botão é sempre "Enviar mensagem no WhatsApp" (o número é o do WhatsApp ligado à Página).' : modo === 'direct' ? 'O botão é sempre "Enviar mensagem" no Direct do Instagram.' : modo === 'perfil_instagram' ? 'O botão é sempre "Ver perfil do Instagram".' : null
  return {
    objetivo: 'Subir um criativo (vídeo) da caixa de entrada ou do Google Drive como anúncio na Meta, numa campanha nova ou num conjunto que já existe.',
    antesDeComecar: ['ficha_conteudo_cliente (tom de voz)', 'buscar_videos_drive + importar_video_drive (com paraBiblioteca=true) ou listar_caixa_de_entrada + criativo_da_caixa', 'listar_criativos_cliente (confirma o id do criativo)', 'audio_do_video_caixa (baixe o áudio extraído e transcreva para escrever o texto)', 'estrutura_anuncios_cliente (se for adicionar a um conjunto que já existe)'],
    perguntas,
    passos: ['Perguntar tudo que estiver sem padrão e faltando', 'MOSTRAR o resumo (campanha, orçamento, público, texto, título, descrição, botão) e esperar o OK', 'criar_campanha_meta (campanha nova) ou adicionar_anuncio_meta (conjunto existente) — nasce PAUSADO', 'propor_alteracao_anuncio (ativar) — admin ou gestor aprova na aba Anúncios', 'Depois de no ar: detalhar_objeto_meta e editar_objeto_meta para ajustes'],
    avisos: [...(fixo ? [fixo] : []), 'Tudo nasce pausado; ativar e mudar orçamento exigem aprovação.', 'Só admin e gestor criam anúncios.', 'O mesmo criativo pode ser usado em vários anúncios (um por criativo e conjunto).'],
  }
}

export function guiaDeAnuncioGoogle(): Guia {
  return {
    objetivo: 'Criar uma campanha de Pesquisa no Google Ads (anúncio de texto). Vídeo NÃO é usado: anúncios de vídeo do Google precisam estar no YouTube e a plataforma ainda não sobe vídeo para o YouTube.',
    antesDeComecar: ['ficha_conteudo_cliente (tom de voz)', 'buscar_locais_google', 'ideias_palavras_google (volume de buscas e lance)'],
    perguntas: [
      { campo: 'cliente', pergunta: 'De qual cliente é a campanha?', obrigatorio: true },
      { campo: 'nome', pergunta: 'Nome da campanha?', obrigatorio: true },
      { campo: 'orcamentoDiario', pergunta: 'Orçamento diário (R$)?', obrigatorio: true },
      { campo: 'estrategia', pergunta: 'Estratégia: cliques (conta sem conversões) ou conversoes?', obrigatorio: true, padrao: 'cliques' },
      { campo: 'locais', pergunta: 'Quais locais atingir? (vazio = Brasil)', obrigatorio: false },
      { campo: 'palavras', pergunta: 'Palavras-chave e correspondência (ampla, frase ou exata)?', obrigatorio: true, dica: 'ideias_palavras_google ajuda a escolher.' },
      { campo: 'negativas', pergunta: 'Palavras negativas?', obrigatorio: false },
      { campo: 'titulos', pergunta: 'Títulos do anúncio (3 a 15, até 30 caracteres cada)?', obrigatorio: true },
      { campo: 'descricoes', pergunta: 'Descrições (2 a 4, até 90 caracteres cada)?', obrigatorio: true },
      { campo: 'url', pergunta: 'URL de destino (https)?', obrigatorio: true },
      { campo: 'cpcMaximo', pergunta: 'Teto de CPC (R$)? (só estratégia cliques)', obrigatorio: false },
      { campo: 'cpaDesejado', pergunta: 'CPA desejado (R$)? (só estratégia conversoes)', obrigatorio: false },
      { campo: 'sitelinks', pergunta: 'Sitelinks e telefone (extensão de chamada)?', obrigatorio: false },
    ],
    passos: ['Perguntar o que faltar', 'MOSTRAR o resumo e esperar o OK', 'criar_campanha_google_pesquisa — nasce PAUSADA', 'propor_alteracao_anuncio (ativar, plataforma google, nível campanha)'],
    avisos: ['Só admin e gestor criam campanhas.', 'Tudo nasce pausado; ativar exige aprovação.'],
  }
}
