# Estrutura renderizada — Estado — menu do perfil

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 136 · linhas do esboço: 63
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
div [0,0 1920×903] {pos:fixed z:1000 c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
  div [0,0 1920×903] {pos:absolute z:1000}
  div [0,0 1920×0]
    div [0,0 0×0] {d:flex pos:absolute z:1000}
      cu3-menu.cu3-menu.cu-dropdown__menu_fixed-width.cu-dropdown__menu_padding-top-bottom [1624,42 288×803] (role=menu data-test=user-main-settings-menu__dropdown-menu-o) {pos:absolute p:8px 0px bg:#ffffff rad:12px 8px 12px 12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 ov:hidden auto z:1000}
        div.menu-header.menu-header-v4 [1632,50 272×42] {d:flex ai:center p:0px 0px 0px 4px m:0px 8px 8px rad:8px}
          cu-user-avatar-picker-dropdown [1636,55 32×32]
            button.no-border.toggle.cu-dropdown [1636,55 32×32] (role=button label=Alterar avatar expanded=false) {pos:relative rad:666px fs:13.3333px lh:normal cur:pointer}
              cu-online-avatar [1636,55 32×32]
                cu3-avatar.cu3-avatar [1636,55 32×32]
                  div.user-bg-black.avatar.has-image [1636,55 32×32] (label=Fabricio Saraiva, , online data-test=avatar-removal-block) {d:flex pos:relative ai:center jc:center bg:#202020 bgimg:url("https://attachments.clickup.com/profilePictures/49188670_WiC.jpg" rad:666px c:#ffffff fs:14px fw:700 ls:-0.15px}
                    img.foreground-image-preloader [1652,71 1×1] {pos:absolute ov:clip}
                    cu-online-offline-indicator [1652,71 0×0]
                      cu3-icon.cu3-icon.status-indicator [1658,77 12×12] {pos:absolute z:1 fs:12px}
          cu3-menu-item.cu3-menu-item.menu-header-profile [1668,49 236×44] (role=menuitem data-test=user-main-settings-menu__profile) {d:flex gap:2px 8px p:6px 8px 6px 12px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
            span.label [1680,55 216×32] {d:flex ai:center jc:space-between}
              div.user-info-container [1680,55 105×32] {ov:hidden}
                div.user-name.truncate [1680,55 105×16] "Fabricio Saraiva" {ov:hidden fw:500}
                div.user-status.truncate [1680,71 105×16] "On-line" {ov:hidden c:#838383 fs:12px lh:16.008px}
              span.menu-header-profile-label [1849,59 47×24] "Perfil" {d:flex ai:center p:0px 7px bg:#000000/0.06 rad:24px c:#646464 fs:12px fw:500 lh:13.716px}
        div.set-status-field [1632,100 272×28] {pos:relative m:0px 8px 8px}
          button.set-status-button [1632,100 272×28] (role=menuitem data-test=user-main-settings-menu__set-status-butt type=button) {d:inline-flex ai:center jc:center gap:8px p:5px 7px bg:#fcfcfc bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:8px c:#646464 fs:14px lh:16px cur:pointer}
            cu3-icon.cu3-icon.set-status-button-icon [1640,106 16×16] {d:flex ai:center jc:center c:#8d8d8d fs:16px lh:18.2857px}
            span.set-status-button-status.placeholder [1664,106 232×16] "Configurar status" {ov:hidden c:#8d8d8d}
        cu-user-status-timer-picker-dropdown [1624,136 288×28] (role=menuitem)
          div.cu-dropdown [1624,136 288×28] {pos:relative}
            cu3-menu-item.cu3-menu-item.mute-notifications-toggle.cu-dropdown__toggle [1632,136 272×28] (role=button label=Menu suspenso data-test=user-status-timer-picker-dropdown__pause expanded=false) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [1640,142 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
              span.label [1664,142 208×16] "Silenciar notificações"
              cu3-icon.cu3-icon.expand-icon [1880,142 16×16] {d:flex ai:center jc:center c:#8d8d8d fs:16px lh:18.288px}
        hr.user-main-settings-menu-separator [1624,172 288×1] {m:8px 0px bt:1px solid #f0f0f0 ov:hidden c:#808080}
        cu3-menu-item.cu3-menu-item [1632,181 272×28] (role=menuitem data-test=dropdown-list-item__Configurações) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          cu3-icon.cu3-icon.icon [1640,187 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
          span.label [1664,187 232×16] "Configurações"
          ↳ (este bloco se repete ×4; último em y=271)
        cu3-menu-item.cu3-menu-item [1632,301 272×28] (role=menuitem data-test=dropdown-list-item__Baixar a ClickUp) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          cu3-icon.cu3-icon.icon [1640,307 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
          span.label [1664,307 232×16]
            span.user-main-settings-menu-item [1664,307 232×16] "Baixar a ClickUp" {d:flex}
              cu3-icon.cu3-icon.end-row-icon [1880,307 16×16] {d:flex ai:center jc:center m:0px 0px 0px 110.688px c:#8d8d8d fs:16px lh:18.288px}
        cu3-menu-item.cu3-menu-item.menu-pin [1632,331 272×28] (role=menuitem data-test=dropdown-list-item__Ajuda) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          cu3-icon.cu3-icon.icon [1640,337 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
          span.label [1664,337 232×16] "Ajuda" {pos:relative}
            button.bug-report-button.menu-pin-button [1876,333 24×24] (data-test=user-main-settings-menu__bug-report-butt) {d:flex pos:absolute ai:center jc:center gap:4px p:1px 0px 0px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px}
              cu3-icon.cu3-icon.bug-report-button-icon [1880,338 16×16] {d:flex ai:center jc:center c:#8d8d8d}
              span [1876,345 1×1] "Relatar um erro" {pos:absolute m:-1px ov:hidden}
        hr.user-main-settings-menu-separator [1624,367 288×1] {m:8px 0px bt:1px solid #f0f0f0 ov:hidden c:#808080}
        cu3-menu-heading.cu3-menu-heading [1624,376 288×28] "Ferramentas pessoais" {d:flex ai:center p:6px 20px 6px 16px c:#838383 fs:12px fw:500 lh:16.008px}
        cu3-menu-item.cu3-menu-item.menu-pin [1632,404 272×28] (role=menuitem data-test=dropdown-list-item__Criar tarefa) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          cu3-icon.cu3-icon.icon [1640,410 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
          span.label [1664,410 232×16] "Criar tarefa" {pos:relative}
            button.menu-pin-button [1872,406 24×24] (data-test=dropdown-list-item__pin-button-pinned) {d:flex pos:absolute ai:center jc:center gap:4px rad:6px c:#bbbbbb fs:16px fw:500 lh:21.3333px cur:not-allowed}
              cu3-icon.cu3-icon [1876,410 16×16] {d:flex ai:center jc:center}
              span [1872,418 1×1] "Soltar" {pos:absolute m:-1px ov:hidden}
          ↳ (este bloco se repete ×12; último em y=734)
        hr.user-main-settings-menu-separator [1624,770 288×1] {m:8px 0px bt:1px solid #f0f0f0 ov:hidden c:#808080}
        cu3-menu-item.cu3-menu-item [1632,779 272×28] (role=menuitem data-test=dropdown-list-item__Lixo) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          cu3-icon.cu3-icon.icon [1640,785 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
          span.label [1664,785 232×16] "Lixo"
        cu3-menu-item.cu3-menu-item [1632,809 272×28] (role=menuitem data-test=dropdown-list-item__Sair) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          cu3-icon.cu3-icon.icon [1640,815 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
          span.label [1664,815 232×16] "Sair"
cu-page-modal [0,903 0×0] {c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
```
