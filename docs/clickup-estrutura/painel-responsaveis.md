# Estrutura renderizada — Estado — painel Responsáveis

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 28 · linhas do esboço: 28
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
cu-team-users-sidebar.cu-team-users-sidebar.cu-team-users-sidebar_list [321,896 0×0] {c:#202020 fs:13px fw:400 lh:13px cur:default}
  cu2-right-sidebar [321,896 0×0]
    div.cu2-right-sidebar.cu2-right-sidebar_team-users-v3.cu2-right-sidebar_collapsed [1593,159 320×737] (data-test=right-sidebar) {pos:absolute m:-1px 0px 0px bl:1px solid #e8e8e8 sh:#000000/0.106 0px 4px 6px -1px, #000000/0.106 0px 2px 4px -2px z:490}
      div.cu2-right-sidebar__inner [1594,159 319×737] (data-test=v2-right-sidebar__inner) {pos:relative bg:#ffffff ov:hidden}
        cu-team-users-block.cu-team-users-block [1594,159 319×737]
          aside.cu-team-assignees [1594,159 319×737] {d:flex dir:column}
            cu-team-users-header [1594,159 319×88]
              header.cu-team-assignees__header [1594,159 319×80] {p:16px 12px 0px}
                h2.cu-team-assignees__header__title [1606,175 295×24] "Responsáveis" {d:flex ai:center jc:space-between fs:16px fw:600 lh:16px}
                  button.cu-team-assignees__header__close-button [1877,175 24×24] (label=Close) {d:flex ai:center jc:center bg:#000000/0.06 rad:24px c:#646464 fw:400 lh:normal cur:pointer}
                    cu3-icon.cu3-icon.cu-form__dropdown-clear-button-icon [1881,179 16×16] {d:flex ai:center jc:center}
                div.cu-team-assignees__header__search [1606,207 295×32] (data-test=team-users-block__search) {m:8px 0px}
                  cu-search-input.cu-search-input.cu-team-assignees__header__search__field.cu3-form-field__text-field [1606,207 295×32]
                    div.cu-search-input__inner.cu-search-input__inner_focused [1606,207 295×32] (data-test=search-input__inner) {d:flex pos:relative ai:center gap:8px p:7px 6px bg:#ffffff bt:1px solid #12a594 bb:1px solid #12a594 bl:1px solid #12a594 br:1px solid #12a594 rad:6px sh:#c7ebe5 0px 0px 0px 2px cur:pointer}
                      input.cu-search-input__input.cu-prevent-lastpass [1637,215 257×16] (data-test=search-input__input type=text placeholder=Pesquisar por usuário ou equipe) {ov:clip fs:14px lh:16.002px cur:text}
                      cu3-icon.cu3-icon.cu-search-input__icon [1613,215 16×16] {d:flex ai:center jc:center c:#8d8d8d fs:16px lh:16px}
            div.cu-team-assignees__body [1594,247 319×600] {ov:hidden}
              p.cu-team-assignees__empty-message [1612,259 301×42] "Nenhuma tarefa foi atribuída ainda. Defina os responsáveis p" {m:12px 0px 0px 18px c:#838383 fs:14px lh:21px}
            div.cu-team-assignees__footer [1594,847 319×49] {p:8px 12px bt:1px solid #e8e8e8}
              button.cu-team-assignees__footer__button [1606,856 295×32] {d:inline-flex ai:center jc:center gap:4px p:0px 11px rad:8px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                cu3-icon.cu3-icon.cu-team-assignees__footer__button-icon [1618,864 16×16] {d:flex ai:center jc:center m:0px 3px 0px 0px fs:16px lh:18.2857px}
                span.cu-team-assignees__footer__button-text [1641,864 171×16] "Comentários atribuídos" {d:flex ai:center gap:5px}
                  cu3-icon.cu3-icon.cu-team-assignees__footer__button-text__hint [1800,866 12×12] {d:flex ai:center jc:center c:#bbbbbb fs:12px lh:13.7143px}
                cu-toggle-switch.cu-team-assignees__footer__button-toggle [1865,865 24×14] {m:0px 0px 0px 48.625px}
                  label.cu-toggle-switch [1865,865 24×14] (data-test=toggle-switch) {pos:relative cur:default}
                    span [1864,864 1×1] {pos:absolute m:-1px ov:hidden}
                    input.cu-prevent-lastpass [1871,868 13×13] (data-test=toggle-switch-input__false type=checkbox) {m:3px 3px 3px 4px fs:13.3333px fw:400 lh:normal}
                    div.cu-toggle-switch__slider.cu-toggle-switch__round [1865,865 24×14] (data-test=toggle-switch__slider) {pos:absolute bg:#8d8d8d rad:34px cur:pointer}
```
