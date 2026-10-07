# ClickUp: estudo de funcionalidades e roadmap da plataforma SRV

Data: 2026-10-07 · Escopo: o que o ClickUp oferece, o que a plataforma já tem, o que falta e em que ordem construir.

> **Como ler.** As seções 1 e 2 vêm da pesquisa (links na seção 8) e do conhecimento geral do produto. Os limites por plano do ClickUp mudam e não foram verificados um a um, então não use os números como regra de negócio. A seção 3 vem do código do repositório. As seções 4 a 7 são recomendação minha, para você aprovar ou cortar.

---

## 1. Mapa do ClickUp

### 1.1 Hierarquia
`Workspace › Space › Folder › List › Task › Subtask`. Subtarefas aninham até 3 níveis (7 com o ClickApp de subtarefas aninhadas) e uma tarefa aceita até 1.000 subtarefas. Checklists vivem dentro da tarefa e também aninham. Pastas e listas podem existir direto no espaço, e a visão **Tudo (Everything)** mostra tarefas de todo o workspace.

### 1.2 Tarefa
- Título, descrição rica, status (por lista), prioridade, responsáveis múltiplos, **seguidores**, datas de **início e prazo**, **tempo estimado** (dividível entre responsáveis) e tags.
- **Tipos de tarefa**, incluindo **marco (milestone)**.
- **Dependências** (bloqueia, bloqueada por, com tipos como fim-início e início-início) e **relacionamentos** com outras tarefas e Docs.
- **Tarefas recorrentes**, **lembretes**, anexos, comentários com **@menção** e comentários atribuídos como ação pendente.
- Histórico de atividade, **templates** de tarefa e de checklist, e criação por e-mail ou formulário.

### 1.3 Visões
| Grupo | Visões |
|---|---|
| Tarefas | Lista, Quadro (Board), Calendário |
| Planejamento | Gantt, Timeline, Workload, Equipe (Team) |
| Dados | Tabela, Mapa, Mind Map |
| Colaboração | Chat, Doc, Whiteboard, Formulário, Incorporar (Embed) |

Cada visão tem filtros, agrupamento, ordenação, colunas visíveis, **subtarefas** (mostrar/recolher), visões **salvas**, **fixadas** e **privadas ou compartilhadas**. O agrupamento aceita status, responsável, prioridade, tag, datas e **qualquer campo personalizado**.

### 1.4 Campos personalizados
Texto, área de texto, número, dinheiro, data, lista suspensa (até 500 opções, com cor), rótulos, caixa de seleção, URL, e-mail, telefone, avaliação, progresso (manual e **automático** por subtarefas e checklists), **fórmula**, **rollup**, relacionamento, pessoas, localização, arquivos, assinatura, votação e botão. Existem também campos de IA (categorizar, preencher automaticamente). Dá para converter alguns tipos entre si, e o campo pode ser reaproveitado em várias listas.

### 1.5 Automações
Estrutura **gatilho → condição (opcional) → ação**.
- **Gatilhos:** mudança de status, responsável, prioridade ou campo; chegada de uma data; tarefa criada, movida ou concluída; comentário; recorrência.
- **Ações:** mudar status, atribuir, atualizar campo, comentar ou @mencionar, mover ou copiar para outra lista, aplicar tag, criar tarefa ou subtarefa, enviar e-mail, chamar **webhook**.
- Há galeria de modelos, histórico de execuções e limite de execuções por plano.

### 1.6 Relatórios e metas
- **Dashboards** com cards: contadores e cálculos, barras, pizza, linha, lista de tarefas, tabela, carga de trabalho, tempo registrado, sprints (burndown, burnup, velocity), portfólio e incorporação.
- **Goals / OKRs** ligados a tarefas, números, dinheiro ou verdadeiro/falso, com progresso automático.
- **Sprints** (ciclos, pontos, velocity) e **Workload** (capacidade por pessoa).

### 1.7 Tempo
Cronômetro, entrada manual, **tempo faturável**, relatórios por pessoa, tarefa e lista, e **timesheets** com aprovação.

