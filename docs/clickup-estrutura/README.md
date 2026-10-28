# ClickUp — especificação da interface (estrutura, medidas e dados)

Capturado em 2026-10-28 a partir do Chrome logado do Fabricio (workspace "Srv Company", tema claro, destaque teal), viewport **1920×903**.
Cada arquivo desta pasta descreve **uma tela ou um estado** (menu, painel, modal) como uma árvore: quem fica dentro de quem, tamanho e posição de cada caixa,
atributos de acessibilidade e **só os estilos que mudam em relação ao elemento pai** (assim dá para ler o layout sem ruído).
Os tokens (cores, tipografia, raios, sombras) estão em `../clickup-design-tokens.md`; as funções e menus, em `../clickup-levantamento.md`.

## Como foi extraído
1. REA conectado ao Chrome por depuração (porta 9222): confirmou a aba, a árvore de nós (7.222 nós) e a árvore de acessibilidade (1.522 nós).
2. Leitura do DOM renderizado por CDP: para cada elemento visível, tag, classes (as 3 primeiras), `[x,y largura×altura]`, `role/aria/data-test`, texto curto e estilos calculados.
3. Para cada tela, as chamadas de rede (método, caminho, forma da resposta) foram registradas em `_rotas-consolidadas.md`.
4. Estados (menus/painéis/modais): clique no gatilho, extração só do que **aparece novo** na tela, e fechar.

**O que não foi copiado, de propósito:** os scripts do ClickUp (código-fonte), os desenhos dos ícones (SVG), imagens, logotipo e textos de marketing. A especificação descreve como a interface é
organizada e se comporta; o código e os ícones da nossa plataforma são escritos por nós (lucide para os ícones).

## Índice
**Telas** — `lista`, `quadro-kanban`, `calendario`, `gantt`, `tabela`, `linha-do-tempo`, `carga-de-trabalho`, `galeria`, `atividade`, `mapa`, `documento-na-lista`, `tarefa-aberta`,
`visao-geral-do-espaco`, `inicio-caixa-de-entrada`, `minhas-tarefas`, `planejador`, `equipes`, `documentos`, `paineis`, `quadros-brancos`, `formularios`, `clipes`, `metas`, `planilhas-de-horas`, `chat`.
**Estados** — `menu-workspace`, `busca-global`, `menu-perfil`, `menu-criar-novo-global`, `seta-nova-tarefa-tipos`, `mais-visualizacao`, `agrupar-por`, `painel-filtro`, `painel-campos-colunas`,
`painel-responsaveis`, `menu-subtarefas`, `menu-mostrar-fechadas`, `menu-adicionar-coluna`, `modal-compartilhar`, `menu-do-status-da-tarefa-na-lista`.
**Dados** — `_rotas-consolidadas.md` (128 rotas únicas, 36 grupos).

## Esqueleto global (todas as telas logadas)
```
body (flex, fundo #FFF, texto #202020 13px)
└ cu-app-view
  ├ cu-global-actions-bar            0,0   1920×40   fundo branco, padding 0 6px, arrastável (janela do app)
  │  ├ left   [workspace-picker 148×28 (avatar 18, nome 14/600, seta) | botão calendário 28×28]
  │  ├ centro busca 360×28 (pílula 666px, ícone 16, "Pesquisar" 14/500 cinza, atalho ⌘K 12/500)
  │  └ right  ações fixadas 24×24 (raio 6, gap 2: criar tarefa, meu trabalho, bloco de notas, clipe, fala→texto, lembrete, documento) + avatar 24 com presença
  └ cu-app-shell → div.cu-manager2__container (flex coluna, 0,40  1920×863)
     └ div.cu-manager2__router-outlet (flex, margem inferior 6)
        ├ cu-simple-bar  (FAIXA)        0,40   64×857    degradê vertical do tema; itens 52×62 (ícone 20, rótulo 10/600)
        └ div.cu-manager2__body-container  64,40  1850×857
           └ body-inner-wrapper (fundo #F9F9F9, bordas 1px #E8E8E8, cantos arredondados)
              ├ cu-nav-sidebar (PAINEL)   65,41   256×855   fundo #F9F9F9
              │   ├ cu-sidebar-header     255×40   grid, padding 8 8 4 12; título 16/600 + ações (busca, filtro, recolher 28×28; "+" 46×28)
              │   └ cu-sidebar-flat-tree  255×815  rolagem, padding-bottom 20; linhas cu-sidebar-row-layout 228×28, raio 6–7, ícone 16, texto 14
              └ conteúdo                  321,41  1592×…  fundo branco
                  ├ cu-location-header    1592×38   flex, padding 8 8 2 12 (breadcrumb em grid | ações à direita)
                  ├ barra de abas/visualizações (24px)
                  ├ barra de ferramentas (24–28px)
                  └ corpo da visualização (lista, quadro, calendário…) + painel lateral direito 320px sobreposto (z 702)
```

