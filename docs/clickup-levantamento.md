# Levantamento do ClickUp (workspace "Srv Company") — base para implementar na plataforma

Levantado em 2026-10-27/28 pelo navegador (Playwright), com a conta do Fabricio. Plano gratuito/Unlimited: funções pagas
aparecem só como tela de upgrade; o que cada uma faz está descrito na seção "Funções pagas" (vem do texto do próprio ClickUp).

Legenda de prioridade sugerida: **A** = alto valor/baixo risco, **B** = médio, **C** = depois.

---------------------------------------------------------------------------------------------------------------------------

## 1. Estrutura de navegação

### 1.1 Faixa de ícones (esquerda, verde) — cada ícone troca o painel ao lado
Início · Espaços · Chat · Planejador · Equipes · Documentos · Painéis · Quadros brancos · Formulários · Clipes · Metas ·
Planilhas de horas · Mais (Aplicativos, "Personalizar navegação"). Rodapé: Convidar, Fazer upgrade.
- Barra lateral recolhível (⌘\\), redimensionável, com "Personalizar a barra lateral" (escolher o que aparece).
- Cada módulo tem painel próprio com: "Todos os X", "Meus X", "Compartilhado comigo", "Privado", Favoritos e Recentes.

### 1.2 Painel "Início"
Novo (atalho de criação) · Caixa de entrada · Respostas · Comentários atribuídos · Posts · Reuniões · Minhas tarefas
(expande: Atribuídas a mim, Hoje e atrasadas, Lista pessoal) · Favoritos · Espaços · Canais · Mensagens diretas.
- Cabeçalho do painel: ícones de caixa de entrada, busca, filtro, recolher, botão "+".
- Botão "+" cria: Tarefa, Mensagem, Lista, Canal, Espaço, Documento, Formulário, Painéis, Quadro branco, Clipe, Importar, Modelos.

### 1.3 Painel "Espaços" (árvore)
"Todas as tarefas" no topo → espaços → pastas → listas → "+ Novo Espaço". Cada nível tem menu "…" e "+".
- **Menu do espaço ("…")**: Favorito, Renomear, Copiar link, Criar novo (Lista/Pasta/Documento/Painéis/Quadro branco/Formulário/Importações/Modelos),
  Cor e ícone, Automações, Campos personalizados, Status de tarefas, Etiquetas, Mais, Importações, Modelos, Ocultar espaço
  ("você continuará tendo acesso, mas ele não aparecerá na barra lateral"), Duplicar, Arquivar, Excluir, Compartilhamento e permissões.
- **Menu da lista ("…")**: Favorito, Renomear, Copiar link, Criar novo, Cor e ícone, Automações, Campos personalizados, Status de tarefas, Mais,
  Informações da Lista, Tipo de tarefa padrão, E-mail para lista (cada lista tem endereço de e-mail que vira tarefa), Importações, Modelos, Mover,
  Duplicar, Arquivar, Excluir, Compartilhamento e permissões.
- Criar lista: nome, espaço (localização), "Tornar privado" (compartilhar só com pessoas escolhidas), "Usar modelos".
- Espaço arquivado mostra aviso amarelo "Este espaço está arquivado. Desarquivar".
- Várias empresas: o seletor do topo esquerdo ("Srv Company ▾") troca de Espaço de trabalho (workspace) e cria outro.

### 1.4 Topo
Seletor de workspace (Configurações, Pessoas, Aplicativos, Modelos, Campos personalizados, Automações, trocar/criar workspace) ·
Busca global ⌘K (centro de comando) · atalhos à direita: Criar tarefa, Meu trabalho(?), Bloco de notas, Gravar clipe, Fala para texto, Lembrete,
Documento · avatar com menu (status, silenciar notificações, Configurações, Notificações, Temas, Atalhos de teclado, Ferramentas pessoais, Lixo, Sair).

### 1.5 Página da lista (cabeçalho)
Trilha **Espaço / Pasta / Lista** (com "…" para níveis ocultos e seletor para pular) · estrela de favorito · Compartilhar (+ avatar de quem tem acesso) ·
ícone de chamada SyncUp · ícone de automações (robô) · "Adicionar canal".
- **Abas de visualização**: Canal (chat da lista), Lista, Calendário, Quadro, "+ Visualização". Cada lista pode ter várias, com ícone colorido por tipo.
- **Barra de ferramentas**: Agrupar por · Subtarefas (recolhidas/expandidas/em linha) · Colunas · Filtro (com Filtros salvos) · Mostrar tarefas fechadas ·
  Responsáveis · "Modo eu" (só minhas tarefas) · Pesquisar · engrenagem "Personalizar visualização" · botão "+ Tarefa" (com seta para escolher o tipo).
- Visualização alterada mostra "Salvar visualização" (laranja). Há "Salvar automaticamente", "Fixar", "Visualização privada", "Proteger", "Definir como padrão".

---------------------------------------------------------------------------------------------------------------------------

## 2. Visualizações (tipos disponíveis ao clicar em "+ Visualização")
Popular: Lista, Gantt, Calendário, Documento, Quadro (Kanban), Formulário, Painéis, Galeria.
Mais: Tabela, Whiteboard, Linha do tempo, Atividade, Carga de trabalho, Mapa mental, Equipe, Mapa.
Incorporações: Qualquer site (embed), Google Sheets. Rodapé: "Visualização privada", "Fixar visualização", "Modelos" (visualizações modelo).

Detalhes de cada (o que configura):
- **Lista**: agrupa por status (padrão) ou outro campo; colunas; subtarefas; "Mostrar status vazios", "Quebrar texto", "Mostrar localizações da tarefa",
  "Mostrar nomes de subtarefas pais", "Mostrar tarefas fechadas".
- **Calendário**: visão Mês/Semana/Dia; "Hoje"; barra lateral direita "Não agendado" e "Em atraso" para arrastar tarefas para o dia.
- **Quadro (Kanban)**: colunas por status, contador, "Adicionar grupo", arrastar cartões; cartão mostra data, prioridade, etiquetas, nº de subtarefas.
- **Gantt**: linhas de tarefas à esquerda e barras no tempo à direita; "Hoje", escala (Semana/Dia…), "Ajuste automático", "Exportar", dependências entre tarefas,
  caminho crítico/marcos (Marco = tipo de tarefa sem duração).
- **Tabela**: planilha de tarefas, linhas numeradas, "Altura da linha" (Pequeno/…), campos como colunas, agrupar, filtrar, selecionar várias.
- **Linha do tempo**: tarefas por data de início/vencimento num eixo (Dias/Semanas…); "Colorir tarefas por", "Mostrar fins de semana", "Mostrar número das semanas",
  "Expandir nomes das tarefas".
- **Carga de trabalho**: capacidade por pessoa e dia (Estimativas de tempo / contagem de tarefas / pontos), "Programado diariamente", "Modificar o trabalho por dia",
  agrupa por Responsável; mostra "Não atribuído" e painel direito com tarefas "Não programado / Nenhuma estimativa / Em atraso / Não atribuído".
- **Galeria**: cartões grandes com capa (imagem da tarefa) agrupados por status; "Tamanho do cartão", "Capa do cartão (Automático)", "Agrupar campos",
  "Mostrar campos vazios", "Recolher grupos vazios".
- **Atividade**: feed cronológico ("Hoje") de tudo que aconteceu nas tarefas da lista ("Fabricio criou esta tarefa").
- **Mapa**: tarefas num mapa por endereço/campo de localização.
- **Mapa mental / Equipe / Painéis** → pagos (ver seção 4).

---------------------------------------------------------------------------------------------------------------------------

