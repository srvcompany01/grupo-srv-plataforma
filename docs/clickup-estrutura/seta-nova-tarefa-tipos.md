# Estrutura renderizada — Estado — seta do botão + Tarefa (tipos)

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 70 · linhas do esboço: 55
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
div [0,0 1920×903] {pos:fixed z:1000 c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
  div [0,0 1920×903] {pos:absolute z:1000}
  div [0,0 1920×0]
    div [0,0 0×0] {d:flex pos:absolute z:1000}
      div.menu.cu-dropdown__menu_padding-top-bottom.menu_no-pinned-templates [1625,199 280×402] {pos:absolute bg:#ffffff rad:12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 ov:hidden z:1000}
        cu-create-task-menu-dropdown.cu-create-task-menu-dropdown.cu-create-task-menu-dropdown_no-pinned [1625,199 280×402]
          div.task-type-list-container [1625,199 280×284] {p:8px 0px}
            div.section-header [1625,207 269×34] {d:flex ai:center p:8px 16px}
              div.section-header-text [1641,216 28×16] "Criar" {c:#838383 fs:12px fw:500 lh:16.008px}
              button.section-header-button [1820,215 58×18] "Gerenciar" (data-test=create-task-menu-dropdown__manage) {d:flex ai:center jc:center gap:4px m:0px 0px 0px 150.562px c:#0f9d9f fs:12px fw:500 lh:16.008px cur:pointer}
            cu-custom-task-type-list.task-type-list [1625,241 269×283] {d:flex dir:column}
              cu3-combo-box.cu3-combo-box.cu-custom-task-type-list__combo-box [1625,241 267×283] (role=combobox data-test=custom-task-type-list__search-list) {d:flex dir:column p:8px 0px bg:#ffffff rad:12px}
                div.menu-header-container [1625,249 267×37] {d:flex dir:column gap:8px p:0px 6px 8px m:0px 0px 8px bb:1px solid #f0f0f0}
                  label [1631,249 255×28]
                    cu3-text-field.menu-search.compact.cu3-text-field [1631,249 255×28] (data-test=combo-box__search-input type=text) {d:inline-flex ai:center gap:6px p:5px 5px 5px 7px bg:#fcfcfc bt:1px solid #12a594 bb:1px solid #12a594 bl:1px solid #12a594 br:1px solid #12a594 rad:7px sh:#c7ebe5 0px 0px 0px 2px cur:text}
                      input.input.cu-prevent-lastpass [1639,255 215×16] (label=Buscar tipo (por exemplo, Marco) type=text placeholder=Buscar tipo (por exemplo, Marco)) {ov:clip fs:14px lh:16.002px}
                div.cu-custom-task-type-list__scroll-area [1625,294 267×194] {p:8px 0px}
                  cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item.active [1633,302 251×28] (role=option data-test=custom-task-type-list__list-item) {d:flex gap:2px 8px p:6px 8px m:0px 8px bg:#000000/0.06 rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                    cu-custom-task-type-icon.cu-custom-task-type-list__icon [1641,308 16×16] {d:flex jc:center fs:16px lh:18.288px}
                      cu3-icon.cu3-icon.cu-custom-task-type-icon [1641,308 16×16] (data-test=cu-custom-task-type-icon__task) {d:flex ai:center jc:center c:#8d8d8d}
                    span.label [1665,308 211×16] "Tarefa"
                  cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item [1633,332 251×28] (role=option data-test=custom-task-type-list__list-item) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                    cu-custom-task-type-icon.cu-custom-task-type-list__icon [1641,338 16×16] {d:flex jc:center fs:16px lh:18.288px}
                      cu3-icon.cu3-icon.cu-custom-task-type-icon [1641,338 16×16] (data-test=cu-custom-task-type-icon__milestone) {d:flex ai:center jc:center c:#8d8d8d}
                    span.label [1665,338 211×16] "Marco"
                    ↳ (este bloco se repete ×5; último em y=452)
                div.cu-custom-task-type-list__footer [1625,488 267×28] {bg:#ffffff}
                  div.cu-custom-task-type-list__create-button-container.cu-custom-task-type-list__create-button-container_last [1625,488 267×28]
                    cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item [1633,488 251×28] (role=option data-test=custom-task-type-list__create-button) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                      cu3-icon.cu3-icon.icon [1641,494 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:18.288px}
                      span.label [1665,494 211×16] "Criar tipo de tarefa"
          div.footer [1625,483 280×118] {pos:sticky p:0px 0px 8px bg:#ffffff}
            div.cu-dropdown [1625,483 280×37] {pos:relative}
              div.cu-dropdown-list-item__separator [1625,483 280×1] {m:0px 0px 8px bb:1px solid #e8e8e8}
              cu-dropdown-list-item.cu-dropdown-list-item.cu-dropdown__toggle [1633,492 264×28] (role=button label=Menu suspenso expanded=false) {d:flex m:0px 8px cur:pointer}
                button.cu-dropdown-list-item__link-container [1633,492 264×28] (data-test=dropdown-list-item__) {d:flex dir:column p:4px 0px fs:13.3333px lh:normal}
                  div.cu-dropdown-list-item__link.cu-dropdown-list-item__link_.cu-dropdown-list-item__link_v3 [1633,496 264×20] {d:flex ai:center p:0px 8px}
                    cu3-icon.cu3-icon.cu-dropdown-list-item__icon.cu-dropdown-list-item__icon_ [1641,498 16×16] (data-test=dropdown-list-item__icon) {d:flex ai:center jc:center m:-2px 8px -2px 0px c:#838383 fs:16px}
                    div.cu-dropdown-list-item__title [1665,498 204×16] (data-test=dropdown-list-item__title) {d:flex pos:relative ai:center p:0px 5px 0px 0px fs:14px lh:16.002px}
                      div.cu-dropdown-list-item__title-text [1665,498 128×16] "Tarefa de outra lista" (data-test=dropdown-list-item__Tarefa de outra list) {ov:hidden lh:16.1px}
                    cu3-icon.cu3-icon.menu-item-chevron [1873,498 16×16] {d:flex ai:center jc:center m:0px 0px 0px 4px c:#8d8d8d fs:16px}
            div.cu-dropdown-list-item__separator [1625,528 280×1] {m:8px 0px bb:1px solid #e8e8e8}
            cu-dropdown-list-item.cu-dropdown-list-item [1633,537 264×28] {d:flex m:0px 8px cur:pointer}
              button.cu-dropdown-list-item__link-container [1633,537 264×28] (data-test=dropdown-list-item__) {d:flex dir:column p:4px 0px fs:13.3333px lh:normal}
                div.cu-dropdown-list-item__link.cu-dropdown-list-item__link_.cu-dropdown-list-item__link_v3 [1633,541 264×20] {d:flex ai:center p:0px 8px}
                  cu3-icon.cu3-icon.cu-dropdown-list-item__icon.cu-dropdown-list-item__icon_ [1641,543 16×16] (data-test=dropdown-list-item__icon) {d:flex ai:center jc:center m:-2px 8px -2px 0px c:#838383 fs:16px}
                  div.cu-dropdown-list-item__title [1665,543 224×16] (data-test=dropdown-list-item__title) {d:flex pos:relative ai:center p:0px 5px 0px 0px fs:14px lh:16.002px}
                    div.cu-dropdown-list-item__title-text [1665,543 107×16] "Fixar um modelo" (data-test=dropdown-list-item__Fixar um modelo) {ov:hidden lh:16.1px}
            cu-dropdown-list-item.cu-dropdown-list-item [1633,565 264×28] {d:flex m:0px 8px cur:pointer}
              button.cu-dropdown-list-item__link-container [1633,565 264×28] (data-test=dropdown-list-item__browseTemplates) {d:flex dir:column p:4px 0px fs:13.3333px lh:normal}
                div.cu-dropdown-list-item__link.cu-dropdown-list-item__link_browsetemplates.cu-dropdown-list-item__link_v3 [1633,569 264×20] {d:flex ai:center p:0px 8px}
                  cu3-icon.cu3-icon.cu-dropdown-list-item__icon.cu-dropdown-list-item__icon_browsetemplates [1641,571 16×16] (data-test=dropdown-list-item__icon) {d:flex ai:center jc:center m:-2px 8px -2px 0px c:#838383 fs:16px}
                  div.cu-dropdown-list-item__title [1665,571 224×16] (data-test=dropdown-list-item__title) {d:flex pos:relative ai:center p:0px 5px 0px 0px fs:14px lh:16.002px}
                    div.cu-dropdown-list-item__title-text [1665,571 120×16] "Aplicar um modelo" (data-test=dropdown-list-item__Aplicar um modelo) {ov:hidden lh:16.1px}
cu-page-modal [0,903 0×0] {c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
```
