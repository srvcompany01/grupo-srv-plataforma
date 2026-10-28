# ClickUp — tokens de design e medidas reais da interface (extraídos em 2026-10-28)

Fonte: a interface logada do workspace "Srv Company" (tema claro, cor de destaque "teal"), lida pelo navegador: variáveis CSS (`--cu-*`) do `body`, estilos calculados
(`getComputedStyle`) e posições de cada elemento a 1600×1000. Os nomes dos ícones vêm do sprite SVG do próprio app (`cu3-icon-*`).
Não copiamos código, logotipo nem os desenhos SVG deles: usamos as medidas, as cores e a organização, e os ícones equivalentes da biblioteca que já temos (lucide).

> O REA (ferramenta de engenharia reversa) só se conecta a um Chrome com porta de depuração (CDP); o navegador logado do Playwright não expõe essa porta. Por isso a extração
> foi feita por dentro desse navegador, que é o equivalente para uma interface em HTML/CSS. Dá para usar o REA nos arquivos públicos (bundles JS) se for preciso.

---------------------------------------------------------------------------------------------------------------------------

## 1. Tipografia
- **Família**: pilha de sistema — `-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Helvetica, Arial, sans-serif` (+ emoji). Mono (editor): GeistMono.
  → Não é uma fonte web: usa a do sistema. Em Mac renderiza como San Francisco. Para ficar igual, usar a mesma pilha (sem Google Fonts).
- **Escala** (`--cu-font-size-N`): 1=6px · 2=8 · 3=10 · 4=11 · 5=12 · 6=14 · 7=16 · 8=18 · 9=20 · 10=22 · 11=24 · 12=28 · 13=32 · 14=36 · 15=40.
- **Pesos**: regular 400 · medium 500 · semibold 600 · bold 700.
- **Estilos nomeados**: título H1=28 / H2=24 / H3=20 / H4=18 / H5=16 / H6=14 (line-height 1.25, peso 600–700); "Title"=32; Label large 18 (1.334), medium 16 (1.25), small 14 (1.143), xsmall 12 (1.334);
  Parágrafo large 16 / medium 14 / small 12 (line-height 1.5); legenda 11 (1.45).
- **Uso real medido**: título do painel lateral 16/600 · linhas da árvore (espaço/pasta/lista) 14/400 com altura 28px · rótulo dos ícones da faixa 10/600 (700 quando ativo) ·
  nome do workspace 14/600 · breadcrumb 14/400 cinza · aba de visualização 12/600 (ativa) 13/400 (inativa) · botões da barra de ferramentas 12/500 · cabeçalho de grupo (status) 12/500 ·
  cabeçalho de coluna 12/500 cinza `#838383` · nome da tarefa na lista 14/500 · "Adicionar Tarefa" 14/400 `#646464` · chip do agrupamento 12/500 na cor do tema.

## 2. Espaçamento, tamanhos e raios
- **Escala de tamanho** (`--cu-size-N`): 1=4px · 2=8 · 3=12 · 4=16 · 5=20 · 6=24 · 7=28 · 8=32 · 9=36 · 10=40 · 11=44 · 12=48 (múltiplos de 4; usa também 2, 3, 5, 6, 10…).
- **Raios** (`--cu-radii-N`): 1=2px · 1.5=3 · 2=4 · 2.5=5 · 3=6 · 3.5=7 · 4=8 · 4.5=9 · 5=10 · 6=12 · 7=16 · 8=20 · 9=24 · round=pílula. Uso: botões/itens 6px, abas 5px, cartões/menus 8–12px, modais 16px.
- **Bordas**: 1px (2px para foco). **Cartão**: padding 24px.
- **Animação**: curva `cubic-bezier(.42,0,.58,1)`; "snappy" `cubic-bezier(.6,0,.05,.95)`; durações curtas (0,15–0,3 s; o app desliga animação com "modo de desempenho").