### 1.8 Comunicação e conhecimento
Docs (wiki com permissões e vínculo a tarefas), Whiteboards, Chat (canais, mensagens diretas, transformar mensagem em tarefa), **Clips** (gravação de tela), **Inbox** (notificações, lembretes, tarefas atribuídas a mim) e **proofing** (anotação sobre imagem, vídeo e PDF).

### 1.9 Entrada de trabalho
**Formulários** públicos que criam tarefas (com campos condicionais), tarefa por e-mail e API.

### 1.10 Permissões e compartilhamento
Papéis Owner, Admin, Member, Limited member e Guest, com permissões Full edit, Edit, Comment e View only **por espaço, pasta, lista e tarefa**. Há espaços privados, links públicos e papéis personalizados (plano Enterprise).

### 1.11 Plataforma
API pública e webhooks, mais de 1.000 integrações (Slack, Google, GitHub etc.), importação (CSV e outros apps), exportação, apps mobile e desktop, **ClickUp Brain** (IA: resumir, escrever, buscar, agentes, notas de reunião) e templates de espaço, lista e projeto.

---

## 2. O que importa para uma agência
Para a Grupo SRV (conteúdo para clientes, aprovação e operação), o ClickUp entrega valor sobretudo em: **formulários de briefing**, **aprovação com proofing**, **tarefas recorrentes** (conteúdo semanal e mensal), **templates** (onboarding de cliente), **tempo por cliente**, **dashboards por cliente**, **workload** e **automações de status**. Estruturas como Sprints, Goals/OKR e Whiteboards pesam menos para o seu caso.

---

## 3. Onde a plataforma está hoje (código do repositório)

| Área | Situação |
|---|---|
| Hierarquia | **Tem:** espaços, pastas, listas, itens soltos na raiz, tarefas e subtarefas. |
| Status por lista | **Tem:** editor de status por lista, com categorias. |
| Visões | **Tem:** Lista, Quadro (Kanban por status) e Calendário. **Falta:** Tabela, Timeline/Gantt, Workload, Mapa, Mind Map, Formulário, Doc, Chat. |
| Filtros e agrupamento | **Tem:** filtros por responsável, status, prioridade, etiqueta, tag de cliente, prazo e mês, e busca. Agrupamento por status, prioridade, mês, cliente, responsável, etiqueta e campos personalizados, ou nenhum. |
| Campos personalizados | **Tem:** 25 tipos, cores por opção, tela de gestão (admin), menu por coluna (ocultar, mover, configurar). **Falta:** rollup, conversão entre tipos, campos de IA, validação de valores antigos ao mudar opções. |
| Tarefa | **Tem:** prioridade, responsáveis, tags, **prazo**, cronômetro, gravação de tela, anexos, comentários, histórico. **Falta:** data de início, checklist, seguidores, dependências, relacionamentos, tipos/marcos, tempo estimado, recorrência, lembretes. |
| Tempo | **Tem:** cronômetro e registro. **Falta:** faturável, relatórios, timesheet. |
| Avisos | **Tem:** sino com avisos e comentários. **Falta:** Inbox completa, preferências, e-mail digest. |
| Clientes | **Tem:** cadastro, tags de cliente, galeria com capa e campos próprios, portal do cliente e aprovação de posts por link. |
| Permissões | **Tem:** papéis admin, gestor, equipe e cliente. Gestão de espaços e membros. **Falta:** permissão por item, convidado por link, papéis personalizados. |
| Automação, formulários, dashboards, metas, docs, chat | **Não tem.** |
| Plataforma | **Tem:** Supabase com RLS, R2, deploy na Vercel. **Falta:** API pública, webhooks, integrações, importação/exportação, busca global, mobile/PWA, IA. |

---

## 4. Roadmap proposto

Esforço: **P** = até 1 dia · **M** = 1 a 3 dias · **G** = 1 a 2 semanas. Cada item é pensado para sair sozinho, com teste, sem travar os outros.