## 3. Tarefa aberta (visão em tela cheia ou painel)
- Trilha **Espaço / Lista**, botões Compartilhar, ★ favorito, "…", alternar entre painel/tela cheia, fechar, setas cima/baixo para ir à tarefa anterior/seguinte.
- **Tipo da tarefa** (Tarefa, Marco, Anotação da reunião, Conteúdo, Postagem, Resposta do formulário; criável em Configurações) com ícone; ID curto (#86ahutzzy);
  botão de "AI/auto-título".
- **Propriedades**: Status (menu com Status ativos, grupo "Fechado" e botão ✓ concluir), Responsáveis (vários), Datas (início → vencimento, calendário com
  atalhos Hoje/Mais tarde/Amanhã/Este final de semana/Semana que vem/Próximo final de semana/2 semanas/4 semanas e "Configurar recorrência"),
  Prioridade (Urgente/Alta/Normal/Baixa, atalhos ⌘1–⌘4, "Prioridades pessoais" por usuário), Estimativa de tempo, Rastrear tempo (Start), Etiquetas.
  "Recolher campos vazios / Ocultar N campos vazios".
- **Campos personalizados** (seção "Campos"): Cliente, Engenharia, Formato, Gancho, Gatilho, Mês, Objetivo, Pauta, Prazo (fórmula)… cada um com ícone do tipo.
- Descrição (editor rico), **Subtarefas** (tabela com Responsável/Prioridade e colunas extras, "Add Tarefa", aninhadas), "Vincular itens ou adicionar dependências"
  (bloqueia/bloqueada por/relacionada), **Checklists** (vários, itens atribuíveis a pessoas), Anexar arquivo.
- **Painel de Atividade** (direita): histórico de tudo ("criou esta tarefa", "alterou o status de X para Y"), busca, filtro, sino de notificações da tarefa,
  caixa de **Comentário** ou **E-mail** (enviar/receber e-mail pela tarefa) com +, anexo, @menção, atribuir comentário, emoji, gravar clipe, tarefa, doc, microfone.
- **Menu "…" da tarefa**: Copiar link/ID/Nova aba, Favorito, Deixar de seguir, Lembrar mais tarde na caixa de entrada, Mover para, Adicionar a (várias listas),
  Mesclar, Duplicar, Converter para (outro tipo), Campos personalizados, Modelos, Relacionamentos, Histórico da descrição, Tipo de tarefa,
  "Sincronizar datas com subtarefas", Impressão, Enviar e-mail para tarefa, Arquivar, Excluir, Compartilhamento e permissões.
- Menu do botão "+ Tarefa": escolher tipo, "Tarefa de outra lista", "Fixar um modelo", "Aplicar um modelo".

---------------------------------------------------------------------------------------------------------------------------

## 4. Funções pagas (só vimos a tela de upgrade; o que o ClickUp diz que cada uma faz)

> Pedido do Fabricio: registrar a função para implementarmos juntos mesmo sem ver a tela.

- **Painéis (Dashboards)** — Business. Painéis com cartões de gráficos e métricas de tarefas/tempo/pessoas/campos; "Painéis avançados"; modelos prontos
  no ClickUp: **Painel simples** ("gerencie e priorize tarefas"), **Portal do cliente** ("colabore com clientes em projetos"), **Gestão de projetos**
  ("analise o progresso e as métricas do projeto"). Lista tem colunas Nome, Localização, Data de visualização, Data de atualização, Proprietário, Compartilhamento.
  → Equivale ao nosso Painel de Gestão/Performance; falta a montagem livre de cartões e o "portal do cliente" compartilhável.
- **Visualização de Mapas mentais** — Business. Brainstorming visual de ideias; transforma a lista em mapa de nós (tarefas e subtarefas ligadas).
- **Visualização de Equipe** — Business. "Veja as tarefas de todo mundo, acompanhe metas e gerencie visualmente a capacidade." Cartão por pessoa com tarefas
  feitas/não feitas, % concluído, barra de progresso por status (Pronto/Em andamento/Revisão), arrastar e soltar para equilibrar carga.
- **Gerenciador de etiquetas** — Business Plus. Lista todas as etiquetas do workspace em um lugar (nome, cor, uso em nº de tarefas, criada em), organizadas por
  localização, com ordenação, filtro e **exclusão em massa**.
- **Gerenciador avançado de campos personalizados**, **Permissões personalizadas**, **Formulários avançados**, **Wikis de documentos**, **Rastreamento de
  tempo avançado**, **Anotações com IA do SyncUp ilimitadas**, **100.000 automações/mês** — Business Plus (lista da tela de upgrade).
- **Business** inclui: Dashboards ilimitados, Painéis avançados, Gerenciamento de recursos (carga), SSO Google + 2FA por SMS, 10.000 automações/mês,
  integrações de automação e Webhooks, Visualizações privadas, ClickUp Brain.
- **Segurança (Business/Enterprise)**: exigir 2FA para todos os membros, SSO (Google/Microsoft/Okta/SAML), gerenciamento de sessão (duração e tempo
  ocioso), retenção de dados do chat (apagar mensagens após X tempo).
- **Marca personalizada** — Enterprise: logo redondo 72×72, logo retangular 232×48 (e-mails, login, links públicos), imagem de pré-visualização 500×260,
  esquema de cor, URL personalizada `empresa.clickup.com`.
- **Registros de auditoria** — Business Plus/Enterprise: log de tudo que cada usuário fez (login, criou/excluiu, alterou permissão), com filtros.
- **Uso de IA / ClickUp Brain** — assistente de IA (⌘O), geração de textos, resumo de tarefas, AI Notetaker (atas de reunião automáticas), "Super Agentes"
  (agentes de IA que executam ações: atualizar tarefa, criar evento, enviar e-mail, concluir tarefa).

---------------------------------------------------------------------------------------------------------------------------

## 5. Configurações do workspace (Administrador / Recursos / Integrações)
- **Geral**: avatar, nome do workspace, marca personalizada (Enterprise), "Layout do Espaço de trabalho pessoal".
- **Pessoas**: tabela Nome/E-mail/Função/Última atividade/Convidado por/em, busca, filtros ("Todos os usuários"), "Convidar pessoas", "Exportar". Funções:
  Proprietário, Admin, Membro, Convidado (limitado) etc.
- **Equipes**: grupos de usuários para atribuir tarefas, mencionar (@equipe) em comentários.
- **Faturamento / Uso de IA / Segurança e permissões / Registros de auditoria / Lixo** (itens apagados somem em 30 dias; filtros Tipo e "Eu").
- **Gerenciador de campos personalizados**: abas "Todos os campos", "Campos do Espaço de trabalho", "Campos de tipo de tarefa" (novo), "Lista pessoal";
  filtra por localização e por tipo de tarefa; tabela com Nome, Tipo, Criado por, Data de criação, Localizações; agrupada por tipo; "Criar novo".
- **Central de modelos**: Destaques, Modelos do espaço de trabalho, Modelos da ClickUp; tipos: Art Kit, Super Agent, Skill, Espaço, Pasta, Lista, Tarefa,
  Documento, Visualização, Quadro branco; filtros por complexidade e casos de uso; modelo "[Template] Novo Cliente", "Post Estático", "Nova Campanha Ads".
- **Gerente de automações** (abas Navegar, Gerenciar, Utilização, Atividade, Webhooks, Recorrência): por espaço/pasta/lista, filtros por Acionar (gatilho),
  Condição, Ação e Atualizado por; "Adicionar automação". Modelo "Quando [gatilho], se [condição], então [ação]".
- **AI Notetaker**, **Emojis** (emojis personalizados), **Espaços** (tabela de espaços com Proprietário, Compartilhado com, contagem de status/campos,
  Substituições de status; abas Ativos/Arquivado/Inacessível), **Tipos de tarefa** (limite de 20 no plano; criar tipo com nome e ícone;
  "Tipos recomendados": Ativo, Campanha etc.), **Cronograma de trabalho** (dias/horas úteis da equipe para a carga de trabalho).
- **Centro de aplicativos**: categorias (Análises, Armazenamento em nuvem, Base de conhecimento, Calendários, Comunicação, Contabilidade, CRM, Desenvolvimento,
  Design e vídeo, E-mail, Notetakers, Rastreamento de tempo, MCP personalizado) — Google Calendar/Drive conectados; ClickApps (liga/desliga recursos).
- **Importações/exportações** (histórico de importações de planilha, "Importar itens" e "Exportar itens"), **API da ClickUp** (token pessoal), **Integração de e-mail**.

## 6. Preferências do usuário (Minhas configurações)
Perfil (avatar, nome, e-mail, senha), 2FA (SMS pago, TOTP), Cor do tema (10 cores), Aparência (Claro/Escuro/Auto), Alto contraste, Idioma e região
(fuso, "notifique mudança de fuso", início da semana, formato 12/24 h e de data), Preferências do aplicativo: avisos de ação, Cmd+Return para enviar comentário,
atalhos de teclado, Markdown, citações e comemorações (confete), selo de verificado, modo de desempenho, detectar app desktop, limites de abas,
"pedir para adicionar tarefa às prioridades após atribuir", IDs no seletor de @, cursor mão, **exibição de links e menções** (pré-visualização de links;
o que mostra ao mencionar tarefa: status, responsável, ID personalizado), permissão de login para o suporte, ClickUp Labs (recursos experimentais).
- **Notificações**: Caixa de entrada, E-mail (com "enviar notificação de teste"), Navegador, Celular (notificações inteligentes: não enviar no celular
  enquanto uso o desktop), integração Slack, "Seguir automaticamente as tarefas das quais participo" (ao criar, editar, comentar…).
- **Atalhos do teclado**: Global (Criar tarefa T, Criar lembrete R, ⌘K busca, ⌘O IA, Fala para texto ⌥V, bloco de notas N/P, ⌘\\ barra lateral),
  Navegação, Editor de texto, Visualização de tarefa, Chat, Caixa de entrada, Documentos, Visualizações, Quadros brancos, SyncUps.

---------------------------------------------------------------------------------------------------------------------------

## 7. Módulos
- **Caixa de entrada**: abas Todos / Principal / Outro / Mais tarde / Removidas com contador de não lidas; filtro; "Apagar tudo"; agrupado por período;
  cada item = notificação ("A tarefa está atrasada. A data final era 6/10/26") com ícone da tarefa, prioridade, data e ações (adiar, concluir, remover).
- **Respostas** e **Comentários atribuídos** (comentários que viram pendência para alguém e podem ser resolvidos).
- **Posts**: publicações tipo mural em canais (tipos Anúncio, Atualização); editor com título, formatação, anexos, @, reações; filtros por Canal, Autor, Tipo.
- **Reuniões**: "Próximas reuniões" (do Google Calendar), anotações do AI Notetaker, filtros e etiquetas.
- **Minhas tarefas / Meu trabalho**: cartões configuráveis ("Gerenciar cartões"): **Prioridades** (lista curta de tarefas mais importantes), **Meu trabalho**
  (tarefas e lembretes atribuídos, agrupados em Hoje, Em atraso, Próximo, Não programado, Feito, Delegado), **Lista pessoal** e **Hoje e atrasadas**.
  Saudação "Boa noite, Fabricio".
- **Planejador**: calendário semanal com "Prioridades", "Reunião com", "Atribuídas a mim", Hoje/atrasadas e lista de pendências para arrastar ao horário.
- **Visão geral do Espaço** (aba "Overview"): página de cartões configuráveis — Recente, Documentos, Favoritos, Pastas (cartões), Listas; botões "Cartão",
  filtro, engrenagem, "Atualização automática". Faixa "Aproveite ao máximo a sua visão geral! Adicione, reordene e redimensione cartões".
- **Documentos**: lista (Todos, Meus, Compartilhado comigo, Privado, Atas, Arquivado), Favoritos, Páginas recentes, Wikis populares (pago). Editor com páginas
  aninhadas, títulos coloridos, Exportar (PDF/HTML/Markdown/Impressão; "Esta página" ou "Documento completo"), Importar (Confluence, Notion, HTML, Markdown,
  arquivos), vincular tarefa/documento, comentários, selo "Novo", compartilhar.
- **Quadros brancos**: canvas infinito com pontos; barra de ferramentas: selecionar, mão, **Tarefa** (cria tarefa real no quadro), caneta, forma, seta, nota
  adesiva, texto, moldura, imagem, fluxograma/mapa; zoom, desfazer; colaboração em tempo real e "Compartilhar".
- **Formulários**: lista com modelos (Recebimento do projeto, Formulário de feedback, Formulário de pedido, Candidatura de emprego, Solicitações de TI,
  "Começar do zero"); cada formulário vira tarefas numa lista (tipo "Resposta do formulário"); coluna Localização e "Criado por". Formulários avançados = pago.
- **Clipes**: gravação de vídeo e voz, SyncUps (chamadas), AI Notetaker; galeria de cartões com miniatura.
- **Metas**: contêineres de alto nível divididos em objetivos (metas numéricas, verdadeiro/falso, monetárias, vinculadas a tarefas); assistente passo a
  passo: Nome, Proprietário(s), Quem tem acesso (workspace ou privado), cor, objetivos; progresso automático.
- **Planilhas de horas**: rastreamento de tempo por tarefa (Start na tarefa), planilhas semanais por pessoa, aprovação (avançado = pago).
- **Chat**: canais (de espaço/pasta/lista ou avulsos), mensagens diretas, Favoritos, busca, filtro; no canal: "Adicionar pessoas", "Importar do Slack",
  atalhos "Acompanhar tarefas / Adicionar documento / Iniciar SyncUp"; abas **Mensagem** e **Publicação**; barra lateral direita com seguidores, busca, respostas,
  fixados, tarefas, configurações do canal.
- **SyncUp**: chamada de voz/vídeo por lista/canal, pré-visualização (microfone/câmera/alto-falante), "Mostrar sempre a pré-visualização", notas com IA (pago ilimitado).
- **Bloco de notas** (⌘ N/P): notas pessoais rápidas, painel flutuante.

---------------------------------------------------------------------------------------------------------------------------

## 8. Comparação rápida com a nossa plataforma (a confirmar)
Já temos (ou parecido): listas/pastas/espaços, visualizações Lista e Kanban, agenda, chat, documentos, quadros, funis, formulários, tarefas com subtarefas,
campos personalizados, cronômetro, avisos, Painel de Gestão, Home, Biolytics, relatórios.
Ideias de maior valor para trazer: (A) Visão geral do espaço com cartões; Filtros salvos + "Modo eu"; Caixa de entrada com abas; Prioridades pessoais;
visualizações Tabela/Galeria/Linha do tempo/Carga de trabalho; tipos de tarefa; (B) automações simples (gatilho→ação) e templates de lista/tarefa;
Metas; Posts/anúncios internos; planilha de horas; (C) Gantt com dependências, mapa mental, whiteboard.

---------------------------------------------------------------------------------------------------------------------------

## 9. Automações — construtor "Quando [gatilho] → então [ação]" (visto por dentro)
Tela: nome da regra, "em <Espaço/Pasta/Lista>", duas colunas (**Acionar** → seta → **Ação**), botão "+" em cada coluna para empilhar mais passos,
frase de resumo ("When a task is created then change the status"), descrição, Cancelar/Criar. Escopo: Tarefas, Subtarefas ou Tarefas ou subtarefas.
Cada gatilho tem "Fonte(s)" (de quais listas/pastas). **Condições** (filtros extras em cima do gatilho: status, responsável, etiquetas, campos…) = plano Core.
Abas do gerenciador: Navegar (galeria de receitas), Gerenciar (minhas regras: filtros Ativas, Todos os tipos, Acionar, Condição, Ação, Atualizado por,
Classificar, Pesquisar), Utilização (cota mensal), Atividade (log de execuções), Webhooks, Recorrência.

**Gatilhos (por grupo):**
- Popular: A cada… (agendado), Campo personalizado alterado, Status alterado, Tarefa/subtarefa criada, Webhook recebido.
- Adicionar ou mover: tarefa existente adicionada aqui; tarefa existente movida para cá.
- Comunicação: Comentário adicionado; Webhook recebido.
- Criar e concluir: Tarefa criada; Todas as checklists resolvidas; Todas as subtarefas imediatas resolvidas.
- Datas e horário: A cada…; A data do campo personalizado chegar; A data é antes/depois de; Chegada da data de início; Chegada da data final;
  Data de início alterada; Data de vencimento alterada; Tempo rastreado.
- Gerenciamento de tarefas: Campo personalizado alterado; Etiqueta adicionada/removida; Nome alterado; Prioridade alterada; Responsável adicionado/removido;
  Status alterado; Tarefa desbloqueada; Tarefa vinculada; Tipo de tarefa alterado.
- Integrações (gatilho vem de fora): Gmail, Google Calendar, Google Drive, Slack, GitHub, HubSpot, Outlook, Bugsnag, Calendly e ~60 apps via **Webhook**
  (Stripe, Shopify, Typeform, Tally, Mailchimp, Notion, Zendesk, Zoom, Vercel…).

**Ações (por grupo):**
- Popular: Atualizar responsáveis, Atualizar status, Chamar webhook, Criar tarefa, Atualizar campo personalizado.
- Adicionar ou mover: Adicionar à lista, Adicionar ao sprint atual, Mover para lista, Remover da lista.
- Comunicação: Adicionar comentário, Atualizar seguidores, Compartilhar tarefa, **Enviar mensagem de canal**, **Enviar mensagem direta**, Chamar webhook.
- Criar e excluir: Aplicar modelo, Arquivar tarefa, Criar lista, Criar subtarefa, Criar tarefa, Duplicar, Excluir tarefa.
- Datas e horário: Atualizar data de início, Atualizar data de vencimento, Estimar tempo, Rastrear tempo.
- Gerenciamento de tarefas: Adicionar relacionamento, Atualizar campo personalizado, Atualizar etiquetas, Atualizar nome, Atualizar prioridade,
  Atualizar responsáveis, Atualizar status, Atualizar tipo de tarefa.
- Integrações (ação para fora): E-mail, Slack, Google Calendar, Google Drive, GitHub, HubSpot, Twilio (SMS/WhatsApp), Bugsnag.
→ Para nós: começar com um subconjunto (status alterado → comentar/atribuir/mover; data de vencimento chegou → avisar; tarefa criada → aplicar modelo/subtarefas;
  todas as subtarefas concluídas → concluir a mãe; "a cada semana" → criar tarefa recorrente). A parte "webhook" cobre WhatsApp/e-mail depois.

---------------------------------------------------------------------------------------------------------------------------

## 10. Complementos (2ª rodada)

### 10.1 Propriedades da própria LISTA (cabeçalho, acima das abas)
"Adicionar descrição" · "Adicionar responsável pela lista" · "Adicionar prioridade da lista" · "Adicionar datas da lista" (início/vencimento da lista inteira) ·
"Esta visualização é pública" (aviso quando a visualização está compartilhada por link) · botão "Automatizar" (atalho para as automações da lista) ·
"Compartilhar · N" (quantas pessoas têm acesso). Status da lista são **por lista** (ex.: A FAZER / EM PROGRESSO / FEITO / CONCLUÍDO, ou PENDENTE / AGUARDANDO
APROVAÇÃO / …), com "Novo status" e categorias (ativo, fechado). Cada grupo mostra contagem e "Calcular" (somas/médias por coluna).

### 10.2 Barra de ferramentas — filtros
Filtro → "Selecionar filtro": Status, Etiquetas, Data de vencimento, Prioridade, Responsável, Arquivado, Comentário atribuído, Criado por, Data de
encerramento, Data criada, … + campos personalizados; vários filtros com E/OU; **Filtros salvos** (menu no topo do painel); lixeira para limpar.
Painel de Responsáveis: busca por usuário ou equipe + chave "Comentários atribuídos".

### 10.3 Formulário (visualização) — plano gratuito = 1 uso
"Receba feedback, colete informações, faça pesquisas, aceite pedidos… com formulários personalizáveis com sua marca; transforme respostas em fluxos de trabalho
automatizados; compartilhe privado ou com qualquer pessoa por link". Cada resposta cria uma tarefa (tipo "Resposta do formulário") na lista. Modelos prontos:
Formulário de feedback, Recebimento do projeto, Formulário de pedido, Candidatura de emprego, Solicitações de TI, Começar do zero.
→ Já temos formulários públicos na plataforma; faltam modelos prontos, campos mapeados para campos da lista e "resposta vira tarefa com automação".

### 10.4 Documento (editor) — comando "/" (menu de blocos)
Sugestões: Conteúdo sincronizado (bloco que se atualiza em vários docs), Nova subpágina, Faixas (banner/callout colorido), Checklist, Colunas, Nova página, Modelo,
**Lista ClickUp (Tabela/Quadro/Lista)** (embute uma lista de tarefas viva no doc), Alternar lista (toggle), Botão, Criar Whiteboard, Novo slide.
Texto: Texto normal, Cabeçalho 1–4, Checklist, Marcadores, Numerada, Toggle, Faixas, Bloco de código, Citação em bloco, Citação direta.
Em linha: mencionar pessoa, tarefa, página, whiteboard. Incorporações: site, CloudApp, YouTube, Vimeo, Figma, Loom, Miro, GIPHY, Google Drive/Apresentações/Docs/Sheets,
Anexo. Formatação: limpar, negrito, itálico, riscado, código em linha, link. Avançados: Divisor, Tabela de conteúdos, Tabela, Markdown, Índice fixo.
Cores do texto (8), Destaques (realce em 8 cores) e Selos (badges coloridos, forte/suave).
Cabeçalho do doc: Favorito, Novo, Adicionar tags, Configurações, **Adicionar página** (subpáginas), **Marcar wiki** (pago: Wikis), Vincular tarefa ou documento,
Adicionar ícone, Adicionar capa; "Fabricio Saraiva • Atualizado por último hoje às 23:54"; título "Sem título".

### 10.5 Tarefa — detalhes que faltavam
- **Dependências/relacionamentos** ("Vincular itens"): "Vincular uma tarefa ou documento", "Esta tarefa bloqueia…", "Esta tarefa está bloqueada por…",
  "Novo relacionamento personalizado" (campo Relacionamento). Também seção "Itens relacionados — Adicionar links".
- **Rastrear tempo**: popover "Tempo nesta tarefa" (0h), usuário, data, intervalo, "Adicionar tags", Salvar (registro manual) + botão Start/Stop.
- **Estimativa de tempo**: "Tempo estimado — um dia equivale a 8 horas, ex.: 1d 4h"; por pessoa quando há vários responsáveis.
- **Comentário**: editor com "Adicionar um arquivo", "Mencionar tarefa", "Gravar Clipe de vídeo", "Nova tarefa", "Novo Whiteboard", "Enviar", **"Agendar para mais tarde"**,
  barra de formatação (lista, "Transformar em", cor, negrito, itálico, sublinhado, riscado, código, alinhamento, link). "Alterar observadores — N seguidor(es) será(ão) notificado(s)".
- Capa da tarefa ("Adicionar capa"), "Adicione em outra lista" (tarefa em várias listas), "Mover tarefa", "Alternar layout", "Abrir barra lateral da subtarefa",
  "Recolher/Expandir" por seção (Campos, Checklists, Atividade).
- **Prioridades pessoais** (cada usuário marca suas prioridades); atalhos ⌘1–⌘4 para prioridade da tarefa.

### 10.6 Planejador (calendário pessoal)
Colunas semanais (dom–sáb ou seg–dom), faixa "O dia todo", horas de 1h, fuso GMT-3, número da semana ("sem44"), botão "Semana/Dia/Mês", painel esquerdo
com "Prioridades", "Reunião com", "Atribuídas a mim", "Hoje e atrasadas", "Lista de pendências" (arrastar tarefas para o horário = bloqueia tempo),
sincroniza com Google Calendar; busca "eventos, colegas de equipe, comandos…". Mensagem de celebração "Parabéns!" quando zera pendências.

### 10.7 Planilhas de horas
Abas: Minha planilha de horas, Todas as planilhas de horas, Aprovações, Configurações. Semana (ex. "out 25 – out 31"); linhas "Todas as tarefas atribuídas",
"Tarefas da semana passada", "Tarefas individuais"; botão "Rastrear tempo"; "Adicionar registros à planilha de horas desta semana"; painel de **Aprovações**
(enviar a semana para aprovação; "Nenhuma aprovação ainda"). Configurações: **Horário de trabalho padrão** (seg–sex • 8h/dia • 40h/semana), "Expandir capacidade diária",
horas semanais, Redefinir, Salvar. → alimenta Carga de trabalho e relatórios de horas por cliente.

### 10.8 Equipes (módulo)
Páginas: Todas as equipes, **Todas as pessoas**, **Gráfico organizacional**, **Dados analíticos**, Minhas equipes. "Central de equipes": visão geral de atividades e
visualizações personalizáveis por equipe; gestão de membros e funis/funções; prioridades ("no que cada membro trabalha agora e o que vem na agenda");
capacidade (carga, cronogramas, progresso); **feed de atividades em tempo real** do espaço de trabalho. Criar equipe → agrupa usuários para atribuir tarefas e @mencionar.

### 10.9 Metas
"Transforme suas metas em realidade. Crie Metas, divida em Objetivos mensuráveis e acompanhe o progresso em tempo real." Assistente: Nome da meta, Proprietário(s)
(opcional), Quem tem acesso (workspace inteiro ou Privado). Objetivos: numérico, monetário, verdadeiro/falso, vinculado a tarefas/listas (progresso automático).
Pastas de metas e cores. Confete ao concluir.

### 10.10 Personalizar interface
- "Personalizar a barra lateral" (botão no rodapé do painel Início) → modal **Personalizar** com abas **Navegação** (escolher/ordenar o que aparece na faixa de ícones),
  **Seções** (Favoritos, Espaços, Canais, Mensagens diretas + "Criar seção" — seções próprias na barra) e **Temas**.
- Início "Mais": Aplicativos (Centro de aplicativos) e "Personalizar navegação".
- Painel Início tem "Filtrar sua barra lateral" (ícone de filtro) para esconder tipos de item.

---------------------------------------------------------------------------------------------------------------------------

## 11. Ordem sugerida para implementarmos (a decidir com o Fabricio)
1. **Visão geral do Espaço** (cartões: Recentes, Documentos, Favoritos, Pastas, Listas) — barato e visual.
2. **Filtros salvos + "Modo eu"** e o painel de filtros por campo; "Salvar visualização" por lista.
3. **Caixa de entrada** (abas Todos/Principal/Outro/Mais tarde/Removidas) ligada aos avisos que já existem.
4. **Prioridades pessoais** e cartões de "Meu trabalho" (Hoje, Em atraso, Próximo, Não programado, Feito, Delegado) — encaixa na nossa Home.
5. **Visualizações novas**: Tabela, Galeria, Linha do tempo, Carga de trabalho (precisa de estimativa de tempo e horário de trabalho).
6. **Tipos de tarefa** (Conteúdo, Postagem, Marco…) e **campos por tipo**.
7. **Automações** (subconjunto da seção 9) + **modelos** (lista/tarefa) + "resposta de formulário → tarefa".
8. **Planilhas de horas** com aprovação; **Metas**; **Equipes** (gráfico organizacional, capacidade).
9. Depois: Gantt com dependências, mapa mental, whiteboard, Posts (mural), Chat com threads/fixados, SyncUp, notificações por canal, marca personalizada por cliente
   (portal do cliente), registros de auditoria, retenção de dados.

---------------------------------------------------------------------------------------------------------------------------

## 12. Atalhos de teclado — lista completa (Mac; no Windows ⌘ = Ctrl, ⌥ = Alt)
**Global**: T criar tarefa · R criar lembrete · ⌘K centro de comando/pesquisa · ⌘O abre a IA · ⌥V fala para texto (segurar) · N ou P bloco de notas · ⌘\ abrir/fechar barra lateral.
**Navegação**: H ir para o Início · I caixa de entrada · D Painéis · Esc fechar tarefa/janela.
**Editor de texto**: / comandos de barra · @ mencionar usuário · @@ mencionar tarefa · @@@ mencionar documento · ↑ editar o último comentário · : emoji · ⌘V colar texto/imagem ·
⌘K hyperlink do texto selecionado · ⌘⇧H reaplica o último destaque · ⌘D duplica o texto selecionado · ⌘⇧L/R/E alinha esquerda/direita/centro · ⌘⇧C código em linha ·
⌘⇧9 lista com marcadores · ⌘⇧8 checklist · ⌘⇧7 lista numerada · ⌥⌘1 a 4 títulos · ⌘⇧6 marcar/desmarcar item · ⌥⌘6 marcar/desmarcar todos os itens.
**Visualização de tarefa** (com a tarefa aberta ou selecionada): ⇧S status · ⇧M comentário · ⇧D data · ⇧A responsável · M atribuir a mim · ⌥A adicionar às prioridades (LineUp) ·
⇧. temporizador · ⇧L etiqueta · ⇧T subtarefa · ⇧P prioridade · ⌃⇧↑/↓ navegar entre as tarefas da lista.
**Visualizações**: M atribuir a mim · A adicionar às prioridades · "-" limpar filtros · L visão Lista · B Quadro · C Calendário · X Equipe.
**Chat**: ⌘G escrever mensagem · E editar · U marcar lida/não lida · C copiar link da mensagem · Delete excluir · (canais) U lida/não lida · C copiar link do canal ·
⌘F buscar no canal · ⌘⇧J pular para a primeira não lida.
**Caixa de entrada**: ⇧A aba Tudo · ⇧P Principal · ⇧O Outras · ⇧Z Adiadas · ⇧C Removidas · ⇧1 filtro @Menções · ⇧2 Atribuídas · ⇧3 Não lidas · Enter/O abrir · Esc limpar ·
J/K (ou setas) próxima/anterior · ] barra de detalhes · ⇧↑/⇧↓ topo/fim · Espaço atualizar · E remover/cancelar remoção · ⇧E apagar tudo · Z adiar · ⌘Z desfazer ·
U lida/não lida · W seguir/deixar de seguir · ⌃⌘T bandeja.
**Documentos**: ⌘⇧M comentário a partir do texto selecionado · ⌥⌘T cria tarefa a partir do texto selecionado · ⌥↑/⌥↓ move o bloco de texto.
**Quadros brancos**: V selecionar · H mão · ⇧T cartões de tarefa · D desenhar · ⇧D marca-texto · E borracha · K laser · R retângulo · O elipse · A seta · N nota · T texto · F moldura ·
⌘U enviar mídia · / chat do cursor · ⌘Z/⌘⇧Z desfazer/refazer · ⌘X/C/V · ⌘A tudo · Backspace apagar · ⌘D duplicar · ⌘' alternar grade · =/- zoom · ⇧0 zoom 100% · ⇧1 ajustar ·
⇧2 zoom na seleção · ] / ⌥] / ⌥[ / [ trazer à frente/avançar/recuar/enviar ao fundo · ⌘G/⌘⇧G agrupar/desagrupar · ⇧H/⇧V espelhar.
**SyncUps**: ⌥⌘H chamada · ⌥⌘⇧M microfone · ⌥⌘O câmera · ⌥⌘⇧S compartilhar tela · ⌥⌘⇧C barra da conversa · ⌥⌘⇧P participantes · ⌥⌘⇧N tela cheia · ⌥⌘⇧E convidar · ⌥⌘. gravar.
→ Para nós: implementar uma camada de atalhos (T, ⌘K já existe?, H/I/D de navegação, ⇧S/⇧A/⇧D/⇧P na tarefa, L/B/C trocando visão) com tela "Atalhos" no perfil.

---------------------------------------------------------------------------------------------------------------------------

## 13. CAMPOS PERSONALIZADOS (gerenciador e criação) — detalhado

### 13.1 Onde se gerencia
- **Gerenciador de campos personalizados** (Configurações → Recursos, ou menu do espaço/lista "Campos personalizados"): modal com menu esquerdo
  "Todos os campos personalizados", "Campos do Espaço de trabalho", "Campos de tipo de tarefa" (novo), "Lista pessoal"; abaixo "Por localização" (um item por espaço, com busca)
  e "Por tipo de tarefa" (Tarefa, Marco, Anotação da reunião, Conteúdo, Postagem, Resposta do formulário, com contador de campos).
- Corpo: busca, filtro "Tipo de campo ▾", "Filtro ▾", botão **Criar novo**. Tabela agrupada por tipo (Dinheiro, Fórmula, Lista suspensa, Site…) com contador e atalho
  "+ Criar campo do tipo X"; colunas **Nome, Tipo, Criado por, Data de criação, Localizações** (onde está em uso; "+2" quando há mais), e "…" por linha.
- **Menu "…" do campo**: Editar, Renomear, Duplicar, **Converter** (muda o tipo mantendo dados quando possível), Copiar ID do campo, Excluir.
- Na lista: ícone "+" no cabeçalho das colunas ("Explorar campos e colunas") abre o painel **Campos** com abas **Criar novo** e **Adicionar um existente**
  (reaproveitar campo de outra lista), busca, seção "Popular" e "Todos"; o engrenagem do painel leva ao gerenciador.
- Campo criado numa lista fica visível nessa lista; "Permissions and settings" decide o alcance. Campos podem ser fixados nas colunas e arrastados para ordenar.

### 13.2 Tipos de campo (26) e para que servem (texto do próprio ClickUp)
Popular: **Lista suspensa** (seleção única: categorização, departamento) · **Texto** (uma linha) · **Data** (data que NÃO é a de vencimento; aparece no Calendário) ·
**Área de texto** (texto longo com formatação) · **Número** · **Rótulos** (seleção múltipla com cores).
Todos: **Agregar** (resume/pesquisa campos de outras tarefas ligadas por relação) · **Arquivos** (anexos; pode acionar automações) · **Assinatura** (aprovar/confirmar
recebimento coletando assinatura, inclusive em formulários) · **Avaliação** (emojis 1–5) · **Botão** (dispara automação manualmente na tarefa) · **Caixa de seleção**
(sim/não; aciona automação) · **Dinheiro** (orçamento, custos, preços) · **E-mail** (envia e-mail direto da tarefa) · **Fórmula** (cálculo simples ou avançado) ·
**Localização** (endereço; alimenta a visualização Mapa) · **Pessoas** (quem não é responsável: RACI, solicitantes, partes interessadas) · **Progresso (automático)**
(pela conclusão de subtarefas/checklists/comentários atribuídos) · **Progresso (manual)** (barra em escala própria) · **Relacionamento** (referência bidirecional entre
tarefas/listas/workspace) · **Site** (link) · **Tarefas** (conexão simples entre tarefas) · **Telefone** (CRM/contatos) · **Votação** (analisar sentimentos, priorizar, retrospectiva).

### 13.3 Formulário de criação por tipo (painel lateral "Nome do campo*" + …)
- **Lista suspensa**: opções (Manual ou alimentadas por regra), cada opção com cor + "Adicionar opção" (padrão "Option 1/Option 2"). **Rótulos**: igual, múltipla escolha.
- **Número**: Formato numérico (EUA 1,234.56 / BR 1.234,56…), Casas decimais (Padrão/0–n). **Dinheiro**: Moeda (USD, BRL…), Formato numérico.
- **Fórmula**: só o nome; ao criar, a célula abre o **construtor**: [Selecione o campo] [operador + − × ÷] [Selecione o campo], botão Calcular, e o interruptor
  **"Editor avançado"** (digitar expressão com funções).
- **Progresso (manual)**: Valor inicial, Valor final. **Progresso (automático)**: "Rastrear a conclusão de" (Subtarefas, Checklists, Comentários atribuídos),
  "Tarefas sem itens de ação" e "Exibir 100% quando a tarefa estiver no status feito".
- **Avaliação**: Tipo de emoji (⭐, ❤️…) e Escala (1–3 até 1–10). **Botão**: Detalhes (texto, ícone), Cor, **Ação*** (Adicionar automação — o botão executa uma automação).
- **Agregar**: Relacionado a (escolher o campo Relacionamento), Campo agregado (ex.: Data criada), Tipo de agregação (Agregar: soma, média, contagem…).
- **Permissions and settings** (todo tipo): Descrição ("explique aos outros como usar o campo"), **Permissões** (Padrão do Espaço de trabalho / quem pode ver/editar),
  **Exceções** (por pessoa: Permitido editar / somente ver; o criador entra automaticamente) + "Adicionar exceção", Configurações de exibição: **Fixado**,
  **Visíveis para Convidados e Membros limitados**, e "Pertence a" (o campo existirá em todas as tarefas das listas listadas).
- Plano gratuito limita a quantidade (Core = ilimitados; "Gerenciador avançado de campos" = Business Plus).

### 13.4 Campos por tipo de tarefa (novo)
Cada tipo (Conteúdo, Postagem…) pode ter seus próprios campos; o contador ao lado do nome mostra quantos. A tarefa mostra só os campos do seu tipo + os da lista.

---------------------------------------------------------------------------------------------------------------------------

## 14. VISUALIZAÇÕES — painel "Personalizar visualização" de cada tipo (opções reais)

Comum a todas (rodapé do painel): nome da visualização (editável), **Campos** (N exibidos), **Filtro**, **Grupo**, **Classificar** (quando existe), **Subtarefas**
(Recolhidas / Expandidas / Separadas), **Modelos**, "Visualizar configurações de acesso": **Salvar automaticamente para mim**, **Fixar visualização**,
**Visualização privada**, **Proteger visualização** (impede mover/redimensionar ao clicar), **Definir como visualização padrão** ("Ações da visualização padrão"),
**Copiar link da visualização**, **Favorito**, **Exportar visualização** (CSV/Excel/PDF/imagem), **Compartilhamento e permissões** (link público), **Excluir visualização**.

- **Lista**: Mostrar status vazios · Quebrar texto · Mostrar localizações da tarefa · Mostrar nomes de subtarefas pais · Mostrar tarefas fechadas · Mais opções.
  **Agrupar por** (menu): Status, Responsável, Prioridade, Etiquetas, Data de vencimento, Tipo de tarefa e **qualquer campo personalizado** (Cliente, Engenharia…), com
  ordem Crescente/Decrescente e lixeira para remover; **Classificar**; "Calcular" (soma/média/contagem no rodapé de cada coluna).
- **Filtro** — campos disponíveis: Status, Etiquetas, Data de vencimento, Prioridade, Responsável, Arquivado, Comentário atribuído, Criado por, Data de encerramento,
  Data criada, Data de atualização, Data de conclusão, Dependência, Duração, Localização/Lista, Recorrência, Data inicial, "O status está fechado" + campos personalizados.
  Painel "Filtros": **Filtros salvos**, Selecionar filtro, Limpar filtro, **Adicionar filtro agrupado** (grupo E/OU), Adicionar filtro.
- **Quadro**: mesmas opções + colunas por status (ou por qualquer campo), "Adicionar grupo", recolher colunas, contagem, cartão com data/prioridade/etiquetas/subtarefas.
- **Calendário**: Mês/Semana/4 dias/Dia, setas, "Hoje", painel "Não agendado" e "Em atraso" (arrastar para agendar), mostrar fins de semana, cor por status/prioridade.
- **Gantt**: barra "Hoje | Semana ▾ (Dia/Semana/Mês/Trimestre) | Ajuste automático | Exportar". Painel: Layout da página e do cartão · **Mostrar fins de semana** ·
  **Mostrar caminho crítico** · **Mostrar tempo ocioso** (folga) · **Modo tela cheia** · **Reagendar dependências** ("mova tarefas dependentes junto com a arrastada") ·
  **Linhas de base** (Novo — salva o planejamento original para comparar) · colunas à esquerda "Nome | Data final | Adicionar uma coluna" · hierarquia
  (Recolher tudo, Criar tarefa/subtarefa, Renomear) · barras por tarefa; tarefa sem data mostra "Não há datas definidas para esta tarefa" (arrastar no tempo cria as datas).
  **Proteger visualização** impede arrastar/redimensionar sem querer.
- **Tabela**: Altura da linha (Pequeno/Médio/Alto) · Mostrar tarefas fechadas · colunas (Campos) · Filtro · Grupo · Subtarefas · edição de célula direto, coluna Nome fixa
  (alfinete), checkbox de seleção em massa, linhas numeradas, "+" para nova coluna e para nova linha.
- **Linha do tempo**: Colorir tarefas por (Status da tarefa, Prioridade, Responsável…) · Mostrar fins de semana · Mostrar número das semanas · Mostrar localizações ·
  Mostrar nomes de subtarefas pais · Expandir nomes das tarefas · escala Dias/Semanas/Meses · "Hoje".
- **Carga de trabalho**: métrica (**Estimativas de tempo** / Contagem de tarefas / Pontos de sprint / campo numérico) · período (14 dias…) · **Programado diariamente** ·
  Colorir tarefas por · Mostrar localizações · Mostrar nomes de subtarefas pais · Expandir nomes · Mostrar tarefas fechadas · Grupo (Responsável) ·
  "Modificar o trabalho por dia" · linha "Não atribuído"/"Adicionar pessoa"; células "0h" por dia com cor de sobrecarga; painel direito "Tarefas: Não programado /
  Nenhuma estimativa / Em atraso / Não atribuído" para arrastar para a pessoa/dia.
- **Galeria**: Tamanho do cartão (Pequeno/Médio/Grande) · **Capa do cartão** (Automático/Imagem da tarefa/Campo de arquivo) · Agrupar campos · Mostrar campos vazios ·
  Recolher grupos vazios · Grupo por Status · Classificar.
- **Atividade**: feed por tarefa/dia; "Atividades" (quais tipos de evento mostrar), Filtro, Subtarefas.
- **Mapa**: **Campo de localização** (qual campo do tipo Localização), Colorir tarefas por, Intervalo do Zoom, Mostrar tarefas fechadas, Filtro, Subtarefas (Separar).
- **Documento** (visualização dentro da lista): um documento da lista com as mesmas ferramentas do editor (seção 10.4).
- **Formulário** (1 uso no plano grátis), **Painéis**, **Mapa mental**, **Equipe** (pagos, ver seção 4), **Whiteboard**, **Qualquer site**, **Google Sheets** (embed).
- **Salvar visualização** (botão laranja): aparece quando se muda filtro/grupo/colunas sem "Salvar automaticamente"; menu: Salvar, Salvar como nova, Descartar alterações.

---------------------------------------------------------------------------------------------------------------------------

## 15. CONFIGURAÇÕES — o que foi extraído página a página (complemento da seção 5)

### 15.1 Espaços (Configurações → Espaços)
Abas Ativos(7) / Arquivado(1) / Inacessível; botão "Novo Espaço". Tabela: Nome (ícone colorido), **Proprietário**, **Compartilhado com** (Todos / pessoas), **Configurações**
(três contadores: nº de status personalizados, de visualizações padrão, de ClickApps ativos — ex. 2·3·11), **Substituições de status** ("Tudo é herdado" ou "1 Lista" quando alguma
lista tem status próprio), **Ações** ("Mais ações": Arquivar, Excluir).
**Modal "Edite as configurações do espaço"**: Ícone e nome · Proprietário · Descrição (opcional) · **Permissão padrão** (Edição total / Comentar / Somente ver) ·
**Tornar privado** · **Visualizações padrão** (quais abas toda lista nova recebe: Lista, Quadro, Calendário…) · **Status de tarefas** (cadeia ✴️ A FAZER → 🔵 EM PROGRESSO → ✅ FEITO → COMPLETE) ·
**ClickApps** do espaço · "Salvar as alterações".
**ClickApps por espaço** (liga/desliga recursos): Prioridade, Sprints, E-mail, Etiquetas, Campos personalizados, Múltiplos responsáveis, Rastreamento de tempo,
Estimativas de tempo, Remapear datas finais da subtarefa, Limites do trabalho em progresso (WIP), Pontos da sprint, Aviso incompleto (avisa ao fechar tarefa com subtarefas abertas),
Aviso de dependência, Reagendar dependências, Mostrar progresso do status, Marcos. Botões "Habilitar ClickApps" e "Desativar todos".
**Editar status** (por espaço/pasta/lista): Modelo de status ("Custom" ou modelo salvo), Status ClickApps (Habilitado), **Ícones de progresso** ("fluxos lineares"), três colunas
**Active / Done / Closed**; cada status tem nome, cor e emoji; "Salvar como modelo", "Aplicar alterações". Status "Closed" encerra a tarefa; "Done" conta como feito mas aberto.

### 15.2 Tipos de tarefa
Cabeçalho "Você pode usar tarefas para qualquer coisa… épicos, clientes, pessoas, faturas, reuniões individuais"; "Criar um tipo de tarefa"; **Uso** (barra "Tipos usados: X de 20");
"Seus tipos": Tarefa (padrão), Marco, Anotação da reunião, Conteúdo ("Manage creation and publication of content pieces"), Postagem, Resposta do formulário, cada um com origem
(ClickUp ou pessoa) e "Mais ações". **Recomendados** (botão Adicionar) com descrição e casos de uso: Ativo, Campanha, Caso do usuário, Conta (cliente), Erro (bug), Iniciativa,
Lead, Meta, Objetivo, Pessoa, Projeto, Promoção (negócio), Recurso. Cada tipo: nome, ícone, descrição, campos próprios (13.4).
→ Para a agência: tipos "Cliente", "Conteúdo", "Postagem", "Campanha", "Lead", "Reunião".

### 15.3 Cronograma de trabalho
"Adapte o cronograma de trabalho… para antecipar o impacto dos dias de folga no planejamento". **Dias úteis** (D S T Q Q S S ligáveis) · **Horário de trabalho**
(mesmo horário todos os dias / personalizado por dia; hora inicial–final; "Capacidade diária 8h • semanal 40h") · **Dias não úteis** ("Selecionar feriados públicos" por país,
"Adicionar dias de folga"). Alimenta Gantt (pula dias não úteis), Carga de trabalho e Planilhas de horas.

### 15.4 Emojis / AI Notetaker / Integrações
- **Emojis**: "Seu Espaço de trabalho tem N emojis personalizados", Adicionar emoji, busca, Criador (usados em status, comentários, reações).
- **AI Notetaker**: abas Minhas configurações / Configurações de administrador; **Geral → Entrada automática** (entra sozinho em reuniões de calendários escolhidos), Personalização
  (nome de exibição, mensagem de entrada no chat da reunião), Preferências de notas (4 tipos incluídos: resumo, tópicos, itens de ação, transcrição), Integrações (Zoom, Meet, Teams).
- **Centro de aplicativos**: abas Todos / Desconectado / Conectado (2), filtros "Funciona com" Brain (53) · Superagentes (53) · Automações (6) · Pesquisar (14) · Comandos (21);
  seções Destaques, Análises (Amplitude, ClickHouse, Grafana, Hex, Mixpanel, PostHog, Tableau — todos "MCP"), Armazenamento em nuvem, Base de conhecimento, Calendários,
  Comunicação, Contabilidade e Finanças, CRM e suporte, Desenvolvimento, Design e vídeo, E-mail, Notetakers, Rastreamento de tempo, **MCP personalizado**; "ClickApps"
  (Todos, IA e pesquisa, Colaboração, Agendamento e datas, Sprints, Tarefas, Tempo e capacidade); "Crie com a gente": MCP e Documentação da API.
- **Importações/exportações**: histórico (tipo Planilha, quem, data, "Importados 205 de 210 itens", "Ignorados: 5", "1 com falha", Excluir), "Importar itens" (CSV/Excel/Jira/Asana/Trello/
  Monday/Notion/…) e "Exportar itens" (backup off-line do workspace).
- **API da ClickUp**: token pessoal (pk_…), apps OAuth. **Integração de e-mail**: endereço por lista/tarefa que vira tarefa/comentário.

### 15.5 Minhas configurações — itens extras que tinham escapado
Perfil (avatar, nome, e-mail, senha), 2FA (SMS = Business; TOTP grátis), **Cor do tema** (10 cores), **Aparência** (Claro/Escuro/Auto), Contraste alto, **Idioma e região**
(idioma, fuso, notificar mudança de fuso, início da semana, formato de hora 12/24, formato de data), e Preferências: mensagem de aviso (toast), Cmd+Return para enviar,
atalhos, Markdown, citações, comemorações, selo verificado, modo de desempenho, detectar app desktop, "selecionar todos os blocos", limite de abas, perguntar sobre prioridades
ao atribuir, ID no @, cursor mão, **links e menções** (cartão de pré-visualização de links externos; mostrar status/responsável/ID personalizado na menção), permissão de login
ao suporte (3 níveis), **ClickUp Labs**. **Notificações**: por canal (Caixa de entrada, E-mail com teste, Navegador, Celular com "notificações inteligentes"), Slack,
"Seguir automaticamente as tarefas das quais participo" (criar, editar, comentar, ser atribuído).

---------------------------------------------------------------------------------------------------------------------------

## 16. Mapa para implementação (resumo objetivo)
| Bloco do ClickUp | Equivale hoje na nossa plataforma | O que construir |
|---|---|---|
| Hierarquia Workspace → Espaço → Pasta → Lista → Tarefa → Subtarefa | Espaços, pastas, listas, tarefas (já existe) | Visão geral do Espaço, ocultar/duplicar/arquivar, status por nível, visualizações padrão |
| Campos personalizados (26 tipos) | Campos de lista (alguns tipos) | Gerenciador central, "adicionar existente", tipos que faltam (fórmula, progresso, avaliação, relacionamento, agregar, botão, assinatura, votação…), permissões do campo |
| Visualizações (Lista, Quadro, Calendário, Tabela, Gantt, Linha do tempo, Carga, Galeria, Atividade, Mapa, Documento) | Lista, Kanban, Calendário | Tabela, Galeria, Linha do tempo, Carga de trabalho, Gantt (+dependências), Atividade; salvar/fixar/privada |
| Filtros/Agrupar/Classificar/Modo eu | Filtros básicos | Painel de filtros E/OU, filtros salvos, agrupar por qualquer campo, classificar, calcular |
| Tarefa (propriedades, subtarefas, checklists, dependências, tempo, comentários, atividade) | Tarefa com subtarefas, comentários, cronômetro | Dependências, estimativa, checklists, prioridades pessoais, tipos, histórico completo, comentário agendado |
| Automações (gatilho→ação) | Recorrências | Construtor visual (seção 9) |
| Caixa de entrada/Respostas/Meu trabalho/Planejador | Avisos, Minhas tarefas, Agenda, Home | Caixa de entrada com abas, adiar, Prioridades, Planejador |
| Metas, Planilhas de horas, Equipes | — | Metas, planilhas semanais com aprovação, hub de equipes/carga |
| Documentos/Quadros/Formulários/Clipes | Documentos, Quadros, Formulários | Docs com "/" e subpáginas, "Lista embutida", resposta de formulário → tarefa |
| Atalhos de teclado | ⌘K? | Camada de atalhos (seção 12) |

---------------------------------------------------------------------------------------------------------------------------

## 17. Nota de confiança — o que foi VISTO e o que foi DEDUZIDO
Visto na tela (texto/captura do ClickUp): as listas de menus, campos, gatilhos/ações, tipos de campo e descrições, painéis "Personalizar visualização" de cada tipo, atalhos,
configurações (Geral, Pessoas, Equipes, Segurança, Espaços, Tipos de tarefa, Cronograma de trabalho, Emojis, AI Notetaker, Centro de aplicativos, Importações, Preferências, Notificações).
**Deduzido/complementado do conhecimento geral do ClickUp (confirmar antes de copiar):** opções exatas de "Exportar visualização" (formatos), valores de "Altura da linha" além de
"Pequeno", escalas do Gantt (Dia/Semana/Mês/Trimestre), tipos de agregação do campo Agregar (soma/média/contagem…), integrações do AI Notetaker (Meet/Teams), conteúdo dos 4 tipos
de nota, regras de "Permissão padrão" (Edição total/Comentar/Somente ver), opções "Expandidas/Separadas" de Subtarefas, métricas alternativas da Carga de trabalho (contagem/pontos),
"Salvar como nova" no menu de Salvar visualização.
**Ainda não visto por dentro:** Painéis (pago), Mapa mental (pago), visualização de Equipe (pago), construtor de formulário, Gantt/Linha do tempo com datas e dependências reais,
Calendário/Quadro configurações completas, menu de pasta, Chat com threads/fixados, Whiteboard em uso, Metas com objetivos, Planilhas com registros, app móvel.
