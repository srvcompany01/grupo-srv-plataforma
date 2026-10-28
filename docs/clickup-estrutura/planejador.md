# Estrutura renderizada — Planejador

URL: https://app.clickup.com/36949648/calendar
Nós visíveis: 1075 · linhas do esboço: 502
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
                              div.cu-simple-bar__item-container.cu-simple-bar__item-container_active.cu-simple-bar__item-container_with-flyout [6,230 52×62] {d:grid pos:relative p:0px 7px cols:38px}
                                a.calendar.cu-simple-bar__item.cu-simple-bar__item_active [16,236 32×32] {d:flex pos:relative ai:center jc:center m:6px 0px 24px sh:#000000/0.106 0px 1px 3px 0px, #000000/0.106 0px 1px 2px -1px}
                                  span.cu-simple-bar__item-inner [16,236 32×32] {d:flex ai:center jc:center}
                                    span.cu-simple-bar__item-icon-container [16,236 32×32] {d:flex pos:relative ai:center jc:center p:6px bg:#ffffff rad:8px}
                                      cu-simple-bar-item-icon.cu-simple-bar-item-icon [22,242 20×20] {d:flex ai:center jc:center}
                                        cu3-icon.cu3-icon.icon.active [22,242 20×20] {d:flex ai:center jc:center c:#067a6f fs:20px lh:20px}
                                    span.cu-simple-bar__item-label-container [3,268 58×18] {d:flex pos:absolute jc:center wrap:wrap}
                                      span.cu-simple-bar__item-label-inner [3,268 57×18] {d:flex}
                                        span.cu-simple-bar__item-label-divider [3,268 5×18]
                                        span.cu-simple-bar__item-label [8,268 52×18] "Planejador" (data-test=simple-bar__item-label) {pos:relative p:2px 0px 0px ov:hidden c:#ffffff fs:10px fw:700 lh:16px ls:-0.25px}
                                      span.cu-simple-bar__item-label-divider [30,286 5×0]
                                    cu-simple-bar-item-live-activity [0,0 0×0] {d:contents}
                                      div.container.dateLabel.active [26,249 12×9] "28" {pos:absolute bg:#ffffff c:#ffffff fs:9px fw:800 lh:9px ls:-0.4px}
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
                                div.calendar.item__icon [24,728 8×8] {d:flex pos:relative ai:center jc:center c:#646464 fs:11px lh:12.5714px}
                                  cu-custom-calendar-icon [24,728 8×8] {d:flex ai:center jc:center}
                                  div.liveActivityContainer.dateLabel [25,730 5×5] "28" {pos:absolute m:1px 0px 0px bg:#ffffff c:#000000/0 fs:6px fw:700 lh:6.85714px ls:-0.4px}
                              cu-more-apps-icon [32,728 8×8]
                                div.clips.item__icon [32,728 8×8] {d:flex pos:relative ai:center jc:center c:#e5484d fs:11px lh:12.5714px}
                                  cu3-icon.cu3-icon.icon [32,728 8×8] {d:flex pos:relative ai:center jc:center}
                              cu-more-apps-icon [24,736 8×8]
                                div.item__icon.time-hub [24,736 8×8] {d:flex pos:relative ai:center jc:center c:#f76808 fs:11px lh:12.5714px}
                                  cu3-icon.cu3-icon.icon [24,736 8×8] {d:flex pos:relative ai:center jc:center}
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
                        cu-nav-sidebar [65,41 0×855]
                        div.cu-manager2__main [65,41 1848×855] {d:flex pos:relative dir:column}
                          cu-modal-keeper [65,41 1848×0]
                            div [65,41 1848×0]
                          cu-banners-container [65,41 1848×44]
                            cu2-banner-popup [65,41 0×0]
                            cu-web-push-notification-banner.cu-web-push-notification-banner [65,41 1848×44]
                              cu3-alert-banner.cu-web-push-notification-banner__banner [65,41 1848×44] (role=alert) {d:flex ai:center jc:space-between gap:8px p:10px 16px bg:#12a594 c:#ffffff fs:16px lh:20px}
                                div.projected-content [81,51 1784×24] {d:flex ai:center jc:space-between gap:16px}
                                  cu3-icon.cu3-icon [81,55 16×16] {d:flex ai:center jc:center}
                                  p.message [113,55 1605×16] "Não deixe atualizações importantes passarem. Ative as notifi" {ov:hidden fs:14px fw:500 lh:16.002px}
                                  button [1734,51 75×24] "Habilitado" {d:flex ai:center jc:center gap:4px p:0px 7px bt:1px solid #ffffff/0.392 bb:1px solid #ffffff/0.392 bl:1px solid #ffffff/0.392 br:1px solid #ffffff/0.392 rad:6px fs:12px fw:500 lh:16px cur:pointer}
                                  button.cu-push-notification-banner__button [1817,51 48×24] "Adiar" {d:flex ai:center jc:center gap:4px p:0px 7px m:0px 0px 0px -8px bt:1px solid #ffffff/0.392 bb:1px solid #ffffff/0.392 bl:1px solid #ffffff/0.392 br:1px solid #ffffff/0.392 rad:6px fs:12px fw:500 lh:16px cur:pointer}
                                button [1873,51 24×24] (label=Descartar) {d:flex ai:center jc:center gap:4px rad:6px fw:500 lh:21.3333px cur:pointer}
                                  cu3-icon.cu3-icon.close-icon [1877,55 16×16] {d:flex ai:center jc:center}
                          cu-calendar-planner [0,0 0×0] {d:contents}
                            div.container [65,85 1848×811] {d:flex gap:8px}
                              div._root_1ka8z_1 [65,85 1848×811] (data-test=calendar-overlay) {d:flex pos:relative ov:hidden}
                                div._left_1ka8z_15 [0,0 0×0] {d:contents}
                                  div._root_n8o4y_49 [65,85 256×811] {d:flex pos:relative dir:column bg:#f9f9f9 br:1px solid #e8e8e8}
                                    div._resizeHandle_n8o4y_72 [316,85 4×811] {pos:absolute z:5 cur:col-resize}
                                    div._virtuosoRoot_n8o4y_82 [65,85 255×811] {pos:relative ov:hidden auto}
                                      div [65,85 244×44] {pos:sticky z:1}
                                        div [65,85 244×44]
                                          div [65,85 244×44]
                                            div._root_lv0g9_1 [65,85 244×44] {d:flex pos:relative ai:center jc:space-between p:8px 8px 8px 12px bg:#f9f9f9}
                                              div._left_lv0g9_11 [77,99 81×16] "Planejador" {d:flex ai:center fs:16px fw:600 lh:16px}
                                              div._right_lv0g9_18 [198,93 103×28] {d:flex ai:center gap:3px}
                                                div._left_lv0g9_11 [206,93 56×28] {d:flex ai:center fs:16px fw:600 lh:16px}
                                                  button._input_8d67u_6._iconButton_lv0g9_36 [206,93 28×28] {d:flex ai:center p:6px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px fs:14px fw:400 lh:16.002px cur:pointer}
                                                  button._input_8d67u_6._iconButton_lv0g9_36 [234,93 28×28] {d:flex ai:center p:6px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px fs:14px fw:400 lh:16.002px cur:pointer}
                                                div._right_lv0g9_18 [257,93 44×28] {d:flex ai:center gap:3px}
                                                  button._input_8d67u_6._root_uj7kg_1 [257,93 44×28] (label=Criar novo item no planejador) {d:flex ai:center jc:center gap:4px p:6px 4px 6px 6px bg:#ffffff bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px sh:#000000/0.45 0px 0px 1px 0px, #000000/0.15 0px 1px 3px 0px, #000000/0. fs:14px lh:16.002px cur:pointer}
                                      div [65,85 244×811] {pos:absolute}
                                        div [65,85 244×499] {p:44px 0px 0px}
                                          div [65,129 244×24]
                                            div._root_fehik_1 [65,129 244×24] {pos:relative p:0px 8px bg:#f9f9f9}
                                              div._input_8d67u_6._button_fehik_9 [73,129 228×24] (role=button) {d:flex ai:center jc:space-between p:2px 6px rad:7px fs:14px lh:16.002px}
                                                div._left_fehik_25 [79,134 66×14] {d:flex ai:center gap:4px}
                                                  div._label_fehik_40 [79,134 66×14] "Prioridades" {c:#646464 fs:12px fw:500 lh:13.716px}
                                                div._suffix_8d67u_157._right_fehik_35 [275,131 20×20] {d:flex ai:center}
                                          div [65,153 244×2]
                                            div._root_2i4ys_1 [65,153 244×2] {bg:#f9f9f9}
                                          div [65,155 244×135]
                                            div._root_1cm5j_1._rootEmpty_1cm5j_6 [65,155 244×135] {d:flex dir:column}
                                              div._root_1jyks_1 [65,155 244×135] {d:flex p:2px 12px}
                                                div._card_1jyks_7 [77,157 220×131] {d:flex dir:column bg:#fcfcfc rad:10px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px}
                                                  section._header_1jyks_15 [77,157 220×86] {d:flex dir:column ai:center jc:center gap:8px p:16px 40px}
                                                    div._title_1jyks_25 [117,195 140×32] "Priorize uma tarefa para vê-la aqui" {c:#838383 fs:12px lh:16.008px}
                                                  section._footer_1jyks_31 [77,243 220×45] {d:flex dir:column ai:center jc:center}
                                                    div._separator_1jyks_38 [77,259 220×1] {m:16px 0px 0px bg:#e8e8e8}
                                                    button._input_8d67u_6._addPriorityEmptyStateButton_1cm5j_21 [77,260 220×28] {d:flex ai:center jc:center gap:3px p:6px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:0px 0px 10px 10px c:#838383 fs:12px lh:16.008px cur:pointer}
                                          div [65,290 244×16]
                                            div._root_lk9j3_1 [65,290 244×16]
                                          div [65,306 244×24]
                                            div._root_fehik_1 [65,306 244×24] {pos:relative p:0px 8px bg:#f9f9f9}
                                              div._input_8d67u_6._button_fehik_9 [73,306 228×24] (role=button) {d:flex ai:center jc:space-between p:2px 6px rad:7px fs:14px lh:16.002px}
                                                div._left_fehik_25 [79,311 74×14] {d:flex ai:center gap:4px}
                                                  div._label_fehik_40 [79,311 74×14] "Reunião com" {c:#646464 fs:12px fw:500 lh:13.716px}
                                                div._suffix_8d67u_157._right_fehik_35 [275,308 20×20] {d:flex ai:center}
                                          div [65,330 244×2]
                                            div._root_2i4ys_1 [65,330 244×2] {bg:#f9f9f9}
                                          div [65,332 244×2]
                                            div._root_2i4ys_1 [65,332 244×2] {bg:#f9f9f9}
                                          div [65,334 244×28]
                                            div._root_1062y_1 [65,334 244×28] {p:0px 10px bg:#f9f9f9}
                                              span._inputContainer_1062y_6 [75,334 224×28] {pos:relative}
                                                input._input_8d67u_6._compact_8d67u_26._input_1062y_6 [75,334 224×28] (type=text placeholder=Pesquisar pessoas...) {d:flex ai:center p:6px 8px bg:#ffffff bt:0px inset #767676 bb:0px inset #767676 bl:0px inset #767676 br:0px inset #767676 rad:7px ov:clip fs:14px lh:16.002px cur:text}
                                          div [65,362 244×16]
                                            div._root_lk9j3_1 [65,362 244×16]
                                          div [65,378 244×24]
                                            div._root_fehik_1 [65,378 244×24] {pos:relative p:0px 8px bg:#f9f9f9}
                                              div._input_8d67u_6._button_fehik_9 [73,378 228×24] (role=button) {d:flex ai:center jc:space-between p:2px 6px rad:7px fs:14px lh:16.002px}
                                                div._left_fehik_25 [79,382 117×16] {d:flex ai:center gap:4px}
                                                  div._label_fehik_40 [79,383 97×14] "Atribuídas a mim" {c:#646464 fs:12px fw:500 lh:13.716px}
                                                div._suffix_8d67u_157._right_fehik_35 [275,380 20×20] {d:flex ai:center}
                                          div [65,402 244×16]
                                            div._root_lk9j3_1 [65,402 244×16]
                                          div [65,418 244×24]
                                            div._root_fehik_1 [65,418 244×24] {pos:relative p:0px 8px bg:#f9f9f9}
                                              div._input_8d67u_6._button_fehik_9 [73,418 228×24] (role=button) {d:flex ai:center jc:space-between p:2px 6px rad:7px fs:14px lh:16.002px}
                                                div._left_fehik_25 [79,422 117×16] {d:flex ai:center gap:4px}
                                                  div._label_fehik_40 [79,423 97×14] "Hoje e atrasadas" {c:#646464 fs:12px fw:500 lh:13.716px}
                                                div._suffix_8d67u_157._right_fehik_35 [275,420 20×20] {d:flex ai:center}
                                          div [65,442 244×16]
                                            div._root_lk9j3_1 [65,442 244×16]
                                          div [65,458 244×24]
                                            div._root_fehik_1 [65,458 244×24] {pos:relative p:0px 8px bg:#f9f9f9}
                                              div._input_8d67u_6._button_fehik_9 [73,458 228×24] (role=button) {d:flex ai:center jc:space-between p:2px 6px rad:7px fs:14px lh:16.002px}
                                                div._left_fehik_25 [79,463 115×14] {d:flex ai:center gap:4px}
                                                  div._label_fehik_40 [79,463 115×14] "Lista de pendências" {c:#646464 fs:12px fw:500 lh:13.716px}
                                                div._suffix_8d67u_157._right_fehik_35 [255,460 40×20] {d:flex ai:center}
                                                  div._input_8d67u_6._root_eadc6_33 [275,460 20×20] (role=button) {d:flex ai:center p:3px rad:6px}
                                          div [65,482 244×2]
                                            div._root_2i4ys_1 [65,482 244×2] {bg:#f9f9f9}
                                          div [65,484 244×84]
                                            div._root_1jyks_1 [65,484 244×84] (type=empty-state) {d:flex p:2px 12px}
                                              div._card_1jyks_7 [77,486 220×80] {d:flex dir:column bg:#fcfcfc rad:10px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px}
                                                section._header_1jyks_15 [77,486 220×80] {d:flex dir:column ai:center jc:center gap:8px p:16px 40px}
                                                  div._title_1jyks_25 [117,502 140×48] "Nenhuma tarefa corresponde a esses filtros" {c:#838383 fs:12px lh:16.008px}
                                          div [65,568 244×16]
                                            div._root_lk9j3_1 [65,568 244×16]
                                    div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                div._right_1ka8z_18 [321,85 1592×811] {d:flex pos:relative dir:column bg:#ffffff ov:hidden}
                                  div._root_10hmh_1 [321,85 1592×40] {d:flex ai:center jc:space-between p:8px 8px 4px 12px bg:#ffffff}
                                    div._left_10hmh_10 [333,93 228×28] {d:flex ai:center gap:4px}
                                      div._chevrons_10hmh_17 [333,93 48×28] {d:flex ai:center}
                                        button._input_8d67u_6._chevron_10hmh_17 [333,93 24×28] (label=Período anterior) {d:flex ai:center p:6px 4px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px fs:14px lh:16.002px cur:pointer}
                                        button._input_8d67u_6._chevron_10hmh_17 [357,93 24×28] (label=Período seguinte) {d:flex ai:center p:6px 4px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px fs:14px lh:16.002px cur:pointer}
                                      button._input_8d67u_6._root_19rqv_1 [385,93 176×28] {d:flex ai:center gap:4px p:4px 8px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px fs:16px fw:500 lh:20px cur:pointer}
                                        span [393,97 104×20] "October 2026"
                                        span [501,97 52×20] "sem 44"
                                    div._right_10hmh_28 [1685,93 220×28] {d:flex ai:center gap:2px}
                                      button._input_8d67u_6._compact_8d67u_26._root_1se4d_1 [1685,93 84×28] {d:flex ai:center gap:4px p:4px 4px 4px 8px m:0px 2px 0px 0px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px c:#646464 fs:14px lh:16.002px cur:pointer}
                                        span._label_1se4d_21 [1693,99 52×16] "Semana" {d:flex ai:center}
                                      button._input_8d67u_6._button_dc3fy_33._nuxIconState_dc3fy_363 [1773,93 28×28] (label=Anotações com IA) {d:flex ai:center gap:4px p:6px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px c:#646464 fs:14px fw:500 lh:16.002px cur:pointer}
                                      span._root_1e0zf_49 [1803,93 42×28] {d:flex}
                                        button._input_8d67u_6._button_1e0zf_58 [1803,93 42×28] "2" {d:flex ai:center gap:4px p:6px 8px 6px 6px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px c:#646464 fs:14px fw:500 lh:16.002px cur:pointer}
                                      button._input_8d67u_6._button_5qgfd_1 [1847,93 28×28] (label=Atualizar) {d:flex ai:center gap:2px p:6px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px c:#646464 fs:12px fw:500 lh:13.716px cur:pointer}
                                      div._rightInnerContainer_10hmh_49 [1877,93 28×28] {d:flex ai:center gap:2px}
                                        button._input_8d67u_6._button_10hmh_40 [1877,93 28×28] (label=Configurações) {d:flex ai:center p:6px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px fs:14px lh:16.002px cur:pointer}
                                  div._grid_113vn_1._fixedScrollMask_113vn_25 [321,125 1592×771] {d:flex pos:relative cur:auto}
                                    div._root_14gej_1 [-540148,125 11621600×1384] {d:flex pos:absolute}
                                      div._root_r81jw_1 [321,125 71×1384] {pos:sticky bg:#ffffff z:3}
                                        div._container_r81jw_20 [321,125 71×1384] {pos:relative}
                                          div._headerContainer_r81jw_26 [321,125 71×56] {pos:sticky bg:#ffffff z:998}
                                            div._root_1b0sr_1 [321,125 71×32] {d:flex ai:center p:0px 4px bb:1px solid #e8e8e8 ov:hidden}
                                              button._input_8d67u_6._root_9i02i_1 [325,131 20×20] (label=Adicionar fuso horário) {d:flex ai:center p:2px rad:7px fs:14px lh:16.002px cur:pointer}
                                              span._root_1p875_1 [345,131 45×20] {d:flex ai:center jc:center}
                                                button._input_8d67u_6._timezoneButton_1p875_10 [345,131 45×20] (role=button) {d:flex ai:center p:2px 4px 2px 2px rad:7px ov:hidden c:#bbbbbb fs:14px lh:16.002px cur:not-allowed}
                                                  span._emojiLabelContainer_1p875_26 [347,133 39×16] {d:flex ai:center ov:hidden}
                                                    span._label_1p875_32 [349,133 37×16] "GMT-3" {m:0px 0px 0px 2px ov:hidden c:#838383 fs:11px fw:600 lh:15.95px tt:uppercase}
                                              div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                            div._allDayContainer_r81jw_36 [321,157 72×25] {d:flex jc:space-between p:2px 3px 2px 2px bb:1px solid #f0f0f0}
                                              button._input_8d67u_6._button_r81jw_49 [323,159 67×20] (label=Expand or collapse all day events) {d:flex ai:center jc:center gap:4px p:2px 6px 2px 4px rad:5px fs:14px lh:16.002px cur:pointer}
                                                span._divider_r81jw_10 [392,157 1×847] {pos:absolute bg:#f0f0f0}
                                                span._label_r81jw_66 [347,149 37×40] "O dia todo" (label=Expand or collapse all day events) {c:#838383 fs:11px fw:600 lh:20px}
                                          div._root_1k3y0_1 [321,181 72×1328] {d:flex pos:absolute z:997}
                                            span [321,181 0×1328]
                                            div._root_1lvmx_1 [340,197 45×20] {pos:absolute bg:#ffffff z:998}
                                              div._currentTime_1lvmx_10 [340,197 45×20] "00:28" {p:2px 4px bg:#e5484d rad:666px c:#ffffff fs:12px fw:700 lh:16.008px}
                                            div._root_tep8m_1 [321,181 72×1328] {pos:relative}
                                              div._hourContainer_tep8m_9 [321,181 72×0] {d:flex pos:absolute jc:end p:0px 8px 0px 0px}
                                                div._hour_tep8m_9 [385,177 0×0] {pos:absolute c:#8d8d8d fs:12px fw:500 lh:12px}
                                                ↳ (este bloco se repete ×24; último em y=1377)
                                      div._root_3yftb_1 [-540148,181 0×1328] {pos:absolute}
                                        div._root_1visi_2 [-24434,181 217×1328] {pos:absolute}
                                          ↳ (este bloco se repete ×326; último em y=181)
                                      ul._root_1u3t6_1 [-540076,125 11621600×0] {pos:absolute z:1}
                                        li._root_92lr8_2 [-42,125 217×1384] {pos:absolute br:1px solid #f0f0f0}
                                          div._root_1br72_1 [-42,181 216×1328] {pos:absolute bgimg:repeating-linear-gradient(#000000/0, #000000/0 51px, #f0f0f0 51px, #f0}
                                            div._draggable_1br72_10 [-42,181 216×1328] (role=button)
                                            div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._root_9qkmw_1 [-42,181 216×1328] {pos:absolute z:997}
                                          div._root_1ndlb_1 [-42,181 216×1328] {pos:absolute z:997}
                                          ul._root_zffj0_1 [-42,181 216×1328] {pos:absolute}
                                            li._root_1mpkg_1 [-42,181 216×467] {d:flex pos:absolute ov:hidden z:-1}
                                            li._root_1mpkg_1 [-42,1065 216×363] {d:flex pos:absolute ov:hidden z:-1}
                                        li._root_92lr8_2 [175,125 217×1384] {pos:absolute br:1px solid #f0f0f0}
                                          div._root_1br72_1 [175,181 216×1328] {pos:absolute bgimg:repeating-linear-gradient(#000000/0, #000000/0 51px, #f0f0f0 51px, #f0}
                                            div._draggable_1br72_10 [175,181 216×1328] (role=button)
                                            div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._root_9qkmw_1 [175,181 216×1328] {pos:absolute z:997}
                                          div._root_1ndlb_1 [175,181 216×1328] {pos:absolute z:997}
                                          ul._root_zffj0_1 [175,181 216×1328] {pos:absolute}
                                            li._root_1mpkg_1 [175,181 216×1247] {d:flex pos:absolute ov:hidden z:-1}
                                        li._root_92lr8_2 [393,125 217×1384] {pos:absolute br:1px solid #f0f0f0}
                                          div._root_1br72_1 [393,181 216×1328] {pos:absolute bgimg:repeating-linear-gradient(#000000/0, #000000/0 51px, #f0f0f0 51px, #f0}
                                            div._draggable_1br72_10 [393,181 216×1328] (role=button)
                                            div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._root_9qkmw_1 [393,181 216×1328] {pos:absolute z:997}
                                          div._root_1ndlb_1 [393,181 216×1328] {pos:absolute z:997}
                                          ul._root_zffj0_1 [393,181 216×1328] {pos:absolute}
                                            li._root_1mpkg_1 [393,181 216×1247] {d:flex pos:absolute ov:hidden z:-1}
                                        li._root_92lr8_2 [610,125 217×1384] {pos:absolute br:1px solid #f0f0f0}
                                          div._root_1br72_1 [610,181 216×1328] {pos:absolute bgimg:repeating-linear-gradient(#000000/0, #000000/0 51px, #f0f0f0 51px, #f0}
                                            div._draggable_1br72_10 [610,181 216×1328] (role=button)
                                            div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._root_9qkmw_1 [610,181 216×1328] {pos:absolute z:997}
                                          div._root_1ndlb_1 [610,181 216×1328] {pos:absolute z:997}
                                          ul._root_zffj0_1 [610,181 216×1328] {pos:absolute}
                                            li._root_1mpkg_1 [610,181 216×467] {d:flex pos:absolute ov:hidden z:-1}
                                            li._root_1mpkg_1 [610,1065 216×363] {d:flex pos:absolute ov:hidden z:-1}
                                          ↳ (este bloco se repete ×5; último em y=125)
                                        li._root_92lr8_2 [1695,125 217×1384] {pos:absolute br:1px solid #f0f0f0}
                                          div._root_1br72_1 [1695,181 216×1328] {pos:absolute bgimg:repeating-linear-gradient(#000000/0, #000000/0 51px, #f0f0f0 51px, #f0}
                                            div._draggable_1br72_10 [1695,181 216×1328] (role=button)
                                            div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._root_9qkmw_1 [1695,181 216×1328] {pos:absolute z:997}
                                          div._root_1ndlb_1 [1695,181 216×1328] {pos:absolute z:997}
                                          ul._root_zffj0_1 [1695,181 216×1328] {pos:absolute}
                                            li._root_1mpkg_1 [1695,181 216×1247] {d:flex pos:absolute ov:hidden z:-1}
                                        li._root_92lr8_2 [1913,125 217×1384] {pos:absolute br:1px solid #f0f0f0}
                                          div._root_1br72_1 [1913,181 216×1328] {pos:absolute bgimg:repeating-linear-gradient(#000000/0, #000000/0 51px, #f0f0f0 51px, #f0}
                                            div._draggable_1br72_10 [1913,181 216×1328] (role=button)
                                            div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._root_9qkmw_1 [1913,181 216×1328] {pos:absolute z:997}
                                          div._root_1ndlb_1 [1913,181 216×1328] {pos:absolute z:997}
                                          ul._root_zffj0_1 [1913,181 216×1328] {pos:absolute}
                                            li._root_1mpkg_1 [1913,181 216×1247] {d:flex pos:absolute ov:hidden z:-1}
                                        li._root_92lr8_2 [2130,125 217×1384] {pos:absolute br:1px solid #f0f0f0}
                                          div._root_1br72_1 [2130,181 216×1328] {pos:absolute bgimg:repeating-linear-gradient(#000000/0, #000000/0 51px, #f0f0f0 51px, #f0}
                                            div._draggable_1br72_10 [2130,181 216×1328] (role=button)
                                            div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._root_9qkmw_1 [2130,181 216×1328] {pos:absolute z:997}
                                          div._root_1ndlb_1 [2130,181 216×1328] {pos:absolute z:997}
                                          ul._root_zffj0_1 [2130,181 216×1328] {pos:absolute}
                                            li._root_1mpkg_1 [2130,181 216×467] {d:flex pos:absolute ov:hidden z:-1}
                                            li._root_1mpkg_1 [2130,1065 216×363] {d:flex pos:absolute ov:hidden z:-1}
                                        li._root_92lr8_2 [2347,125 217×1384] {pos:absolute br:1px solid #f0f0f0}
                                          div._root_1br72_1 [2347,181 216×1328] {pos:absolute bgimg:repeating-linear-gradient(#000000/0, #000000/0 51px, #f0f0f0 51px, #f0}
                                            div._draggable_1br72_10 [2347,181 216×1328] (role=button)
                                            div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._root_9qkmw_1 [2347,181 216×1328] {pos:absolute z:997}
                                          div._root_1ndlb_1 [2347,181 216×1328] {pos:absolute z:997}
                                          ul._root_zffj0_1 [2347,181 216×1328] {pos:absolute}
                                            li._root_1mpkg_1 [2347,181 216×467] {d:flex pos:absolute ov:hidden z:-1}
                                            li._root_1mpkg_1 [2347,1065 216×363] {d:flex pos:absolute ov:hidden z:-1}
                                      div._root_nf98t_2 [-540076,205 11621600×1304] {pos:absolute}
                                        div._strongLine_nf98t_10 [1044,204 217×3] {pos:absolute bg:#e5484d z:2}
                                      div._indicatorRoot_nf98t_31 [1044,200 12×12] {pos:absolute m:-5px 0px 0px bg:#e5484d rad:666px z:2}
                                      div._root_80bj6_1 [-540076,125 11621600×1304] {pos:absolute z:2}
                                        div._sticky_80bj6_15 [-540076,125 11621600×0] {pos:sticky}
                                          div._background_80bj6_22 [-540076,125 11621600×56] {pos:absolute bg:#ffffff}
                                          div._root_9rqmd_1 [0,0 0×0] {d:contents}
                                            div._root_11jgz_2 [-42,125 217×32] {d:flex pos:absolute ai:center jc:center gap:4px bg:#ffffff bb:1px solid #e8e8e8 ov:hidden z:2}
                                              div._weekday_11jgz_41 [48,133 17×16] "Fri" {c:#646464 fs:14px fw:500 lh:16.002px}
                                              div._day_11jgz_53 [69,133 17×16] "23" {d:flex ai:center jc:center c:#646464 fs:14px fw:500 lh:16.002px}
                                              ↳ (este bloco se repete ×12; último em y=125)
                                          div._headerDraggable_80bj6_33 [-540076,125 11621600×32] (role=button) {pos:absolute z:1}
                                          div._dragLayer_80bj6_52 [-540076,157 11621600×24] {pos:absolute ov:hidden z:0}
                                            div._dragLayerContent_80bj6_69 [-540076,157 11621600×24] {pos:relative}
                                              div._contentDraggable_80bj6_43 [-540076,157 11621600×24] (role=button) {pos:absolute}
                                          div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
                                          div._blocksLayer_80bj6_75 [-540076,157 11621600×24] {pos:absolute ov:clip z:1}
                                            div._blocksLayerContent_80bj6_87 [-540076,157 11621600×24] {pos:relative}
                                              div._root_xrmlh_1 [0,0 0×0] {d:contents}
                                                div._root_1l6m9_2 [-42,157 217×24] {d:flex pos:absolute ai:center jc:center br:1px solid #f0f0f0}
                                                  ↳ (este bloco se repete ×23; último em y=157)
                                              ul [-540076,157 11621600×0]
                                                li._cell_zam2c_3 [-2647,157 217×24] {d:flex pos:absolute z:1}
                                                  ↳ (este bloco se repete ×37; último em y=157)
                                                li [-540076,157 11621600×0]
                                                  div._root_y56sm_5._gridWeek_y56sm_26._allDay_y56sm_46 [-2429,159 206×20] {d:flex pos:absolute ai:center bg:#b6b6ff rad:6px ov:clip z:0}
                                                    div._block_y56sm_240._solidModePadding_y56sm_616 [-2429,159 206×20] {d:flex pos:absolute gap:4px p:2px 4px cur:pointer}
                                              div._overlayPortal_80bj6_95 [-540148,157 11621672×24] {pos:absolute z:999}
                                          div._border_80bj6_104 [-540076,181 11621600×1] {pos:absolute bb:1px solid #f0f0f0}
                                      div._timedOverlayPortal_14gej_12 [-540148,125 11621600×1384] {pos:absolute z:1}
                                  ol._root_1czx7_1 [1117,884 0×0] {d:flex pos:absolute ai:end jc:center z:2}
                                    li._item_1czx7_13 [877,840 480×44] {d:flex pos:absolute ai:end jc:center bg:#ffffff rad:12px sh:#000000/0.106 0px 10px 15px -3px, #000000/0.106 0px 4px 6px -4px ov:clip}
                                      div._root_uwfks_2._content_1czx7_29 [877,840 480×44] {d:flex ai:center gap:8px p:8px bg:#ffffff}
                                        div._left_uwfks_12 [885,848 464×28] {d:flex ai:center gap:4px}
                                          button._input_8d67u_6._input_uwfks_20 [885,848 464×28] {d:flex pos:relative ai:center gap:8px p:6px 8px bt:0px outset #000000 bb:0px outset #000000 bl:0px outset #000000 br:0px outset #000000 rad:7px ov:hidden fs:14px lh:16.002px cur:text}
                                            span._label_uwfks_33._shimmerColors_uwfks_41._shimmer_uwfks_41 [917,854 326×16] "Pesquise eventos, colegas de equipe, comandos..." {bgimg:linear-gradient(250deg, #000000/0 calc(50% - 132.275px), #dc3175, #604 ov:hidden c:#000000/0}
                                  div [-1,-1 1×1] (role=status) {pos:fixed m:-1px ov:hidden}
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
  div.ReactModalPortal [0,903 1920×0]
    ↳ (este bloco se repete ×3; último em y=903)
  div [0,903 1920×0]
    div [0,903 1920×0]
    div [0,903 1920×0]
  div.ReactModalPortal [0,903 1920×0]
```
