# Plano de ação — levar para a nossa plataforma o que foi extraído do ClickUp

Base: `docs/clickup-levantamento.md` (funções e menus), `docs/clickup-design-tokens.md` (tokens e medidas) e `docs/clickup-estrutura/` (estrutura de 25 telas e 15 estados + rotas de dados).
Regra de ouro: **reconstruímos com código e ícones nossos** a partir dessas especificações; não copiamos código-fonte, ícones nem textos do ClickUp.

## 0. Ponto de partida (o que já temos)
- Visualizações: lista, Kanban, calendário, painel, documentos (`VISOES` em `src/dominio/filtros.ts`). Faltam: tabela, galeria, linha do tempo, carga de trabalho, Gantt, atividade, mapa.
- Campos personalizados com 8+ tipos (dropdown, text, date, long_text, number, labels, files, signature…). Faltam: fórmula, progresso (manual/automático), avaliação, botão, relacionamento, agregar, pessoas, votação, telefone, e-mail, site, localização, dinheiro.
- Filtros, visão salva, status por lista, subtarefas, comentários, cronômetro, avisos, Home, Biolytics, Performance, MCP.
- Navegação: barra única (Home/Tarefas/Chat/Agenda, grupos recolhidos, espaços, rodapé com perfil) — **ainda sem commit/deploy**.
- Tema: tokens em `globals.css` (hoje ElevenLabs claro) com tema salvo por admin.

## 1. Decisões que travam o resto (responder antes da Fase 1)
1. **Duas barras (faixa de ícones 64px + painel 256px) ou barra única?** Recomendo as duas, como no ClickUp, com a faixa atual de ícones já existente no histórico do projeto.
2. **Cor de destaque**: teal `#12A594`, roxo `#6049E7` ou vermelho/preto da marca SRV. Recomendo manter a marca SRV como destaque e usar a paleta ClickUp só para neutros e estados.
3. **Tema claro apenas** agora, escuro pronto pelos mesmos tokens depois.
4. **Escopo**: a plataforma é uma agência (clientes, conteúdo, tráfego), não um gerenciador genérico. Sugestão: implementar o "núcleo de trabalho" (Fases 1–5) e deixar Gantt, mapa mental, metas e automações avançadas para depois (Fase 6).

## 2. Fases (cada uma termina com testes, commit e deploy; cada uma é independente)

### Fase 1 — Fundação visual (tokens, tipografia, componentes base) · ~1 semana
- Criar a camada `--cu-*` (paleta 50–1100 das 12 cores, neutros, alphaGrey, tamanhos 4px, raios, elevações 1–5) em `globals.css` e mapear os tokens atuais para ela.
- Tipografia: pilha de sistema + escala 10/11/12/13/14/16/18/20/24/28/32, pesos 400/500/600/700.
- Componentes base em `src/componentes/ui/`: botão (24/28/32px, raio 6), botão dividido "+ Tarefa ▾", chip de status (20px), interruptor 24×14, **linha de campo** (`field-switch`/`field-button` do painel direito), menu suspenso (anel + elevação), modal (raio 16), tooltip escuro, avatar quadrado de espaço.
- Ícones: mapa lucide da seção 6 do documento de tokens (versão cheia para estado ativo).
- Teste: página interna `/config/design` (só admin) mostrando todos os componentes; testes de unidade dos utilitários.
- **Entregável**: a plataforma muda de cara sem mudar funcionalidade.

### Fase 2 — Esqueleto e navegação · ~1 semana
- Barra superior de 40px (workspace/seletor de empresa, busca central ⌘K, ações fixadas 24×24, avatar com presença).
- Faixa de ícones 64px + painel 256px (se aprovado), cabeçalho de página com trilha Espaço/Pasta/Lista + favorito + compartilhar, abas de visualização de 24px, barra de ferramentas.
- Seletor de **vários espaços de trabalho** (duas empresas na mesma conta) — exige modelo de dados `workspaces` (migration) e troca de contexto. Pode ficar para a Fase 6 se complicar.
- Atalhos globais (T criar tarefa, ⌘K, H início, I caixa de entrada, ⌘\ barra lateral) e tela "Atalhos" no perfil.

### Fase 3 — Lista, tarefa e visualizações · ~2 semanas
- Painel direito **Personalizar visualização** (layout, campos, filtro, grupo, subtarefas, modelos, salvar/fixar/privada/proteger/padrão/copiar link/exportar/compartilhar). Migration para persistir visualizações por lista (`views`: tipo, nome, config jsonb, privada, fixa, padrão, dono).
- Barra de ferramentas: Agrupar por (qualquer campo, crescente/decrescente), Subtarefas (recolhidas/expandidas/separadas), Colunas, Filtro com **grupo E/OU e filtros salvos**, Mostrar fechadas, Responsáveis, **Modo eu**, Pesquisar; botão "Salvar visualização".
- Novas visualizações, em ordem de valor: **Tabela**, **Galeria**, **Linha do tempo**, **Carga de trabalho**, **Atividade**; Calendário/Quadro ganham "Não agendado/Em atraso" e agrupar por campo.
- **Tarefa aberta**: grade de propriedades (status, responsáveis, datas início→vencimento, prioridade com atalhos, estimativa, rastrear tempo, etiquetas), recolher campos vazios, subtarefas em tabela, checklists, **dependências** (bloqueia/bloqueada por), painel "Atividade" com histórico e comentário/e-mail, menu "…" (mover, adicionar a outras listas, mesclar, duplicar, converter tipo, arquivar), navegação ⌃⇧↑/↓ entre tarefas, **atalhos da tarefa** (⇧S/⇧A/⇧D/⇧P/⇧T).
- **Tipos de tarefa** (Cliente, Conteúdo, Postagem, Campanha, Lead, Reunião): migration + ícone + campos por tipo.