### Fase 1: acabamento da tarefa e da lista (valor alto, risco baixo)
| # | Item | Esforço | Notas |
|---|---|---|---|
| 1.1 | **Colunas padrão na lista** (Status, Tag do cliente, Etiquetas, Responsável, Prazo, Prioridade) com ocultar, mover e "Campos existentes" no "+" | M | É a Etapa B já combinada. Refatora a grade para uma lista ordenada de colunas. |
| 1.2 | **Data de início** e prazo como intervalo | P | Coluna nova em `tasks`. Alimenta Calendário, Timeline e Workload. |
| 1.3 | **Checklists** na tarefa | M | Tabela `task_checklist_items`. Base do progresso automático. |
| 1.4 | **@menções** nos comentários e **seguidores** | M | Gera aviso. Seguidores recebem avisos da tarefa. |
| 1.5 | **Visões salvas** (filtros, agrupamento, colunas, ordem) por lista | M | Hoje isso mora na URL e no navegador. Passa para tabela `saved_views`, privada ou compartilhada. |
| 1.6 | **Edição em massa** (status, responsável, prazo, prioridade, mover, tag) | M | A seleção múltipla já existe. Só falta a barra de ações. |
| 1.7 | **Busca global** (Cmd+K) por tarefas, listas, clientes | M | Postgres full-text. |
| 1.8 | **Ordenação por coluna** na lista | P | Complementa o agrupamento. |
| 1.9 | **Tempo estimado** e **tipos de tarefa** (tarefa e marco) | P | Coluna e enum. |

### Fase 2: planejamento
| # | Item | Esforço | Notas |
|---|---|---|---|
| 2.1 | **Dependências** (bloqueia, bloqueada por) e **relacionamentos** | M | Tabela de ligações, com aviso visual de bloqueio. |
| 2.2 | **Tarefas recorrentes** | G | Regra de recorrência mais um job (cron do Supabase ou Vercel) que cria a próxima ocorrência. **Prioridade para a SRV.** |
| 2.3 | **Templates** de tarefa, lista e espaço | G | Copiar estrutura com campos, status e checklists. Ideal para onboarding de cliente. |
| 2.4 | **Visão Tabela** | M | Reaproveita as colunas da 1.1. |
| 2.5 | **Timeline / Gantt** | G | Depende de 1.2 e 2.1. |
| 2.6 | **Workload** (carga por pessoa e por semana) | M | Depende de 1.2 e 1.9. |
| 2.7 | **Lembretes** e **Inbox** unificada | M | Evolui o sino atual. |

### Fase 3: entrada de trabalho e automação
| # | Item | Esforço | Notas |
|---|---|---|---|
| 3.1 | **Formulários** (briefing que vira tarefa) | G | Link público com token e campos escolhidos entre os personalizados. **Prioridade para a SRV.** |
| 3.2 | **Automações** (gatilho, condição, ação) | G | Tabela `automations`, execução no servidor (função ou fila) e histórico. Comece com 5 gatilhos e 6 ações. |
| 3.3 | **Webhooks de saída** e **API pública** com token | G | Permite integrar com n8n, Zapier e outros. |

### Fase 4: relatórios
| # | Item | Esforço | Notas |
|---|---|---|---|
| 4.1 | **Dashboards** com cards (contador, barra, pizza, lista, carga, tempo) | G | Cards configuráveis, salvos por usuário ou compartilhados. |
| 4.2 | **Tempo faturável** e **relatório por cliente** | M | Marca de faturável mais agregação por cliente, pessoa e período. **Prioridade para a SRV.** |
| 4.3 | **Rollup** e **fórmula** entre subtarefas | M | Soma ou média de campos das subtarefas. |
| 4.4 | **Metas (Goals)** | M | Só se você usar OKR de verdade. Baixa prioridade. |

### Fase 5: cliente e colaboração
| # | Item | Esforço | Notas |
|---|---|---|---|
| 5.1 | **Proofing**: comentar em ponto da imagem ou do vídeo no portal | G | Estende a aprovação de posts já existente. **Prioridade para a SRV.** |
| 5.2 | **Convidados por link** e permissão por item | G | Full edit, Edit, Comment, View. Mexe nas políticas de RLS. |
| 5.3 | **Docs** (wiki ligada a tarefas e clientes) | G | Editor rico mais permissões. |
| 5.4 | **Chat / canais** | G | Só se a equipe não usar WhatsApp ou Slack para isso. |
| 5.5 | **Papéis personalizados** | G | Depois de 5.2. |

