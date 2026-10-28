# Estrutura renderizada — Estado — painel Campos (colunas)

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 411 · linhas do esboço: 88
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
cu-views-sidebar [1593,159 320×737] (data-test=view-sidebar) {pos:absolute z:702 c:#202020 fs:13px fw:400 lh:13px cur:default}
  div.sidebar [1593,159 320×737] {bg:#ffffff bl:1px solid #e8e8e8 sh:#000000/0.106 0px 4px 6px -1px, #000000/0.106 0px 2px 4px -2px ov:hidden}
    cu-views-sidebar-edit-fields-screen [1594,159 319×737] (data-test=view-sidebar__fields-section)
      cu-views-sidebar-screen.widget-no-drag-area.container [1594,159 319×737] (data-test=views-sidebar-edit-fields-screen)
        section.screen.screen_fields [1594,159 319×737] {d:flex dir:column p:12px 0px 0px ov:hidden}
          header.header [1594,171 319×36] {d:flex ai:center gap:8px p:0px 16px 12px}
            h2.title [1610,174 227×18] "Campos" (data-test=views-sidebar-screen-title) {ov:hidden fs:14px fw:600 lh:17.5px}
            div.header-actions [1845,171 52×24] {d:flex ai:center gap:4px}
              button [1845,171 24×24] (data-test=views-sidebar-fields__open-cfm-button type=button) {d:flex ai:center jc:center gap:4px rad:666px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                cu3-icon.cu3-icon [1849,175 16×16] {d:flex ai:center jc:center}
                span [1592,183 1×1] "Abrir gerenciador de campos personalizados" {pos:absolute m:-1px ov:hidden}
              button [1873,171 24×24] (data-test=views-sidebar-screen-close-button) {d:flex ai:center jc:center gap:4px bg:#000000/0.06 rad:666px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                span [1592,183 1×1] "Fechar" {pos:absolute m:-1px ov:hidden}
                cu3-icon.cu3-icon [1877,175 16×16] {d:flex ai:center jc:center}
          div.viewport [1594,207 319×689] {ov:auto hidden}
            cu-view-sidebar-fields-visibility.widget-no-drag-area [1594,207 319×689]
              div.cu-view-sidebar-fields-manage-visibility [1594,207 319×689] (data-test=fields-sidebar__visibility-container) {d:flex dir:column m:0px 0px -8px}
                cu-view-sidebar-fields-search-input [1594,207 319×44]
                  div.cu-view-sidebar-fields-search-input [1594,207 319×44] {p:8px 8px 4px}
                    cu3-text-field.cu-view-sidebar-fields-search-input__text-field.cu3-text-field.main [1602,215 303×32] (data-test=views-sidebar-fields__search-input) {d:inline-flex ai:center gap:8px p:7px 3px 7px 7px bg:#ffffff bt:1px solid #12a594 bb:1px solid #12a594 bl:1px solid #12a594 br:1px solid #12a594 rad:8px sh:#c7ebe5 0px 0px 0px 2px cur:text}
                      input.input.cu-prevent-lastpass [1610,223 291×16] (type=text placeholder=Pesquisar campos de tarefa) {p:0px 4px 0px 0px ov:clip fs:14px lh:16.002px}
                cu-fields-tabs-switcher [1594,251 319×56]
                  div.fields-tabs-switcher__row [1594,251 319×48] {d:flex ai:center gap:4px p:0px 12px m:0px 0px 8px sh:#e8e8e8 0px -1px 0px 0px inset}
                    cu3-tab-group.fields-tabs-switcher.medium [1606,251 295×48] (role=tablist) {d:flex gap:12px}
                      button.medium.tab [1606,251 76×48] (role=tab data-test=fields-sidebar-tab__create-new type=button selected=false) {p:8px 0px 6px bb:2px solid #000000/0 c:#838383 fs:14px fw:500 lh:16.002px cur:pointer}
                        span.tab-label [1606,259 76×32] "Criar novo" {d:flex ai:center gap:4px p:8px 4px rad:8px}
                      button.medium.tab.active [1694,251 158×48] (role=tab data-test=fields-sidebar-tab__add-existing type=button selected=true) {p:8px 0px 6px bb:2px solid #202020 fs:14px fw:500 lh:16.002px cur:pointer}
                        span.tab-label [1694,259 158×32] "Adicionar um existente" {d:flex ai:center gap:4px p:8px 4px rad:8px}
                cu-view-sidebar-fields-visibility-fields-list.has-scrollbar [1594,307 319×589] {pos:relative}
                  div.cu-fields-list__sticky-header-overlay [1594,307 319×30] {pos:absolute z:10}
                    div.cu-fields-list__sticky-header [1594,307 319×30] {p:0px 20px 0px 8px bg:#ffffff}
                      div.cu-fields-list-group [1602,307 291×28]
                        button.cu-fields-list-group__title.cu-fields-list-group__title--collapsible [1602,307 291×28] {d:flex ai:center jc:flex-start gap:4px p:0px 4px 0px 8px rad:6px c:#838383 fs:12px fw:500 lh:16.008px cur:pointer}
                          span.cu-fields-list-group__title-label [1611,313 61×16] "Mostrados"
                          cu3-icon.cu3-icon.cu-fields-list-group__title-collapsible-button-icon [1676,315 14×14] {d:flex ai:center jc:center m:1px 0px 0px fs:14px lh:18.676px}
                          span.cu-fields-list-group__title-count [1876,313 8×16] "4" {m:0px 4px 0px 181.609px}
                  cdk-virtual-scroll-viewport.cu-fields-list__virtual-scroll-viewport [1594,307 319×589] {pos:relative}
                    div [1594,307 308×941] {pos:absolute}
                      div.cu-fields-list__drop-list [1594,307 308×941] {p:0px 0px 8px}
                        div.cu-fields-list__header [1594,307 308×30] {p:0px 8px}
                          div.cu-fields-list-group [1602,307 292×28]
                            button.cu-fields-list-group__title.cu-fields-list-group__title--collapsible [1602,307 292×28] {d:flex ai:center jc:flex-start gap:4px p:0px 4px 0px 8px rad:6px c:#838383 fs:12px fw:500 lh:16.008px cur:pointer}
                              span.cu-fields-list-group__title-label [1611,313 61×16] "Mostrados"
                              cu3-icon.cu3-icon.cu-fields-list-group__title-collapsible-button-icon [1676,315 14×14] {d:flex ai:center jc:center m:1px 0px 0px fs:14px lh:18.676px}
                              span.cu-fields-list-group__title-count [1877,313 8×16] "4" {m:0px 4px 0px 182.609px}
                        div.cu-fields-list__list-item [1594,337 308×30] (data-test=fields-list__list-item) {p:0px 8px}
                          cu-view-sidebar-fields-visibility-field.field [1602,337 292×28] (data-test=fields-list__field-row)
                            cu-field-menu-item.disabled.show-drag-handle [1602,337 292×28] (data-test=fields-list__field-row) {d:flex ai:center gap:8px p:0px 6px 0px 8px bg:#ffffff rad:6px cur:not-allowed}
                              span.field-menu-item__icon-area [1610,343 16×16] {d:flex pos:relative ai:center jc:center}
                                span.field-menu-item__icon [1610,343 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                  cu3-icon.cu3-icon [1610,343 16×16] {d:flex ai:center jc:center}
                              span.field-menu-item__label [1634,343 222×16] "Nome da tarefa" (data-test=field-component__body-item-title) {ov:hidden c:#bbbbbb fs:14px lh:16.002px}
                              span.field-menu-item__toggle [1864,347 24×8]
                                cu3-switch [1864,341 24×14] (data-test=views-sidebar-fields__field-visibility-s) {d:flex m:-6px 0px 0px fs:14px lh:20px}
                                  button.small [1864,344 24×14] (role=switch data-test=switch__toggle-body type=button checked=true) {pos:relative bg:#53b9ab bt:2px solid #53b9ab bb:2px solid #53b9ab bl:2px solid #53b9ab br:2px solid #53b9ab rad:666px}
                                    span.toggle [1876,346 10×10] (data-test=switch__toggle) {pos:absolute bg:#ffffff rad:666px}
                                  label [1888,341 0×14] {d:flex}
                                    span.content [1888,341 0×14] {c:#bbbbbb}
                          ↳ (este bloco se repete ×4; último em y=427)
                        div.cu-fields-list__header.cu-fields-list__header--separate [1594,465 308×39]
                          div.cu-fields-list-group__separator [1594,465 308×1] {m:8px 0px bg:#e8e8e8}
                          div.cu-fields-list-group [1594,474 308×28] {p:0px 8px}
                            button.cu-fields-list-group__title.cu-fields-list-group__title--collapsible [1602,474 292×28] {d:flex ai:center jc:flex-start gap:4px p:0px 4px 0px 8px rad:6px c:#838383 fs:12px fw:500 lh:16.008px cur:pointer}
                              span.cu-fields-list-group__title-label [1611,480 77×16] "Propriedades"
                              cu3-icon.cu3-icon.cu-fields-list-group__title-collapsible-button-icon [1692,482 14×14] {d:flex ai:center jc:center m:1px 0px 0px fs:14px lh:18.676px}
                              span.cu-fields-list-group__title-count [1870,480 15×16] "23" {m:0px 4px 0px 159.703px}
                        div.cu-fields-list__list-item [1594,504 308×30] (data-test=fields-list__list-item) {p:0px 8px}
                          cu-view-sidebar-fields-visibility-field.field [1602,504 292×28] (data-test=fields-list__field-row)
                            cu-field-menu-item [1602,504 292×28] (data-test=fields-list__field-row) {d:flex ai:center gap:8px p:0px 6px 0px 8px bg:#ffffff rad:6px}
                              span.field-menu-item__icon-area [1610,510 16×16] {d:flex pos:relative ai:center jc:center}
                                span.field-menu-item__icon [1610,510 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                  cu3-icon.cu3-icon [1610,510 16×16] {d:flex ai:center jc:center}
                              span.field-menu-item__label [1634,510 222×16] "Comentários" (data-test=field-component__body-item-title) {ov:hidden fs:14px lh:16.002px}
                              span.field-menu-item__toggle [1864,514 24×8]
                                cu3-switch [1864,508 24×14] (data-test=views-sidebar-fields__field-visibility-s) {d:flex m:-6px 0px 0px fs:14px lh:20px}
                                  button.small [1864,511 24×14] (role=switch data-test=switch__toggle-body type=button checked=false) {pos:relative bg:#8d8d8d bt:2px solid #8d8d8d bb:2px solid #8d8d8d bl:2px solid #8d8d8d br:2px solid #8d8d8d rad:666px cur:pointer}
                                    span.toggle [1866,513 10×10] (data-test=switch__toggle) {pos:absolute bg:#ffffff rad:666px}
                                  label [1888,508 0×14] {d:flex cur:pointer}
                                    span.content [1888,508 0×14] {c:#646464}
                          ↳ (este bloco se repete ×23; último em y=1164)
                        div.cu-fields-list__header.cu-fields-list__header--separate [1594,1202 308×39]
                          div.cu-fields-list-group__separator [1594,1202 308×1] {m:8px 0px bg:#e8e8e8}
                          div.cu-fields-list-group [1594,1211 308×28] {p:0px 8px}
                            button.cu-fields-list-group__title.cu-fields-list-group__title--collapsible [1602,1211 292×28] {d:flex ai:center jc:flex-start gap:4px p:0px 4px 0px 8px rad:6px c:#838383 fs:12px fw:500 lh:16.008px cur:pointer}
                              span.cu-fields-list-group__title-label [1611,1217 138×16] "Campos personalizados"
                              cu3-icon.cu3-icon.cu-fields-list-group__title-collapsible-button-icon [1753,1218 14×14] {d:flex ai:center jc:center m:1px 0px 0px fs:14px lh:18.676px}
                              span.cu-fields-list-group__title-count [1879,1217 6×16] "1" {m:0px 4px 0px 108.094px}
                    div [1594,307 308×1114]
```