### Fase 4 — Campos personalizados completos · ~1,5 semana
- Gerenciador central (tabela por tipo, localização, criado por; menu Editar/Renomear/Duplicar/Converter/Copiar ID/Excluir; "adicionar existente"; campos por tipo de tarefa).
- Tipos que faltam (seção 13 do levantamento): fórmula (construtor simples + editor avançado), progresso manual/automático, avaliação, botão (dispara automação), relacionamento, agregar, pessoas, votação, telefone, e-mail, site, localização, dinheiro, caixa de seleção, tarefas.
- Permissões do campo (descrição, exceções por pessoa, fixado, visível a convidados, "pertence a").
- Migration de tipos + testes PGlite; manter MCP em dia (`definir_valor_campo`, `criar_campo`).

### Fase 5 — Início, caixa de entrada, planejador e perfil · ~1,5 semana
- **Caixa de entrada** (Todos/Principal/Outro/Mais tarde/Removidas, filtros @menções/atribuídas/não lidas, adiar, remover, atalhos), Respostas, Comentários atribuídos.
- **Minhas tarefas** com cartões configuráveis (Prioridades, Meu trabalho: hoje/atrasado/próximo/sem data/feito/delegado, Lista pessoal), prioridades pessoais (LineUp).
- **Planejador** (calendário semanal + prioridades + pendências para arrastar).
- **Visão geral do espaço** (cartões: recentes, documentos, favoritos, pastas, listas) e Favoritos na barra lateral, ocultar espaço.
- Preferências do usuário (tema, idioma/região, início da semana, formato de hora/data, notificações por canal, seguir automaticamente).

### Fase 6 — Funções maiores (decidir caso a caso) · conforme prioridade
- **Automações** (gatilho → ação): começar com ~8 receitas (status alterado → comentar/atribuir/mover; vencimento chegou → avisar; todas as subtarefas concluídas → concluir a mãe; "a cada semana" → criar tarefa; webhook de entrada).
- **Gantt** com dependências/linhas de base, **Mapa mental**, **Equipe** (visão de carga), **Painéis** montáveis, **Metas**, **Planilhas de horas** com aprovação, **Chat** com threads/fixados, quadro branco, formulários avançados, modelos de lista/tarefa, importar/exportar.
- Segurança: 2FA obrigatório, sessão, retenção de chat, registro de auditoria (útil para a agência com clientes).

## 3. Regras de execução (valem em toda fase)
- **Uma fase por vez, com checkpoint**: você aprova o visual/escopo → eu implemento → testes (`vitest --maxWorkers=2`) → você diz "suba" → commit + push + deploy.
- **Migrations**: eu escrevo o SQL e você roda no Supabase de produção antes do deploy (como combinado).
- **Não quebrar o que existe**: nada de remover funcionalidade; telas novas entram atrás de rotas/abas novas e substituem as antigas só depois de validadas.
- **MCP** sempre em dia (`src/mcp/ferramentas.ts`): cada função nova que a IA deva usar vira ferramenta (sem exclusão definitiva).
- **Medidas e comportamento vêm dos documentos**; cores/ícones/textos são nossos.
- Referência de aceitação por tela: comparar com o arquivo correspondente em `docs/clickup-estrutura/` (medidas de cada caixa) e com os atalhos da seção 12 do levantamento.

## 4. Riscos e pontos de atenção
- **Tamanho**: reproduzir a interface inteira é meses de trabalho; por isso o corte entre núcleo (Fases 1–5) e funções maiores (Fase 6).
- **Dois modelos de navegação** (barra única × duas barras) afetam todas as telas: decidir primeiro.
- **Multi-workspace e permissões por campo/lista** mexem em RLS do Supabase: exigem migrations cuidadosas e testes de RLS.
- **Desempenho**: tabela/linha do tempo/Gantt com muitas tarefas pedem virtualização (já usamos listas longas; avaliar `@tanstack/react-virtual`).
- **Direitos autorais**: manter a regra de não copiar código/ícones/textos; o visual final deve ser nosso, inspirado na organização e nas medidas.
- Pendências antes de começar: commit/deploy da barra lateral unificada (ou descartar se voltarmos às duas barras); apagar a lista de teste e o canal criados na conta do ClickUp.

## 5. Estimativa e ordem sugerida
Fase 1 → 2 → 3 → 4 → 5 (≈ 7 semanas de trabalho contínuo) e Fase 6 por demanda. Se quiser resultado visível rápido: **Fase 1 + Fase 2** (cara nova e navegação) já mudam a plataforma inteira.
