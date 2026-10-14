# Auditoria de design da plataforma

Data: 2026-10-07 · Método: métricas medidas no código (`src/`, 9.715 linhas de TSX) e leitura de `globals.css`, `lib/ui.ts` e das telas principais. **Não foi feita inspeção visual no navegador**, então os achados abaixo são estruturais. Eles explicam por que a interface parece sem acabamento, mas não substituem uma passada visual tela a tela.

## Diagnóstico em uma frase
A plataforma já usa shadcn e Radix (boa base), mas **não tem um sistema de design aplicado**: cada tela escolhe tamanhos, cores e raios por conta própria. O resultado é uma interface que "quase" combina, e é isso que dá a sensação de amador.

## Achados (com evidência)

### 1. Tipografia sem escala
- 14 tamanhos diferentes escritos como `text-[Npx]`. Os mais usados: 13px (81x), 12px (78x), 11px (48x), 10px (32x).
- **15 usos de 8px e 9px**, abaixo do legível. 32 usos de 10px.
- Não existe escala nomeada (corpo, legenda, rótulo). Quem escreve a tela escolhe o número.

### 2. Cores fora do sistema
- **47 cores hexadecimais fixas** dentro de componentes (`#87909e`, `#7b68ee`, `#77787d`, `#ececef`, `#292a2d`, `#3b82f6`, `#ae48ca`…). Várias não pertencem à paleta da marca (azul, roxo, magenta).
- **Paletas cruas misturadas:** `rose` 49x, `sky` 11x, `emerald` 10x, `teal` 6x, `orange` 5x. Para erro, sucesso e aviso não há tokens, cada tela usa o tom que quiser.
- **Gambiarra de paleta:** em `globals.css`, `sky`, `teal`, `cyan`, `indigo`, `violet` e `pink` foram redefinidos para virar o vermelho da marca. Então `bg-sky-600` significa "vermelho", o que engana quem lê o código e impede usar azul de verdade quando for preciso (por exemplo, para informação).

### 3. Contraste insuficiente
- `texto-3` (`#838383`) sobre branco tem contraste de cerca de **3,8:1**, abaixo do mínimo de 4,5:1 para texto pequeno (WCAG AA). Esse tom é usado em rótulos de 9 a 11px, exatamente o pior caso.

### 4. Raios, alturas e botões sem regra
- Raios: `rounded-lg` 74x, `rounded-full` 68x, `rounded` 55x, `rounded-xl` 50x, `rounded-md` 50x. Cinco raios competindo, sem uma regra de "controle é X, cartão é Y".
- Alturas de controle: `h-8` 47x, `h-9` 34x, `h-11` 12x, `h-7` 8x, `h-10` 6x. Botões e campos de alturas diferentes lado a lado.
- Dois sistemas de botão: `lib/ui.ts` (`botao*`, em pílula) e `components/ui/button.tsx` (shadcn). Telas usam um ou outro.
- Sombras arbitrárias em 5 lugares.

### 5. Estados de interface ausentes
- **Nenhum `loading.tsx` e nenhum `error.tsx`** em `src/app` (existe só um `not-found` do portal). Uma falha de servidor mostra a tela de erro padrão do Next, como vimos no erro 500 da migration 16.
- Só 3 arquivos usam skeleton ou `animate-pulse`. Telas esperam em branco.
- **12 usos de `confirm()` e `alert()` do navegador** (excluir tarefas, arquivar campo…). É a janela cinza do sistema, o sinal mais claro de sistema sem acabamento.
- Estados vazios existem em alguns pontos (clientes, campos) mas sem componente padrão.

### 6. Estrutura do código de UI
- Arquivos grandes concentram muita coisa: `BarraLateral` (421 linhas), `VisaoLista` (331), `CriadoresNavegacao` (255), `CaixaComentario` (241). Isso dificulta padronizar.
- Muita classe repetida em linha (botões de 8 a 10 utilitários copiados). Quando algo precisa mudar, muda em dezenas de lugares.

## O que está bom e deve ser preservado
- Identidade vermelho, preto e branco, já aprovada.
- Fonte única (Sora) e densidade adequada a ferramenta de produtividade.
- Base shadcn/Radix: menus, diálogos, popovers e abas acessíveis por teclado.
- Barra lateral recolhível e redimensionável, e lista com colunas ajustáveis.

## Plano proposto (cada etapa sobe sozinha e é reversível)

**Etapa 1: tokens (sem mudar o visual de forma perceptível) · esforço M**
1. Escala tipográfica nomeada (legenda 11, rótulo 12, corpo 13, destaque 14…) e piso de **11px**: eliminar 8, 9 e 10px.
2. Tokens semânticos de cor: `perigo`, `sucesso`, `aviso`, `info` (cor forte + fundo suave), e remoção do alias `sky/teal/cyan/indigo/violet/pink`, trocando por `marca-*`.
3. Corrigir contraste: `texto-3` para um cinza que passe de 4,5:1.
4. Regra de raio (controle, cartão, pílula) e de altura de controle (`sm` 32, `md` 36, toque 44).

**Etapa 2: componentes base · esforço M**
5. Unificar botão e campo no `components/ui` (variantes primário, secundário, fantasma, perigo) e aposentar `lib/ui.ts` aos poucos.
6. `ConfirmDialog` próprio no lugar dos 12 `confirm()`.
7. `EstadoVazio`, `Esqueleto` (skeleton) e `Selo` (badge) padrão.

**Etapa 3: estados globais · esforço P**
8. `error.tsx` e `global-error.tsx` com a identidade do app e botão "tentar de novo", `not-found.tsx`, e `loading.tsx` nas rotas principais (lista, tarefa, clientes, config).

**Etapa 4: migrar as telas · esforço G, em lotes**
9. Lista de tarefas e cabeçalho de colunas, tarefa aberta, clientes, configurações, barra lateral. Trocar hexadecimais e paletas cruas pelos tokens.
10. Passada visual no navegador, tela a tela, claro e escuro quando houver.

## Riscos
- **Regressão visual silenciosa:** não há teste visual automatizado. Mitigação: etapas pequenas, conferência no navegador e, se quiser, captura de tela com Playwright antes e depois.
- **Migração de cor:** trocar o alias `sky → vermelho` exige varrer cerca de 30 usos. É mecânico, mas precisa conferência.