## Catálogo de componentes (medidas reais)
- **Botão de ícone da barra do topo**: 24×24, raio 6, ícone 16 cinza (#000 a 44,7%), hover fundo preto 9%.
- **Botão de workspace**: 148×28, padding 0 6, gap 6, fundo preto 6%, avatar quadrado 18 (raio 4,5, inicial 11/700 branca), nome 14/600, seta 14 `#838383`.
- **Busca global**: botão 360×28 de raio total, borda 1px transparente, fundo branco, sombra leve; ícone 16 `#8D8D8D`, texto 14/500 `#8D8D8D`, dica de atalho 12/500 `#BBB`.
- **Item da faixa**: 52×62 com `padding 0 7`; ícone 20; rótulo 10/600 (700 ativo) logo abaixo; ativo = pastilha 32×62 clara e ícone preenchido.
- **Linha do painel lateral**: 228×28, raio 6–7, ícone 16 `#838383`, texto 14 `#646464` (ativo: fundo preto 6%, texto `#202020`); linhas aninhadas recuam ~20px; ações "…" e "+" aparecem no hover.
- **Cabeçalho do painel**: 255×40, título 16/600, ações 28×28.
- **Painel direito "Personalizar visualização"** (medido): `cu-views-sidebar` 320×737 colado à direita (x 1593), `position:absolute z:702`, fundo branco, borda esquerda 1px `#E8E8E8`, sombra 3 (`0 4px 6px -1px, 0 2px 4px -2px` a 10,6%).
  Cabeçalho: título 14/600 + botão fechar 24×24 (pílula, fundo preto 6%). Corpo rola. Linha "avatar da visualização" 32×32 (ícone do tipo 16 numa caixa de borda 1px `#E8E8E8`, raio 8) + campo de nome editável 259×32 (raio 6, borda 1px).
  **Grupos** (`fieldset` com `legend` cinza 12 `#838383`): "Layout da página", "Configurações de visualização de filtros", "Visualizar configurações de acesso", "Ações da visualização padrão"; separador `hr` 1px `#E8E8E8` com margem 8 0.
  **Linha de interruptor** (`field-switch`): 303×28, padding 4 12, raio 7; rótulo 14, interruptor à direita **24×14** (raio total, borda 2px; ligado = fundo/borda da cor do tema `#12A594`, bola branca 10×10 à direita; desligado = `#8D8D8D`, bola à esquerda); ícone opcional 16 à esquerda.
  **Linha de botão** (`field-button`): 303×28, padding 6 12, gap 12, raio 7; ícone 16 `#838383` + rótulo 14 + rótulo secundário 12 `#838383` ("3 exibido", "Nenhum", "Status", "Recolhidas") + seta 16.
- **Botão "+ Tarefa"**: 24 de altura, fundo da cor do tema, texto 12/500 branco, raio 6 0 0 6 + seta separada (raio 0 6 6 0), padding 0 5, gap 4.
- **Cabeçalho de grupo de status**: chip 20 de altura, raio 6, padding 2 6 2 4, texto 12/500 maiúsculo.
- **Cabeçalho de coluna**: 32 de altura, 12/500 `#838383`. **Linha de tarefa**: 35–36 de altura, nome 14/500, células com padding 0 12.
- **Interruptor, linha de campo, menu e modal**: ver os arquivos de estado; menus usam fundo branco, raio 8–12, anel + elevação 3–4; modais, raio 16 e elevação 5.

## O que ainda não foi capturado
- Estados da **tarefa aberta** (status, datas, prioridade, menu "…"): a tarefa de teste usada não abriu mais (a lista de teste parece ter sido apagada). A estrutura da tarefa aberta está em `tarefa-aberta.md`.
- **Configurações do workspace** (Geral, Pessoas, Espaços…), menu do espaço e da pasta, criar tarefa (modal), editor de documento e quadro branco em uso, construtor de formulário, Painéis por dentro (plano pago).
- **Hover/foco/desabilitado** de cada botão (só o estado de repouso foi medido).
- **Código-fonte, ícones e imagens**: por escolha, não copiados.
