# Estrutura renderizada — Estado — menu Mostrar tarefas fechadas

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 169 · linhas do esboço: 134
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
cu-save-view-menu.cu-save-view-menu [1450,167 145×24] {d:flex ai:center c:#202020 fs:13px fw:400 lh:13px cur:default}
  button.save-view-button__button [1450,167 125×24] (data-test=save-view-menu__save-button) {d:flex pos:relative ai:center jc:center gap:4px p:0px 7px bg:#ffedd5 bt:1px solid #ffd3a4 bb:1px solid #ffd3a4 bl:1px solid #ffd3a4 rad:6px 0px 0px 6px c:#99543a fs:12px fw:500 lh:16px cur:pointer}
    span [1458,171 110×16] "Salvar visualização"
  button.save-view-button__menu-button [1575,167 20×24] (role=button label=Abrir menu para salvar visualização data-test=save-view-menu__button type=button haspopup=menu expanded=false) {d:flex ai:center jc:center gap:4px p:4px 3px bg:#ffedd5 bt:1px solid #ffd3a4 bb:1px solid #ffd3a4 bl:1px solid #ffd3a4 br:1px solid #ffd3a4 rad:0px 6px 6px 0px c:#99543a fs:12px fw:500 lh:16px cur:pointer}
    cu3-icon.cu3-icon.save-view-button__chevron [1579,173 12×12] {d:flex ai:center jc:center}
cu-view-setting-separator.cu-save-view-menu__separator [1599,171 9×16] {c:#202020 fs:13px fw:400 lh:13px cur:default}
  div.view-setting-separator [1603,171 1×16] {m:0px 4px bl:1px solid #e8e8e8}
button.toggle__clear [1665,168 22×22] (data-test=view-setting-toggle-clear) {d:flex pos:absolute ai:center jc:center gap:4px p:0px 11px bg:#ffffff rad:666px ov:hidden c:#646464 fs:14px fw:500 lh:16px cur:pointer}
  cu3-icon.cu3-icon [1668,171 16×16] {d:flex pos:relative ai:center jc:center z:1 c:#067a6f fs:16px lh:18.2857px}
  span [1664,179 1×1] "Ocultar rapidamente tarefas fechadas" {pos:absolute m:-1px ov:hidden}
cu-list-view-divisions [321,215 1592×144] {c:#202020 fs:13px fw:400 lh:13px cur:default}
  cu-drop-area-to-create [321,215 1592×144] {pos:relative}
    div.drop-area [321,215 1592×144]
      cu-list-group.cu-list-group.cu-list-group_list-view-v3.cu-list-group_single-list [321,215 1592×144] (data-test=dashboard-table-list-group__body)
        cu-task-list.cu-task-list.cu-task-list__outer.cu-task-list-v3 [321,215 1592×144] (data-test=list-view-divisions__task-list__✴️ a faz) {pos:sticky fs:0px lh:0px}
          cu-task-list-header.cu-task-list-header.cu-task-list-header_list-view-v3.cu-task-list-header_selected-view-options [321,215 1592×72] (data-test=task-list-header__task-group-and-count) {pos:sticky p:8px 0px 0px m:0px 0px 1px bg:#ffffff z:20}
            div.cu-task-list-header__row [321,223 1592×32] {d:flex pos:relative ai:center p:0px 48px}
              div.cu-task-list-header__row-inner [369,227 124×24] {d:flex pos:sticky ai:center}
                button.cu-task-list-header__collapse-all [337,227 24×24] (data-test=task-list__group-toggle) {d:flex ai:center jc:center gap:4px m:0px 8px 0px -32px rad:6px c:#838383 fs:16px fw:500 lh:21.3333px cur:pointer}
                  cu3-icon.cu3-icon [341,231 16×16] {d:flex ai:center jc:center}
                  span [368,239 1×1] "Recolher grupo" {pos:absolute m:-1px ov:hidden}
                div.cu-task-list-header__item-label-body-inner [369,229 124×20] {d:flex ai:center}
                  cu-status-group-header.cu-status-group-header.reskin-enabled [369,229 96×20] {d:flex pos:relative ai:center p:2px 6px 2px 4px m:0px 8px 0px 0px bg:#ffffff rad:6px}
                    cu-status-group-indicator.cu-status-group-header__icon [373,231 16×16] {m:0px 2px 0px 0px}
                      cu-status-indicator [373,231 16×16]
                        div.cu-status-indicator-wrapper [373,231 16×16] {d:grid pos:relative ai:center}
                          div.cu-status-indicator.open.status-badge [373,231 16×16] {d:grid pos:absolute ai:center cols:16px}
                            cu3-icon.cu3-icon.status-indicator-icon [373,231 16×16] {d:flex ai:center jc:center c:#000000/0.875 fs:16px lh:16px}
                            div.status-indicator-body [377,235 8×8] {pos:relative rad:666px ov:hidden}
                              div.status-indicator-percentage [381,235 8×8] {pos:absolute z:1}
                    span.cu-status-group-header__label [391,231 68×16] "✴️ a fazer" {ov:hidden c:#000000/0.875 fs:12px fw:500 lh:16.008px cur:text}
                  div.cu-group-header__task-count [480,231 6×16] "1" (data-test=group-header__task-count) {m:0px 7px c:#838383 fs:12px fw:500 lh:16.008px}
            div.cu-task-list-header__row [321,255 1592×32] {d:flex pos:relative ai:center p:0px 48px}
              div.cu-task-list-header__item.cu-task-list-header__item_main [369,255 952×32] {d:flex pos:sticky ai:center z:35}
                cu-task-list-header-toggle.cu-task-list-header__row-toggle-container [321,255 48×32] {d:flex pos:absolute ai:center p:0px 0px 0px 25px bg:#ffffff z:45}
                cu-task-list-header-field.cu-task-list-header-field.cu-task-list-header__item_main.cu-task-list-header__item [369,255 952×32] (data-test=task-list-header-field) {d:flex pos:sticky ai:center z:35 cur:pointer}
                  div.cu-task-list-header__resizer.cu-task-list-header__resizer_right [1314,255 14×32] (data-test=list-view-column-resize-handler) {pos:absolute z:10 cur:col-resize}
                  cu-dropdown-list.cu-dropdown-list.cu-task-list-header-field__item [369,255 952×32]
                    div.cu-dropdown [369,255 952×32] {pos:relative}
                      div.cu-dropdown__toggle [369,255 952×32] (role=button expanded=false)
                        cu-editable.cu-editable [369,255 952×32] {pos:relative}
                          div.cu-task-list-header-field__title [369,255 952×32] (data-test=task-list-header-field__title) {d:flex ai:center jc:flex-start p:0px 12px 0px 4px}
                            div.cu-task-list-header-field__title-text [373,263 34×16] "Nome" (data-test=task-list-header-field__title-text) {ov:hidden c:#838383 fs:12px fw:500 lh:16.008px}
              div.cu-task-list-header__items.widget-no-drag-area [1321,255 480×32] {d:flex ai:center}
                cu-task-list-header-field.cu-task-list-header-field.cu-task-list-header__item.cu-task-list-header-field_list-view-v3 [1321,255 160×32] {d:flex pos:relative ai:center cur:pointer}
                  div.cu-task-list-header__resizer.cu-task-list-header__resizer_right [1474,255 14×32] (data-test=list-view-column-resize-handler) {pos:absolute z:10 cur:col-resize}
                  div.cu-dropdown [1321,271 0×0] {pos:relative}
                    div.cu-dropdown__toggle [1321,271 0×0] (role=button label=Menu suspenso expanded=false)
                  cu-dropdown-list.cu-dropdown-list.cu-task-list-header-field__item [1321,255 160×32]
                    div.cu-dropdown [1321,255 160×32] {pos:relative}
                      div.cu-dropdown__toggle [1321,255 160×32] (role=button expanded=false)
                        cu-editable.cu-editable [1321,255 160×32] {pos:relative}
                          div.cu-task-list-header-field__title [1321,255 160×32] (data-test=task-list-header-field__title) {d:flex ai:center p:0px 12px}
                            div.cu-task-list-header-field__title-text [1333,263 73×16] "Responsável" (data-test=task-list-header-field__title-text) {ov:hidden c:#838383 fs:12px fw:500 lh:16.008px}
                  ↳ (este bloco se repete ×3; último em y=255)
              cu-task-list-header-settings.cu-task-list-header-settings.cu-task-list-header-settings_list-view-v3 [1801,259 64×24] {d:flex pos:sticky ai:center jc:flex-end z:30}
                div.cu-dropdown [1801,259 64×24] {pos:relative}
                  div.cu-task-list-header-settings__toggles [1801,259 64×24] {d:flex gap:4px}
                    button.cu-task-list-header-settings__add-button.cu-dynamic-ui-exp--status-engaged.widget-no-drag-area [1821,259 24×24] (data-test=task-list-header-settings__add-column-in) {d:flex ai:center jc:center gap:4px m:0px 20px rad:6px c:#838383 fs:16px fw:500 lh:21.3333px cur:pointer}
                      cu3-icon.cu3-icon [1825,263 16×16] {d:flex ai:center jc:center}
                      span [1800,271 1×1] "Explorar campos e colunas" {pos:absolute m:-1px ov:hidden}
          div.cu-task-list__header-border [369,286 1496×1] {pos:sticky m:-2px 48px 1px bg:#f0f0f0 z:19}
          div.cu-task-list__rows.cu-task-list__rows_drop.cu-lazy-renderer_contain-layout [321,288 1592×35] (data-test=task-list__rows)
            cu-task-row.cu-task-row.cu-task-row_list-view-v3.widget-no-drag-area [321,288 1592×35] (data-test=task-list__task-row) {pos:relative cur:pointer}
              div.cu-task-row__container.row-menu-only-on-hover [321,288 1592×35] (data-test=task-row__container__Post de teste A) {d:flex p:0px 48px bg:#ffffff}
                div.cu-task-row__toggle-container [321,287 48×36] (data-test=task-row__toggle-container) {pos:sticky m:-1px 0px 0px -48px bg:#ffffff z:35}
                div.cu-task-row__main [369,287 952×36] (data-test=task-row__main) {d:flex pos:sticky ai:center p:1px 4px 1px 28px m:-1px 0px 0px bg:#ffffff bt:1px solid #f0f0f0 bb:1px solid #f0f0f0 z:35}
                  cu-task-row-status-icon [0,0 0×0] {d:contents}
                    cu-task-row-status.cu-task-row__status.cu-task-row-status_dot.cu-task-row-status [397,297 16×16] (data-test=task-row-status__limited-edit-status) {m:0px 12px 0px 0px}
                      div.cu-dropdown [397,297 16×16] {d:flex pos:relative ai:center jc:center}
                        div.percentage-toggle.cu-dropdown__toggle [397,297 16×16] (role=button label=Alterar o status de Post de teste A data-test=task-row-status__percentage-toggle expanded=false) {d:flex ai:center}
                          div [396,305 1×1] "✴️ A FAZER" {pos:absolute m:-1px ov:hidden}
                          cu-status-indicator.cu-task-row-status__status-indicator [397,297 16×16]
                            div.cu-status-indicator-wrapper [397,297 16×16] {d:grid pos:relative ai:center}
                              div.cu-status-indicator.open.status-checkbox [397,297 16×16] {d:grid pos:absolute ai:center cols:16px}
                                cu3-icon.cu3-icon.status-indicator-icon [397,297 16×16] {d:flex ai:center jc:center c:#ffffff fs:16px lh:16px}
                                div.status-indicator-body [401,301 8×8] {pos:relative rad:666px ov:hidden}
                                  div.status-indicator-percentage [405,301 8×8] {pos:absolute z:1}
                      span [368,312 1×1] "Status atual: ✴️ a fazer" {pos:absolute m:-1px ov:hidden}
                  div.cu-task-row__crumbs-wrapper [425,289 892×32] (data-test=cu-task-row__crumbs-wrapper) {d:flex dir:column jc:center}
                    div.cu-task-row__main-editable [425,291 892×29] {pos:relative}
                      cu-editable.cu-editable.cu-task-row-main [425,291 892×29] (data-test=task-row-main) {d:inline-flex pos:relative}
                        cu-task-row-main.cu-task-row-main.cu-task-row-main_list-view-v3.cu-task-row-main_legacy-list-view [425,291 892×29] (data-test=task-row__main) {d:grid cols:892px}
                          a.cu-task-row-main__link [425,291 892×29] (data-test=task-row-main__link draggable=false) {d:flex dir:column ai:center p:4px 0px}
                            div.cu-task-row-main__link-text [425,295 892×21] {d:flex ai:center}
                              span.cu-task-row-main__link-text-inner [420,295 105×21] "Post de teste A" {p:0px 0px 0px 5px m:0px 4px 0px -5px rad:4px ov:hidden fs:14px fw:500 lh:21px}
                div.cu-task-row__placeholder [1321,288 160×35] {d:flex pos:relative}
                  cu-task-row-column-placeholder.cu-task-row__placeholder-content [1321,287 100×36] (data-test=task-row__assignee-placeholder) {d:flex pos:relative ai:center p:0px 12px m:-1px 0px 0px c:#8d8d8d fs:14px lh:16.002px}
                    cu3-icon.cu3-icon.task-row-column-placeholder__icon [1333,297 16×16] {d:flex ai:center jc:center m:0px 8px 0px 0px fs:16px lh:18.288px}
                  ↳ (este bloco se repete ×3; último em y=288)
                div.cu-task-row__fading [1801,288 48×35] {pos:sticky m:0px -48px 0px 0px bgimg:linear-gradient(to right, #000000/0 0%, #ffffff 100%)}
                div.cu-task-row__menu-placeholder [1801,288 64×35] {d:flex ai:center jc:center}
          cu-task-list-dynamic-skeleton-loader [321,323 0×0]
          cu-task-list-footer.cu-task-list-footer.cu-task-list-footer_list-view-v3 [321,322 1592×37] {d:flex pos:relative ai:flex-start p:0px 48px m:-1px 0px 0px z:-1}
            div.cu-task-list-footer__item.cu-task-list-footer__item_main [369,323 952×35] {d:flex pos:sticky bg:#ffffff z:10}
              button.cu-task-list-footer__add.cu-hidden-print [369,323 952×35] (data-test=task-list-footer-quick-task) {d:flex pos:sticky ai:center jc:flex-start p:0px 28px rad:4px fs:13.3333px lh:normal cur:pointer}
                cu3-icon.cu3-icon.cu-task-list-footer__add-plus [397,333 16×16] {d:flex ai:center jc:center m:0px 3px 0px 0px c:#8d8d8d fs:16px}
                span.cu-task-list-footer__add-text [368,329 18×24] "Nova tarefa" (data-test=task-list-footer__add-new-task) {pos:absolute p:0px 8px m:-1px rad:4px ov:hidden c:#8d8d8d fs:12px lh:22px}
              cu-create-task-menu.cu-create-task-menu.cu-task-list-footer__add-dropdown [416,329 145×24] (data-test=create-menu-task__inline) {pos:absolute}
                div.container [416,329 145×24] {d:flex ai:center}
                  button.cu-task-list-footer__add-dropdown-button [416,329 121×24] "Adicionar Tarefa" {d:flex ai:center jc:center gap:4px p:0px 8px bg:#ffffff rad:6px 8px 8px 6px ov:hidden c:#646464 fs:14px lh:18.676px cur:pointer}
                  div.dropdown.cu-dropdown [537,329 24×24] {pos:relative}
                    div.toggle.cu-dropdown__toggle [537,329 24×24] (role=button label=Escolha o tipo de tarefa data-test=create-task-menu-toggle expanded=false) {cur:pointer}
                      button.cu-task-list-footer__add-dropdown-toggle [537,329 24×24] (role=presentation data-test=task-list-footer-inline-menu) {d:inline-flex ai:center jc:center gap:4px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:0px 6px 6px 0px c:#646464 fs:16px fw:500 lh:21.3333px}
                        cu3-icon.cu3-icon [541,333 16×16] {d:flex ai:center jc:center c:#8d8d8d}
                        span [536,341 1×1] "Expandir" {pos:absolute m:-1px ov:hidden}
            div.cu-task-list-footer__items [1321,323 544×35] {d:flex ai:center p:0px 64px 0px 0px}
              cu-task-list-footer-field.cu-task-list-footer-field.cu-task-list-footer__item.cu-task-list-footer-field_disabled [1321,323 160×35] (data-test=task-list-footer-field__assignee)
                div.cu-task-list-footer-field__calc.cu-dropdown [1321,323 160×35] {pos:relative}
                  div.cu-dropdown__toggle.cu-dropdown__toggle_disabled [1321,323 160×35] (role=button label=Menu suspenso expanded=false) {cur:auto}
                    div.cu-task-list-footer-field__value [1321,323 160×35] (data-test=task-list-footer-field__value) {d:flex ai:center p:0px 12px rad:4px cur:not-allowed}
                      div.cu-task-list-footer-field__no-value [1334,333 46×16] "Calcular" {ov:hidden c:#838383 fs:12px lh:16px}
                      cu3-icon.cu3-icon.cu-task-list-footer-field__no-value-chevron [1384,334 14×14] {d:flex ai:center jc:center m:0px 0px 0px 4px c:#838383 fs:14px lh:14px}
                ↳ (este bloco se repete ×3; último em y=323)
          cu-task-list-columns-tracker [321,215 1592×144] {d:flex pos:absolute p:0px 0px 0px 48px z:-1}
            div.fake-column.fake-column_name [369,215 350×144]
            div.fake-column.fake-column_assignee [719,215 160×144]
            div.fake-column.fake-column_dueDate [879,215 160×144]
            div.fake-column.fake-column_priority [1039,215 160×144]
  cu-group-header [321,359 0×0]
div [0,0 1920×903] {d:flex pos:absolute dir:column z:1000 c:#202020 fs:13px fw:400 lh:13px cur:default}
  div [1488,199 200×74] {d:flex pos:absolute z:1000}
    cu-view-show-closed-dropdown [1488,199 200×74]
      cu3-menu.cu3-menu.view-show-closed-dropdown__dropdown.cu3-menu-position-below [1488,199 200×74] (role=menu) {d:grid p:8px 0px bg:#ffffff rad:12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 ov:hidden auto cols:200px}
        cu3-menu-item-toggle.cu3-menu-item [1496,207 184×28] (role=menuitemcheckbox data-test=dropdown-list-item__showClosed checked=true) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          span.label [1504,213 136×16] "Tarefas"
          cu3-switch.switch.switch-only [1648,214 24×14] {pos:relative rad:14px lh:14px}
            button.small [1648,214 24×14] (role=switch data-test=switch__toggle-body type=button checked=true) {pos:relative bg:#12a594 bt:2px solid #12a594 bb:2px solid #12a594 bl:2px solid #12a594 br:2px solid #12a594 rad:666px}
              span.toggle [1660,216 10×10] (data-test=switch__toggle) {pos:absolute bg:#ffffff rad:666px}
        cu3-menu-item-toggle.cu3-menu-item [1496,237 184×28] (role=menuitemcheckbox data-test=dropdown-list-item__showClosedSubtasks checked=false) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          span.label [1504,243 136×16] "Subtarefas"
          cu3-switch.switch.switch-only [1648,244 24×14] {pos:relative rad:14px lh:14px}
            button.small [1648,244 24×14] (role=switch data-test=switch__toggle-body type=button checked=false) {pos:relative bg:#8d8d8d bt:2px solid #8d8d8d bb:2px solid #8d8d8d bl:2px solid #8d8d8d br:2px solid #8d8d8d rad:666px}
              span.toggle [1650,246 10×10] (data-test=switch__toggle) {pos:absolute bg:#ffffff rad:666px}
```
