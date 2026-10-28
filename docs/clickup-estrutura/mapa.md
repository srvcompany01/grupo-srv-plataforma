# Estrutura renderizada — Visualização Mapa

URL: https://app.clickup.com/36949648/v/m/137kmg-41353
Nós visíveis: 812 · linhas do esboço: 674
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
                                div.calendar.item__icon [24,728 8×8] {d:flex pos:relative ai:center jc:center c:#646464 fs:11px lh:12.5714px}
                                  cu-custom-calendar-icon [24,728 8×8] {d:flex ai:center jc:center}
                                  div.liveActivityContainer.dateLabel [25,730 5×5] "28" {pos:absolute m:1px 0px 0px bg:#ffffff c:#000000/0 fs:6px fw:700 lh:6.85714px ls:-0.4px}
                              cu-more-apps-icon [32,728 8×8]
                                div.dashboards.item__icon [32,728 8×8] {d:flex pos:relative ai:center jc:center c:#ab4aba fs:11px lh:12.5714px}
                                  cu3-icon.cu3-icon.icon [32,728 8×8] {d:flex pos:relative ai:center jc:center}
                              cu-more-apps-icon [24,736 8×8]
                                div.item__icon.teams [24,736 8×8] {d:flex pos:relative ai:center jc:center c:#3451b2 fs:11px lh:12.5714px}
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
                                            cu-simple-bar-item-counter.in-header [0,0 0×0] {d:contents}
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
                                    cu-finish-setup-apps-card [65,81 255×0]
                                    cu-sidebar-flat-tree.content.show-new-section-button.full-height [65,81 255×815] (data-test=project-list-bar) {pos:relative p:0px 0px 20px ov:hidden}
                                      cdk-virtual-scroll-viewport.viewport [65,81 255×795] (data-test=project-list-bar__scrollable) {pos:relative bg:#f9f9f9}
                                        div [65,-313 244×1209] {d:flex pos:absolute dir:column}
                                          cu-tree.tree [65,-313 244×1209] (role=tree) {d:flex dir:column p:0px 0px 20px ov:hidden}
                                            cdk-tree-node [65,-313 244×8] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,-313 220×6] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,-305 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-special-hub-item-row.special-hub-item-row [73,-305 228×28] {d:flex}
                                                a.row-body [73,-305 228×28] (data-test=special-hub-item-row-new-ai-launch) {d:flex ai:center gap:10px p:0px 8px rad:7px cur:pointer}
                                                  cu-sidebar-item-icon.row-icon [81,-299 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                                    cu3-icon.cu3-icon [81,-299 16×16] {d:flex ai:center jc:center}
                                                  div.title [107,-299 186×16] "Novo" {ov:hidden c:#646464 lh:16.002px}
                                            cdk-tree-node.tree-node [73,-275 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-special-chat-item-row.special-chat-item-row [73,-275 228×28] {d:flex}
                                                a.row-body [73,-275 228×28] (data-test=special-chat-item-row-inbox) {d:flex pos:relative ai:center gap:10px p:0px 8px rad:7px cur:pointer}
                                                  cu3-icon.cu3-icon.row-icon [81,-269 16×16] {d:flex ai:center jc:center c:#838383 fs:16px lh:16px}
                                                  div.title [107,-269 186×16] "Caixa de entrada" {ov:hidden c:#646464 lh:16.002px}
                                              ↳ (este bloco se repete ×5; último em y=-155)
                                            cdk-tree-node.tree-node [73,-125 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-my-work-row.cu-my-work-row [73,-125 228×28]
                                                cu-sidebar-row-layout.cu-my-work-row__inner.expandable.home-sidebar [73,-125 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,-119 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,-119 26×16] {d:flex}
                                                  a.row-body [107,-119 194×16] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-my-work-row__container [107,-119 194×16] {d:flex ai:center gap:8px}
                                            cdk-tree-node.tree-node [73,-95 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-more-row [73,-95 228×28] {d:flex ov:hidden}
                                                cu-more-special-items-dropdown-row [73,-95 228×28] {d:flex ov:hidden}
                                                  button.row-body [73,-95 228×28] (role=button type=button haspopup=menu expanded=false) {d:flex pos:relative ai:center gap:10px p:0px 12px 0px 8px rad:7px fs:13.3333px lh:normal cur:pointer}
                                                    cu3-icon.cu3-icon.row-icon [81,-89 16×16] {d:flex ai:center jc:center c:#838383 fs:16px}
                                                    span.title [107,-89 182×16] "Mais" {ov:hidden c:#646464 fs:14px lh:16.002px}
                                            cdk-tree-node [65,-65 244×23] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider.with-border [77,-65 220×21] {pos:relative m:0px 12px}
                                            cdk-tree-node.group-row [73,-42 228×30] (role=treeitem expanded=false) {p:4px 0px 2px m:0px 8px}
                                              cu-group-row.home-sidebar [73,-38 228×24]
                                                div.context-menu-trigger [73,-38 228×24] {d:flex pos:relative ai:center jc:space-between}
                                                  button.expand-button [73,-38 228×24] (role=button) {d:flex ai:center jc:flex-start p:0px 3px 0px 5px rad:5px fs:13.3333px lh:normal cur:pointer}
                                                    div.section-name [79,-34 53×16] "Favoritos" (data-test=sidebar-group-row__section-name) {ov:hidden c:#646464 fs:12px fw:500 lh:16.008px}
                                                    cu3-icon.cu3-icon.caret [132,-33 16×16] {d:flex ai:center jc:center m:1px 0px 0px c:#8d8d8d fs:16px}
                                                  div.right [253,-36 44×20] {d:flex pos:absolute ai:center}
                                                    div.menu [253,-36 44×20] {d:flex gap:4px}
                                            cdk-tree-node [65,-12 244×12] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,-12 220×10] {pos:relative m:0px 12px}
                                            cdk-tree-node.group-row [73,0 228×30] (role=treeitem expanded=true) {p:4px 0px 2px m:0px 8px}
                                              cu-group-row.home-sidebar [73,4 228×24]
                                                div.context-menu-trigger.with-spaces-section-create [73,4 228×24] {d:flex pos:relative ai:center jc:space-between p:0px 32px 0px 0px}
                                                  button.expand-button.expand-button-rotated [73,4 196×24] (role=button) {d:flex ai:center jc:flex-start p:0px 3px 0px 5px rad:5px fs:13.3333px lh:normal cur:pointer}
                                                    div.section-name [79,8 48×16] "Espaços" (data-test=sidebar-group-row__section-name) {ov:hidden c:#646464 fs:12px fw:500 lh:16.008px}
                                                  div.right [253,6 44×20] {d:flex pos:absolute ai:center}
                                                    div.menu [253,6 44×20] {d:flex gap:4px}
                                            cdk-tree-node.tree-node.everything-row [73,30 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-everything-row.sidebar-everything-row.home-sidebar [73,30 228×28]
                                                cu-sidebar-row-layout.everything-row__inner.home-sidebar [73,30 228×28] {d:flex pos:relative ai:center rad:6px c:#8d8d8d}
                                                  div.row-left [73,34 34×20] {pos:absolute p:0px 0px 0px 6px}
                                                    div.row-avatar [79,34 28×20] {d:flex fs:20px lh:20px}
                                                  a.row-body [73,30 220×29] {ov:hidden lh:28px cur:pointer}
                                                    span.everything-row__text [73,35 228×17] "Todas as tarefas" (data-test=sidebar-workspace-name-text) {p:0px 0px 0px 34px c:#646464}
                                                  div.row-actions.remove-parent-hover [297,44 0×0] {d:flex jc:flex-end m:0px 4px}
                                            cdk-tree-node.tree-node [73,60 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-project-row.sidebar-project-row.home-sidebar [73,60 228×28]
                                                cu-sidebar-row-layout.cu-project-row__inner.expandable.home-sidebar [73,60 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,64 34×20] {p:0px 0px 0px 6px}
                                                    div.row-avatar [79,64 28×20] {d:flex}
                                                  a.row-body [107,60 194×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-project-row__container [107,60 194×28] {d:flex ai:center gap:normal 2px}
                                              ↳ (este bloco se repete ×6; último em y=210)
                                            cdk-tree-node.tree-node [73,240 228×30] (role=treeitem expanded=true) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-project-row.sidebar-project-row.home-sidebar.show-create-default [73,240 228×28]
                                                cu-sidebar-row-layout.cu-project-row__inner.expandable.home-sidebar [73,240 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,244 34×20] {p:0px 0px 0px 6px}
                                                    div.row-avatar [79,244 28×20] {d:flex}
                                                  a.row-body [107,240 160×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-project-row__container [107,240 160×28] {d:flex ai:center gap:normal 2px}
                                                  div.row-actions.remove-parent-hover [271,244 26×20] {d:flex jc:flex-end m:0px 4px}
                                                    div.row [271,244 26×20] {d:flex gap:4px}
                                            cdk-tree-node.tree-node [73,270 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,270 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,270 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,276 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,276 24×16] {d:flex}
                                                  a.row-body [123,270 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,270 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,300 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,300 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,302 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,302 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,302 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,308 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,308 24×16] {d:flex}
                                                  a.row-body [123,302 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,302 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,332 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,332 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,334 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,334 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,334 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,340 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,340 24×16] {d:flex}
                                                  a.row-body [123,334 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,334 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,364 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,364 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,366 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,366 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,366 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,372 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,372 24×16] {d:flex}
                                                  a.row-body [123,366 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,366 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,396 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,396 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,398 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,398 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,398 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,404 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,404 24×16] {d:flex}
                                                  a.row-body [123,398 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,398 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,428 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,428 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,430 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,430 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,430 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,436 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,436 24×16] {d:flex}
                                                  a.row-body [123,430 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,430 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,460 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,460 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,462 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,462 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,462 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,468 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,468 24×16] {d:flex}
                                                  a.row-body [123,462 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,462 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,492 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,492 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,494 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,494 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,494 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,500 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,500 24×16] {d:flex}
                                                  a.row-body [123,494 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,494 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,524 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,524 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,526 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,526 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,526 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,532 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,532 24×16] {d:flex}
                                                  a.row-body [123,526 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,526 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,556 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,556 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,558 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,558 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,558 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,564 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,564 24×16] {d:flex}
                                                  a.row-body [123,558 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,558 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,588 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,588 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node [73,590 228×30] (role=treeitem expanded=false) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-category-row.sidebar-category-row.home-sidebar [93,590 208×28]
                                                cu-sidebar-row-layout.cu-category-row__inner.expandable.home-sidebar [93,590 208×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [93,596 30×16] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,596 24×16] {d:flex}
                                                  a.row-body [123,590 178×28] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-category-row__container [123,590 178×28] {d:flex ai:center gap:normal 2px}
                                            cdk-tree-node.category-spacer-row-with-inline-margin [73,620 228×2] (role=treeitem) {p:0px 0px 2px m:0px 8px}
                                              cu-group-divider [85,620 204×0] {pos:relative m:0px 12px}
                                            cdk-tree-node.tree-node.active-hierarchy-item [73,622 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px 20px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-subcategory-row.home-sidebar [93,622 208×28]
                                                cu-sidebar-row-layout.cu-subcategory-row__inner.active.home-sidebar [93,622 208×28] {d:flex pos:relative ai:center bg:#000000/0.06 rad:7px}
                                                  div.row-left [93,626 30×20] {p:0px 0px 0px 6px}
                                                    div.row-avatar [99,626 24×20] {d:flex}
                                                  a.row-body [123,622 160×28] {ov:hidden lh:28px}
                                                    span.cu-subcategory-row__container [123,622 160×28] {d:flex ai:center gap:normal 2px}
                                                  div.row-count [285,630 6×12] "1" (data-test=sidebar-row__task-count) {m:0px 10px 0px 2px fs:12px lh:12px}
                                            cdk-tree-node.tree-node [73,652 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-create-project-row.sidebar-create-project-row.home-sidebar [73,652 228×28] {cur:pointer}
                                                cu-sidebar-row-layout.create-project-row__inner.home-sidebar [73,652 228×28] (data-test=sidebar-section__create-space-button) {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,658 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,658 26×16] {d:flex fs:16px lh:16px}
                                                  a.row-body [107,652 194×28] {ov:hidden lh:28px}
                                                    span.create-project-row__content [107,652 194×28] (data-test=create-project-row__content) {d:flex ai:center gap:normal 8px}
                                            cdk-tree-node [65,682 244×12] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,682 220×10] {pos:relative m:0px 12px}
                                            cdk-tree-node.group-row [73,694 228×30] (role=treeitem expanded=true) {p:4px 0px 2px m:0px 8px}
                                              cu-group-row.home-sidebar [73,698 228×24]
                                                div.context-menu-trigger [73,698 228×24] {d:flex pos:relative ai:center jc:space-between}
                                                  button.expand-button.expand-button-rotated [73,698 228×24] (role=button) {d:flex ai:center jc:flex-start p:0px 3px 0px 5px rad:5px fs:13.3333px lh:normal cur:pointer}
                                                    div.section-name [79,702 39×16] "Canais" (data-test=sidebar-group-row__section-name) {ov:hidden c:#646464 fs:12px fw:500 lh:16.008px}
                                                  div.right [253,700 44×20] {d:flex pos:absolute ai:center}
                                                    div.menu [253,700 44×20] {d:flex gap:4px}
                                            cdk-tree-node.tree-node [73,724 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-chat-room-row.cu-chat-room-row.home-sidebar [73,724 228×28] {rad:6px}
                                                cu-sidebar-row-layout.cu-chat-room-row__inner.expanded.home-sidebar [73,724 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,730 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,730 26×16] {d:flex}
                                                  a.row-body [107,724 186×28] {ov:hidden lh:28px cur:pointer}
                                                    div.cu-chat-room-row__container.secondary [107,730 142×16] (data-test=chat-sidebar-item__name) {d:inline-grid pos:relative ai:center gap:normal 4px cols:142.125px c:#646464}
                                                  div.row-actions.remove-parent-hover [297,738 0×0] {d:flex jc:flex-end m:0px 4px}
                                                    div [297,738 0×0]
                                            cdk-tree-node.tree-node [73,754 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-chat-room-row.cu-chat-room-row.home-sidebar [73,754 228×28] {rad:6px}
                                                cu-sidebar-row-layout.cu-chat-room-row__inner.expanded.home-sidebar [73,754 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,760 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,760 26×16] {d:flex}
                                                  a.row-body [107,754 186×28] {ov:hidden lh:28px cur:pointer}
                                                    div.cu-chat-room-row__container.secondary [107,760 122×16] (data-test=chat-sidebar-item__name) {d:inline-grid pos:relative ai:center gap:normal 4px cols:122.219px c:#646464}
                                                  div.row-actions.remove-parent-hover [297,768 0×0] {d:flex jc:flex-end m:0px 4px}
                                                    div [297,768 0×0]
                                            cdk-tree-node.tree-node [73,784 228×30] (role=treeitem) {d:flex pos:relative ai:center p:0px 0px 2px m:0px 8px rad:6px fs:14px lh:14px}
                                              cu-section-action-row [73,784 228×28] {rad:6px}
                                                cu-sidebar-row-layout.cu-section-action-row__inner.hide-row-actions.home-sidebar [73,784 228×28] {d:flex pos:relative ai:center rad:7px}
                                                  div.row-left [73,790 34×16] {p:0px 0px 0px 8px}
                                                    div.row-avatar [81,790 26×16] {d:flex}
                                                  a.row-body [107,790 194×16] {ov:hidden lh:28px cur:pointer}
                                                    span.cu-section-action-row__body [107,790 194×16] {d:flex ai:center gap:4px}
                                            cdk-tree-node [65,814 244×12] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,814 220×10] {pos:relative m:0px 12px}
                                            cdk-tree-node.group-row [73,826 228×30] (role=treeitem expanded=false) {p:4px 0px 2px m:0px 8px}
                                              cu-group-row.home-sidebar [73,830 228×24]
                                                div.context-menu-trigger [73,830 228×24] {d:flex pos:relative ai:center jc:space-between}
                                                  button.expand-button [73,830 228×24] (role=button) {d:flex ai:center jc:flex-start p:0px 3px 0px 5px rad:5px fs:13.3333px lh:normal cur:pointer}
                                                    div.section-name [79,834 109×16] "Mensagens diretas" (data-test=sidebar-group-row__section-name) {ov:hidden c:#646464 fs:12px fw:500 lh:16.008px}
                                                    cu3-icon.cu3-icon.caret [188,835 16×16] {d:flex ai:center jc:center m:1px 0px 0px c:#8d8d8d fs:16px}
                                                  div.right [253,832 44×20] {d:flex pos:absolute ai:center}
                                                    div.menu [253,832 44×20] {d:flex gap:4px}
                                            cdk-tree-node [65,856 244×12] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,856 220×10] {pos:relative m:0px 12px}
                                            cdk-tree-node [65,868 244×8] (role=treeitem) {p:0px 0px 2px}
                                              cu-group-divider [77,868 220×6] {pos:relative m:0px 12px}
                                        div [65,-313 244×1189]
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
                          router-outlet [321,85 1592×0]
                          cu-dashboard.cu-dashboard [321,85 1592×811] {d:grid cols:0px 1592px 0px}
                            div.cu-dashboard__body.cu-dashboard__body_v6 [321,85 1592×811] (data-test=dashboard__body__view-body) {d:flex pos:relative dir:column}
                              cu-location-split-layout [0,0 0×0] {d:contents}
                                div.cu-location-split-layout__row [0,0 0×0] {d:contents}
                                  div.cu-location-split-layout__column [0,0 0×0] {d:contents}
                                    cu-views-bar-container [0,0 0×0] {d:contents}
                                      cu2-views-bar.cu2-views-bar.cu-hidden-print.cu2-views-bar_map [321,85 1592×114] {bg:#ffffff}
                                        cu-global-request-edit-access-banner [321,85 0×0]
                                          cu-request-edit-access-banner.cu-request-edit-access-banner [321,85 0×0]
                                        cu-location-header [321,85 1592×38]
                                          div.location-header [321,85 1592×38] (data-test=location-header__views-v3) {d:flex ai:center p:8px 8px 2px 12px bg:#ffffff}
                                            div.left [333,95 1363×24] {d:flex ai:center gap:10px bg:#ffffff}
                                              div.left-body [333,95 1363×24] {d:flex}
                                                cu-location-header-breadcrumbs [333,95 356×24] {d:grid ai:center cols:89.0312px 8.125px 258.375px 0px}
                                                  cu-breadcrumb-item [333,95 89×24]
                                                    a.item.item_project [332,95 91×24] {d:flex ai:center p:0px 4px m:0px -1px rad:6px c:#646464 fs:14px lh:16.002px cur:pointer}
                                                  div.separator [424,99 4×16] "/" {m:0px 2px c:#bbbbbb fs:14px lh:16.002px}
                                                  cu-location-menu.cu-location-menu [430,95 258×24]
                                                    cu-location-picker [430,95 258×24]
                                                  cu-location-menu.cu-location-menu [689,107 0×0]
                                                    cu2-list-details-menu.cu2-list-details-menu [689,107 0×0]
                                                cu-nav-menu-move-to-section-combo-button [689,95 24×24] {d:grid cols:24px}
                                                  div.cu-dropdown [689,95 24×24] {pos:relative}
                                                    button.button.cu-dropdown__toggle [689,95 24×24] (role=button data-test=task-view-header__favorite-button type=button expanded=false) {d:inline-flex ai:center jc:center rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                                                div.location-properties-container [717,95 979×24] {d:flex m:0px 0px 0px 4px}
                                                  cu-page-header-properties.location-properties.set [717,95 0×24] {d:flex ai:center gap:4px bg:#f9f9f9 rad:6px z:2}
                                                  cu-page-header-properties.location-properties.unset [717,95 78×24] {d:flex ai:center gap:2px p:4px bg:#f9f9f9 rad:6px z:1}
                                                    cu-page-header-description-toggle.property.description-button [721,99 16×17]
                                                    cu-page-header-assignee-picker.property [739,99 16×17] (data-test=page-header-properties__assignee-picker)
                                                    cu-page-header-priority-picker.property.priority-picker [757,99 16×17] (data-test=page-header-properties__priority-picker)
                                                    cu-page-header-dates-picker.property [775,99 16×17]
                                            div.right [1696,93 209×28] {d:flex ai:center jc:flex-end gap:1px bg:#ffffff}
                                              cu-chat-room-header-syncup-button.syncup-button [0,0 0×0] {d:contents}
                                                cu3-combo-button [1696,93 40×28] (data-test=start-syncup-button) {d:flex pos:relative ai:center}
                                                  button.syncupButton [1696,93 26×28] {d:flex ai:center jc:center gap:4px rad:7px 0px 0px 7px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                                                    cu3-icon.cu3-icon [1701,99 16×16] {d:flex ai:center jc:center}
                                                    span [1695,107 1×1] "Adicionar canal e iniciar o SyncUp" {pos:absolute m:-1px ov:hidden}
                                                  button.syncupDropdown [1722,93 14×28] (role=button type=button haspopup=menu expanded=false) {d:flex ai:center jc:center gap:4px p:3px rad:0px 7px 7px 0px c:#838383 fs:16px fw:500 lh:18.2857px cur:pointer}
                                                    cu3-icon.cu3-icon [1721,99 16×16] {d:flex ai:center jc:center}
                                                    span [1695,107 1×1] "Mais opções" {pos:absolute m:-1px ov:hidden}
                                              cu-location-header-automations [0,0 0×0] {d:contents}
                                                cu-automation-converged-ai-task-dropdown.automation-converged-ai-task-dropdown [1737,93 28×28] {pos:relative}
                                                  div.cu-dropdown [1737,93 28×28] {pos:relative}
                                                    cu-automation-converged-ai-task-button.cu-dropdown__toggle [1737,93 28×28] (role=button label=Menu suspenso expanded=false) {cur:pointer}
                                              cu-brain-command-bar-at-location [1766,107 0×0] (data-test=brain-command-bar-at-location)
                                                cu-writing-tool-popover [1766,107 0×0]
                                                  div [1766,107 0×0]
                                              cu-share-header-button [1767,93 138×28]
                                                cu-header-sharing-trigger.cu-hidden-print [1767,102 138×16]
                                                  button.cu-share-header-button__btn [1767,93 138×28] (label=Documento compartilhado com 1 pessoa data-test=cu-header-share-btn) {d:inline-flex ai:center jc:center gap:4px p:0px 7px rad:7px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                                                    cu3-icon.cu3-icon [1774,99 16×16] {d:flex ai:center jc:center m:0px 0px 0px -1px fs:16px lh:18.2857px}
                                                    span.share-btn-label [1794,99 86×16] "Compartilhar" {d:flex}
                                                    span.share-btn-divider [1884,106 3×3] {d:flex ai:center jc:center}
                                                    span.share-btn-member-count [1890,99 7×16] "1"
                                        div.cu2-views-bar__controller.cu2-views-bar__controller_header-collapsed [329,123 1576×76] (data-test=views-bar__controller) {m:0px 8px}
                                          div.cu2-views-bar__controller-row.cu2-views-bar__controller-row_top [321,123 1592×35] (data-test=views-bar__controller-row) {d:flex pos:relative p:0px 8px 0px 12px m:0px -8px}
                                            cu-view-block.cu-view-block.cu2-views-bar__views [0,0 0×0] {d:contents m:0px 0px -1px}
                                              cu3-data-view-list.cu-view-block__data-view-list.in-chat [333,123 1572×35] {d:flex ai:center}
                                                div.items [333,123 866×36] {d:flex p:0px 0px 1px m:0px 0px -1px ov:clip}
                                                  div.create-chat-button [337,129 101×24] {m:0px 4px}
                                                    cu-create-location-chat-button [337,132 101×16]
                                                  div.chat-divider [442,133 11×16] {p:0px 6px 0px 4px bg:#e8e8e8}
                                                  div.drop-container [453,123 746×36] (data-test=data-view-list__unpinned-views) {d:flex p:0px 0px 1px m:0px 0px -1px ov:clip}
                                                    div.item.item_visible [453,123 55×35] {d:flex pos:relative ai:center m:0px 2px 0px 0px}
                                                      ↳ (este bloco se repete ×7; último em y=123)
                                                    div.item.item_visible.item_selected [1043,123 58×35] {d:flex pos:relative ai:center m:0px 2px 0px 0px}
                                                    div.item.item_visible [1103,123 94×35] {d:flex pos:relative ai:center m:0px 2px 0px 0px}
                                                div.float-container [1199,123 181×35] {d:flex pos:relative}
                                                  cu-add-view-dropdown [0,0 0×0] {d:contents}
                                                    cu-data-view-add-dropdown.cu-data-view-add-dropdown.cu-data-view-add-dropdown_in-chat [0,0 0×0] {d:contents}
                                          cu-views-settings-bar.cu2-views-bar__views-settings-bar [321,158 1592×41] {pos:relative p:0px 8px 0px 12px m:0px -8px}
                                            div [333,158 1572×41]
                                              div.views-settings-bar [333,158 1572×41] {d:flex ai:center gap:4px p:1px 0px 0px ov:hidden}
                                                cu-view-filter-controls [333,167 1411×24]
                                                  div.view-filter-controls [333,167 1411×24] {d:flex ai:center gap:4px}
                                                    cu-view-setting-toggle [333,167 79×24] {pos:relative}
                                                    cu-views-source-badge [0,0 0×0] {d:contents}
                                                    div.view-filter-controls__separator [412,179 1220×0] {m:0px 0px 0px -4px}
                                                    cu-view-filter-dropdown [1636,167 24×24]
                                                    cu-view-setting-toggle [1664,167 24×24] {pos:relative}
                                                    cu-view-setting-toggle [1692,167 24×24] (data-test=view-assignee-filter-toggle) {pos:relative}
                                                    cu-me-mode-avatar-toggle [1720,167 24×24] (data-test=me-mode-avatar-toggle)
                                                cu-view-filter-search-v2 [1748,167 24×24] (data-test=view-filter-search) {d:grid pos:relative cols:24px}
                                                  div.view-filter-search__toggle-container [1748,167 24×24] {pos:absolute z:1}
                                                    button.view-filter-search__toggle [1748,167 24×24] (data-test=view-filter-search-toggle) {d:inline-flex ai:center jc:center gap:4px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                                                  cu-search-filter.view-filter-search [1748,167 24×24] {ov:hidden}
                                                    div.cu-search-filter.widget-no-drag-area [1748,167 24×24] (data-test=search-filter-search) {d:flex pos:relative ai:center}
                                                cu-view-setting-separator [1776,171 9×16]
                                                  div.view-setting-separator [1780,171 1×16] {m:0px 4px bl:1px solid #e8e8e8}
                                                button [1789,167 24×24] {d:flex ai:center jc:center gap:4px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                                                  cu3-icon.cu3-icon [1793,171 16×16] {d:flex ai:center jc:center}
                                                  span [320,179 1×1] "Personalize as configurações da sua visualização" {pos:absolute m:-1px ov:hidden}
                                                cu-create-cu-object-button.cu2-views-bar__create-cu-object-button [1817,167 88×24]
                                                  cu-create-cu-object-button-view [1817,167 88×24]
                                                    cu-create-task-menu.cu-create-task-menu.views-settings-bar-compact [1817,167 88×24] (data-test=cu2-views-bar__create-menu-view-bar-coll)
                                    div.cu-dashboard__router-outlet-container [321,199 1592×697] {pos:relative}
                                      div.cu-dashboard__router-outlet.cu-dashboard__router-outlet_v6 [321,199 1592×697] (data-test=dashboard__router-outlet-canvas) {pos:relative ov:hidden}
                                        router-outlet [321,199 0×0]
                                        cu-routed-data-view-host [0,0 0×0] {d:contents}
                                          cu-dashboard-map [321,199 1592×697]
                                            div.cu-map-view [321,199 1592×697] {d:flex}
                                              div.cu-map-view__scroll-container [321,199 1552×697] {d:flex}
                                                google-map.cu-map-view__map [321,199 1552×697]
                                                  div.map-container [321,199 1552×697] {pos:relative ov:hidden}
                                                    div [321,199 1552×697] {pos:absolute bg:#e5e3df}
                                                div.cu-modal.cu-map-view__fake-modal [321,199 1592×697] {d:flex pos:absolute jc:center bg:#000000/0.6 z:10}
                                                  cu-map-location-modal.cu-map-location-modal.cu-modal__dialog_centered [913,424 407×247] {d:flex dir:column ai:center jc:center p:24px bg:#ffffff rad:6px}
                                                    img [1077,448 80×80] {ov:clip}
                                                    div.cu-map-location-modal__title [937,528 359×25] "Veja suas tarefas visualizadas em um mapa." {m:0px 0px 10px c:#292d34 fs:18px fw:500 lh:25.2px}
                                                    div.cu-map-location-modal__subtitle [976,563 283×20] "Veja suas tarefas visualizadas em um mapa." {c:#292d34 fs:14px lh:19.6px}
                                                    div [988,583 258×64]
                                              cu-dashboard-map-sidebar.cu-dashboard-map-sidebar [1873,199 40×697] {d:flex}
                                                div.cu-dashboard-time__collapsed-bar.cu-hidden-print [1873,199 40×697] {bg:#ffffff bt:1px solid #e8e8e8 bl:1px solid #e8e8e8 ov:hidden cur:pointer}
                                                  div.cu-dashboard-time__collapsed-bar-inner [1888,206 12×39] {d:flex ai:center jc:flex-end}
                                                    div.cu-dashboard-time__collapsed-bar-unscheduled [1888,243 12×42] "Tarefas" {c:#7c828d fs:12px fw:500 lh:12px}
                                                    div.cu-dashboard-time__collapsed-bar-icon.icon [1887,215 14×12] {d:flex ai:center jc:center m:0px 8px 0px 15px}
                                                div [1913,199 0×697]
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
  div [-1,902 1×1] "ZZ Teste exploracao (apagar) Post de teste A" {pos:absolute m:-1px ov:hidden}
  div [0,903 1920×0]
  div [0,903 1920×0]
    div [0,903 1920×0]
    div [0,903 1920×0]
  div.ReactModalPortal [0,903 1920×0]
```
