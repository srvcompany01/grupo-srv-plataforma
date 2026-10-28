# Garantia de funcionalidades — o que existe hoje e como cada coisa é preservada

Regra combinada: **nenhuma funcionalidade atual é excluída**. A interface pode mudar de lugar, de visual e de botões; o que a plataforma faz hoje continua fazendo,
e o que vem do ClickUp (documentos `clickup-levantamento.md`, `clickup-design-tokens.md`, `clickup-estrutura/`) é **somado**, não substitui.
Inventário feito em 2026-10-28 sobre o código atual (branch `feat/plataforma`).

## 1. Inventário do que existe hoje
**Telas logadas (43 rotas):** Home (`/home`), Minhas tarefas (`/inicio`), Tarefas (`/tarefas/[id]` e painel lateral `@painel`), Listas (`/listas/[id]`), Espaços (`/espacos/[id]`), Agenda, Agendamentos (posts),
Chat (+ canal), Clientes (+ detalhe + relatório), Anúncios, Insights, Google Meu Negócio (GMN), Performance (inclui Projeção e Relatórios), Biolytics (link da bio + quiz), Tráfego & Performance, Social & Conteúdo,
Painel de Gestão, Projetos, Time, Reuniões, Documentos (+ editor colaborativo), Quadros (+ editor), Funis (+ funil), Financeiro, Editor do Blog (+ post), Relatórios (atalho para Performance) e **Configurações**
(Usuários, Espaços, Campos, Campos de clientes, Formulários, Integrações, Personalização, Armazenamento).
**Páginas públicas/externas:** login, blog (posts, busca, feed, IndexNow), landings, página da bio (`/l/[slug]` + quiz + redirecionamentos), relatório compartilhado do cliente (`/r/[token]`), portal do cliente (`/portal`, `/cliente/[slug]`, `/c/[token]`),
formulários públicos (`/f/[token]`), admin do blog, OAuth do MCP, privacidade, exclusão de dados, sobre.
**APIs e rotinas:** `/api/mcp` (**102 ferramentas** para IA), `/api/ia`, `/api/leads`, `/api/unsplash`, integrações Meta/Google/GMN/performance, 4 crons (recorrências, arquivos, anúncios, GMN).
**Núcleo de trabalho:** espaços → pastas → listas → tarefas/subtarefas; status por lista; campos personalizados (dropdown, texto, data, texto longo, número, rótulos, arquivos, assinatura…); filtros e visão salva; visualizações
Lista, Kanban, Calendário, Painel, Documentos; edição em lote; cronômetro e lançamento de tempo; comentários e menções; anexos; prioridade; tags de cliente; recorrência; avisos/notificações; presença e status do time;
arrastar para reordenar/mover itens na barra lateral (admin); personalizar cor/ícone/emoji de espaço, pasta e lista; larguras e modo (fixa/recolhida) da barra lateral; tema por admin.
**Segurança e dados:** RLS por papel (admin/gestor/membro/cliente), migrations versionadas, 131 arquivos / 785 testes automatizados.

