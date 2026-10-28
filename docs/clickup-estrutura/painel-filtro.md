# Estrutura renderizada — Estado — painel Filtros

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 153 · linhas do esboço: 65
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
div [0,0 1920×903] {pos:absolute z:1000 c:#202020 fs:13px fw:400 lh:13px cur:default}
div [0,0 1920×0] {c:#202020 fs:13px fw:400 lh:13px cur:default}
  div [0,0 0×0] {d:flex pos:absolute z:1000}
    div.cu-filter-value-list-dropdown__menu-filters.cu-dropdown__menu.cu-hidden-print [1020,199 640×178] {pos:absolute bg:#ffffff rad:12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 z:1000}
      div.cu-filter-value-list-dropdown__menu [1020,199 640×178] (data-test=filter-value-list-dropdown__menu-body) {p:15px}
        header.cu-filter-value-list-dropdown__header [1035,214 610×24] {d:grid cols:489.828px 120.172px}
          h2.cu-filter-value-list-dropdown__title [1035,214 490×24] {d:flex pos:relative ai:center gap:4px z:10 fs:14px fw:500 lh:16.002px}
            span.cu-filter-value-list-dropdown__title-text [1035,218 41×16] "filtros"
            cu3-icon.cu3-icon.cu-filter-value-list-dropdown__info [1080,220 12×12] {d:flex ai:center jc:center c:#838383 fs:12px lh:13.716px}
          div.cu-filter-value-list-dropdown__header-controls [1525,214 120×24] {d:flex ai:center gap:4px}
            cu-saved-filter-button [0,0 0×0] {d:contents}
              cu3-picker-field.cu3-picker-field.outlined.small [1525,214 120×24] (role=combobox data-test=filter-value-list-dropdown__templates haspopup=menu expanded=false) {d:flex pos:relative ai:center gap:4px p:3px 8px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:6px fs:14px lh:16.002px cur:pointer}
                div.picker-content [1534,218 84×16] {d:flex ai:center gap:4px wrap:wrap}
                  span [1534,218 84×16] "Filtros salvos"
                cu3-icon.cu3-icon.trailing-icon [1622,219 14×14] {d:flex ai:center jc:center c:#8d8d8d}
        cu-filter-value-list.cu-filter-value-list [1035,238 610×124] (data-test=filter-value-list-dropdown__menu-body-in) {d:grid ai:center gap:8px p:8px 0px 0px cols:75px 527px}
          div.cu-filter-value-list__group.cu-filter-value-list__value_full-width [1035,246 610×76] (data-test=filter-value-list__group) {p:8px bg:#000000/0.024 rad:8px}
            cu-filter-value-list.cu-filter-value-list [1043,254 594×60] {d:grid ai:center gap:8px cols:75px 511px}
              cu-filter-value.cu-filter-value.cu-filter-value-list__value_full-width [1043,254 594×32] (data-test=filter-row) {d:flex ai:center jc:space-between gap:normal 4px}
                cu-filter-field-selector.cu-filter-value__title [1043,256 143×28] (data-test=filter-value__dropdown_type) {d:flex ai:center}
                  div.cu-filter-field-selector.cu-dropdown_left.cu-dropdown [1043,256 143×28] (data-test=filter-value-add-dropdown) {pos:relative}
                    cu-filter-trigger.cu-dropdown__toggle.cu-filter-trigger__menu-open [1043,256 143×28] (role=button label=Menu suspenso data-test=filter-value-add-dropdown__toggle expanded=true) {cur:pointer}
                      button.cu-filter-trigger.cu-filter-trigger-form-field [1043,256 143×28] {d:inline-flex ai:center jc:flex-start gap:4px p:0px 7px bg:#ffffff bt:1px solid #bbbbbb bb:1px solid #bbbbbb bl:1px solid #bbbbbb br:1px solid #bbbbbb rad:7px fs:14px lh:16px}
                        span.cu-filter-trigger__placeholder [1051,262 101×16] "Selecionar filtro" {ov:hidden c:#8d8d8d}
                        cu3-icon.cu3-icon.cu-filter-trigger__chevron [1163,262 16×16] {d:flex ai:center jc:center m:0px -1px 0px 6.35938px c:#646464 fs:16px lh:18.2857px}
                button.cu-filter-value__clear [1605,254 32×32] (data-test=filter-value__clear) {d:flex ai:center jc:center gap:4px rad:8px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                  cu3-icon.cu3-icon [1613,262 16×16] {d:flex ai:center jc:center}
                  span [1019,270 1×1] "Limpar filtro" {pos:absolute m:-1px ov:hidden}
              div.cu-filter-value-list__container [1043,294 594×20] {d:flex ai:center gap:8px}
                button [1043,294 157×20] "Adicionar filtro agrupado" (data-test=filter-value-list__add_filter) {d:flex ai:center jc:center gap:2px p:0px 6px rad:5px c:#646464 fs:12px fw:500 lh:16px cur:pointer}
          div.cu-filter-value-list__container [1035,330 610×32] {d:flex ai:center gap:8px}
            button [1035,330 137×32] "Adicionar filtro" (data-test=filter-value-list__add_group) {d:flex ai:center jc:center gap:4px p:0px 11px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:8px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
              cu3-icon.cu3-icon [1043,338 16×16] {d:flex ai:center jc:center m:0px 0px 0px -4px fs:16px lh:18.2857px}
div [0,0 1920×903] {pos:absolute z:1000 c:#202020 fs:13px fw:400 lh:13px cur:default}
div [0,0 1920×0] {c:#202020 fs:13px fw:400 lh:13px cur:default}
  div [0,0 0×0] {d:flex pos:absolute z:1000}
    cu3-combo-box.cu3-combo-box.cu-dropdown__menu.cu-hidden-print [1043,292 210×341] (role=combobox data-test=filter-value-add-dropdown__filter-list) {pos:absolute p:8px 0px bg:#ffffff rad:12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 ov:hidden auto z:1000}
      div.menu-header-container [1043,300 210×37] {d:flex dir:column gap:8px p:0px 8px 8px m:0px 0px 8px bb:1px solid #f0f0f0}
        label [1051,300 194×28]
          cu3-text-field.menu-search.compact.cu3-text-field [1051,300 194×28] (data-test=combo-box__search-input type=text) {d:inline-flex ai:center gap:6px p:5px 5px 5px 7px bg:#fcfcfc bt:1px solid #12a594 bb:1px solid #12a594 bl:1px solid #12a594 br:1px solid #12a594 rad:7px sh:#c7ebe5 0px 0px 0px 2px cur:text}
            input.input.cu-prevent-lastpass [1059,306 154×16] (label=Pesquisar... type=text placeholder=Pesquisar...) {ov:clip fs:14px lh:16.002px}
      cdk-virtual-scroll-viewport.cu-filter-field-selector__body [1043,345 210×280] (data-test=filter-value-add-dropdown__body) {pos:relative}
        div [1043,345 199×504] {pos:absolute}
          cu-filter-field-option [0,0 0×0] {d:contents}
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item.cu-filter-field-option [1051,345 183×28] (role=option data-test=filter-value-add-dropdown__item-Status type=select) {d:flex gap:2px 8px p:6px 8px m:0px 8px bg:#000000/0.06 rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [1059,351 16×16] {d:flex ai:center jc:center fs:16px lh:18.288px}
              span.label [1083,351 143×16]
                span.cu-filter-field-option-title [1083,351 143×16] {d:flex ai:center}
                  span.cu-filter-field-option-title-text [1083,351 41×16] "Status" {m:0px 101.578px 0px 0px ov:hidden}
            ↳ (este bloco se repete ×14; último em y=0)
          cu-filter-field-option [0,0 0×0] {d:contents}
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item.cu-filter-field-option [1051,737 183×28] (role=option data-test=filter-value-add-dropdown__item-Localiza type=select) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [1059,743 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:18.288px}
              span.label [1083,743 143×16]
                span.cu-filter-field-option-title [1083,743 143×16] {d:flex ai:center}
                  span.cu-filter-field-option-title-text [1083,743 111×16] "Localização/Lista" {m:0px 14.2656px 0px 0px ov:hidden}
                  cu3-icon.cu3-icon.cu-filter-field-selector__item-location-icon [1212,744 14×14] {d:flex ai:center jc:center m:0px 0px 0px 4px c:#646464}
          cu-filter-field-option [0,0 0×0] {d:contents}
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item.cu-filter-field-option [1051,765 183×28] (role=option data-test=filter-value-add-dropdown__item-Recorrên type=select) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [1059,771 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:18.288px}
              span.label [1083,771 143×16]
                span.cu-filter-field-option-title [1083,771 143×16] {d:flex ai:center}
                  span.cu-filter-field-option-title-text [1083,771 77×16] "Recorrência" {m:0px 65.8281px 0px 0px ov:hidden}
            ↳ (este bloco se repete ×3; último em y=0)
        div [1043,345 199×784]
```