### Fase 6: plataforma
| # | Item | Esforço | Notas |
|---|---|---|---|
| 6.1 | **Importar do ClickUp** (via API ou CSV) | G | Útil para trazer o histórico, caso vocês estejam migrando. |
| 6.2 | **Integrações:** Google Calendar e Drive, WhatsApp, Meta Ads, Slack | M cada | Escolha pelo que o time usa. |
| 6.3 | **Exportar** (CSV de listas e relatórios) | P | |
| 6.4 | **PWA / mobile** | M | Instalável, com avisos push. |
| 6.5 | **IA**: resumir tarefa, criar tarefas a partir de texto, categorizar campo | M | Via API da Anthropic. |

---

## 5. Trilha paralela: design e robustez
Estes itens valem mais do que várias funcionalidades novas para a sensação de produto sério.

1. **Design system mínimo:** tokens de cor, tipografia e espaçamento num só lugar. Hoje há valores soltos (`text-[10px]`, hexadecimais fixos, tons de sky e rose misturados com a marca vermelha).
2. **Estados de interface:** carregamento (skeleton), vazio, erro e confirmação própria. Trocar `confirm()` do navegador por diálogo do app.
3. **Acessibilidade:** foco visível, rótulos, contraste e navegação por teclado nos menus e diálogos.
4. **Desempenho:** virtualizar listas grandes, paginar tarefas, revisar consultas e índices.
5. **Qualidade:** testes de ponta a ponta nos fluxos críticos (Playwright), revisão de segurança das políticas de RLS e das ações de servidor, monitoramento de erros (Sentry) e **log de auditoria**.
6. **Operação:** ambientes separados de desenvolvimento e produção. O `.env.local` aponta para um banco diferente do de produção, o que já causou o erro da migration 16.

---

## 6. O que não copiar
- **Excesso de configuração:** o ClickUp é conhecido por curva de aprendizado alta. Prefira padrões bons e poucas opções.
- **Sprints, OKR e Whiteboards:** pesam pouco para uma agência de conteúdo. Deixe para o fim.
- **Mais de 15 visões:** três ou quatro bem feitas (Lista, Quadro, Calendário, Tabela) servem melhor do que muitas pela metade.

---

## 7. Sequência recomendada
1. **Já combinado:** Etapa B (1.1).
2. **Quick wins** de 1.2 a 1.9 e **design system** (trilha da seção 5, itens 1 a 3).
3. **Pacote agência:** recorrência (2.2), templates (2.3), formulários (3.1), tempo faturável e relatório por cliente (4.2), proofing (5.1).
4. **Planejamento:** dependências, Tabela, Timeline, Workload.
5. **Automação e API.**
6. **Dashboards** e integrações.

Estimativa de ordem de grandeza: fases 1 e 2 somam algumas semanas de trabalho contínuo. Fases 3 a 6 são meses, se feitas por completo.

---

## 8. Fontes consultadas
- [ClickUp: termos e funcionalidades](https://clickup.com/blog/the-ultimate-guide-to-clickup-terms-features)
- [ClickUp: hierarquia](https://clickup.com/hierarchy-guide) e [funcionalidades principais](https://help.clickup.com/hc/en-us/articles/6311563319063-Core-ClickUp-features)
- [ClickUp: introdução às visões](https://help.clickup.com/hc/en-us/articles/6329880717719)
- [ClickUp: criar uma automação](https://help.clickup.com/hc/en-us/articles/30241682127127-Create-an-Automation)
- [ClickUp: tipos de campo personalizado](https://help.clickup.com/hc/en-us/articles/6303499162647-Custom-Field-Types)
- [ClickUp: cards de dashboard](https://help.clickup.com/hc/en-us/articles/25757497269143-Intro-to-cards) e [dashboards para metas e OKRs](https://help.clickup.com/hc/en-us/articles/30807421482391-Use-Dashboards-for-goals-and-OKRs)
- [ClickUp: convidados (guests)](https://help.clickup.com/hc/en-us/articles/6311803642903-Use-ClickUp-as-a-guest)
- [ClickUp: fluxos de aprovação para agências](https://clickup.com/blog/how-agencies-can-optimize-approval-workflows/)
- [ClickUp: operações de agência](https://clickup.com/blog/set-up-clickup-for-agency-operations/)
- [Visão geral e avaliações 2026](https://hackceleration.com/clickup-review/)