## 3. Cores — paleta base (tema claro)
Cada cor tem 12 degraus (50…1100). O destaque padrão do app é **800**; hover **900**; fundo suave **200/300**; texto em cima do suave **1000**.
| Cor | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | **800** | 900 | 1000 | 1100 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| grey (neutros) | #FCFCFC | #F9F9F9 | #F0F0F0 | #E8E8E8 | #E0E0E0 | #D9D9D9 | #CECECE | #BBBBBB | #8D8D8D | #838383 | #646464 | #202020 |
| purple (padrão) | #FDFDFF | #F8F8FF | #F0F1FF | #E5E6FF | #D9DAFF | #CACBFF | #B6B6FF | #9B98FD | **#6049E7** | #553ED0 | #5A43D6 | #2B216A |
| teal (tema do Fabricio) | #FAFEFD | #F1FCFA | #E7F9F5 | #D9F3EE | #C7EBE5 | #AFDFD7 | #8DCEC3 | #53B9AB | **#12A594** | #0E9888 | #067A6F | #0D3D38 |
| azureBlue | #FBFDFF | #F5FAFF | #EDF6FF | #E1F0FF | #CEE7FE | #B7D9F8 | #96C7F2 | #5EB0EF | **#0091FF** | #0880EA | #0B68CB | #113264 |
| neonBlue | #FDFDFE | #F8FAFF | #F0F4FF | #E6EDFE | #D9E2FC | #C6D4F9 | #AEC0F5 | #8DA4EF | **#3E63DD** | #3A5CCC | #3451B2 | #1F2D5C |
| green | #FBFEFC | #F2FCF5 | #E9F9EE | #DDF3E4 | #CCEBD7 | #B4DFC4 | #92CEAC | #5BB98C | **#30A46C** | #299764 | #18794E | #193B2D |
| yellow | #FEFDFB | #FFF9ED | #FFF3D0 | #FFECB7 | #FFE0A1 | #F5D08C | #E4BB78 | #D6A35C | **#FFC53D** | #FFBA1A | #915930 | #4F3422 |
| orange | #FEFCFB | #FEF8F4 | #FFEDD5 | #FFE0BB | #FFD3A4 | #FFC291 | #FFAA7D | #ED8A5C | **#F76808** | #ED5F00 | #99543A | #582D1D |
| red | #FFFCFC | #FFF7F7 | #FFEFEF | #FFE5E5 | #FDD8D8 | #F9C6C6 | #F3AEAF | #EB9091 | **#E5484D** | #D93D42 | #C62A2F | #641723 |
| pink | #FFFCFD | #FFF7FB | #FEEFF6 | #FCE5F0 | #F9D8E7 | #F4C6DB | #EDADC8 | #E58FB1 | **#E93D82** | #DC3175 | #CB1D63 | #621639 |
| violet | #FEFCFF | #FFF8FF | #FCEFFC | #F9E5F9 | #F3D9F4 | #EBC8ED | #DFAFE3 | #CF91D8 | **#AB4ABA** | #A43CB4 | #9C2BAD | #53195D |
| mint | #F8FEFC | #F1FCF9 | #D9FAF1 | #C1F6E8 | #A8EFDD | #8EE3CE | #6AD3BC | #14BFA4 | **#16C0A4** | #00B499 | #007B65 | #05453A |
| brown | #FDFCFC | #FDF8F6 | #F8F1EE | #F2E8E4 | #EADDD7 | #E0CEC7 | #D1B9B0 | #BFA094 | **#A18072** | #947467 | #7D5E54 | #43302B |
Também: **brightPurple** (#8930FD/800) e **magenta** (#FF02F0/800) formam o gradiente da IA; **cyan** (#41C5F2/800); **black** (#000000/800; #1E1F24/1100); **white** #FFFFFF.
**Transparências de cinza** (`alphaGrey`, preto com alpha — usadas em hovers/seleções): 50=.014 · 100=.024 · 150=.039 · 200=.059 · 300=.090 · 400=.122 · 500=.149 · 600=.192 · 700=.267 · 800=.447 · 900=.486 · 1000=.608 · 1100=.875.

## 4. Cores — papéis semânticos (os que importam para a interface)
| Papel | Valor (tema claro) |
|---|---|
| Fundo da página / cartão / menu | `#FFFFFF` (`background-main`, `background-menu`, `card-background`) |
| Fundo suave (hover de linha, painéis) | `#FCFCFC` (`background-subtle`) → hover `#F9F9F9` |
| Hover de itens | preto 2,4% (`background-main-hover`) · seleção/ativo preto 5,9% (`background-on-main`) · pressionado preto 12% |
| Primária (botão principal, links de destaque) | `800` da cor do tema (teal `#12A594`); hover `900`; texto sobre ela `#FFFFFF` |
| Primária suave (chips, linha selecionada) | `200` da cor do tema (`#E7F9F5`); texto `1000` (`#067A6F`) |
| Texto principal | `#202020` (`grey1100`) |
| Texto secundário | `#646464` (`grey1000`) |
| Texto terciário (cabeçalho de coluna) | `#838383` (`grey900`) |
| Placeholder | `#8D8D8D` · desabilitado `#BBBBBB` |
| Borda padrão | `#E8E8E8` (`grey300`) · baixo contraste `#F0F0F0` · alto `#CECECE` · de campo `#8D8D8D` (hover `#838383`) |
| Perigo | fundo `#E5484D`, hover `#D93D42`; suave `#FFEFEF` |
| Sucesso | `#30A46C`; suave `#E9F9EE` · Aviso `#FFC53D`; suave `#FFF3D0` |
| Tooltip | fundo `#202020` |
| Link | azul `800` (`#0091FF`), hover `1100` |
| Notificação (bolinha) | `pink800` `#E93D82` |
| IA | violeta `800` + gradiente `brightPurple → magenta` |
| Barra do topo (40px) | fundo branco; botões e ícones em preto 6–9% no hover; busca branca com borda |
| Avatar de espaço/usuário | `800` da cor escolhida (fundo), texto branco |
| Campos personalizados (chip do tipo) | dinheiro/fórmula/número = teal200 · data/lista/rótulos = green200 · texto = azure200 · e-mail/telefone/pessoas/local = pink200 · anexo/botão/caixa/votação = purple200 · progresso = orange200 · relacionamento/tarefas/rollup = yellow200 |

**Sombras (elevação)**: 1 `0 1px 2px rgba(0,0,0,.055)` · 2 `0 1px 3px rgba(0,0,0,.106), 0 1px 2px -1px rgba(0,0,0,.106)` · 3 `0 4px 6px -1px …, 0 2px 4px -2px …` ·
4 `0 10px 15px -3px …, 0 4px 6px -4px …` · 5 `0 20px 25px -5px …, 0 8px 10px -6px …` (todas com alpha .106) · **anel** `0 0 1px 0 rgba(0,0,0,.267)` (cartões e menus ganham anel + elevação).

**Temas do usuário**: 11 cores de destaque trocam `primary` (purple padrão, neonBlue, azureBlue, teal, mint, orange, pink, violet, brown, black, personalizada); modo Claro/Escuro/Auto; alto contraste.

---------------------------------------------------------------------------------------------------------------------------

## 5. Layout e medidas dos componentes (viewport 1600×1000)
| Peça | Medida |
|---|---|
| **Barra superior global** | altura **40px**, padding 0 6px, **fundo branco** (cor do `body`); à esquerda botão de workspace (avatar quadrado + "Srv Company" 14/600 + seta) e botão de calendário; **busca centralizada** (pílula branca 14/500, placeholder cinza, atalho ⌘K); à direita 7 ícones de 16px a cada 26px (concluir, caixa, bloco de notas, clipe de vídeo, microfone, lembrete, documento) e o avatar (com bolinha de presença verde) |
| **Faixa de ícones (esquerda)** | largura **64px**, começa abaixo da barra superior (y=40); **fundo = degradê vertical** `linear-gradient(#067A6F 0%, #0D3D38 100%)` (teal 1000 → teal 1100 do tema; com o tema roxo vira purple 1000 → 1100); cada item **52×62px**, padding 0 7px, ícone **20×20** branco, rótulo **10px/600** (700 ativo) branco logo abaixo (altura 18, padding-top 2); item ativo = ícone preenchido (`…Filled`) sobre pastilha branca arredondada de ~32px, ícone na cor `1000` do tema (#067A6F); espaçamento vertical entre itens 62px; rodapé fixo: Convidar (ícone addUser) e Fazer upgrade |
| **Painel lateral** | largura **256px** (x 64→320), **fundo `#F9F9F9`** (grey100) com cantos arredondados, sem borda dura; cabeçalho com **título 16/600** (20px) e à direita ícones 16px (busca, filtro, recolher, "+" em quadradinho de 24px com borda); seções com título 13/600 cinza ("Espaços", "Canais", "Mensagens diretas") + "+" que aparece no hover; linhas de **28–30px** (14/400, `#646464`, ícone 16px, recuo 16–17px por nível), **raio 6px**; hover = preto 2,4%; ativa = fundo `#E7F9F5`-like/preto 5,9% e texto `#202020` com peso 500; contador pequeno à direita (cinza); cadeado quando privado; "…" e "+" no hover; barra de rolagem fina |
| **Conteúdo** | começa em x=321, fundo branco (cartão arredondado sobre a página); cabeçalho da página com **breadcrumb** (14/400 cinza, separador "/", ícone de pasta/lista de 16px colorido, nível atual 14/600 preto, estrela de favorito, seta de menu) e à direita Compartilhar (texto 14, ícone de pessoas) + chamada/robô de automação |
| **Abas de visualização** | altura **24px**, raio 5px, padding 0 4px, ícone **16px colorido por tipo** (view1 lista, view7 calendário, view23 quadro, view16 …) + nome 12/600 (ativa, com sublinhado de 2px na cor do tema) ou 13/400; "+ Visualização" no fim; "Adicionar canal" à esquerda em caixinha |
| **Barra de ferramentas** | altura 24–28px; à esquerda chip "Agrupando por: Status" (12/500 na cor do tema, fundo suave `#E7F9F5`, raio 6px), ícones de Subtarefas e Colunas (16px, cinza `#646464`); à direita ícones: Filtro, Mostrar fechadas (check em círculo), Responsáveis, avatar "Modo eu", Pesquisar, engrenagem e **botão "+ Tarefa"**: altura **24px**, fundo `#12A594`, texto 12/500 branco, raio **6px 0 0 6px** (esquerda) + seta separada à direita (raio 0 6 6 0), padding 0 5px, gap 4px |
| **Lista de tarefas** | cabeçalho de grupo = chip de status (altura 20px, raio 6px, padding 2px 6px 2px 4px; texto 12/500 em maiúsculas, fundo da cor do status) + contagem cinza; **cabeçalho de colunas altura 32px**, títulos 12/500 `#838383`; **linha de tarefa altura 35–36px**, nome 14/500 `#202020`, raio 4px no texto; células com padding 0 12px, valor vazio = ícone cinza `#8D8D8D`; linhas separadas por 1px `#F0F0F0`; rodapé "Adicionar Tarefa" (botão 24px, 14/400, raio 6px 8px 8px 6px, padding 0 8px, gap 4px); "+ Novo status" ao final |
| **Painéis laterais direitos** (Campos, Filtros, Personalizar…) | largura ~320px, cabeçalho 16/600 + fechar; interruptores (toggle 36×20) à direita; itens com seta ">" e valor cinza à direita |
| **Modais** | raio **16px** (`cu-radii-7`), sombra 5, fundo branco, título 18–20/600, botão primário à direita, cancelar em contorno |
| **Menus suspensos** | fundo branco, raio 8–12px, anel + elevação 3–4, itens 28–32px, ícone 16px + texto 14, divisores 1px `#F0F0F0`, rodapé de ação em botão cheio na cor do tema ("Compartilhamento e permissões") |
| **Tarefa aberta** | duas colunas: conteúdo (largura máx. ~900px, título 28–32px/700) + painel "Activity" à direita (~420px) com campo de comentário na base; propriedades em grade 2×N (rótulo cinza 14 + valor), seções recolhíveis "Campos", "Subtarefas", "Checklists" |

## 6. Ícones (nomes do sprite → equivalente lucide que já temos)
Faixa lateral: `v4IaSidebarHome` → **House** · `…Spaces` → **Orbit/Planet (Globe)** · `…Chat` → **MessagesSquare** · `…Calendar` (Planejador) → **CalendarDays** · `…Teams` → **Users** · `…Docs` → **FileText** · `…Dashboards` → **BarChart3/LayoutDashboard** ·
`…Whiteboards` → **PenTool/Frame** · `…Forms` → **ClipboardCheck** · `…Clips` → **Video** · `…Goals` → **Trophy** · `…Timesheets` → **Clock** · `nineDots` (Mais) → **Grip/LayoutGrid** · `addUser` → **UserPlus** · `closeLeft/closeRight` → **PanelLeftClose/Open**.
Cada item tem versão **preenchida** (ativo) e **contorno** (inativo) — em lucide: usar `fill="currentColor"` + `strokeWidth` menor no ativo, ou o par ícone/ícone-sólido.
Painel e barras: `add` → **Plus** · `ellipsisRegular` → **Ellipsis** · `chevronDown/caret/caretSmall/caretExpanded` → **ChevronDown/ChevronRight** · `search` → **Search** · `filter` → **ListFilter** · `sort` → **ArrowUpDown** · `inboxFilled` → **Inbox** ·
`notifications` → **Bell** · `folder/folderColor` → **Folder** · `list` → **ListTodo/List** · `lockAlt/lock` → **Lock** · `favorite` → **Star** · `automations` → **Bot** · `settings` → **Settings** · `group` → **Layers** · `subtask` → **ListTree/GitFork** · `columns` → **Columns3** ·
`circleCheck` → **CircleCheck** · `users/user/userAdd/userAssignedToMe` → **Users/User/UserPlus/UserCheck** · `dateAdd/dateDue` → **CalendarPlus/CalendarClock** · `priority` → **Flag** · `description` → **AlignLeft** · `syncup` → **Phone/Headset** · `portfolio` (barra do topo) → **Briefcase** ·
`notepad` → **NotebookText** · `video` → **Video** · `microphone` → **Mic** · `reminder` → **AlarmClock** · `doc` → **FileText** · `megaphone` (Posts) → **Megaphone** · `reply` (Respostas) → **Reply** · `myTasks` → **ListChecks** · `personalList` → **ListTodo** · `popNewEditFilled` (Novo) → **SquarePen** ·
`everything` ("Todas as tarefas") → **Asterisk/Sparkles**. Ícones de visualização (`view1`…`view35`): Lista, Quadro, Calendário, Gantt, Tabela, Linha do tempo, Carga de trabalho, Galeria, Atividade, Mapa — cada um com **cor própria** (vermelho=Gantt, verde=Tabela, laranja=Linha do tempo/Calendário, azul=Quadro, teal=Carga, roxo=Galeria, azul-claro=Atividade/Documento).
Ícone de status: círculo tracejado = aberto; meia-lua = em progresso; check = feito (`statusIconOpenDashed`, …).
**Tamanho padrão do ícone: 16px (rail 20px, menus 14px). Traço fino ~1,5px, cantos arredondados.**

---------------------------------------------------------------------------------------------------------------------------

## 7. Como aplicar na nossa plataforma (plano)
1. **Camada de tokens**: criar `--cu-*` em `src/app/globals.css` (paleta 50–1100 das 12 cores, neutros, alphaGrey, tamanhos, raios, elevações) e mapear os tokens atuais (`--color-texto`, `--color-borda`, `--color-marca`…) para eles — um único lugar para trocar tema (cor de destaque do cliente/usuário, claro/escuro).
2. **Tipografia**: trocar a Inter por **pilha de sistema** (igual ao ClickUp) e adotar a escala 10/11/12/13/14/16/18/20/24/28/32; pesos 400/500/600/700.
3. **Esqueleto**: barra superior de 40px (workspace + busca central ⌘K + atalhos + avatar), **faixa de ícones de 64px + painel lateral de 256px** (como no ClickUp — hoje temos uma barra só; decidir se voltamos às duas),
   cabeçalho da página com breadcrumb, abas de visualização de 24px e barra de ferramentas.
4. **Componentes base**: botão primário 24/28/32px com raio 6px, botão dividido "+ Tarefa ▾", chips de status, linhas de lista de 35px, painéis laterais de 320px, modais de 16px de raio, menus com anel + elevação, interruptores, avatares quadrados de espaço.
5. **Ícones**: mapa da seção 6 para lucide, versões cheias para estado ativo.
6. **Ordem**: tokens → tipografia → barra superior e navegação → cabeçalho da página/abas/ferramentas → lista/tarefa → modais/menus → páginas (Home, Painéis…).

## 8. Decisões que preciso de você
- Voltar às **duas barras** (faixa de ícones + painel), como no ClickUp, ou manter a barra única que fizemos?
- **Cor de destaque**: teal `#12A594` (a do seu tema), o roxo padrão do ClickUp `#6049E7`, ou o vermelho/preto da marca SRV?
- **Tema claro** apenas, ou já deixar o escuro pronto pelos mesmos tokens?
