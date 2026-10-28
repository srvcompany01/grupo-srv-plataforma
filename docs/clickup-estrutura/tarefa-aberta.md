# Estrutura renderizada — Tarefa aberta (visão completa)

URL: https://app.clickup.com/t/36949648/17tnw2ba7ya
Nós visíveis: 1198 · linhas do esboço: 984
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
body.cu-os-mac.cu-scrollbar.cu-teal [0,0 1920×903] {d:flow-root bg:#ffffff ov:hidden c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
  app-root [0,0 1920×903]
    cu-app-view.user-is-logged-in [0,0 1920×903]
      cu-route-config-loading-bar [0,0 0×0] {d:contents}
      cu-maintenance-container [0,0 0×0]
      cu-global-actions-bar.cu-hidden-print [0,0 1920×40]
        div.global-actions-bar.draggable [0,0 1920×40] {d:flex ai:center p:0px 6px}
          div.row.draggable [6,4 1908×32] {d:flex ai:center}
            div.left-part.draggable [6,4 774×32] {d:flex ai:center p:0px 4px 0px 0px}
              cu-workspace-picker-toggle.non-draggable [6,6 148×28]
                button.toggle [6,6 148×28] (role=button data-test=workspace-picker-toggle__button type=button haspopup=menu expanded=false) {d:inline-flex ai:center gap:6px p:0px 6px bg:#000000/0.06 rad:6px fs:13.3333px lh:normal cur:pointer}
                  cu3-avatar.cu3-avatar [13,11 18×18]
                    div.space-bg-azure-blue.space-avatar [13,11 18×18] (label=Srv Company, ,  data-test=avatar-removal-block) {d:flex pos:relative ai:center jc:center bg:#0091ff rad:4.5px c:#ffffff fs:11px fw:700}
                      span.avatar-initials [18,14 8×13] "S"
                  span.name [37,12 90×16] "Srv Company" {ov:hidden fs:14px fw:600 lh:16.002px}
                  cu3-icon.cu3-icon.chevron [133,13 14×14] {d:flex ai:center jc:center c:#838383 fs:14px}
              cu-calendar-global-action-bar.non-draggable [154,4 622×32] {d:flex ai:center}
                div.container [154,6 32×28] {d:flex}
                  div._root_87juj_1._layoutV4_87juj_8 [158,6 28×28] {d:flex pos:relative ai:center m:0px 0px 0px 4px}
                    button._root_19al1_6._iconOnly_19al1_165._root_18tku_1 [158,6 28×28] {d:flex pos:relative ai:center gap:4px p:0px 6px rad:6px ov:hidden fs:13.3333px lh:normal cur:pointer}
                      span._root_1a6cr_1._icon_19al1_46 [164,12 16×16] {d:flex pos:relative ai:center jc:center c:#000000/0.447}
            div.stt-search-area.non-draggable [780,6 360×28] {d:flex ai:center}
              cu-search-modal-toggle.search-modal-toggle [780,6 360×28] (data-test=global-actions-bar__search-modal-toggle) {d:flex pos:relative}
                div.wrapper.ai-sidebar-v4 [780,6 360×28] {rad:666px}
                  button.button.search-button [780,6 360×28] (data-test=search-modal-toggle__search-modal) {d:flex pos:relative ai:center jc:flex-start gap:4px p:0px 7px bg:#ffffff rad:666px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px fs:13.3333px lh:normal cur:pointer}
                    cu3-icon.cu3-icon.leading-icon [788,12 16×16] {d:flex pos:relative ai:center jc:center c:#8d8d8d fs:16px fw:500}
                    span.placeholder [808,12 65×16] "Pesquisar" {pos:relative ov:hidden c:#8d8d8d fs:14px fw:500 lh:16px}
                    div.hotkey [877,13 21×15] "⌘ K" {c:#bbbbbb fs:12px fw:500}
            cu-quick-create-modal-toggle [1140,20 0×0]
            div.right-part.draggable [1140,4 774×32] {d:flex ai:center jc:flex-end p:0px 0px 0px 4px}
              cu3-overflow-items.overflow-items [1144,4 724×32] {d:flex jc:flex-end ov:hidden auto}
                cu-pinned-items.pinned-items.draggable [1144,4 724×32] {d:flex ai:center gap:2px}
                  cu3-overflow-items-container.container.cu3-overflow-items-container.cu3-overflow-items-container--align-end [1144,4 724×32] {d:flex pos:relative ai:center jc:flex-end gap:2px p:0px 4px 0px 0px ov:hidden}
                    cu-syncup-global-action-bar.cu-pinned-items-no-drag [1682,20 0×0]
                      div [1682,20 0×0]
                    button.app-task.button.cu-pinned-items-no-drag [1684,8 24×24] (label=Criar tarefa) {d:flex ai:center jc:center gap:4px rad:6px c:#000000/0.447 fs:16px fw:500 lh:21.3333px cur:pointer}
                      cu3-icon.cu3-icon.checkSelect-icon [1688,12 16×16] {d:flex ai:center jc:center}
                    button.app-myTasks.button.cu-pinned-items-no-drag [1710,8 24×24] (label=Meu trabalho) {d:flex ai:center jc:center gap:4px rad:6px c:#000000/0.447 fs:16px fw:500 lh:21.3333px cur:pointer}
                      cu3-icon.cu3-icon.portfolio-icon [1714,12 16×16] {d:flex ai:center jc:center}
                    button.app-notepad.button.cu-pinned-items-no-drag [1736,8 24×24] (label=Bloco de notas) {d:flex ai:center jc:center gap:4px rad:6px c:#000000/0.447 fs:16px fw:500 lh:21.3333px cur:pointer}
                      cu3-icon.cu3-icon.notepad-icon [1740,12 16×16] {d:flex ai:center jc:center}
                    cu-clip-button.cu-pinned-items-no-drag [1762,8 24×24] (data-test=clip-button)
                      cu-recording-setup-dropdown [1762,8 24×24]
                        div.cu-dropdown [1762,8 24×24] {pos:relative}
                          div.cu-dropdown__toggle [1762,8 24×24] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                            button.app-clip.record-button [1762,8 24×24] (label=Gravar um clipe) {d:inline-flex ai:center jc:center gap:4px rad:6px c:#000000/0.447 fs:16px fw:500 lh:21.3333px}
                              cu3-icon.cu3-icon [1766,12 16×16] {d:flex ai:center jc:center}
                    cu-stt-button.cu-pinned-items-no-drag [1788,8 24×24] (data-test=stt-button)
                      div.cu-dropdown [1788,8 24×24] {pos:relative}
                        button.app-talk_to_text.stt-button.cu-dropdown__toggle [1788,8 24×24] (role=button expanded=false) {d:inline-flex ai:center jc:center gap:4px rad:6px c:#000000/0.447 fs:16px fw:500 lh:21.3333px cur:pointer}
                          cu3-icon.cu3-icon [1792,12 16×16] {d:flex ai:center jc:center}
                          span [1787,20 1×1] "Fala para Texto" {pos:absolute m:-1px ov:hidden}
                    button.app-reminder.button.cu-pinned-items-no-drag [1814,8 24×24] (label=Criar lembrete) {d:flex ai:center jc:center gap:4px rad:6px c:#000000/0.447 fs:16px fw:500 lh:21.3333px cur:pointer}
                      cu3-icon.cu3-icon.reminder-icon [1818,12 16×16] {d:flex ai:center jc:center}
                    button.app-docs.button.cu-pinned-items-no-drag [1840,8 24×24] (label=Criar documento) {d:flex ai:center jc:center gap:4px rad:6px c:#000000/0.447 fs:16px fw:500 lh:21.3333px cur:pointer}
                      cu3-icon.cu3-icon.doc-icon [1844,12 16×16] {d:flex ai:center jc:center}
              cu-user-main-settings-menu.non-draggable [1870,4 44×32] {m:0px 0px 0px 2px}
                div.cu-dropdown [1870,4 44×32] {pos:relative}
                  div.user-main-settings-menu__toggle.cu-dropdown__toggle [1870,4 44×32] (role=button label=Menu suspenso data-test=user-main-settings-menu__dropdown-toggle expanded=false) {d:flex ai:center gap:2px p:0px 2px rad:16px cur:pointer}
                    cu-online-avatar.user-main-settings-menu__avatar [1873,8 24×24]
                      cu3-avatar.cu3-avatar [1873,8 24×24]
                        div.user-bg-black.avatar.has-image [1873,8 24×24] (label=Fabricio Saraiva, , online data-test=avatar-removal-block) {d:flex pos:relative ai:center jc:center bg:#202020 bgimg:url("https://attachments.clickup.com/profilePictures/49188670_WiC.jpg" rad:666px c:#ffffff fs:12px fw:700 lh:12px ls:-0.15px}
                          img.foreground-image-preloader [1885,20 1×1] {pos:absolute ov:clip}
                          span.avatar-initials [1885,20 0×0]
                          cu-online-offline-indicator [1885,20 0×0]
                            cu3-icon.cu3-icon.status-indicator [1888,23 11×11] {pos:absolute z:1 c:#fcfcfc fs:11px lh:11px}
                    cu3-icon.cu3-icon.user-main-settings-menu__toggle-chevron [1899,15 10×10] {d:flex ai:center jc:center m:0px 2px 0px 0px c:#838383 fs:10px lh:10px}
      router-outlet [0,40 0×0]
      cu-app-shell [0,40 1920×863]
        router-outlet [0,40 0×0]
        cu-manager.user-is-logged-in [0,40 1920×863]
          div.cu-manager2__container [0,40 1920×863] {d:flex dir:column}
            cu-confetti-celebration.cu-confetti-celebration [0,40 1920×0]
            div.cu-manager2__container-inner [0,40 1920×863] (data-test=manager__container-inner-top) {d:flex dir:column}
              div.cu-manager2__router-outlet [0,40 1920×857] (data-test=manager__body) {d:flex m:0px 0px 6px}
                cu-simple-bar.cu-simple-bar.v3_9.v4 [0,40 64×857] {pos:relative}
                  div.cu-simple-bar__container.sidebar-v3.cu-simple-bar__container_v4 [0,40 64×857] (role=navigation label=Barra lateral) {d:grid pos:relative z:999 cols:64px}
                    div.cu-simple-bar__container-inner [6,40 52×857] {d:grid pos:relative m:0px 6px bgimg:linear-gradient(#067a6f 0%, #0d3d38 100%) rad:8px sh:#000000/0.106 0px 4px 6px -1px, #000000/0.106 0px 2px 4px -2px cols:52px}
                      div.cu-simple-bar__body [6,40 52×742] (data-test=simple-sidebar) {d:flex dir:column ai:center p:0px 0px 6px m:0px 0px -1px}
                        div.cu-simple-bar__body-items [6,40 52×674] {d:flex pos:relative dir:column ai:center}
                          cu-simple-bar-home-switch [6,40 52×190] {d:flex dir:column ai:center p:4px 0px 0px}
                            div.container [16,44 32×62] {d:flex jc:center}
                              cu-simple-bar-item.cu-simple-bar-home-switch__item.home [16,44 32×62] {d:flex pos:relative ai:center jc:center}
                                a.cu-simple-bar-item__link [16,50 32×32] {d:flex pos:relative ai:center jc:center m:6px 0px 24px cur:pointer}
                                  span.cu-simple-bar-item__inner [16,50 32×32] {d:flex ai:center jc:center rad:8px}
                                    cu-simple-bar-item-icon.cu-simple-bar-item__icon [22,56 20×20] {d:flex ai:center jc:center}
                                      cu3-icon.cu3-icon.icon [22,56 20×20] {d:flex ai:center jc:center c:#ffffff fs:20px lh:20px}
                                  span.cu-simple-bar-item__label-container [0,82 64×18] {d:flex pos:absolute jc:center p:0px 6px wrap:wrap}
                                    span.cu-simple-bar-item__label-inner [14,82 31×18] {d:flex}
                                      span.cu-simple-bar-item__label-divider [14,82 5×18]
                                      span.cu-simple-bar-item__label [19,82 26×18] "Início" {pos:relative p:2px 0px 0px ov:hidden c:#ffffff fs:10px fw:600 lh:16px ls:-0.25px}
                                    span.cu-simple-bar-item__label-divider [45,82 5×18]
                              ↳ (este bloco se repete ×3; último em y=168)
                          div.cu-simple-bar__body-pinned-hubs [6,230 52×484] (data-test=simple-bar__body-pinned-hubs) {d:flex dir:column ai:center ov:clip}
                            div.cu-simple-bar__pinned-item-container [6,230 52×62] {d:flex jc:center}
                              div.cu-simple-bar__item-container.cu-simple-bar__item-container_with-flyout [6,230 52×62] {d:grid pos:relative p:0px 7px cols:38px}
                                a.calendar.cu-simple-bar__item [16,236 32×32] {d:flex pos:relative ai:center jc:center m:6px 0px 24px cur:pointer}
                                  span.cu-simple-bar__item-inner [16,236 32×32] {d:flex ai:center jc:center}
                                    span.cu-simple-bar__item-icon-container [16,236 32×32] {d:flex pos:relative ai:center jc:center p:6px rad:8px}
                                      cu-simple-bar-item-icon.cu-simple-bar-item-icon [22,242 20×20] {d:flex ai:center jc:center}
                                        cu3-icon.cu3-icon.icon [22,242 20×20] {d:flex ai:center jc:center c:#ffffff fs:20px lh:20px}
                                    span.cu-simple-bar__item-label-container [3,268 58×18] {d:flex pos:absolute jc:center wrap:wrap}
                                      span.cu-simple-bar__item-label-inner [4,268 56×18] {d:flex}
                                        span.cu-simple-bar__item-label-divider [4,268 5×18]
                                        span.cu-simple-bar__item-label [9,268 51×18] "Planejador" (data-test=simple-bar__item-label) {pos:relative p:2px 0px 0px ov:hidden c:#ffffff fs:10px fw:600 lh:16px ls:-0.25px}
                                      span.cu-simple-bar__item-label-divider [30,286 5×0]
                                    cu-simple-bar-item-live-activity [0,0 0×0] {d:contents}
                                      div.container.dateLabel [26,249 12×9] "28" {pos:absolute bg:#ffffff c:#000000/0 fs:9px fw:800 lh:9px ls:-0.4px}
                            div.cu-simple-bar__pinned-item-container [6,292 52×62] {d:flex jc:center}
                              div.cu-simple-bar__item-container.cu-simple-bar__item-container_with-flyout [6,292 52×62] {d:grid pos:relative p:0px 7px cols:38px}
                                a.cu-simple-bar__item.teams [16,298 32×32] {d:flex pos:relative ai:center jc:center m:6px 0px 24px cur:pointer}
                                  span.cu-simple-bar__item-inner [16,298 32×32] {d:flex ai:center jc:center}
                                    span.cu-simple-bar__item-icon-container [16,298 32×32] {d:flex pos:relative ai:center jc:center p:6px rad:8px}
                                      cu-simple-bar-item-icon.cu-simple-bar-item-icon [22,304 20×20] {d:flex ai:center jc:center}
                                        cu3-icon.cu3-icon.icon [22,304 20×20] {d:flex ai:center jc:center c:#ffffff fs:20px lh:20px}
                                    span.cu-simple-bar__item-label-container [3,330 58×18] {d:flex pos:absolute jc:center wrap:wrap}
                                      span.cu-simple-bar__item-label-inner [8,330 43×18] {d:flex}
                                        span.cu-simple-bar__item-label-divider [8,330 5×18]
                                        span.cu-simple-bar__item-label [13,330 38×18] "Equipes" (data-test=simple-bar__item-label) {pos:relative p:2px 0px 0px ov:hidden c:#ffffff fs:10px fw:600 lh:16px ls:-0.25px}
                                      span.cu-simple-bar__item-label-divider [51,330 5×18]
                              ↳ (este bloco se repete ×8; último em y=726)
                        div.cu-simple-bar__item-dropdown.cu-dropdown [6,714 52×62] {d:flex pos:relative}
                          button.cu-simple-bar__item.cu-simple-bar__item_more.cu-dropdown__toggle [16,720 32×32] (role=button label=Menu suspenso data-test=simple-bar__more expanded=false) {d:flex pos:relative ai:center jc:center m:6px 10px 24px rad:8px c:#ffffff fs:14px fw:500 lh:16px cur:pointer}
                            cu3-icon.cu3-icon.cu-simple-bar__more-icon [23,727 18×18] {d:flex ai:center jc:center fs:18px lh:20.5714px}
                            cu-more-apps-icons.cu-simple-bar__apps [24,728 16×16] {d:grid pos:absolute gap:1px cols:11px 11px}
                              cu-more-apps-icon [24,728 8×8]
                                div.forms.item__icon [24,728 8×8] {d:flex pos:relative ai:center jc:center c:#553ed0 fs:11px lh:12.5714px}
                                  cu3-icon.cu3-icon.icon [24,728 8×8] {d:flex pos:relative ai:center jc:center}
                                ↳ (este bloco se repete ×3; último em y=736)
                              cu3-icon.cu3-icon.add [32,736 8×8] {d:flex pos:relative ai:center jc:center fs:11px lh:12.5714px}
                            span.cu-simple-bar__item-label-container [3,752 58×18] {d:flex pos:absolute jc:center wrap:wrap}
                              span.cu-simple-bar__item-label-inner [16,752 27×18] {d:flex}
                                span.cu-simple-bar__item-label-divider [16,752 5×18]
                                span.cu-simple-bar__item-label [21,752 22×18] "Mais" {pos:relative p:2px 0px 0px ov:hidden fs:10px fw:600 ls:-0.25px}
                              span.cu-simple-bar__item-label-divider [43,752 5×18]
                        div.cu-simple-bar__body-divider [6,776 52×0]
                      div.cu-simple-bar__bottom.cu-simple-bar__bottom-v3 [6,781 52×116] (data-test=simple-bar__bottom) {d:flex pos:relative dir:column ai:center jc:center gap:10px}
                        div.cu-simple-bar__bottom-buttons.cu-simple-bar__bottom-buttons-v3.cu-simple-bar__bottom-buttons-with-upgrade-v3 [6,781 52×116] {d:flex dir:column ai:center jc:space-between gap:8px p:0px 0px 10px c:#646464 fs:20px lh:20px}
                          div.cu-simple-bar__bottom-right-section.cu-simple-bar__bottom-right-section-multi-invite [16,781 32×48] {d:flex dir:column ai:center}
                            cu-invite-upgrade-experiment.cu-simple-bar__bottom-invite-upgrade [16,781 32×48] {pos:relative}
                              div.invite-upgrade-experiment-container [16,781 32×32]
                                cu-invite-button.invite-upgrade-experiment__v3 [16,781 32×32]
                                  button.cu-invite-button__button [16,781 32×32] (data-test=invite-button__sidebar) {d:flex pos:relative ai:center jc:center m:0px 0px 16px rad:8px c:#ffffff lh:normal cur:pointer}
                                    cu3-icon.cu3-icon [22,787 20×20] {d:flex ai:center jc:center}
                                    div.cu-invite-button__button-label [0,812 64×18] "Convidar" {pos:absolute p:2px 10px 0px ov:hidden fs:10px fw:600 lh:16px}
                          cu-simple-bar-upgrade-toggle [0,0 0×0] {d:contents}
                            cu-upgrade-nudge-button [16,837 32×50]
                              button.dynamic-upgrade-button.has-label.cu-dynamic-ui-exp--status-promote-treatment-dynamic [16,837 32×50] (label=Fazer upgrade data-test=dynamic-upgrade-button) {d:flex dir:column ai:center gap:2px fs:13.3333px lh:normal cur:pointer}
                                cu-upgrade-button-icon.theme--color [16,837 32×32] (data-test=dynamic-upgrade-button__icon)
                                  span.upgrade-button-icon [16,837 32×32] {d:inline-flex pos:relative ai:center jc:center rad:8px}
                                span.dynamic-upgrade-button__label [0,871 64×16] "Fazer upgrade" (data-test=dynamic-upgrade-button__label) {pos:relative ov:hidden c:#ffffff fs:10px fw:700 lh:16px}
                main.cu-manager2__body.cu-manager2__body_v4 [64,40 1850×857] {d:flex pos:relative dir:column m:0px 6px 0px 0px}
                  div.cu-manager2__body-container [64,40 1850×857] {d:flex}
                    div.cu-manager2__body-inner-wrapper [64,40 1850×857] (data-test=manager__body-wrapper) {d:flex pos:relative dir:column bg:#f9f9f9 bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:8px sh:#000000/0.055 0px 1px 2px 0px ov:clip}
                      cu-automation-banner [65,41 1848×0]
                      div.cu-manager2__body-inner [65,41 1848×855] {d:flex pos:relative bg:#f9f9f9 ov:clip}
                        cu-nav-sidebar [65,41 256×855]
                          cu-nav-sidebar-container.v4 [0,0 0×0] {d:contents}
                            div.cu-nav-sidebar__container [65,41 256×855] {d:grid pos:relative bg:#f9f9f9 br:1px solid #e8e8e8 z:700 cols:255px}
                              div.cu-nav-sidebar__container-resizer-handle [316,41 9×855] {d:flex pos:absolute jc:center bg:#c7ebe5 z:20 cur:col-resize}
                              div.cu-nav-sidebar__container-sidebar [65,41 255×855] (data-test=nav-sidebar-container) {bg:#f9f9f9}
                                cu-home-sidebar [65,41 255×855] {d:flex pos:relative dir:column}
                                  cu-sidebar-final.home-sidebar.full-height [65,41 255×855] {d:flex dir:column bg:#f9f9f9}
                                    cu-sidebar-header.header [65,41 255×40] {d:grid pos:sticky ai:center p:8px 8px 4px 12px bg:#f9f9f9 z:2 cols:235px lh:28px}
                                      span.sidebar__title [77,53 235×20] "Início" {ov:hidden fs:16px fw:600 lh:20px}
                                      div.sidebar__title-actions [150,49 162×28] (data-test=sidebar-header__title-actions) {d:flex ai:center gap:1px}
                                        a.inbox-header-bell-link.in-viewport [158,49 28×28] {d:flex pos:relative ai:center jc:center gap:4px bg:#f9f9f9 rad:7px c:#838383 fs:16px fw:500 lh:18.2857px cur:pointer}
                                          cu-unseen-notifications-counter.cu-unseen-notifications-counter [185,50 0×0] {pos:absolute}
                                            cu-simple-bar-item-counter.in-header.cu-animations__zoom-in [0,0 0×0] {d:contents}
                                              cu3-counter.cu3-counter.container.notification [185,50 0×0] (role=note) {d:flex pos:absolute z:1}
                                              span [184,49 1×1] "Número de notificações não lidas" {pos:absolute m:-1px ov:hidden}
                                          cu3-icon.cu3-icon.icon-inbox [164,55 16×16] {d:flex ai:center jc:center}
                                          span [158,63 1×1] "Caixa de entrada" {pos:absolute m:-1px ov:hidden}
                                        cu-search-input.cu-search-input.search-input.in-home-sidebar [187,49 28×28] {d:flex bg:#f9f9f9}
                                          div.cu-search-input__inner.cu-search-input__inner_show-label [187,49 28×28] (data-test=search-input__inner) {d:flex pos:relative ai:center jc:flex-end p:6px rad:7px cur:pointer}
                                            input.cu-search-input__input.cu-prevent-lastpass [209,55 0×16] (data-test=search-input__input type=text placeholder=Search sidebar...) {ov:clip fs:14px lh:16px cur:text}
                                            cu3-icon.cu3-icon.cu-search-input__icon [193,55 16×16] {d:flex ai:center jc:center c:#838383 fs:16px}
                                        cu-sidebar-filter.sidebar-filter [216,49 28×28]
                                          button.sidebar-filter [216,49 28×28] (data-test=sidebar-filter__toggle) {d:flex ai:center jc:center gap:4px rad:7px c:#838383 fs:16px fw:500 lh:18.2857px cur:pointer}
                                            cu3-icon.cu3-icon [222,55 16×16] {d:flex ai:center jc:center}
                                            span [215,63 1×1] "Filtrar sua barra lateral" {pos:absolute m:-1px ov:hidden}
                                        cu-collapsed-sidebar.cu-collapsed-sidebar.collapsed-sidebar.in-sidebar [245,49 28×28] {d:flex ai:center}
                                          button.cu-collapsed-sidebar__toggle.cu-collapsed-sidebar__toggle_in-sidebar [245,49 28×28] (label=Fechar barra lateral data-test=collapsed-sidebar__toggle-icon-hover expanded=false) {d:flex ai:center jc:center gap:4px rad:7px c:#838383 fs:16px fw:500 lh:18.2857px cur:pointer}
                                            cu3-icon.cu3-icon [251,55 16×16] (data-test=collapsed-sidebar__toggle-icon-expand-si) {d:flex ai:center jc:center}
                                        cu-sidebar-creation-menu-button [266,49 46×28] (role=button haspopup=menu expanded=false) {d:flex}
                                          button.create-new-items-button.reduced [268,49 44×28] (data-test=sidebar-header__create-items) {d:flex ai:center jc:center gap:4px p:0px 7px m:0px 0px 0px 2px bg:#ffffff rad:7px sh:#000000/0.45 0px 0px 1px 0px, #000000/0.15 0px 1px 3px 0px, #000000/0. fs:14px fw:500 lh:16px cur:pointer}
                                            cu3-icon.cu3-icon.create-new-items-button__icon [274,55 16×16] {d:flex ai:center jc:center m:0px 0px 0px -2px fs:16px lh:18.2857px}
                                            span [64,63 1×1] "Criar" {pos:absolute m:-1px ov:hidden}
                                            cu3-icon.cu3-icon.create-new-items-button__chevron [294,56 14×14] {d:flex ai:center jc:center m:0px -4px 0px 0px c:#838383}
                                    cu-sidebar-filters [0,0 0×0] {d:contents}
                                    cu-sidebar-flat-tree.content.show-new-section-button.full-height [65,81 255×815] (data-test=project-list-bar) {pos:relative p:0px 0px 20px ov:hidden}
                                      cdk-virtual-scroll-viewport.viewport [65,81 255×795] (data-test=project-list-bar__scrollable) {pos:relative bg:#f9f9f9}
                                        div [65,81 244×827] {d:flex pos:absolute dir:column}
                                          cu-tree.tree [65,81 244×827] (role=tree) {d:flex dir:column p:0px 0px 20px ov:hidden}
                                            cdk-tree-node [65,81 244×8] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,81 220×6] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,89 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-special-hub-item-row.special-hub-item-row [73,89 228×28] {d:flex}
                                                a.row-body [73,89 228×28] (data-test=special-hub-item-row-new-ai-launch) {d:flex ai:center gap:10px p:0px 8px rad:7px cur:pointer}
                                                  cu-sidebar-item-icon.row-icon [81,95 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                                    cu3-icon.cu3-icon [81,95 16×16] {d:flex ai:center jc:center}
                                                  div.title [107,95 186×16] "Novo" {ov:hidden c:#646464 lh:16.002px}
                                            cdk-tree-node.tree-node [73,119 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-special-chat-item-row.special-chat-item-row [73,119 228×28] {d:flex}
                                                a.row-body [73,119 228×28] (data-test=special-chat-item-row-inbox) {d:flex pos:relative ai:center gap:10px p:0px 8px rad:7px cur:pointer}
                                                  cu3-icon.cu3-icon.row-icon [81,125 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                                  div.title [107,125 186×16] "Caixa de entrada" {ov:hidden c:#646464 lh:16.002px}
                                              ↳ (este bloco se repete ×5; último em y=239)
                                            cdk-tree-node.tree-node [73,269 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-my-work-row.cu-my-work-row [73,269 228×28]
                                                cu-sidebar-row-layout.cu-my-work-row__inner.expandable.home-sidebar [73,269 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,275 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,275 26×16] {d:flex}
                                                  a.row-body [107,275 194×16] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-my-work-row__container [107,275 194×16] {d:flex ai:center gap:8px}
                                            cdk-tree-node.tree-node [73,299 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-more-row [73,299 228×28] {d:flex ov:hidden}
                                                cu-more-special-items-dropdown-row [73,299 228×28] {d:flex ov:hidden}
                                                  button.row-body [73,299 228×28] (role=button type=button haspopup=menu expanded=false) {d:flex pos:relative ai:center gap:10px p:0px 12px 0px 8px rad:7px fs:13.3333px lh:normal cur:pointer}
                                                    cu3-icon.cu3-icon.row-icon [81,305 16×16] {d:flex ai:center jc:center c:#838383 fs:16px}
                                                    span.title [107,305 182×16] "Mais" {ov:hidden c:#646464 fs:14px lh:16.002px}
                                            cdk-tree-node [65,329 244×23] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider.with-border [77,329 220×21] {pos:relative m:0px 12px}
                                            cdk-tree-node.group-row [73,352 228×30] (role=treeitem expanded=false) {p:4px 0px 2px m:0px 8px}
                                              cu-group-row.home-sidebar [73,356 228×24]
                                                div.context-menu-trigger [73,356 228×24] {d:flex pos:relative ai:center jc:space-between}
                                                  button.expand-button [73,356 228×24] (role=button) {d:flex ai:center jc:flex-start p:0px 3px 0px 5px rad:5px fs:13.3333px lh:normal cur:pointer}
                                                    div.section-name [79,360 53×16] "Favoritos" (data-test=sidebar-group-row__section-name) {ov:hidden c:#646464 fs:12px fw:500 lh:16.008px}
                                                    cu3-icon.cu3-icon.caret [132,361 16×16] {d:flex ai:center jc:center m:1px 0px 0px c:#8d8d8d fs:16px}
                                                  div.right [253,358 44×20] {d:flex pos:absolute ai:center}
                                                    div.menu [253,358 44×20] {d:flex gap:4px}
                                            cdk-tree-node [65,382 244×12] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,382 220×10] {pos:relative m:0px 12px}
                                            cdk-tree-node.group-row [73,394 228×30] (role=treeitem expanded=true) {p:4px 0px 2px m:0px 8px}
                                              cu-group-row.home-sidebar [73,398 228×24]
                                                div.context-menu-trigger.with-spaces-section-create [73,398 228×24] {d:flex pos:relative ai:center jc:space-between p:0px 32px 0px 0px}
                                                  button.expand-button.expand-button-rotated [73,398 196×24] (role=button) {d:flex ai:center jc:flex-start p:0px 3px 0px 5px rad:5px fs:13.3333px lh:normal cur:pointer}
                                                    div.section-name [79,402 48×16] "Espaços" (data-test=sidebar-group-row__section-name) {ov:hidden c:#646464 fs:12px fw:500 lh:16.008px}
                                                  div.right [253,400 44×20] {d:flex pos:absolute ai:center}
                                                    div.menu [253,400 44×20] {d:flex gap:4px}
                                            cdk-tree-node.tree-node.everything-row [73,424 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-everything-row.sidebar-everything-row.home-sidebar [73,424 228×28]
                                                cu-sidebar-row-layout.everything-row__inner.home-sidebar [73,424 228×28] {d:flex pos:relative ai:center rad:6px c:#8d8d8d}
                                                  div.row-left [73,428 34×20] {pos:absolute p:0px 0px 0px 6px}
                                                    div.row-avatar [79,428 28×20] {d:flex fs:20px lh:20px}
                                                  a.row-body [73,424 220×29] {ov:hidden lh:28px cur:pointer}
                                                    span.everything-row__text [73,429 228×17] "Todas as tarefas" (data-test=sidebar-workspace-name-text) {p:0px 0px 0px 34px c:#646464}
                                                  div.row-actions.remove-parent-hover [297,438 0×0] {d:flex jc:flex-end m:0px 4px}
                                            cdk-tree-node.tree-node [73,454 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-project-row.sidebar-project-row.home-sidebar [73,454 228×28]
                                                cu-sidebar-row-layout.cu-project-row__inner.expandable.home-sidebar [73,454 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,458 34×20] {p:0px 0px 0px 6px}
                                                    div.row-avatar [79,458 28×20] {d:flex}
                                                  a.row-body [107,454 194×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-project-row__container [107,454 194×28] {d:flex ai:center gap:normal 2px}
                                              ↳ (este bloco se repete ×8; último em y=664)
                                            cdk-tree-node [65,694 244×12] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,694 220×10] {pos:relative m:0px 12px}
                                            cdk-tree-node.group-row [73,706 228×30] (role=treeitem expanded=true) {p:4px 0px 2px m:0px 8px}
                                              cu-group-row.home-sidebar [73,710 228×24]
                                                div.context-menu-trigger [73,710 228×24] {d:flex pos:relative ai:center jc:space-between}
                                                  button.expand-button.expand-button-rotated [73,710 228×24] (role=button) {d:flex ai:center jc:flex-start p:0px 3px 0px 5px rad:5px fs:13.3333px lh:normal cur:pointer}
                                                    div.section-name [79,714 39×16] "Canais" (data-test=sidebar-group-row__section-name) {ov:hidden c:#646464 fs:12px fw:500 lh:16.008px}
                                                  div.right [253,712 44×20] {d:flex pos:absolute ai:center}
                                                    div.menu [253,712 44×20] {d:flex gap:4px}
                                            cdk-tree-node.tree-node [73,736 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-chat-room-row.cu-chat-room-row.home-sidebar [73,736 228×28] {rad:6px}
                                                cu-sidebar-row-layout.cu-chat-room-row__inner.expanded.home-sidebar [73,736 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,742 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,742 26×16] {d:flex}
                                                  a.row-body [107,736 186×28] {ov:hidden lh:28px cur:pointer}
                                                    div.cu-chat-room-row__container.secondary [107,742 142×16] (data-test=chat-sidebar-item__name) {d:inline-grid pos:relative ai:center gap:normal 4px cols:142.125px c:#646464}
                                                  div.row-actions.remove-parent-hover [297,750 0×0] {d:flex jc:flex-end m:0px 4px}
                                                    div [297,750 0×0]
                                            cdk-tree-node.tree-node [73,766 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-chat-room-row.cu-chat-room-row.home-sidebar [73,766 228×28] {rad:6px}
                                                cu-sidebar-row-layout.cu-chat-room-row__inner.active.expanded [73,766 228×28] {d:flex pos:relative ai:center bg:#000000/0.06 rad:7px}
                                                  div.row-left [73,772 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,772 26×16] {d:flex}
                                                  a.row-body [107,766 186×28] {ov:hidden lh:28px cur:pointer}
                                                    div.cu-chat-room-row__container.default [107,772 122×16] (data-test=chat-sidebar-item__name) {d:inline-grid pos:relative ai:center gap:normal 4px cols:122.219px}
                                                  div.row-actions.remove-parent-hover [297,780 0×0] {d:flex jc:flex-end m:0px 4px}
                                                    div [297,780 0×0]
                                            cdk-tree-node.tree-node [73,796 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-section-action-row [73,796 228×28] {rad:6px}
                                                cu-sidebar-row-layout.cu-section-action-row__inner.hide-row-actions.home-sidebar [73,796 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,802 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,802 26×16] {d:flex}
                                                  a.row-body [107,802 194×16] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-section-action-row__body [107,802 194×16] {d:flex ai:center gap:4px}
                                            cdk-tree-node [65,826 244×12] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,826 220×10] {pos:relative m:0px 12px}
                                            cdk-tree-node.group-row [73,838 228×30] (role=treeitem expanded=false) {p:4px 0px 2px m:0px 8px}
                                              cu-group-row.home-sidebar [73,842 228×24]
                                                div.context-menu-trigger [73,842 228×24] {d:flex pos:relative ai:center jc:space-between}
                                                  button.expand-button [73,842 228×24] (role=button) {d:flex ai:center jc:flex-start p:0px 3px 0px 5px rad:5px fs:13.3333px lh:normal cur:pointer}
                                                    div.section-name [79,846 109×16] "Mensagens diretas" (data-test=sidebar-group-row__section-name) {ov:hidden c:#646464 fs:12px fw:500 lh:16.008px}
                                                    cu3-icon.cu3-icon.caret [188,847 16×16] {d:flex ai:center jc:center m:1px 0px 0px c:#8d8d8d fs:16px}
                                                  div.right [253,844 44×20] {d:flex pos:absolute ai:center}
                                                    div.menu [253,844 44×20] {d:flex gap:4px}
                                            cdk-tree-node [65,868 244×12] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,868 220×10] {pos:relative m:0px 12px}
                                            cdk-tree-node [65,880 244×8] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,880 220×6] {pos:relative m:0px 12px}
                                        div [65,81 244×807]
                                      cu-project-menu [65,876 0×0]
                                        div.nav-menu.cu-project-menu__trigger [65,876 255×0] (role=button label= Configurações do Espaço haspopup=menu expanded=false)
                                        div [65,876 255×0]
                                      cu-category-menu-container [65,876 0×0]
                                        cu-category-menu.cu-category-menu [65,876 0×0]
                                          cu-nav-menu [65,876 0×0]
                                            div.nav-menu [65,876 255×0] (role=button label= Configurações de pasta haspopup=menu expanded=false)
                                            div [65,876 255×0]
                                      cu-subcategory-menu-container [65,876 0×0]
                                        cu2-list-details-menu.cu2-list-details-menu [65,876 0×0]
                                          cu-nav-menu.cu2-list-details-menu [65,876 0×0]
                                            div.nav-menu [65,876 255×0] (role=button label= Configurações da lista haspopup=menu expanded=false)
                                            div [65,876 255×0]
                                      cu-nav-menu-dropdown [65,876 0×0]
                                        div.nav-menu [65,876 255×0] (role=button haspopup=menu expanded=false)
                                      cu-data-view-menu-container [65,876 0×0]
                                        cu-nav-data-view-menu.cu-nav-data-view-menu[sidebarDataView] [65,876 0×0]
                                          cu-nav-menu [65,876 0×0]
                                            div.nav-menu [65,876 255×0] (role=button label=  haspopup=menu expanded=false)
                                            div [65,876 255×0]
                                      cu-scroll-more [0,0 0×0] {d:contents}
                                    cu-global-upgrade-to-member-banner [65,896 255×0]
                        div.cu-manager2__main [321,41 1592×855] {d:flex pos:relative dir:column}
                          cu-modal-keeper [321,41 1592×0]
                            div [321,41 1592×0]
                          cu-banners-container [321,41 1592×0]
                            cu2-banner-popup [321,41 0×0]
                            cu-trial-banner [321,41 0×0]
                          cu-dashboard.cu-dashboard [321,41 1592×855] {d:grid cols:0px 1592px 0px}
                            div.cu-dashboard__body.cu-dashboard__body_v6 [321,41 1592×855] (data-test=dashboard__body__view-body) {d:flex pos:relative dir:column}
                              cu-location-split-layout [0,0 0×0] {d:contents}
                                div.cu-location-split-layout__row [0,0 0×0] {d:contents}
                                  div.cu-location-split-layout__column [0,0 0×0] {d:contents}
                                    cu-views-bar-container [0,0 0×0] {d:contents}
                                      cu2-views-bar.cu2-views-bar.cu-hidden-print.cu2-views-bar_list [321,41 1592×69] {bg:#ffffff}
                                        cu-global-request-edit-access-banner [321,41 0×0]
                                          cu-request-edit-access-banner.cu-request-edit-access-banner [321,41 0×0]
                                        cu-location-header [321,41 1592×34]
                                          div.location-header [321,41 1592×34] (data-test=location-header__views-v3) {d:flex ai:center p:8px 8px 2px 12px bg:#ffffff}
                                            div.left [333,49 1572×24] {d:flex ai:center gap:10px bg:#ffffff}
                                              div.left-body [333,49 1572×24] {d:flex}
                                                cu-location-header-breadcrumbs [333,49 216×24] {d:grid ai:center cols:215.734px}
                                                  cu-breadcrumb-item [333,49 216×24]
                                                    span.item.item_active.item_team [332,49 218×24] {d:flex ai:center p:0px 4px 0px 0px m:0px -1px rad:6px fs:14px fw:600 lh:16.002px}
                                                cu-nav-menu-move-to-section-combo-button [549,49 0×24] {d:grid}
                                                div.location-properties-container [553,49 1352×24] {d:flex m:0px 0px 0px 4px}
                                                  cu-page-header-properties.location-properties.set [553,49 0×24] {d:flex ai:center gap:4px bg:#f9f9f9 rad:6px z:2}
                                                  cu-page-header-properties.location-properties.unset [553,49 0×24] {d:flex ai:center gap:2px bg:#f9f9f9 rad:6px z:1}
                                            div.right [1905,61 0×0] {d:flex ai:center jc:flex-end gap:1px bg:#ffffff}
                                              cu-brain-command-bar-at-location [1905,61 0×0] (data-test=brain-command-bar-at-location)
                                                cu-writing-tool-popover [1905,61 0×0]
                                                  div [1905,61 0×0]
                                        div.cu2-views-bar__controller.cu2-views-bar__controller_header-collapsed [329,75 1576×35] (data-test=views-bar__controller) {m:0px 8px}
                                          div.cu2-views-bar__controller-row.cu2-views-bar__controller-row_top [321,75 1592×35] (data-test=views-bar__controller-row) {d:flex pos:relative p:0px 8px 0px 12px m:0px -8px}
                                            cu-view-block.cu-view-block.cu2-views-bar__views [0,0 0×0] {d:contents m:0px 0px -1px}
                                              cu3-data-view-list.cu-view-block__data-view-list.in-chat [333,75 1572×35] {d:flex ai:center}
                                                div.skeleton-loader [333,83 252×20] (data-test=views-skeleton-loader__container) {d:flex pos:relative ai:center gap:6px m:0px 8px 0px 0px}
                                                  div.skeleton-view [333,83 80×20] {pos:relative bg:#f0f0f0 rad:5px}
                                                    ↳ (este bloco se repete ×3; último em y=83)
                                                cu-add-view-dropdown [0,0 0×0] {d:contents}
                                                  cu-data-view-add-dropdown.cu-data-view-add-dropdown.cu-data-view-add-dropdown_in-chat [0,0 0×0] {d:contents}
                                                    div.cu-dropdown [606,81 168×24] {d:flex pos:relative ai:center m:0px 0px 0px 13px}
                                    div.cu-dashboard__router-outlet-container [321,110 1592×786] {pos:relative}
                                      div.cu-dashboard__router-outlet.cu-dashboard__router-outlet_v6 [321,110 1592×786] (data-test=dashboard__router-outlet-canvas) {pos:relative ov:hidden}
                                        router-outlet [321,110 0×0]
                                        cu-routed-data-view-host [0,0 0×0] {d:contents}
                                          cu-dashboard-table.cu-dashboard-table.dashboard-router-outlet [0,0 0×0] {d:contents}
                                            div.cu-if-not-task-view-scroll.cu-dashboard-table__scroll [321,110 1592×786] (data-test=dashboard-table__scroll) {d:flex dir:column bg:#ffffff}
                                              cu-location-description.cu-dashboard-table__location-description [321,110 1592×16] {pos:sticky}
                                                div.location-description.with-margin [369,126 1496×0] {m:16px 48px 8px}
                                                  cu-location-description-content [0,0 0×0] {d:contents}
                                              div.cu-dashboard-table__empty [321,126 1592×770] {p:70px 20px 20px}
                                                cu-table-placeholder [341,196 1552×240] (data-test=cu-dashboard-table__empty-placeholder)
                                                  div [341,196 1552×240]
                                                    div.lv-empty_img [341,196 1552×192] {p:15px 0px}
                                                    div.lv-empty_desc [341,388 1552×48] (data-test=lv-empty_desc) {c:#4a4a4a fs:16px lh:16px}
                      cu-tray-bar.cu-tray-bar.cu-hidden-print [65,896 1848×0]
                    cu-right-sidebar [1914,40 0×857] {d:flex}
                      div.cu-right-sidebar.collapsed.closed [1914,40 0×857] {d:flex pos:relative}
                        div.resizer-handle [1906,44 8×849] (role=separator label=Redimensionar a barra lateral) {d:flex pos:absolute jc:center bg:#c7ebe5 rad:4px z:20 cur:col-resize}
                        div.container.is-task-view-open [1914,40 2×857] {d:flex pos:relative dir:column bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:8px sh:#000000/0.055 0px 1px 2px 0px ov:clip auto}
          cu-manager-render-detector [0,903 0×0]
          cu-manager-task-drafter [0,903 0×0]
          cu-toast-manager.cu-toast-manager [72,887 320×0] {d:flex pos:fixed dir:column ai:flex-start gap:4px z:1000}
            cu-queued-tasks.cu-toast-manager-item [0,0 0×0] {d:contents}
              div.cu-queued-tasks.cu-toast-manager-item [0,0 0×0] {d:contents}
            cu-refresh-toast.cu-toast-holder.cu-toast-manager-item.cu-hidden-print [0,0 0×0] {d:contents pos:fixed z:1000}
            cu-upload-toasts.cu-toast-manager-item [0,0 0×0] {d:contents}
            cu-undo-toast-items.toast.cu-toast-manager-item.cu-hidden-print [0,0 0×0] (data-test=manager__toast_component_undo) {d:contents pos:fixed z:1001}
            cu-settings-success-items.toast.cu-toast-manager-item.cu-hidden-print [0,0 0×0] {d:contents pos:fixed z:1001}
            cu-toast-items.toast.cu-toast-manager-item.cu-hidden-print [0,0 0×0] {d:contents pos:fixed z:1000}
            cu-simple-toast-items.cu-hidden-print.cu-toast-manager-item [0,0 0×0] {d:contents}
            cu-toast-lazy-wrapper.cu-toast-manager-item [0,0 0×0] {d:contents}
              cu-toast-new.cu-toast-new.cu-toast-manager-item [0,0 0×0] {d:contents pos:fixed z:1000}
                div.cu-toast-manager-item.cu-toast-new__container.cu-toast-group [0,0 0×0] (role=status) {d:contents pos:relative z:2}
                div.cu-toast-new__minimize-container.cu-toast-group [395,838 0×0] {d:flex pos:absolute}
          cu-whiteboard-paywall [0,903 0×0]
          cu-sync-block-nux-modal [0,903 0×0]
          cu-replace-loom-modal [0,903 0×0]
          cu-epd-solutions-modal [0,903 0×0]
          cu-manager-services-initializer [0,903 0×0] (data-test=manager-services-initializer__host)
        cu-whiteboard-keeper [0,903 0×0]
      cu-modal-keeper [0,903 0×0]
        div [0,903 1920×0]
      cu-task-keeper [0,903 0×0]
        cu-task-view.direct-link [0,0 0×0] {d:contents}
          div.cu-task-view__inner.full-screen [64,40 1850×857] (data-test=task-view__mode--full-screen) {d:flex pos:fixed jc:center z:801}
            div.cu-task-view__container.full-screen [64,40 1850×857] (data-test=task-view__container) {d:grid pos:relative bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:8px ov:hidden z:801 cols:1848px}
              cu-task-view-header.task-view-hide-on-print-description [65,41 1848×45] (data-test=task-container__header-wrapper) {d:flex pos:relative ai:center p:0px 8px bb:1px solid #e8e8e8}
                div.cu-task-view-header__left [73,51 1483×24] {d:flex ai:center bg:#ffffff}
                  button.cu-task-view-header__button.cu-task-view-header__button_previous.cu-hidden-print [74,51 24×24] (data-test=task-view-header__arrow-previous) {d:flex pos:relative ai:center jc:center gap:4px m:0px 1px rad:6px c:#bbbbbb fs:16px fw:500 lh:21.3333px cur:not-allowed}
                    cu3-icon.cu3-icon [78,55 16×16] {d:flex ai:center jc:center}
                  button.cu-task-view-header__button.cu-hidden-print [99,51 24×24] (data-test=task-view-header__arrow-next) {d:flex pos:relative ai:center jc:center gap:4px rad:6px c:#bbbbbb fs:16px fw:500 lh:21.3333px cur:not-allowed}
                    cu3-icon.cu3-icon [103,55 16×16] {d:flex ai:center jc:center}
                  cu-task-view-breadcrumbs.cu-task-view-header__breadcrumbs [127,51 400×24] (data-test=task-view-header__breadcrumbs) {d:flex ai:center m:0px 0px 0px 4px}
                    a.cu-task-view-breadcrumbs__v4morelists.cu-task-view-breadcrumbs__v4morelists--muted [127,51 91×24] (data-test=task-view-breadcrumbs__timl-list-item) {d:flex ai:center gap:4px p:4px rad:4px ov:hidden c:#646464 fs:14px lh:16.002px cur:pointer}
                      span.cu-task-view-breadcrumbs__v4morelists__icon [131,55 16×16] {d:flex ai:center jc:center fs:16px lh:0px}
                        cu3-avatar.cu3-avatar.cu-task-view-breadcrumbs__v4projectavatar [131,55 16×16] (data-test=task-view-breadcrumbs__space-avatar)
                          div.space-bg-red.space-avatar [131,55 16×16] (label=Operação, ,  data-test=avatar-removal-block) {d:flex pos:relative ai:center jc:center bg:#e5484d rad:4px c:#ffffff fs:10px fw:700}
                            span.avatar-initials [134,63 0×0]
                            cu3-custom-icon.cu3-custom-icon.size-xxsmall [134,58 10×10]
                      span.cu-task-view-breadcrumbs__v4morelists__name [151,55 63×16] "Operação" {ov:hidden}
                    div.cu-task-view-breadcrumbs__v4morelistsslashdivider [218,55 8×16] "/" {p:0px 0px 2.6px c:#bbbbbb}
                    a.cu-task-view-breadcrumbs__v4morelists [226,51 240×24] (data-test=task-view-breadcrumbs__timl-list-item) {d:flex ai:center gap:4px p:4px rad:4px ov:hidden fs:14px fw:500 lh:16.002px cur:pointer}
                      span.cu-task-view-breadcrumbs__v4morelists__icon [230,55 16×16] {d:flex ai:center jc:center fs:16px lh:0px}
                        cu3-icon.cu3-icon [230,55 16×16] {d:flex ai:center jc:center}
                      span.cu-task-view-breadcrumbs__v4morelists__name [250,55 194×16] "ZZ Teste exploracao (apagar)" {ov:hidden}
                      cu3-icon.cu3-icon.cu-task-view-breadcrumbs__v4morelists__lockIcon [448,56 14×14] (data-test=task-view-breadcrumbs__lock-icon) {d:flex ai:center jc:center}
                    div.cu-dropdown [466,51 24×24] {pos:relative}
                      button.cu-hidden-print.cu-dropdown__toggle [466,51 24×24] (role=button data-test=task-view-breadcrumbs__addToAnotherList expanded=false) {d:inline-flex ai:center jc:center gap:4px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                        cu3-icon.cu3-icon.cu-task-view-breadcrumbs__button-icon [470,55 16×16] {d:flex ai:center jc:center}
                        span [465,63 1×1] "Adicione em outra lista" {pos:absolute m:-1px ov:hidden}
                    div.cu-task-view-breadcrumbs__v4morelistsverticalline [496,57 1×12] {m:0px 6px bg:#cecece}
                    div.cu-dropdown [503,51 24×24] {pos:relative}
                      button.cu-hidden-print.cu-dropdown__toggle [503,51 24×24] (role=button expanded=false) {d:inline-flex ai:center jc:center gap:4px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                        cu3-icon.cu3-icon [507,55 16×16] {d:flex ai:center jc:center}
                        span [502,63 1×1] "Mover tarefa" {pos:absolute m:-1px ov:hidden}
                div.cu-task-view-header__created_at.cu-hidden-print [1556,57 111×12] "Criada em 27 out" (label=Criada por Fabricio Saraiva em 27 out 23 data-test=task-view-header__created-at) {d:flex ai:center p:0px 7px c:#838383 fs:12px lh:12px}
                div.cu-task-view-header__right [1667,49 238×28] {d:flex ai:center gap:normal 1px bg:#ffffff}
                  cu-brain-command-bar-at-location.cu-task-view-header__brain-command-bar [1667,63 0×0] (data-test=brain-command-bar-at-location)
                    cu-writing-tool-popover [1667,63 0×0]
                      div [1667,63 0×0]
                  cu-share-header-button [1668,49 121×28]
                    cu-header-sharing-trigger.cu-hidden-print [1668,58 121×16]
                      button.cu-share-header-button__btn [1668,49 121×28] (data-test=cu-header-share-btn) {d:inline-flex ai:center jc:center gap:4px p:0px 7px rad:7px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                        cu3-icon.cu3-icon [1675,55 16×16] {d:flex ai:center jc:center m:0px 0px 0px -1px fs:16px lh:18.2857px}
                        span.share-btn-label [1695,55 86×16] "Compartilhar" {d:flex}
                  cu-task-view-menu-dropdown-button.cu-task-view-header__menu [1790,49 28×28]
                    cu-quick-actions-menu.cu-quick-actions-menu.cu-hidden-print [1790,49 28×28]
                      div.nav-menu.cu-dropdown.menu-options [1790,49 28×28] {pos:relative}
                        div.cu-dropdown__toggle [1790,49 28×28] (role=button label=Menu suspenso data-test=dropdown__toggle expanded=false) {cur:pointer}
                          button.cu-task-view-header__button [1790,49 28×28] (data-test=task-view-header__task-settings) {d:inline-flex pos:relative ai:center jc:center gap:4px rad:7px c:#646464 fs:16px fw:500 lh:18.2857px}
                            cu3-icon.cu3-icon [1796,55 16×16] {d:flex ai:center jc:center}
                            span [1790,63 1×1] "Configurações da tarefa" {pos:absolute m:-1px ov:hidden}
                  cu-nav-menu-move-to-section-combo-button [1819,49 28×28] {d:grid cols:28px}
                    div.cu-dropdown [1819,49 28×28] {pos:relative}
                      button.button.cu-dropdown__toggle [1819,49 28×28] (role=button data-test=task-view-header__favorite-button type=button expanded=false) {d:inline-flex ai:center jc:center rad:7px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                        cu3-icon.cu3-icon.icon [1825,55 16×16] (data-test=task-view-header__unfavorited) {d:flex ai:center jc:center}
                        span [1818,63 1×1] "Favorito" {pos:absolute m:-1px ov:hidden}
                  cu-expanded-task-view-mode-switcher [1848,49 28×28]
                    div.cu-dropdown [1848,49 28×28] {pos:relative}
                      button.cu-dropdown__toggle [1848,49 28×28] (role=button type=button expanded=false) {d:inline-flex ai:center jc:center gap:4px rad:7px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                        cu3-icon.cu3-icon [1854,55 16×16] {d:flex ai:center jc:center}
                        span [1847,63 1×1] "Alternar layout" {pos:absolute m:-1px ov:hidden}
                  button.cu-task-view-header__button.cu-task-view-header__close.cu-hidden-print [1877,49 28×28] (label=Fechar janela data-test=task-close-v3) {d:flex pos:relative ai:center jc:center gap:4px rad:7px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                    cu3-icon.cu3-icon [1883,55 16×16] {d:flex ai:center jc:center}
              cu-request-edit-access-banner.cu-request-edit-access-banner [65,86 1848×0]
              div.cu-task-view__main [65,86 1848×810] {d:flex pos:relative}
                div.cu-task-view__subtasks-sidebar.cu-hidden-print.task-view-hide-on-print-description [65,86 0×810] {pos:relative bg:#f9f9f9 rad:0px 0px 0px 8px ov:hidden auto}
                cu-task-view-body [65,86 1848×810] {d:flex pos:relative dir:column ov:clip}
                  div.cu-task-view-body__inner [65,86 1848×810] (data-test=view-task__body) {d:flex}
                    cu-task-view-task-content.cu-task-view-body__content.expanded.cu-block-spacing_v3 [65,86 1288×810] {d:flex pos:relative dir:column}
                      div.cu-task-view-task-content__scrollable [65,86 1288×810] (data-test=task-view-task-content__scrollable) {bg:#ffffff ov:hidden scroll}
                        div.cu-task-view-task-content__sticky-title-wrapper [65,86 1277×0] {pos:sticky z:105}
                        div [65,86 1277×0]
                        div.cu-task-view-task-content__sticky.cu-hidden-print [65,86 1277×0] {d:flex pos:sticky z:110}
                          div.cu-task-view-task-content__sticky-edge [65,86 140×0]
                          div.cu-task-view-task-content__sticky-body [205,122 998×0] {p:0px 0px 0px 28px m:36px 0px 48px}
                          div.cu-task-view-task-content__sticky-edge [1203,86 140×0]
                        div.cu-task-view-task-content__body [205,86 998×812] {p:0px 48px m:0px 139.5px 48px}
                          cu-task-hero-section.cu-task-hero-section.task-view-hide-on-print-description [253,86 902×292]
                            div.cu-task-hero-section__actions [253,86 902×66] {d:flex ai:center p:32px 0px 6px m:0px 0px 4px}
                              cu-task-view-task-label.cu-task-view-task-label [253,118 93×28] {d:flex m:0px 8px 0px 0px}
                                button.cu-task-view-task-label__button.cu-task-view-task-label__task-type-dropdown.cu-dropdown [253,118 93×28] (role=button label=Menu suspenso data-test=cu-task-view-task-label__task-type expanded=false) {d:flex pos:relative ai:center jc:center gap:2px p:0px 7px 0px 6px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:7px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                                  cu-custom-task-type-icon.cu-task-view-task-label__button-font-icon [260,124 16×16] (data-test=task-view-task-label__icon) {d:flex ai:center jc:center m:0px 2px 0px 0px}
                                    cu3-icon.cu3-icon.cu-custom-task-type-icon [261,125 14×14] (data-test=cu-custom-task-type-icon__task) {d:flex ai:center jc:center}
                                  span.cu-task-view-task-label__button-label [280,124 41×16] "Tarefa" (data-test=task-view-task-label__button-label)
                                  cu3-icon.cu3-icon.cu-task-view-task-label__button-chevron [323,124 16×16] {d:flex ai:center jc:center m:0px -1px 0px 0px c:#838383 fs:16px lh:18.2857px}
                              cu-task-id-button.task-id-button [354,120 24×24] (data-test=task-hero-section__task-id-button) {d:flex}
                                div [354,120 24×24]
                                  button.cu-task-id-icon-button--icon-only.cu-task-id-button--no-border [354,120 24×24] (label=Copy Task ID 17tnw2ba7ya data-test=cu-task-view-task-label__task-id) {d:inline-flex ai:center jc:center gap:4px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                                    cu3-icon.cu3-icon.cu-task-id-button__icon [358,124 16×16] {d:flex ai:center jc:center}
                              cu-pill-button-section.cu-hidden-print.no-padding [378,132 0×0] (data-test=task-hero-section__pill-button-section) {d:flex jc:space-between bg:#ffffff}
                                div.task-view-pill-button__container [378,132 0×0] {d:flex gap:2px}
                              cu-task-hero-actions.cu-task-hero-actions [378,120 777×24] {d:flex ai:center jc:end}
                                div.container.container__0 [1033,120 122×24] {d:flex ai:center}
                                  div.btn-container.cu-hidden-print.cu-animations__accordion-horizontal-expand [1033,120 122×24] {d:grid cols:121.641px}
                                    div.min-width.cu-animations__accordion-content [1033,120 122×24] {ov:hidden}
                                      button.task-hero-section__add-cover-btn.cu-task-hero-section__actions-btn.add-cover-button [1037,120 118×24] "Adicionar capa" (data-test=task-hero-section__add-cover) {d:inline-flex ai:center jc:center gap:4px p:0px 7px m:0px 0px 0px 4px rad:6px c:#646464 fs:12px fw:500 lh:16px cur:pointer}
                                        cu3-icon.cu3-icon [1045,126 12×12] {d:flex ai:center jc:center}
                            cu-task-view-parent-task-link [253,156 902×0] {d:flex ai:center gap:4px p:0px 6px}
                            cu-task-title.cu-task-hero-section__task-title.cu-task-title--no-ai-banner [253,156 902×44] (data-test=task-hero-section__task-title) {d:flex pos:relative m:0px 0px 8px}
                              cu-slash-command.cu-task-title__container [253,156 902×44] (data-test=slash-command)
                                div.cu-task-title [253,156 902×43] {p:3px 5px rad:8px}
                                  div.cu-task-title__icons [256,178 0×0] {d:flex pos:absolute m:0px 0px 0px -3px}
                                  div.cu-task-title__text-wrapper [259,160 890×35] {pos:relative}
                                    h1.cu-task-title__overlay [259,160 890×35] "Post de teste A" (data-test=task-title__title-overlay) {pos:absolute fs:28px fw:600 lh:35px cur:pointer}
                                    textarea.cu-task-title__title [259,160 890×35] (label=Editar nome da tarefa data-test=task-title__text-area type=text) {ov:hidden c:#000000/0 fs:28px fw:600 lh:35px cur:pointer}
                              cu-task-title-timing-marker [1155,156 0×44]
                            div.cu-task-hero-section__task-properties__container [253,208 902×170] {pos:relative p:0px 0px 30px}
                              cu-task-fields-container [253,208 902×140]
                                div.cu-task-fields-container.rows-7 [253,208 902×140] {d:grid gap:4px 10px p:0px 6px cols:440px 440px}
                                  div.cu-task-fields__row [259,208 440×32] {d:grid gap:4px cols:145.328px 290.672px}
                                    cu-task-field-label-icon [259,208 145×32]
                                      div.cu-task-label-icon__v4-container [259,208 120×32] (data-test=task-field-label-icon__container-Status) {d:flex ai:center gap:6px cur:pointer}
                                        cu3-icon.cu3-icon [259,216 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                        span.cu-task-label-icon__v4-label [281,216 41×16] "Status" {c:#838383 fs:14px lh:16.002px}
                                    cu-status-button [0,0 0×0] {d:contents}
                                      div.cu-status-button__dropdown.cu-dropdown [0,0 0×0] (data-test=view-task_task-status-v3) {d:contents pos:relative}
                                        div.cu-status-button__inner.cu-dropdown__toggle [408,208 291×32] (role=button label=Mudar status data-test=status-button__status-dropdown expanded=false) {d:flex ai:center p:0px 4px rad:6px cur:pointer}
                                          div [252,224 1×1] "✴️ A FAZER" {pos:absolute m:-1px ov:hidden}
                                          cu-status-button-badge [0,0 0×0] {d:contents}
                                            div.cu-status-button-badge__body.light [412,212 108×24] (data-test=status-button-badge__body) {d:flex ai:center p:0px 8px bg:#ffffff rad:6px sh:#838383 0px 0px 1px 0px c:#ffffff}
                                              span.cu-status-button-badge__label [420,218 68×12] "✴️ a fazer" (data-test=status-button-badge__✴️ a fazer) {ov:hidden c:#000000/0.875 fs:12px fw:500 lh:12px tt:uppercase}
                                              button.cu-status-button-badge__next-status [496,212 24×24] (label=Próximo status [🔵 EM PROGRESSO] data-test=status-button-badge__next-status) {d:flex pos:relative ai:center jc:center m:0px -8px 0px 8px fs:13.3333px lh:normal}
                                                div.cu-status-button-badge__next-status-icon.icon [500,216 16×16] {d:flex ai:center jc:center}
                                          button.cu-status-button-check [524,212 24×24] (label=Marcar como fechada data-test=status-button__checkmark) {d:flex ai:center jc:center gap:4px m:0px 0px 0px 4px bg:#000000/0.06 rad:6px c:#646464 fs:16px fw:500 lh:21.3333px}
                                            cu3-icon.cu3-icon [528,216 16×16] {d:flex ai:center jc:center}
                                  div.cu-task-fields__row [709,208 440×32] {d:grid gap:4px cols:145.328px 290.672px}
                                    cu-task-field-label-icon [709,208 145×32]
                                      div.cu-task-label-icon__v4-container [709,208 120×32] (data-test=task-field-label-icon__container-Respons) {d:flex ai:center gap:6px cur:pointer}
                                        cu3-icon.cu3-icon [709,216 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                        span.cu-task-label-icon__v4-label [731,216 88×16] "Responsáveis" {c:#838383 fs:14px lh:16.002px}
                                    cu-assignees [858,208 291×32] (data-test=task-hero-section__assignees) {pos:relative rad:6px}
                                      ul [857,207 1×1] (label=Pessoas atribuídas) {pos:absolute m:-1px ov:hidden}
                                      ul [857,207 1×1] (label=Equipes atribuídas) {pos:absolute m:-1px ov:hidden}
                                      cu-user-and-groups-list-dropdown.cu-user-and-groups-list-dropdown.cu-user-list-dropdown [858,208 291×32] (data-test=task-hero-section__assign-dropdown-toggl)
                                        cu-user-list-dropdown.cu-user-list-dropdown [858,208 291×32] (data-test=user-list-dropdown)
                                          div.cu-dropdown [858,208 291×32] {pos:relative}
                                            div.cu-task-hero-section__row-data.cu-assignees-lazy__dropdown-toggle.cu-assignees-lazy__dropdown-toggle-empty [858,208 291×32] (role=button label=Abrir a lista suspensa de responsáveis data-test=user-list-dropdown__toggle expanded=false) {d:flex ai:center jc:space-between p:0px 8px rad:6px fs:14px lh:15.96px cur:pointer}
                                              div.cu-assignees-avatars-and-name [866,216 35×16] {d:flex ai:center gap:8px}
                                                cu-user-group [866,216 35×16] (data-test=assignees-lazy__assignee-avatars)
                                                  cu-avatar-group.cu-user-group [866,216 35×16] (data-test=user-group__container) {d:flex pos:relative dir:row-reverse ai:center jc:flex-end}
                                                    div.cu-user-group__item.cu-user-group__item_assign-mono [866,216 35×16] (data-test=user-group__item_assign-mono) {pos:relative}
                                              div.cu-task-hero-section__row-data-autofill-ai-button-container [1141,224 0×0] {d:flex ai:center}
                                  div.cu-task-fields__row [259,244 440×32] {d:grid gap:4px cols:145.328px 290.672px}
                                    cu-task-field-label-icon [259,244 145×32]
                                      div.cu-task-label-icon__v4-container [259,244 120×32] (data-test=task-field-label-icon__container-Datas) {d:flex ai:center gap:6px cur:pointer}
                                        cu3-icon.cu3-icon [259,252 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                        span.cu-task-label-icon__v4-label [281,252 37×16] "Datas" {c:#838383 fs:14px lh:16.002px}
                                    cu-task-hero-section-dates [408,244 291×32] (data-test=task-hero-section__dates)
                                      cu-task-view-dates-dropdown [408,244 291×32]
                                        cu-recurring-date-dropdown.cu-recurring-date-dropdown [408,244 291×32] (data-test=task-view-dates-dropdown)
                                          div.cu-recurring-date-dropdown__dropdown.cu-dropdown [408,244 291×32] (data-test=recurring-date-dropdown__dropdown) {pos:relative}
                                            div.cu-dropdown__toggle [408,244 291×32] (role=button data-test=recurring-date-dropdown__dropdown__toggl expanded=false) {d:flex ai:center gap:4px cur:pointer}
                                              div.cu-task-hero-section__row-data.cu-task-hero-section-dates-lazy__toggle [408,244 291×32] (data-test=dates-row) {d:flex ai:center p:0px 8px 0px 2px rad:6px fs:14px lh:15.96px}
                                                span.date-toggle-dates [410,246 281×28] {d:flex ai:center ov:hidden}
                                                  div.date-toggle-dates__empty [410,246 193×28] (data-test=task-hero__date-toggle-dates__empty) {d:flex ai:center c:#8d8d8d lh:16px}
                                                    button.task-v4-placeholder-button.start-date-toggle [410,246 69×28] {d:flex ai:center jc:center gap:4px p:0px 8px 0px 6px rad:7px fw:500}
                                                    cu3-icon.cu3-icon.date-toggle-dates__icon-arrow [479,255 10×10] {d:flex ai:center jc:center m:0px 2px 0px 0px fs:10px}
                                                    button.task-v4-placeholder-button.due-date-toggle [491,246 112×28] {d:flex ai:center jc:center gap:4px p:0px 8px 0px 6px rad:7px fw:500}
                                                  div.cu-recurring-dates__container [611,260 0×0] {m:0px 0px 0px 8px}
                                                    cu-recurring-icon.cu-recurring-icon [611,260 0×0]
                                                span.date-toggle-icons [691,260 0×0] {d:flex ai:center gap:2px}
                                            span [407,275 1×1] "Alterar datas de início e vencimento" {pos:absolute m:-1px ov:hidden}
                                  div.cu-task-fields__row [709,244 440×32] {d:grid gap:4px cols:145.328px 290.672px}
                                    cu-task-field-label-icon [709,244 145×32]
                                      div.cu-task-label-icon__v4-container [709,244 120×32] (data-test=task-field-label-icon__container-Priorid) {d:flex ai:center gap:6px cur:pointer}
                                        cu3-icon.cu3-icon [709,252 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                        span.cu-task-label-icon__v4-label [731,252 66×16] "Prioridade" {c:#838383 fs:14px lh:16.002px}
                                    cu-task-hero-section-priority [858,244 291×32]
                                      cu-task-view-priority-dropdown [858,244 291×32] (data-test=task-hero-section-priority-lazy__dropdow)
                                        cu-priority-list-dropdown.cu-priority-list-dropdown [858,244 291×32]
                                          div.cu-dropdown [858,244 291×32] (data-test=priorities-list__dropdown) {pos:relative}
                                            div.cu-dropdown__toggle [858,244 291×32] (role=button data-test=priorities-list__dropdown-toggle expanded=false) {cur:pointer}
                                              div.cu-task-hero-section__row-data.cu-task-hero-section-priority-lazy__toggle [858,244 291×32] (data-test=task-hero-section-priority__row-data) {d:flex ai:center jc:space-between gap:4px p:0px 8px rad:6px fs:14px lh:16px}
                                                span.cu-task-hero-section-priority__empty-label [866,252 35×16] "Vazio" {c:#8d8d8d}
                                                div.cu-task-hero-section__row-data-autofill-ai-button-container [1141,260 0×0] {d:flex ai:center}
                                  div.cu-task-fields__row [259,280 440×32] {d:grid gap:4px cols:145.328px 290.672px}
                                    cu-task-field-label-icon [259,280 145×32]
                                      div.cu-task-label-icon__v4-container [259,280 120×32] (data-test=task-field-label-icon__container-Estimat) {d:flex ai:center gap:6px cur:pointer}
                                        cu3-icon.cu3-icon [259,288 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                        span.cu-task-label-icon__v4-label [281,280 98×32] "Estimativa de tempo" {c:#838383 fs:14px lh:16.002px}
                                    cu-task-hero-section-time-estimates-dropdown [408,280 291×32] (data-test=task-hero-section__time-estimates-dropdo)
                                      cu-time-estimates-dropdown-wrapper [0,0 0×0] {d:contents}
                                        cu-time-estimates-dropdown-v2.cu-time-estimates-dropdown-v2 [408,280 291×32]
                                          div.cu-time-estimates-dropdown-v2__toggle [408,280 291×32] (role=button data-test=dropdown__toggle haspopup=menu expanded=false) {cur:pointer}
                                            div.cu-task-hero-section__row-data.cu-task-hero-section__row-data_padding [408,280 291×32] (data-test=task-hero-section__time-estimates-value) {d:flex ai:center p:0px 8px rad:6px fs:14px lh:15.96px}
                                              span.empty-label [416,288 35×16] "Vazio" {c:#8d8d8d}
                                  div.cu-task-fields__row [709,280 440×32] {d:grid gap:4px cols:145.328px 290.672px}
                                    cu-task-field-label-icon [709,280 145×32]
                                      div.cu-task-label-icon__v4-container [709,280 120×32] (data-test=task-field-label-icon__container-Rastrea) {d:flex ai:center gap:6px cur:pointer}
                                        cu3-icon.cu3-icon [709,288 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                        span.cu-task-label-icon__v4-label [731,280 98×32] "Rastrear tempo" {c:#838383 fs:14px lh:16.002px}
                                    cu-task-hero-section-time-tracker [858,280 291×32] {d:flex ai:center gap:9px}
                                      button.cu-task-hero-section__time-tracking-v3 [858,280 291×32] (data-test=task-hero-section-time-tracker__time-tra) {d:flex ai:center p:0px 8px rad:6px fs:13.3333px lh:normal cur:pointer}
                                        cu-time-tracker-timer-v3.cu-task-hero-section__time-tracker-timer [866,288 52×16]
                                          div.cu-time-tracker-timer-v3 [866,288 52×16] {d:flex ai:center gap:4px}
                                            cu-time-tracker-timer-toggle-v3 [866,288 16×16]
                                              div.cu-time-tracker-timer-toggle.cu-time-tracker-timer-toggle--empty.cu-time-tracker-timer-toggle--primary [866,288 16×16] (data-test=time-tracker-timer-toggle) {d:flex}
                                                cu3-icon.cu3-icon.cu-time-tracker-timer-toggle__play-icon [866,288 16×16] {d:flex ai:center jc:center bg:#bbbbbb rad:100% c:#ffffff fs:14px}
                                            div.cu-time-tracker-timer-v3__duration-display [886,288 32×16] (data-test=time-tracker-timer__duration-display) {c:#8d8d8d fs:14px lh:15.96px}
                                              span [886,287 32×17] "Start"
                                        cu-task-time-tracker-v3 [917,296 0×0]
                                          div.cu-dropdown [917,296 0×0] {pos:relative}
                                            div.cu-dropdown__toggle [917,296 0×0] (role=button label=Menu suspenso data-test=dropdown__toggle expanded=false)
                                  div.cu-task-fields__row [259,316 440×32] {d:grid gap:4px cols:145.328px 290.672px}
                                    cu-task-field-label-icon [259,316 145×32]
                                      div.cu-task-label-icon__v4-container [259,316 120×32] (data-test=task-field-label-icon__container-Etiquet) {d:flex ai:center gap:6px cur:pointer}
                                        cu3-icon.cu3-icon [259,324 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                        span.cu-task-label-icon__v4-label [281,324 60×16] "Etiquetas" {c:#838383 fs:14px lh:16.002px}
                                    cu-task-hero-section-tags-field [408,316 291×32] (data-test=task-hero-section__tags)
                                      cu-task-hero-section-tags-dropdown [408,316 291×32]
                                        cu-tags-list.cu2-tags-list.cu-task-hero-section-tags-lazy__tags-dropdown [408,316 291×32]
                                          div.cu-dropdown [408,316 291×32] {pos:relative}
                                            div.cu-tags-list__toggle.cu-dropdown__toggle [408,316 291×32] (role=button data-test=dropdown__toggle expanded=false) {cur:pointer}
                                              div.cu-task-hero-section__row-data.cu-task-hero-section-tags-lazy__tags-list.reskin-enabled [408,316 291×32] (role=list) {d:flex ai:center gap:4px p:0px 33px 0px 8px rad:6px fs:14px lh:15.96px}
                                                span.cu-task-hero-section-tags__empty-label [416,324 35×16] "Vazio" {c:#8d8d8d}
                              div.cu-task-hero-section__task-properties-button__container.cu-hidden-print [253,348 902×26] {d:flex pos:absolute jc:space-between cur:pointer}
                                cu-task-field-options [0,0 0×0] {d:contents}
                                  button.cu-task-field-options__button [253,350 176×24] "Recolher campos vazios" (data-test=task-field-options__button) {d:flex ai:center jc:center gap:6px p:3px 7px 3px 5px m:2px 0px 0px rad:5px c:#838383 fs:12px fw:500 lh:16px}
                                    cu3-icon.cu3-icon [259,354 16×16] {d:flex ai:center jc:center fs:16px lh:21.3333px}
                          cu-task-view-task-content-description-expanded-collapsed [259,378 890×29] {m:0px 6px}
                            div.content-container [259,378 890×29]
                              cu-task-view-content-description [259,378 890×29] {pos:relative}
                                div.content-description-body.content-description-body_empty-prompt.content-description-body_empty-prompt-no-ai [259,378 890×29] {pos:relative}
                                  div [259,378 890×0]
                                    cu-task-editor.cu-task-editor.main-task-editor [259,378 890×0]
                                      div.cu-editor-wrapper.cu-editor-wrapper_sticky-actions.cu-editor-wrapper_task-description-editor [259,378 890×29] (data-test=task-editor-wrapper) {pos:absolute z:1}
                                        cu-task-editor-appearance-actions-slot [259,378 0×0]
                                          div.cu-task-editor__header-buttons [1149,369 0×9] {d:flex pos:absolute ai:center jc:flex-end p:5px 0px 4px}
                                        cu-task-editor-appearance-loading [0,0 0×0] {d:contents}
                                        cu-task-editor-appearance-remote-editing [259,378 0×0]
                                      cu-rich-editor-task-ui [259,378 0×0]
                                        cu-task-mention [259,378 0×0]
                                          div.task-mention-list.cu-dropdown [259,378 380×0] {pos:relative bg:#ffffff rad:6px sh:#000000/0.15 0px 2px 14px 0px z:100}
                                        div.cu-dropdown [259,378 890×0] {pos:relative}
                                          div.cu-dropdown__toggle [259,378 890×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                      cu-emoji-list-dropdown.cu-emoji-list-dropdown [259,378 0×0]
                                        div.cu-dropdown [259,378 890×0] {pos:relative}
                                          div.cu-dropdown__toggle [259,378 890×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                      div.cu-dropdown [259,378 890×0] {pos:relative}
                                        div.cu-dropdown__toggle [259,378 890×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                        ↳ (este bloco se repete ×5; último em y=378)
                                      cu-doc-page-avatar-dropdown.cu-doc-page-avatar-dropdown [259,378 890×0] {d:flex ai:center jc:center}
                                        div.cu-dropdown [704,378 0×0] {pos:relative}
                                          div.cu-dropdown__toggle [704,378 0×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                      cu-mention-selector-dropdown [259,378 0×0]
                                        div.cu-dropdown [259,378 890×0] {pos:relative}
                                          div.cu-dropdown__toggle [259,378 890×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                      cu-share-dialog-dropdown [259,378 0×0]
                                        div.cu-dropdown [259,378 890×0] {pos:relative}
                                          div.cu-dropdown__toggle [259,378 890×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                      cu-writing-tool-popover [259,378 0×0]
                                        div [259,378 890×0]
                                      cu-quill-rich-editor-image-gen [259,378 0×0]
                                        cu-image-gen-popover [259,378 890×0]
                                          div [259,378 890×0]
                                  div.generate-by-prompt-template-wrapper.cu-hidden-print [259,378 890×29] {bt:1px solid #f0f0f0}
                                    cu-generate-by-prompt-blank-editor-commands [259,379 890×28]
                                      div [259,379 890×28]
                                        cu-prompt-template-empty-description.cu-prompt-template-empty-description [259,379 890×28] (data-test=prompt-template-empty-description__menu)
                                          cu-dropdown-list-item.cu-dropdown-list-item.list-item [253,379 902×28] (data-test=prompt-template-empty-description__menu-) {d:flex m:0px -6px cur:pointer}
                                            button.cu-dropdown-list-item__link-container [253,379 902×28] (data-test=dropdown-list-item__blank) {d:flex dir:column p:4px 0px fs:13.3333px lh:normal}
                                              div.cu-dropdown-list-item__link.cu-dropdown-list-item__link_blank.cu-dropdown-list-item__link_v3 [253,383 902×20] {d:flex ai:center p:0px 8px}
                                                cu3-icon.cu3-icon.cu-dropdown-list-item__icon.cu-dropdown-list-item__icon_blank [261,385 16×16] (data-test=dropdown-list-item__icon) {d:flex ai:center jc:center m:-2px 8px -2px 0px c:#838383 fs:16px}
                                                div.cu-dropdown-list-item__title [285,385 862×16] (data-test=dropdown-list-item__title) {d:flex pos:relative ai:center p:0px 5px 0px 0px fs:14px lh:16.002px}
                                                  div.cu-dropdown-list-item__title-text [285,385 127×16] "Adicionar descrição" (data-test=dropdown-list-item__Adicionar descrição) {ov:hidden lh:16.1px}
                                  cu-task-view-slash-commands-editor-wrapper [259,407 0×0]
                          cu-task-view-flat-layout.cu-task-view-task-content__section.task-view-hide-on-print-description [253,431 902×467]
                            div.task-view-tabs__content [253,431 902×467] {p:0px 0px 0px 4px m:24px 0px 0px}
                              div.cu-task-view-task-content__subsection.cu-task-view-task-content__subsection--custom-fields [257,431 898×173]
                                cu-task-view-custom-fields-section.cu-task-view-custom-fields-section.cu-task-view-custom-fields-section__with-cf-task-types [257,431 898×173] (data-test=task-view-flat-layout__custom-fields-sec)
                                  cu-task-view-section-header.cu-task-view-section-header [251,431 904×32] (role=button) {d:flex pos:relative ai:center p:0px 4px 0px 6px m:0px 0px 0px -6px rad:8px}
                                    h6.cu-task-view-section-header__heading-wrapper.cu-task-view-section-header__heading [257,431 894×32] {d:flex ai:center gap:0px 4px rad:8px fs:14px fw:600 lh:17.5px}
                                      button.cu-task-view-section-header__arrow-button.cu-task-view-section-header-expanded [257,437 20×20] (expanded=true) {d:flex ai:center jc:center gap:4px rad:5px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                                        cu3-icon.cu3-icon.cu-task-view-section-header__arrow [260,440 14×14] (data-test=task-view-section-header__arrow) {d:flex ai:center jc:center}
                                        span [250,447 1×1] "Recolher" {pos:absolute m:-1px ov:hidden}
                                      button.cu-task-view-section-header__container.cu-task-view-section-header__clickable-area [281,431 870×32] (label=Campos data-test=task-view-section-header__subheader_Camp expanded=true) {d:flex pos:relative fs:13.3333px fw:400 lh:normal cur:pointer}
                                        span.cu-task-view-section-header__row [281,431 55×32] {d:flex ai:center ov:hidden}
                                          span.cu-task-view-section-header__title [281,439 55×16] "Campos" (data-test=task-view-section-header__title-Campos) {ov:hidden fs:14px fw:600 lh:16.002px}
                                    cu-search-input.cu-search-input [1151,434 0×26]
                                      div.cu-search-input__inner.cu-search-input__inner_show-label.cu-search-input__inner_task-activity-search [1151,434 0×26] (data-test=search-input__inner) {d:flex pos:relative ai:center jc:flex-end bg:#ffffff rad:6px cur:pointer}
                                        input.cu-search-input__input.cu-prevent-lastpass [1151,434 0×26] (data-test=search-input__input type=text placeholder=Pesquisar...) {ov:clip fs:14px lh:16px cur:text}
                                  div.cu-task-view-section-content [276,467 875×109] {m:0px 4px 0px 19px}
                                    cu-task-view-custom-fields.cu-task-view-custom-fields.task-view__custom-fields__location-section.is-expanded [276,467 875×109] (data-test=task-view-custom-fields)
                                      cu-task-custom-fields.cu-task-custom-fields.cu-task-custom-fields-v3.cu-task-custom-fields-v4 [276,467 875×109]
                                        div.cu-custom-fields.cu-custom-fields-v3.cu-custom-fields__toggle-hidden [276,467 875×109] {m:0px 0px 28px}
                                          section.cu-task-custom-fields__container [276,467 875×109] (label=Campos personalizados) {pos:relative}
                                            div.cu-task-custom-fields__container-inner [276,467 875×109] {m:4px 0px 0px}
                                              cdk-virtual-scroll-viewport.cu-task-custom-fields__virtual-scroll-viewport [276,467 875×109] {pos:relative p:0px 0px 1px}
                                                div [276,467 875×108] {pos:absolute}
                                                  div.cu-task-custom-fields__virtual-scroll-row [276,467 875×36]
                                                    div.cu-task-custom-fields__row.cu-task-custom-fields__row_in-task-view.cu-task-custom-fields__row--label-actions [276,467 875×36] (data-test=task-custom-fields__row) {d:flex pos:relative}
                                                    ↳ (este bloco se repete ×3; último em y=539)
                                                div [276,467 875×108]
                                            div.cu-task-custom-fields__row.cu-task-custom-fields__row_unset.cu-task-custom-fields__row_actions [276,576 875×0] {d:flex pos:relative ai:center}
                                              div.cu-task-custom-fields__collapsed [276,576 0×0] {d:flex ai:center cur:pointer}
                                            div.cu-task-custom-fields__resizer [276,467 220×109] {pos:absolute}
                                              div.cu-task-custom-fields__resizer-handle.cu-task-custom-fields__resizer-handle-full [492,467 9×109] {pos:absolute z:100 cur:col-resize}
                                  div.cu-dropdown [257,604 898×0] {pos:relative}
                                  cu-task-view-custom-fields-combined-actions [257,604 898×0] {d:flex}
                                    cu-task-view-task-type-custom-fields-actions-dropdown [257,604 0×0]
                                    cu-task-view-location-custom-fields-actions-dropdown [257,604 0×0]
                                      cu-custom-field-type-selection-dropdown-list [257,604 0×0]
                                        cu-dropdown-list.cu-dropdown-list.cu-custom-field-type-selection-dropdown [257,604 0×0]
                                          div.cu-dropdown [257,604 0×0] {pos:relative}
                                            div.cu-dropdown__toggle [257,604 0×0] (role=button expanded=false) {cur:pointer}
                                    ↳ (este bloco se repete ×3; último em y=604)
                                  cu-task-view-location-custom-fields-actions-dropdown [257,604 0×0]
                                    cu-custom-field-type-selection-dropdown-list [257,604 0×0]
                                      cu-dropdown-list.cu-dropdown-list.cu-custom-field-type-selection-dropdown [257,604 0×0]
                                        div.cu-dropdown [257,604 898×0] {pos:relative}
                                          div.cu-dropdown__toggle [257,604 898×0] (role=button expanded=false) {cur:pointer}
                                  cu-task-view-task-type-custom-fields-actions-dropdown [257,604 0×0]
                              div.cu-task-view-task-content__subsection [257,604 898×32] (data-test=task-view__subtasks-section)
                                cu-task-view-subtasks-section.cu-task-view-subtasks-section_collapsed [257,604 898×32]
                                  cu-task-view-section-header.cu-task-view-section-header.cu-task-view-task-content-subtasks-expanded-collapsed__header.cu-task-view-use-flat-layout [251,604 904×32] (data-test=task-view-task-content-subtasks-expanded) {d:flex pos:relative ai:center p:0px 4px 0px 6px m:0px 0px 8px -6px rad:8px}
                                    div.cu-task-view-section-header__heading [257,604 894×32] {d:flex ai:center gap:normal 4px rad:8px cur:pointer}
                                      div.cu-task-view-section-header__heading-icon [257,610 20×20] {d:flex ai:center jc:center c:#646464}
                                        cu3-icon.cu3-icon.cu-task-view-section-header__heading-icon-svg [259,612 16×16] {d:flex ai:center jc:center}
                                      span.cu-task-view-section-header__heading-title [281,611 870×18] "Adicionar subtarefa" {fs:14px lh:17.5px}
                              div.cu-task-view-task-content__subsection [257,644 898×32]
                                cu-task-view-relationships-section.task-v4 [257,644 898×32] (data-test=task-view-relationships-section)
                                  cu-task-view-section-header.cu-task-view-section-header.cu-task-view-task-content-relationships-expanded-collapsed__header.cu-hidden-print [251,644 904×32] (role=button label=Menu suspenso data-test=task-view-task-content-relationships-exp expanded=false) {d:flex pos:relative ai:center p:0px 4px 0px 6px m:0px 0px 8px -6px rad:8px cur:pointer}
                                    div.cu-task-view-section-header__heading [257,644 894×32] {d:flex ai:center gap:normal 4px rad:8px}
                                      div.cu-task-view-section-header__heading-icon [257,650 20×20] {d:flex ai:center jc:center c:#646464}
                                        cu3-icon.cu3-icon.cu-task-view-section-header__heading-icon-svg [259,652 16×16] {d:flex ai:center jc:center}
                                      span.cu-task-view-section-header__heading-title [281,651 870×18] "Vincular itens ou adicionar dependências" {fs:14px lh:17.5px}
                                  div.cu-task-view-section-content [281,684 870×0] {m:0px 4px 0px 24px}
                              div.cu-task-view-task-content__subsection [257,684 898×162] (data-test=task-view__checklists-section) {p:0px 0px 12px}
                                cu-task-view-checklists-section.cu-task-view-checklists-section.cu-task-view-checklists-section_expanded [257,684 898×150]
                                  cu-task-view-section-header.cu-task-view-section-header.cu-task-view-task-content-checklists-expanded-collapsed__header.cu-task-view-use-flat-layout [251,684 904×32] (data-test=task-view-task-content-checklists-expand) {d:flex pos:relative ai:center p:0px 4px 0px 6px m:0px 0px 6px -6px rad:8px}
                                    h6.cu-task-view-section-header__heading-wrapper.cu-task-view-section-header__heading [257,684 894×32] {d:flex ai:center gap:0px 4px rad:8px fs:14px fw:600 lh:17.5px}
                                      button.cu-task-view-section-header__arrow-button.cu-task-view-section-header-expanded [257,690 20×20] (expanded=true) {d:flex ai:center jc:center gap:4px rad:5px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                                        cu3-icon.cu3-icon.cu-task-view-section-header__arrow [260,693 14×14] (data-test=task-view-section-header__arrow) {d:flex ai:center jc:center}
                                        span [250,700 1×1] "Recolher" {pos:absolute m:-1px ov:hidden}
                                      button.cu-task-view-section-header__container.cu-task-view-section-header__clickable-area [281,684 870×32] (label=Checklists data-test=task-view-section-header__subheader_Chec expanded=true) {d:flex pos:relative fs:13.3333px fw:400 lh:normal cur:pointer}
                                        span.cu-task-view-section-header__row [281,684 71×32] {d:flex ai:center ov:hidden}
                                          span.cu-task-view-section-header__title [281,692 71×16] "Checklists" (data-test=task-view-section-header__title-Checklis) {ov:hidden fs:14px fw:600 lh:16.002px}
                                  div.cu-task-view-section-content [281,722 870×112] {m:0px 4px 0px 24px}
                                    div.cu-task-view-checklists-section__popover-anchor [281,722 870×0]
                                    cu-checklist.cu-checklist.cu-checklist__empty.cu-checklist_v3 [281,722 870×112] (data-test=checklist__root)
                                      div.cu-checklist-wrapper [281,722 870×76] (data-test=checklist__container) {rad:10px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px}
                                        div.cu-checklist__title [281,722 870×40] (data-test=checklist__title) {d:flex ai:center gap:4px p:8px 10px 5px 6px}
                                          h3.cu-checklist__title-heading [287,730 75×27] {rad:6px ov:hidden}
                                            div.cu-checklist__name [288,731 73×25] "Checklist" (data-test=checklist__name contenteditable=true) {p:2px 6px ov:hidden fs:14px fw:500 lh:21px cur:text}
                                          div.cu-checklist__actions [1117,732 24×24] {d:flex p:2px m:0px 0px 0px 750.625px bg:#ffffff rad:7px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px z:1}
                                            cu-checklist-menu.cu-checklist-menu [1119,734 20×20]
                                              div.cu-dropdown [1119,734 20×20] {pos:relative}
                                                button.cu-dropdown__toggle [1119,734 20×20] (role=button data-test=checklist-menu__ellipsis expanded=false) {d:inline-flex ai:center jc:center gap:4px rad:5px c:#646464 fs:14px fw:500 lh:18.6667px cur:pointer}
                                                  cu3-icon.cu3-icon [1122,737 14×14] {d:flex ai:center jc:center}
                                                  span [1118,743 1×1] "Opções" {pos:absolute m:-1px ov:hidden}
                                        div [281,762 870×0]
                                        cu-checklist-new-item.cu-checklist-new-item.cu-checklist-new-item_root.cu-hidden-print [281,762 870×36] (data-test=checklist-new-item__root) {d:flex pos:relative ai:center p:0px 1px 4px 0px}
                                          div.cu-checklist-new-item__row.cu-checklist-new-item__row-main [295,766 853×24] {d:flex ai:center m:0px 0px 0px 16px}
                                            div.cu-checklist-new-item__plus.icon [295,771 14×14] {d:flex ai:center jc:center m:0px 9px 0px 0px}
                                            div.cu-checklist-new-item__name-wrapper [318,768 794×21] {d:flex pos:relative ai:center}
                                              div.cu-checklist-new-item__name.cu-checklist-new-item__name-placeholder [318,768 786×21] (data-test=checklist-new-item__name contenteditable=true) {pos:relative m:0px 8px 0px 0px c:#8d8d8d fs:14px lh:17px cur:text}
                                              span.cu-checklist-new-item__name-placeholder-text [318,771 92×14] "Adicionar item" (data-test=checklist-new-item__name__text) {pos:absolute ov:hidden c:#8d8d8d fs:14px lh:14px cur:text}
                                            cu-user-and-groups-list-dropdown.cu-user-and-groups-list-dropdown.cu-user-list-dropdown.cu-checklist-new-item__assignee [1112,766 27×24] {m:0px 9px 0px 0px}
                                              cu-user-list-dropdown.cu-user-list-dropdown [1112,766 27×24] (data-test=user-list-dropdown)
                                                div.cu-dropdown [1112,766 27×24] {pos:relative}
                                                  div.cu-dropdown__toggle [1112,766 27×24] (role=button data-test=user-list-dropdown__toggle expanded=false) {cur:pointer}
                                                    cu-user-group [1112,766 27×24]
                                      div.cu-checklist-footer-controls [281,798 870×36] {d:flex gap:8px p:6px 0px 6px 6px}
                                        button.cu-checklist-footer-controls-button [287,804 146×24] "Adicionar checklist" (data-test=task-view-checklists-tab__create-item__A) {d:flex ai:center jc:center gap:9px p:0px 7px rad:6px c:#8d8d8d fs:12px lh:16px cur:pointer}
                                          cu3-icon.cu3-icon.cu-checklist-footer-controls-icon [295,809 14×14] {d:flex ai:center jc:center fs:14px lh:18.6667px}
                              div.cu-task-view-task-content__subsection [257,846 898×52] {p:0px 0px 12px}
                                cu-task-view-attachments-section.cu-task-view-attachments-section [257,846 898×40]
                                  div [257,846 898×32]
                                    cu-task-view-section-header.cu-task-view-section-header.cu-task-view-task-content-attachments-expanded-collapsed__header.cu-hidden-print [251,846 904×32] (data-test=task-view-task-content-attachments-expan) {d:flex pos:relative ai:center p:0px 4px 0px 6px m:0px 0px 8px -6px rad:8px}
                                      div.cu-task-view-section-header__heading [257,846 894×32] {d:flex ai:center gap:normal 4px rad:8px cur:pointer}
                                        div.cu-task-view-section-header__heading-icon [257,852 20×20] {d:flex ai:center jc:center c:#646464}
                                          cu3-icon.cu3-icon.cu-task-view-section-header__heading-icon-svg [259,854 16×16] {d:flex ai:center jc:center}
                                        span.cu-task-view-section-header__heading-title [281,853 870×18] "Anexar arquivo" {fs:14px lh:17.5px}
                      div.cu-task-view-task-content__sticky.cu-task-view-task-content__sticky_bottom.cu-hidden-print [65,896 1288×0] {d:flex pos:sticky z:110}
                        div.cu-task-view-task-content__sticky-body [65,932 998×0] {p:0px 0px 0px 28px m:36px 0px 48px}
                        div.cu-task-view-task-content__sticky-edge [1063,896 290×0]
                      cu-task-view-subtasks-sidebar-toggle.cu-task-view-task-content__floating-subtasks-toggle.cu-task-view-task-content__floating-wrapper.task-view-hide-on-print-description [75,96 28×28] (data-test=task-view-task-content__floating-subtask) {pos:absolute bg:#ffffff rad:9px z:105}
                        button.cu-task-view-subtasks-sidebar-toggle__btn [75,96 28×28] (data-test=task-view-subtasks-sidebar-toggle__btn) {d:inline-flex ai:center jc:center gap:4px p:0px 8px rad:8px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                          cu3-icon.cu3-icon [81,102 16×16] {d:flex ai:center jc:center}
                          span [74,110 1×1] "Abrir barra lateral da subtarefa" {pos:absolute m:-1px ov:hidden}
                    cu-task-view-right-sidebar.cu-task-view-right-sidebar.expanded.task-view-hide-on-print-description [1353,86 560×810] {pos:absolute}
                      cu-task-view-floating-sidebar.floating-sidebar [1311,96 32×122] {d:flex pos:absolute dir:column ai:flex-start gap:2px p:2px bg:#ffffff rad:9px z:105}
                        cu-task-view-relationships-button.collapse.expanded [1313,98 28×28]
                          div.cu-task-view-relationships-button.cu-task-view-relationships-button--empty [1313,98 28×28] (data-test=task-view-relationships-buttons-lazy__Co) {d:flex dir:column ai:center gap:4px}
                            button.cu-task-view-relationships-button__trigger [1313,98 28×28] (role=tab data-test=task-view-relationships-buttons-lazy__bu selected=false) {d:flex pos:relative ai:center jc:center gap:4px rad:8px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                              cu3-icon.cu3-icon [1319,104 16×16] {d:flex ai:center jc:center}
                            span.cu-task-view-relationships-button__text [1310,97 1×1] "Recolher" {pos:absolute m:-1px ov:hidden c:#646464 fs:10px fw:600 lh:12px}
                        cu-task-view-relationships-button [1313,128 28×28]
                          div.cu-task-view-relationships-button.cu-task-view-relationships-button--empty [1313,128 28×28] (data-test=task-view-relationships-buttons-lazy__Ac) {d:flex dir:column ai:center gap:4px}
                            button.cu-task-view-relationships-button__trigger [1313,128 28×28] (role=tab data-test=task-view-relationships-buttons-lazy__bu selected=true) {d:flex pos:relative ai:center jc:center gap:4px bg:#000000/0.06 rad:8px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                              cu3-icon.cu3-icon [1319,134 16×16] {d:flex ai:center jc:center}
                            span.cu-task-view-relationships-button__text [1310,127 1×1] "Atividade" {pos:absolute m:-1px ov:hidden c:#646464 fs:10px fw:600 lh:12px}
                        cu-task-view-relationships-button [1313,158 28×28]
                          div.cu-task-view-relationships-button.cu-task-view-relationships-button--empty [1313,158 28×28] (data-test=task-view-relationships-buttons-lazy__Re) {d:flex dir:column ai:center gap:4px}
                            button.cu-task-view-relationships-button__trigger [1313,158 28×28] (role=tab data-test=task-view-relationships-buttons-lazy__bu selected=false) {d:flex pos:relative ai:center jc:center gap:4px rad:8px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                              cu3-icon.cu3-icon [1319,164 16×16] {d:flex ai:center jc:center}
                            span.cu-task-view-relationships-button__text [1310,157 1×1] "Itens relacionados" {pos:absolute m:-1px ov:hidden c:#646464 fs:10px fw:600 lh:12px}
                        cu-toggl-integration [0,0 0×0] {d:contents}
                        cu-task-view-relationships-button [1313,188 28×28]
                          div.cu-task-view-relationships-button.cu-task-view-relationships-button--empty [1313,188 28×28] (data-test=task-view-relationships-buttons-lazy__Ad) {d:flex dir:column ai:center gap:4px}
                            button.cu-task-view-relationships-button__trigger [1313,188 28×28] (role=tab data-test=task-view-relationships-buttons-lazy__bu selected=false) {d:flex pos:relative ai:center jc:center gap:4px rad:8px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                              cu3-icon.cu3-icon [1319,194 16×16] {d:flex ai:center jc:center}
                            span.cu-task-view-relationships-button__text [1310,187 1×1] "Adicionar links" {pos:absolute m:-1px ov:hidden c:#646464 fs:10px fw:600 lh:12px}
                      div.container [1353,86 560×810] {pos:relative bg:#f9f9f9 bl:1px solid #e8e8e8}
                        cu-task-view-task-activity-lazy.component.activity.show [1354,86 559×810] {d:flex pos:absolute dir:column}
                          cu-task-activity-search-and-filter [1354,86 559×49] {pos:relative}
                            cu-right-sidebar-v4-header [1354,86 559×49]
                              div.header-container [1354,86 559×49] {d:flex dir:column gap:8px p:12px 12px 12px 16px bg:#ffffff bb:1px solid #e8e8e8}
                                div.header-container__info-and-actions [1370,98 531×24] {d:flex ai:center jc:space-between gap:8px}
                                  div.header-container__info-and-actions__text [1370,102 51×16] "Activity" {fs:14px fw:600 lh:16.002px}
                                  div.header-container__info-and-actions__actions [1809,98 92×24] {d:flex ai:center gap:2px c:#646464}
                                    button [1809,98 24×24] (data-test=task-activity-search-and-filter__search-) {d:flex ai:center jc:center gap:4px rad:6px fs:16px fw:500 lh:21.3333px cur:pointer}
                                      cu3-icon.cu3-icon [1813,102 16×16] {d:flex ai:center jc:center}
                                      span [1353,110 1×1] "Pesquisar" {pos:absolute m:-1px ov:hidden}
                                    cu-users-watchers-dropdown [1835,98 40×24]
                                      cu-users.cu-hidden-print.cu-task-activity-search-and-filter__watchers [1835,98 40×24]
                                        div.cu-dropdown [1835,98 40×24] (data-test=task-activity-search-and-filter__watcher) {pos:relative}
                                          button.toggle.current-user-selected.cu-dropdown__toggle [1835,98 40×24] (role=button data-test=users__add-or-remove-watchers expanded=false) {d:inline-flex ai:center jc:center gap:4px p:0px 4px rad:8px c:#067a6f fs:14px fw:500 lh:16px cur:pointer}
                                            cu-user-watch-toggle [0,0 0×0] {d:contents}
                                              span.watchers-toggle-content [0,0 0×0] {d:contents}
                                                cu3-icon.cu3-icon.watchers-toggle-icon [1840,102 16×16] {d:flex ai:center jc:center fs:16px lh:18.2857px}
                                                span.watchers-toggle-count [1860,102 10×16] "1" (data-test=watchers-toggle-count)
                                                span [1834,110 1×1] "Alterar observadores" {pos:absolute m:-1px ov:hidden}
                                                span [1834,110 1×1] "1 seguidor será(ão) notificada(s)" {pos:absolute m:-1px ov:hidden}
                                    cu-activity-fields-filter.cu-activity-fields-filter.cu-hidden-print.cu-task-activity-search-and-filter__filter [1877,98 24×24] (data-test=task-activity-search-and-filter__filter)
                                      cu-dropdown-list.cu-dropdown-list [1877,98 24×24]
                                        div.cu-dropdown [1877,98 24×24] {pos:relative}
                                          div.cu-task-activity-search-and-filter__actions-btn.cu-dropdown__toggle [1877,98 24×24] (role=button expanded=false) {d:flex ai:center jc:center rad:6px cur:pointer}
                                            div.icon [1882,103 14×14] {d:flex ai:center jc:center}
                                            span [1876,110 1×1] "Filtrar atividade" {pos:absolute m:-1px ov:hidden}
                          cu-task-activity-summary [1354,135 559×0]
                          div.cu-task-view-task-activity-lazy__body.cu-task-view-task-activity-lazy__body--without-tray-clearance [1354,135 559×761] {d:flex dir:column}
                            cu-task-activity-stream [1354,135 559×619] {d:grid pos:relative bg:#f9f9f9 cols:559px}
                              div.cu-task-activity-stream__container.cu-lazy-renderer_contain-layout [1354,135 559×619] {d:flex dir:column-reverse p:0px 2px 0px 12px ov:auto scroll z:0}
                                div.cu-task-activity-stream__load-more.bottom [1366,746 534×8]
                                cu-task-activity-stream-item-wrapper.cu-task-activity-stream-item-wrapper [1366,706 534×40]
                                  div.container.generic [1366,706 534×32] {m:0px 0px 8px}
                                    cu-task-activity-stream-item.cu-task-history-item [1366,706 534×32] (data-test=task-activity-stream-item-wrapper__item_)
                                      div.task-history-item.cu-task-history-item_generic [1366,706 534×32] (data-test=task-activity-stream-item__item-generic) {d:flex ai:baseline gap:8px p:8px 17px 8px 4px rad:8px cols:16px 1fr auto c:#838383 fs:12px lh:16.008px}
                                        p.task-history-item__content [1394,714 224×16]
                                          span.task-history-item__name.task-history-item__name_btn.task-history-item__name_btn-hover [1394,714 129×15] "Fabricio Saraiva (você)" {cur:pointer}
                                          span.task-history-item__text.task-history-item__spaced-i18n [1526,714 92×15] "criou esta tarefa" {m:0px 0px 0px 3.02344px}
                                        div.task-history-item__date [1820,714 63×16] "55 minutos" {m:0px 0px 0px 193.625px}
                                div.cu-task-activity-stream__load-more [1366,698 534×8]
                            cu-task-activity-add-comment [0,0 0×0] {d:contents}
                              div.cu-task-activity-add-comment__overlay-container [1354,754 559×0] {pos:relative}
                                cu-comment-users.task__overlay.cu-comment-users [1898,716 0×0] {d:flex pos:absolute}
                                div.cu-task-activity-add-comment__share-container [1354,754 559×0] {p:0px 12px}
                                  cu-share-agent-dialog [1366,754 0×0]
                                  cu-share-dialog.cu-task-activity-add-comment__share-container-share-dialog [1366,754 0×0]
                              div.cu-task-activity-add-comment__container.task-column__footer.second [1354,754 559×142] (data-test=task-activity-add-comment__container) {pos:relative p:12px z:10}
                                div.cu-task-activity-add-comment__resizer [1354,750 559×9] (data-test=task-activity-add-comment__resize-handle) {pos:absolute cur:row-resize}
                                div.cu-task-activity-add-comment__body.cu-task-activity-add-comment__body_comment-bar-tabs-enabled [1366,766 535×118] {d:grid pos:relative cols:535px}
                                  cu-comment-bar.cu-task-activity-add-comment__comment-row.cu-task-activity-add-comment__comment-bar-host.cu-comment-bar [1366,766 535×118] (data-test=view-task__comment-bar) {pos:relative}
                                    div [1366,766 535×0]
                                      cu-writing-tool-popover [1366,766 0×0]
                                        div [1366,766 535×0]
                                      cu-image-gen-popover [1366,766 535×0]
                                        div [1366,766 535×0]
                                    cu-comment-bar-overrides.comment-bar-overrides_v3 [0,0 0×0] {d:contents}
                                      div.comment-bar-root.comment-bar-root_has-tabs [1366,766 535×118] {d:flex pos:relative dir:column gap:4px p:4px bg:#000000/0.024 rad:12px 12px 16px 16px}
                                        div.cu-comment-bar__brain-premium-dock [1366,766 535×0] {pos:absolute}
                                          cu-brain-mention-premium-notice.cu-comment-bar__brain-premium-notice [1366,766 535×0] {pos:absolute bg:#ffffff rad:16px 16px 0px 0px}
                                        cu-comment-bar-compose-type-tabs [1370,770 527×28] {d:flex ai:center jc:space-between}
                                          cu3-tab-group.comment-bar-tabs__tab-group.small [1370,770 132×28] (role=tablist label=Tipo de comentário data-test=comment-bar__compose-type-tabs) {d:flex gap:4px p:2px 4px}
                                            button.small.tab.active [1374,772 75×24] (role=tab data-test=comment-bar__compose-tab-message type=button selected=true) {rad:6px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px fs:12px fw:500 lh:16.008px cur:pointer}
                                              span.tab-label [1374,772 75×24] "Comentário" {d:flex ai:center gap:4px p:4px bg:#ffffff rad:6px}
                                            button.small.tab [1453,772 45×24] (role=tab data-test=comment-bar__compose-tab-email type=button selected=false) {rad:6px c:#646464 fs:12px fw:500 lh:16.008px cur:pointer}
                                              span.tab-label [1453,772 45×24] "E-mail" {d:flex ai:center gap:4px p:4px rad:6px}
                                        div.comment-bar-root__panes [0,0 0×0] {d:contents}
                                          div.comment-bar-root__pane.comment-bar-root__pane_open [0,0 0×0] {d:contents}
                                            div.comment-bar-root__pane-inner [0,0 0×0] {d:contents}
                                              div.comment-bar-root__panel.comment-bar-root__panel_has-tabs [1370,802 527×78] (role=tabpanel data-test=comment-bar-root-panel) {d:flex dir:column}
                                                div.comment-bar.comment-bar_tabs-enabled.comment-bar_within-tabs [1370,802 527×78] {d:flex pos:relative dir:column bg:#ffffff rad:12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px}
                                                  div.comment-bar__content.cu-comment-editor-wrapper [1370,802 527×44] {pos:relative}
                                                    div [1370,802 527×0]
                                                    div.comment-bar__editor.cu-comment-bar__editor.cu-comment-editor-content [1370,802 527×44] (data-test=comment-bar__editor) {pos:relative p:6px 6px 5px rad:0px 10px 0px 0px ov:hidden}
                                                  div.comment-bar__footer.comment-bar__footer_tabs-enabled [1370,846 527×34] {d:flex pos:relative ai:center jc:flex-end gap:4px p:0px 6px 6px z:1}
                                                    div.comment-bar__toolbar-switch [1376,846 515×28] {d:flex pos:relative ai:center jc:flex-end gap:4px}
                                                  cu-emoji-list-dropdown.cu-emoji-list-dropdown [1370,880 527×0]
                                                    div.cu-dropdown [1370,880 527×0] {pos:relative}
                                    cu-rich-editor-task-ui [1366,884 0×0]
                                      cu-task-mention [1366,884 0×0]
                                        div.task-mention-list.cu-dropdown [1366,884 380×0] {pos:relative bg:#ffffff rad:6px sh:#000000/0.15 0px 2px 14px 0px z:100}
                                      div.cu-dropdown [1366,884 535×0] {pos:relative}
                                        div.cu-dropdown__toggle [1366,884 535×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                    div.cu-dropdown [1366,884 535×0] {pos:relative}
                                      div.cu-dropdown__toggle [1366,884 535×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                      ↳ (este bloco se repete ×3; último em y=884)
                                    cu-mention-selector-dropdown [1366,884 0×0]
                                      div.cu-dropdown [1366,884 535×0] {pos:relative}
                                        div.cu-dropdown__toggle [1366,884 535×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                    cu-doc-page-avatar-dropdown.cu-doc-page-avatar-dropdown [1366,884 535×0] {d:flex ai:center jc:center}
                                      div.cu-dropdown [1634,884 0×0] {pos:relative}
                                        div.cu-dropdown__toggle [1634,884 0×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                    div.cu-dropdown [1366,884 535×0] {pos:relative}
                                      div.cu-dropdown__toggle [1366,884 535×0] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                    cu-use-syncups-modal.comment-bar__syncups-modal [1366,884 0×0]
                                  cu-task-view-slash-commands-editor-wrapper.cu-task-activity-add-comment__slash [1366,766 0×0] {pos:absolute}
                        div.cu-task-view-body__resizer.cu-task-view-body__resizer_right-sidebar [1349,86 9×810] {pos:absolute z:115 cur:col-resize}
              cu-task-view-telemetry [65,896 1848×0]
          cu-task-view-print-overlay [0,903 0×0]
      cu-doc-keeper [0,903 0×0]
      cu-page-modal [0,903 0×0]
      cu-app-view-toast-initializer [0,903 0×0]
        cu-toast-lazy-wrapper [0,903 0×0]
          cu-toast-new.cu-toast-new.cu-toast-manager-item.cu-toast-new__center [960,891 0×0] {pos:fixed z:1000}
            div.cu-toast-manager-item.cu-toast-new__container.cu-toast-group [960,891 0×0] (role=status) {d:flex pos:relative dir:column ai:flex-start z:2}
            div.cu-toast-new__minimize-container.cu-toast-group [963,842 0×0] {d:flex pos:absolute}
        cu-toast-lazy-wrapper [0,903 0×0]
          cu-toast-new.cu-toast-new.cu-toast-manager-item.cu-toast-new__right [1896,891 0×0] {pos:fixed z:1000}
            div.cu-toast-manager-item.cu-toast-new__container.cu-toast-new__container-right [1896,891 0×0] (role=status) {d:flex pos:relative dir:column ai:flex-end z:2}
            div.cu-toast-new__minimize-container.cu-toast-group [1899,842 0×0] {d:flex pos:absolute}
      cu-attachments-viewer [0,903 0×0]
      cu-app-loader [0,903 0×0]
      cu-chat-modal-outlet [0,903 0×0]
        div.react-node [0,903 1920×0]
      cu-react-app [0,903 0×0]
        div [0,903 1920×0]
      cu3-icons [0,903 0×0]
      cu-chat-bot-trigger [0,903 0×0]
      cu-app-view-services-initializer [0,903 0×0]
  div.ql-bubble.ql-tooltip-container.comment-bar-tooltip-container [0,903 1920×0] (data-test=comment-bar-tooltip-container) {pos:relative}
    div.ql-tooltip.ql-hidden [0,861 520×32] {pos:absolute rad:25px z:10 c:#ffffff}
      cu-rich-editor-toolbar.cu-rich-editor-toolbar.cu-rich-editor-toolbar_v2.cu-hidden-print [12,861 508×32] (data-test=editor-toolbar-unpinned) {d:flex pos:relative ai:center p:2px m:0px 0px 0px 12px bg:#ffffff rad:8px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000}
        div.cu-rich-editor-toolbar__row [14,863 504×28] (data-test=toolbar-row) {d:flex ai:center gap:1px}
          cu-rich-editor-toolbar-lists [14,863 48×28]
            div.combo-button [14,863 48×28] {d:flex pos:relative}
              button.format-list-button [14,863 28×28] (data-test=toolbar-list-button-bullet) {p:6px rad:6px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                cu3-icon.cu3-icon [20,869 16×16] {d:inline-flex ai:center jc:center}
                span [13,868 1×1] "Lista com marcadores" {pos:absolute m:-1px ov:hidden}
              button.menu-trigger [42,863 20×28] (role=button data-test=toolbar-list-select type=button haspopup=menu expanded=false) {p:6px 4px 6px 0px rad:6px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                cu3-icon.cu3-icon [42,869 16×16] {d:inline-flex ai:center jc:center}
                span [13,868 1×1] "Todas as listas" {pos:absolute m:-1px ov:hidden}
          cu-rich-editor-toolbar-block-items [63,863 69×28] (data-test=toolbar-text-size-select)
            button.menu-trigger [63,863 69×28] (role=button type=button haspopup=menu expanded=false) {d:flex ai:center jc:center gap:4px p:6px 8px 6px 6px rad:6px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
              span [69,869 36×16] "Texto"
              cu3-icon.cu3-icon [109,869 16×16] {d:flex ai:center jc:center m:0px -1px 0px 0px fs:16px lh:18.2857px}
              span [11,877 1×1] "Transformar em" {pos:absolute m:-1px ov:hidden}
          div.ql-formats-separator [134,867 1×20] {m:0px 1px bg:#f0f0f0}
          cu-rich-editor-toolbar-font-color.cu-rich-editor-toolbar-font-color.cu-rich-editor-toolbar-font-color_v2 [0,0 0×0] {d:contents}
            button.menu-trigger [137,863 28×28] (role=button data-test=cu-rich-editor-toolbar-font-color-trigge type=button haspopup=menu expanded=false) {d:flex ai:center jc:center gap:4px p:4px rad:6px c:#202020 fs:14px fw:500 lh:16px cur:pointer}
              span.cu-rich-editor-toolbar__text-color-option.cu-rich-editor-toolbar__trigger-square [141,867 20×20] {d:grid jc:center bt:1px solid #000000/0.192 bb:1px solid #000000/0.192 bl:1px solid #000000/0.192 br:1px solid #000000/0.192 rad:6px cols:9.84375px fw:600}
              span [11,877 1×1] "Cor do texto" {pos:absolute m:-1px ov:hidden}
          button [166,863 28×28] (data-test=toolbar-format-bold) {p:6px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
            cu3-icon.cu3-icon [172,869 16×16] {d:inline-flex ai:center jc:center}
            span [11,868 1×1] "Negrito" {pos:absolute m:-1px ov:hidden}
            ↳ (este bloco se repete ×5; último em y=863)
          cu-rich-editor-toolbar-alignment [311,863 49×28]
            button.menu-trigger [311,863 49×28] (role=button data-test=toolbar-alignment-trigger type=button haspopup=menu expanded=false) {d:flex ai:center jc:center gap:4px p:6px 8px 6px 6px rad:6px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
              cu3-icon.cu3-icon [317,869 16×16] {d:flex ai:center jc:center fs:16px lh:18.2857px}
              cu3-icon.cu3-icon [337,869 16×16] {d:flex ai:center jc:center m:0px -1px 0px 0px fs:16px lh:18.2857px}
              span [11,877 1×1] "Alinhamento" {pos:absolute m:-1px ov:hidden}
          div.ql-formats-separator [362,867 1×20] {m:0px 1px bg:#f0f0f0}
          div [365,863 28×28]
            button [365,863 28×28] (data-test=toolbar-format-link) {p:6px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
              cu3-icon.cu3-icon [371,869 16×16] {d:inline-flex ai:center jc:center}
              span [11,868 1×1] "Insira um link" {pos:absolute m:-1px ov:hidden}
          cu-rich-editor-toolbar-create-task [394,863 91×28]
            div.combo-button [394,863 91×28] {d:flex pos:relative}
              button.primary-button [394,863 73×28] "Tarefa" (data-test=toolbar-create-task-ai) {d:flex ai:center jc:center gap:4px p:6px rad:6px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                cu3-icon.cu3-icon.primary-button-icon [400,869 16×16] {d:flex ai:center jc:center c:#067a6f fs:16px lh:18.2857px}
              button.menu-trigger [465,863 20×28] (role=button data-test=toolbar-create-task__dropdown-trigger type=button haspopup=menu expanded=false) {p:6px 4px 6px 0px m:0px 0px 0px -2px rad:6px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                cu3-icon.cu3-icon [465,869 16×16] {d:inline-flex ai:center jc:center}
                span [393,868 1×1] "Opções de criação de tarefas" {pos:absolute m:-1px ov:hidden}
          div.ql-formats-separator [487,867 1×20] {m:0px 1px bg:#f0f0f0}
          cu-rich-editor-toolbar-more-menu.cu-rich-editor-toolbar-more-menu.cu-rich-editor-toolbar-more-menu_v2 [490,863 28×28]
            button.menu-trigger [490,863 28×28] (role=button data-test=toolbar-more-actions type=button haspopup=menu expanded=false) {p:6px rad:6px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
              cu3-icon.cu3-icon [496,869 16×16] {d:inline-flex ai:center jc:center}
              span [11,868 1×1] "Mais configurações" {pos:absolute m:-1px ov:hidden}
  div.ql-bubble.ql-tooltip-container [0,903 1920×0] {pos:relative}
    div.ql-tooltip.ql-hidden [0,893 0×0] {pos:absolute rad:25px z:10 c:#ffffff}
  div.ReactModalPortal [0,903 1920×0]
  div [0,903 1920×0]
    div [0,903 1920×0]
    div [0,903 1920×0]
```