## 2. O que o plano muda, módulo a módulo
| Área atual | Vai mudar? | Como fica |
|---|---|---|
| Tarefas (lista, subtarefas, comentários, anexos, tempo, recorrência, edição em lote) | Visual e organização | **Tudo mantido**; ganha dependências, checklists, estimativa, histórico, tipos de tarefa, atalhos |
| Visualizações Lista/Kanban/Calendário/Painel/Documentos | Aparência de abas e barra de ferramentas | **Mantidas**; somam Tabela, Galeria, Linha do tempo, Carga de trabalho, Atividade (Gantt/Mapa depois) |
| Filtros e visão salva | Painel novo (E/OU, filtros salvos, "Modo eu") | **Mantidos** e ampliados; visões salvas antigas continuam abrindo |
| Campos personalizados (config + em lista) | Gerenciador central | **Mantidos**; somam os tipos que faltam e permissões por campo; valores atuais preservados (migration só adiciona) |
| Espaços/pastas/listas (criar, arrastar, renomear, cor/ícone/emoji, privacidade) | Barra lateral nova | **Mantidos todos**; somam ocultar espaço, favoritos, visão geral do espaço |
| Barra lateral (largura, fixa/recolhida, cronômetro, contador do chat) | Layout (1 ou 2 barras) | **Mantidos**; configurações e perfil vão para o rodapé (já feito) |
| Home, Minhas tarefas, Agenda, Chat, Agendamentos | Visual | **Mantidos**; Minhas tarefas ganha Prioridades/cartões, Agenda ganha Planejador, Chat ganha threads/fixados (depois) |
| Clientes, Anúncios, Insights, GMN, Performance (+Projeção), Biolytics, Tráfego, Social, Financeiro, Funis, Projetos, Time, Reuniões, Painel de Gestão, Blog | **Só o visual** (tokens, tipografia, componentes, páginas de relatório) | **Sem mudança de função** |
| Documentos e Quadros | Visual; Documentos ganha comandos "/" e subpáginas | **Mantidos** |
| Formulários, Integrações, Usuários, Personalização, Armazenamento | Visual; Personalização passa a editar os novos tokens (tema antigo continua valendo) | **Mantidos** |
| Páginas públicas (bio, quiz, relatório do cliente, blog, landings, portal) | **Não mudam** (o novo visual vale só na área logada) | Intactas |
| MCP (102 ferramentas), crons, APIs | Não mudam | Intactos; cada função nova ganha ferramenta |
| Rotas atuais (`/inicio`, `/relatorios`, `/listas/…`, links salvos) | Não mudam | Continuam funcionando; qualquer rota movida ganha redirecionamento |

## 3. Único ponto em que eu já perdi algo (e como corrijo)
- **Reordenar os atalhos do menu "Início" por arrastar** (lista de atalhos no menu do celular, ordem guardada em cookie `srv-nav-ordem-inicio`): na barra lateral unificada (ainda **sem commit/deploy**) o bloco foi substituído pelos grupos recolhíveis e esse arraste deixou de existir.
  **Correção**: restaurar o arraste dos atalhos (Home, Tarefas, Chat, Agenda e dos itens dentro de cada grupo) na própria barra unificada, usando o `ListaOrdenavel` que continua no código e o mesmo cookie. Entra na Fase 2, antes do deploy da barra.
- Fora isso, nada foi removido: configurações e perfil **mudaram de lugar** (cabeçalho → rodapé da barra) e a faixa estreita de ícones **foi substituída** pela lista com nomes por extenso (mesma navegação).

## 4. Como a garantia é cumprida na prática
1. **Inventário vira checklist de aceitação** (este documento): ao fim de cada fase, passo por todas as rotas e ações da seção 1 e marco o que foi verificado.
2. **Testes existentes continuam obrigatórios**: nenhum teste é apagado para "passar"; os 785 precisam seguir verdes a cada fase (mudança de comportamento intencional exige conversa antes).
3. **Mudanças de dados só aditivas**: migrations novas apenas criam tabelas/colunas/tipos; nada de `drop`/`rename` em dados existentes (exceto se você pedir, como foi com o Kommo).
4. **Substituição em duas etapas**: a tela nova entra ao lado da antiga; a antiga só sai depois de você validar a nova.
5. **Rotas e links**: nada de quebrar endereço existente; se mover, redireciona.
6. **MCP e docs de IA em dia** (`descrever_plataforma`) a cada mudança de regra.
7. **Conferência por área** no deploy: depois de cada "suba" eu listo o que foi tocado e o que não foi, para você poder checar a parte que importa.

## 5. Funcionalidades do ClickUp que são SOMADAS (não substituem nada)
Visualizações extras, painel "Personalizar visualização", filtros E/OU e salvos, "Modo eu", tipos de tarefa, dependências/checklists/estimativa, campos novos, caixa de entrada, Prioridades, Planejador, visão geral do espaço, favoritos, ocultar espaço,
atalhos de teclado, preferências do usuário, e (Fase 6, sob demanda) automações, Gantt, Mapa mental, Equipe, Painéis montáveis, Metas, planilhas de horas, vários espaços de trabalho.
