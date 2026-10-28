# Estrutura renderizada — Chat

URL: https://app.clickup.com/36949648/chat/r/launchpad
Nós visíveis: 660 · linhas do esboço: 497
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
body.cu-os-mac.cu-scrollbar.cu-teal [0,0 1920×903] {d:flow-root bg:#ffffff ov:clip c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
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
                              cu-simple-bar-item.cu-simple-bar-home-switch__item.active.home [16,44 32×62] {d:flex pos:relative ai:center jc:center}
                                a.cu-simple-bar-item__link.active [16,50 32×32] {d:flex pos:relative ai:center jc:center m:6px 0px 24px cur:pointer}
                                  span.cu-simple-bar-item__inner.active [16,50 32×32] {d:flex ai:center jc:center bg:#ffffff rad:8px sh:#000000/0.106 0px 1px 3px 0px, #000000/0.106 0px 1px 2px -1px}
                                    cu-simple-bar-item-icon.cu-simple-bar-item__icon [22,56 20×20] {d:flex ai:center jc:center}
                                      cu3-icon.cu3-icon.icon.active [22,56 20×20] {d:flex ai:center jc:center c:#067a6f fs:20px lh:20px}
                                  span.cu-simple-bar-item__label-container [0,82 64×18] {d:flex pos:absolute jc:center p:0px 6px wrap:wrap}
                                    span.cu-simple-bar-item__label-inner [14,82 31×18] {d:flex}
                                      span.cu-simple-bar-item__label-divider [14,82 5×18]
                                      span.cu-simple-bar-item__label [19,82 26×18] "Início" {pos:relative p:2px 0px 0px ov:hidden c:#ffffff fs:10px fw:700 lh:16px ls:-0.25px}
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
                              ↳ (este bloco se repete ×6; último em y=602)
                            div.cu-simple-bar__pinned-item-container [6,664 52×62] {d:flex jc:center}
                              div.cu-simple-bar__item-container.cu-simple-bar__item-container_last-visible [6,664 52×62] {d:grid pos:relative p:0px 7px cols:38px}
                                cu-sidebar-pinned-item-actions.cu-simple-bar__pinned-item-hover-actions [6,664 52×62] {pos:absolute}
                                  div.cu-dropdown [6,675 0×0] {pos:relative}
                                a.cu-simple-bar__item.goals [16,670 32×32] {d:flex pos:relative ai:center jc:center m:6px 0px 24px cur:pointer}
                                  span.cu-simple-bar__item-inner [16,670 32×32] {d:flex ai:center jc:center}
                                    span.cu-simple-bar__item-icon-container [16,670 32×32] {d:flex pos:relative ai:center jc:center p:6px rad:8px}
                                      cu-simple-bar-item-icon.cu-simple-bar-item-icon [22,676 20×20] {d:flex ai:center jc:center}
                                        cu3-icon.cu3-icon.icon [22,676 20×20] {d:flex ai:center jc:center c:#ffffff fs:20px lh:20px}
                                    span.cu-simple-bar__item-label-container [3,702 58×18] {d:flex pos:absolute jc:center wrap:wrap}
                                      span.cu-simple-bar__item-label-inner [12,702 34×18] {d:flex}
                                        span.cu-simple-bar__item-label-divider [12,702 5×18]
                                        span.cu-simple-bar__item-label [17,702 29×18] "Metas" (data-test=simple-bar__item-label) {pos:relative p:2px 0px 0px ov:hidden c:#ffffff fs:10px fw:600 lh:16px ls:-0.25px}
                                      span.cu-simple-bar__item-label-divider [47,702 5×18]
                            div.cu-simple-bar__pinned-item-container [6,726 52×62] {d:flex jc:center}
                              div.cu-simple-bar__item-container.cu-simple-bar__item-container_hidden [6,726 52×62] {d:grid pos:relative p:0px 7px cols:38px}
                                cu-sidebar-pinned-item-actions.cu-simple-bar__pinned-item-hover-actions [6,726 52×62] {pos:absolute}
                                  div.cu-dropdown [6,737 0×0] {pos:relative}
                                a.cu-simple-bar__item.time-hub [16,732 32×32] {d:flex pos:relative ai:center jc:center m:6px 0px 24px cur:pointer}
                                  span.cu-simple-bar__item-inner [16,732 32×32] {d:flex ai:center jc:center}
                                    span.cu-simple-bar__item-icon-container [16,732 32×32] {d:flex pos:relative ai:center jc:center p:6px rad:8px}
                                      cu-simple-bar-item-icon.cu-simple-bar-item-icon [22,738 20×20] {d:flex ai:center jc:center}
                                        cu3-icon.cu3-icon.icon [22,738 20×20] {d:flex ai:center jc:center c:#ffffff fs:20px lh:20px}
                                    span.cu-simple-bar__item-label-container [3,764 58×18] {d:flex pos:absolute jc:center wrap:wrap}
                                      span.cu-simple-bar__item-label-inner [3,764 58×18] {d:flex}
                                        span.cu-simple-bar__item-label-divider [3,764 5×18]
                                        span.cu-simple-bar__item-label [8,764 53×18] "Planilhas de horas" (data-test=simple-bar__item-label) {pos:relative p:2px 0px 0px ov:hidden c:#ffffff fs:10px fw:600 lh:16px ls:-0.25px}
                                      span.cu-simple-bar__item-label-divider [30,782 5×0]
                        div.cu-simple-bar__item-dropdown.cu-dropdown [6,714 52×62] {d:flex pos:relative}
                          button.cu-simple-bar__item.cu-simple-bar__item_more.cu-dropdown__toggle [16,720 32×32] (role=button label=Menu suspenso data-test=simple-bar__more expanded=false) {d:flex pos:relative ai:center jc:center m:6px 10px 24px rad:8px c:#ffffff fs:14px fw:500 lh:16px cur:pointer}
                            cu3-icon.cu3-icon.cu-simple-bar__more-icon [23,727 18×18] {d:flex ai:center jc:center fs:18px lh:20.5714px}
                            cu-more-apps-icons.cu-simple-bar__apps [24,728 16×16] {d:grid pos:absolute gap:1px cols:11px 11px}
                              cu-more-apps-icon [24,728 8×8]
                                div.dashboards.item__icon [24,728 8×8] {d:flex pos:relative ai:center jc:center c:#ab4aba fs:11px lh:12.5714px}
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
                                        a.inbox-header-bell-link [150,49 28×28] {d:flex pos:relative ai:center jc:center gap:4px bg:#f9f9f9 rad:7px c:#838383 fs:16px fw:500 lh:18.2857px cur:pointer}
                                          cu-unseen-notifications-counter.cu-unseen-notifications-counter [177,50 0×0] {pos:absolute}
                                            cu-simple-bar-item-counter.in-header [0,0 0×0] {d:contents}
                                              cu3-counter.cu3-counter.container.notification [177,50 0×0] (role=note) {d:flex pos:absolute z:1}
                                              span [176,49 1×1] "Número de notificações não lidas" {pos:absolute m:-1px ov:hidden}
                                          cu3-icon.cu3-icon.icon-inbox [156,55 16×16] {d:flex ai:center jc:center}
                                          span [150,63 1×1] "Caixa de entrada" {pos:absolute m:-1px ov:hidden}
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
                                    cu-finish-setup-apps-card [65,81 255×0]
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
                                                cu-sidebar-row-layout.cu-chat-room-row__inner.expanded.home-sidebar [73,766 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,772 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,772 26×16] {d:flex}
                                                  a.row-body [107,766 186×28] {ov:hidden lh:28px cur:pointer}
                                                    div.cu-chat-room-row__container.secondary [107,772 122×16] (data-test=chat-sidebar-item__name) {d:inline-grid pos:relative ai:center gap:normal 4px cols:122.219px c:#646464}
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
                          cu-banners-container [321,41 1592×44]
                            cu2-banner-popup [321,41 0×0]
                            cu-web-push-notification-banner.cu-web-push-notification-banner [321,41 1592×44]
                              cu3-alert-banner.cu-web-push-notification-banner__banner [321,41 1592×44] (role=alert) {d:flex ai:center jc:space-between gap:8px p:10px 16px bg:#12a594 c:#ffffff fs:16px lh:20px}
                                div.projected-content [337,51 1528×24] {d:flex ai:center jc:space-between gap:16px}
                                  cu3-icon.cu3-icon [337,55 16×16] {d:flex ai:center jc:center}
                                  p.message [369,55 1349×16] "Não deixe atualizações importantes passarem. Ative as notifi" {ov:hidden fs:14px fw:500 lh:16.002px}
                                  button [1734,51 75×24] "Habilitado" {d:flex ai:center jc:center gap:4px p:0px 7px bt:1px solid #ffffff/0.392 bb:1px solid #ffffff/0.392 bl:1px solid #ffffff/0.392 br:1px solid #ffffff/0.392 rad:6px fs:12px fw:500 lh:16px cur:pointer}
                                  button.cu-push-notification-banner__button [1817,51 48×24] "Adiar" {d:flex ai:center jc:center gap:4px p:0px 7px m:0px 0px 0px -8px bt:1px solid #ffffff/0.392 bb:1px solid #ffffff/0.392 bl:1px solid #ffffff/0.392 br:1px solid #ffffff/0.392 rad:6px fs:12px fw:500 lh:16px cur:pointer}
                                button [1873,51 24×24] (label=Descartar) {d:flex ai:center jc:center gap:4px rad:6px fw:500 lh:21.3333px cur:pointer}
                                  cu3-icon.cu3-icon.close-icon [1877,55 16×16] {d:flex ai:center jc:center}
                          cu-chat-core.chat-core_own-route [321,85 1592×811] {d:flex}
                            div.chat-core__core [321,85 1592×811]
                              div._chatShell_13y1m_1._chatShellVariables_2y23e_1 [321,85 1592×811] {d:flex ai:stretch jc:flex-start bg:#ffffff rad:4px}
                                div._chatShellBody_13y1m_16 [321,85 1592×811] {d:flex pos:relative}
                                  div._chatRight_13y1m_24 [321,85 1592×811]
                                    div [0,0 0×0] {d:contents}
                                      div._chatRoom_1xnz5_28 [321,85 1592×811] {d:flex dir:column ov:clip}
                                        div._chatRoomHeader_zrjcu_6._withAttachedSecondaryHeader_zrjcu_28 [321,85 1592×38] {d:flex pos:relative ai:center gap:4px p:8px 8px 2px bg:#ffffff z:2}
                                          div._chatRoomHeaderLeft_zrjcu_42 [329,98 1576×18] {d:flex ai:center}
                                            div._titleContainer_zrjcu_64 [329,98 159×18] (data-test=chat-room-header__container)
                                              div._specialChatRoomTitle_zrjcu_79 [329,98 159×18] "Nova mensagem direta" {p:0px 0px 0px 4px ov:hidden fs:14px fw:600 lh:17.5px}
                                        div._chatRoomBodyContainer_1xnz5_36 [321,123 1592×773] {d:flex pos:relative}
                                          div._chatRoomBody_1xnz5_36 [321,123 1592×773] {d:flex dir:column}
                                            div._chatRoomItemsContainer_1xnz5_55 [321,123 1592×773] (data-test=chat-room__container) {d:flex dir:column}
                                              div._flex_1wz5h_87._secondaryHeader_kpgdf_1._secondaryHeader_1njix_1 [321,123 1592×45] {d:flex dir:column jc:flex-end p:0px 12px 12px bg:#ffffff bb:1px solid #e8e8e8 z:2}
                                                div._contents_1wz5h_47 [0,0 0×0] {d:contents}
                                                  div._begin_1bzbt_1 [333,123 0×0]
                                                  div._flex_1wz5h_87._resultsContainer_wl5rj_28._flexCol_1wz5h_87 [333,123 1568×32] {d:flex pos:relative dir:column gap:8px}
                                                    div._flex_1wz5h_87._inputContainer_wl5rj_90._inputContainerNoPadding_1njix_10 [333,123 1568×32] {d:flex dir:column gap:8px bg:#ffffff z:1}
                                                    div._dropdown_wl5rj_32._resultsContainerDropdown_1njix_40 [333,163 1568×72] {d:flex pos:absolute dir:column p:5px 0px bg:#ffffff rad:8px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 z:2}
                                              div._flex_1wz5h_87._root_1njix_14._flexCol_1wz5h_87 [321,168 1592×728] {d:flex pos:relative dir:column bg:#fcfcfc}
                                                div._noRoom_1njix_23 [321,168 1592×614] {bg:#ffffff}
                                                div._flex_1wz5h_87._roomContainer_16pu2_1._flexCol_1wz5h_87 [321,782 1592×114] {d:flex dir:column bg:#ffffff}
                                                  div._chatEditorContainer_1xnz5_67._chatEditorContainerTabsEnabled_1xnz5_79 [321,794 1592×102] {d:flex pos:relative p:0px 24px 24px m:12px 0px 0px}
                                                    div._chatEditorInner_1xnz5_91._chatEditorInnerTabsEnabled_1xnz5_102 [477,794 1280×78] {pos:relative m:0px 132px bg:#ffffff}
                                  div._chatRightSidebar_1k9j2_110 [1913,85 0×811] {pos:relative}
                                    div._chatRightSidebarInner_1k9j2_328 [1913,85 1×811] {pos:absolute bl:1px solid #e8e8e8}
                      cu-tray-bar.cu-tray-bar.cu-hidden-print [65,896 1848×0]
                    cu-right-sidebar [1914,40 0×857] {d:flex}
                      div.cu-right-sidebar.collapsed.closed [1914,40 0×857] {d:flex pos:relative}
                        div.resizer-handle [1906,44 8×849] (role=separator label=Redimensionar a barra lateral) {d:flex pos:absolute jc:center bg:#c7ebe5 rad:4px z:20 cur:col-resize}
                        div.container [1914,40 2×857] {d:flex pos:relative dir:column bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:8px sh:#000000/0.055 0px 1px 2px 0px ov:clip auto}
          cu-manager-render-detector [0,903 0×0]
          cu-manager-task-drafter [0,903 0×0]
          cu-toast-manager.cu-toast-manager [72,887 320×0] {d:flex pos:fixed dir:column ai:flex-start gap:4px z:1000}
            cu-queued-tasks.cu-toast-manager-item [0,0 0×0] {d:contents}
              div.cu-queued-tasks.cu-toast-manager-item [0,0 0×0] {d:contents}
            cu-refresh-toast.cu-toast-holder.cu-toast-manager-item.cu-hidden-print [0,0 0×0] {d:contents pos:fixed z:1000}
            cu-manager-clips.cu-toast-manager-item [0,0 0×0] {d:contents}
            cu-upload-toasts.cu-toast-manager-item [0,0 0×0] {d:contents}
            cu-manager-stt.cu-toast-manager-item [0,0 0×0] {d:contents}
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
    div.ql-tooltip.ql-hidden [0,861 457×32] {pos:absolute rad:25px z:10 c:#ffffff}
      cu-rich-editor-toolbar.cu-rich-editor-toolbar.cu-rich-editor-toolbar_v2.cu-hidden-print [12,861 445×32] (data-test=editor-toolbar-unpinned) {d:flex pos:relative ai:center p:2px m:0px 0px 0px 12px bg:#ffffff rad:8px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000}
        div.cu-rich-editor-toolbar__row [14,863 441×28] (data-test=toolbar-row) {d:flex ai:center gap:1px}
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
          cu-rich-editor-toolbar-create-task [394,863 28×28]
            button [394,863 28×28] (data-test=toolbar-create-task) {p:6px rad:6px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
              cu3-icon.cu3-icon.primary-button-icon [400,869 16×16] {d:inline-flex ai:center jc:center c:#067a6f}
              span [11,868 1×1] "Criar tarefa" {pos:absolute m:-1px ov:hidden}
          div.ql-formats-separator [424,867 1×20] {m:0px 1px bg:#f0f0f0}
          cu-rich-editor-toolbar-more-menu.cu-rich-editor-toolbar-more-menu.cu-rich-editor-toolbar-more-menu_v2 [427,863 28×28]
            button.menu-trigger [427,863 28×28] (role=button data-test=toolbar-more-actions type=button haspopup=menu expanded=false) {p:6px rad:6px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
              cu3-icon.cu3-icon [433,869 16×16] {d:inline-flex ai:center jc:center}
              span [11,868 1×1] "Mais configurações" {pos:absolute m:-1px ov:hidden}
  div [0,903 1920×0]
    div [0,903 1920×0]
    div [0,903 1920×0]
  div.ReactModalPortal [0,903 1920×0]
```
