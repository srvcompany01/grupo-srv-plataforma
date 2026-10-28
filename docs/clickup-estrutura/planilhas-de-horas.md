# Estrutura renderizada — Planilhas de horas

URL: https://app.clickup.com/36949648/time
Nós visíveis: 450 · linhas do esboço: 370
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
                              div.cu-simple-bar__item-container.cu-simple-bar__item-container_active.cu-simple-bar__item-container_hidden [6,652 52×62] {d:grid pos:absolute p:0px 7px z:1 cols:38px}
                                cu-sidebar-pinned-item-actions.cu-simple-bar__pinned-item-hover-actions [6,652 52×62] {pos:absolute}
                                  div.cu-dropdown [6,663 0×0] {pos:relative}
                                a.cu-simple-bar__item.time-hub.cu-simple-bar__item_active [16,658 32×32] {d:flex pos:relative ai:center jc:center m:6px 0px 24px sh:#000000/0.106 0px 1px 3px 0px, #000000/0.106 0px 1px 2px -1px}
                                  span.cu-simple-bar__item-inner [16,658 32×32] {d:flex ai:center jc:center}
                                    span.cu-simple-bar__item-icon-container [16,658 32×32] {d:flex pos:relative ai:center jc:center p:6px bg:#ffffff rad:8px}
                                      cu-simple-bar-item-icon.cu-simple-bar-item-icon [22,664 20×20] {d:flex ai:center jc:center}
                                        cu3-icon.cu3-icon.icon.active [22,664 20×20] {d:flex ai:center jc:center c:#067a6f fs:20px lh:20px}
                                    span.cu-simple-bar__item-label-container [3,690 58×18] {d:flex pos:absolute jc:center wrap:wrap}
                                      span.cu-simple-bar__item-label-inner [3,690 58×18] {d:flex}
                                        span.cu-simple-bar__item-label-divider [3,690 5×18]
                                        span.cu-simple-bar__item-label [8,690 53×18] "Planilhas de horas" (data-test=simple-bar__item-label) {pos:relative p:2px 0px 0px ov:hidden c:#ffffff fs:10px fw:700 lh:16px ls:-0.25px}
                                      span.cu-simple-bar__item-label-divider [30,708 5×0]
                              div.cu-simple-bar__item-container-placeholder [32,726 0×62]
                        div.cu-simple-bar__item-dropdown.cu-dropdown [6,714 52×62] {d:flex pos:relative}
                          button.cu-simple-bar__item.cu-simple-bar__item_more.cu-dropdown__toggle [16,720 32×32] (role=button label=Menu suspenso data-test=simple-bar__more expanded=false) {d:flex pos:relative ai:center jc:center m:6px 10px 24px rad:8px c:#ffffff fs:14px fw:500 lh:16px cur:pointer}
                            cu3-icon.cu3-icon.cu-simple-bar__more-icon [23,727 18×18] {d:flex ai:center jc:center fs:18px lh:20.5714px}
                            cu-more-apps-icons.cu-simple-bar__apps [24,728 16×16] {d:grid pos:absolute gap:1px cols:11px 11px}
                              cu-more-apps-icon [24,728 8×8]
                                div.calendar.item__icon [24,728 8×8] {d:flex pos:relative ai:center jc:center c:#646464 fs:11px lh:12.5714px}
                                  cu-custom-calendar-icon [24,728 8×8] {d:flex ai:center jc:center}
                                  div.liveActivityContainer.dateLabel [25,730 5×5] "28" {pos:absolute m:1px 0px 0px bg:#ffffff c:#000000/0 fs:6px fw:700 lh:6.85714px ls:-0.4px}
                              cu-more-apps-icon [32,728 8×8]
                                div.goals.item__icon [32,728 8×8] {d:flex pos:relative ai:center jc:center c:#915930 fs:11px lh:12.5714px}
                                  cu3-icon.cu3-icon.icon [32,728 8×8] {d:flex pos:relative ai:center jc:center}
                              cu-more-apps-icon [24,736 8×8]
                                div.forms.item__icon [24,736 8×8] {d:flex pos:relative ai:center jc:center c:#553ed0 fs:11px lh:12.5714px}
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
                          cu-time-hub [65,85 1848×811] {d:flex pos:relative ov:hidden}
                            cu-time-hub-permission-check [0,0 0×0] {d:contents}
                              div.container [65,85 1848×811] {d:flex pos:relative dir:column ov:hidden}
                                cu-time-hub-header [65,85 1848×49] {d:flex pos:sticky ai:center p:0px 8px 0px 16px m:0px 0px 24px bg:#ffffff bb:1px solid #e8e8e8 z:3}
                                  cu3-icon.cu3-icon.title-icon [81,101 16×16] {d:flex ai:center jc:center m:0px 4px 0px 0px fs:16px lh:16px}
                                  p.title-text [101,102 117×14] "Planilhas de horas" (data-test=time-hub__timesheets) {pos:relative m:0px 27px 0px 0px fs:14px lh:14px}
                                  cu-time-hub-tabs [0,0 0×0] {d:contents}
                                    cu3-tab-group.tabs-container.medium [245,85 464×48] (role=tablist) {d:flex gap:12px}
                                      button.medium.tab.active [245,85 164×49] (role=tab type=button selected=true) {p:8px 0px 6px m:0px 0px -1px bb:2px solid #202020 fs:14px fw:500 lh:16.002px cur:pointer}
                                        span.tab-label [245,93 164×33] "Minha planilha de horas" {d:flex ai:center gap:4px p:8px 4px 9px rad:8px}
                                      button.medium.tab [421,85 190×49] (role=tab type=button selected=false) {p:8px 0px 6px m:0px 0px -1px bb:2px solid #000000/0 c:#838383 fs:14px fw:500 lh:16.002px cur:pointer}
                                        span.tab-label [421,93 190×33] "Todas as planilhas de horas" {d:flex ai:center gap:4px p:8px 4px 9px rad:8px}
                                      button.medium.tab [623,85 86×49] (role=tab type=button selected=false) {p:8px 0px 6px m:0px 0px -1px bb:2px solid #000000/0 c:#838383 fs:14px fw:500 lh:16.002px cur:pointer}
                                        span.tab-label [623,93 86×33] "Aprovações" {d:flex ai:center gap:4px p:8px 4px 9px rad:8px}
                                  div.flex-spacer [709,109 1066×0]
                                  button [1775,95 130×28] "Configurações" (data-test=open-timesheet-settings) {d:flex ai:center jc:center gap:4px p:0px 7px bg:#000000/0.06 rad:7px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                                    cu3-icon.cu3-icon [1783,102 14×14] {d:flex ai:center jc:center}
                                div.body [65,158 1848×738]
                                  router-outlet [65,158 0×0]
                                  cu-time-hub-user-timesheet [65,158 1848×738] {d:flex dir:column}
                                    cu-time-hub-toolbar [65,158 1848×57] {p:0px 24px}
                                      div.time-hub-toolbar [89,158 1800×33] {d:flex ai:center m:0px 0px 24px}
                                        cu-time-hub-date-navigation [89,163 48×24]
                                          button [89,163 24×24] (label=Semana anterior) {d:inline-flex ai:center jc:center gap:4px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                                            cu3-icon.cu3-icon [93,167 16×16] {d:flex ai:center jc:center}
                                          button [113,163 24×24] (label=Semana que vem) {d:inline-flex ai:center jc:center gap:4px rad:6px c:#646464 fs:16px fw:500 lh:21.3333px cur:pointer}
                                            cu3-icon.cu3-icon [117,167 16×16] {d:flex ai:center jc:center}
                                        div.cu-dropdown [137,158 184×33] {pos:relative}
                                          button.time-hub-toolbar__date-range-text.cu-dropdown__toggle [145,158 168×33] "out 25 - out 31" (role=button label=Menu suspenso expanded=false) {p:4px 8px 6px m:0px 8px rad:6px fs:20px fw:500 lh:normal cur:pointer}
                                            cu3-icon.cu3-icon.time-hub-toolbar__date-range-icon [289,166 16×16] {d:inline-flex pos:relative ai:center jc:center c:#646464 fs:16px}
                                        div [321,175 0×0]
                                        div [321,175 1568×0]
                                    cu-time-hub-filters [65,215 1848×48] (data-test=time-hub-filters) {p:0px 24px}
                                      cu-time-hub-pill-group.time-hub-filters [89,215 1800×32] {d:flex ai:center gap:4px m:0px 0px 16px}
                                        cu3-switcher.time-hub-filters__switcher [1568,215 321×32] (role=group data-test=view-mode-switcher) {d:grid pos:relative p:2px m:0px 0px 0px 1479.12px bg:#000000/0.06 rad:7px cols:158.438px 158.438px}
                                          div.selected-item-background-container [1570,217 317×28] {pos:absolute}
                                            div.selected-item-background [1570,217 158×28] {bg:#ffffff rad:5px}
                                          button [1570,217 158×28] "Planilha de horas" (data-test=task-view-button) {d:flex ai:center jc:center gap:4px p:6px 8px rad:5px z:1 c:#646464 fs:14px fw:500 lh:16.002px cur:pointer}
                                            cu3-icon.cu3-icon [1584,224 14×14] {d:flex ai:center jc:center}
                                          button [1729,217 158×28] "entradas de tempo" (data-test=entry-view-button) {d:flex ai:center jc:center gap:4px p:6px 8px rad:5px z:1 c:#8d8d8d fs:14px fw:500 lh:16.002px cur:pointer}
                                            cu3-icon.cu3-icon [1737,224 14×14] {d:flex ai:center jc:center}
                                    cu-time-hub-by-task [0,0 0×0] {d:contents}
                                      cu-time-hub-task-table [65,263 1848×337] {p:0px 24px 24px ov:hidden auto}
                                        div.time-hub-task-table-stack [89,263 1800×313] {d:flex dir:column gap:12px}
                                          div.time-hub-task-table-card [89,263 1800×301] {bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:12px ov:hidden}
                                            cu-time-hub-clickapp-disabled-banner [90,264 0×0]
                                            div.time-hub-task-table.time-hub-task-table--no-min-width.time-hub-task-table--is-wide-layout [90,264 1798×299] (data-test=timesheet-task-table) {ov:auto clip}
                                              table [90,264 1798×299] {pos:relative}
                                                tbody [90,264 1798×299] (data-test=timesheet-tbody)
                                                  tr.empty-row [90,264 1798×299] (data-test=empty-state-row)
                                                    td.time-hub-task-table__empty-table-cell [90,264 1798×299] {pos:sticky p:0px 16px 0px 12px bg:#ffffff z:1}
                                          cu-time-tracker-dropdown-v3 [89,576 1800×0]
                                            div.cu-dropdown [89,576 1800×0] {pos:relative}
                                              div.cu-dropdown__toggle [89,576 1800×0] (role=button label=Menu suspenso data-test=dropdown__toggle expanded=false) {cur:pointer}
                              cu-time-hub-approval-sidebar [0,0 0×0] {d:contents}
                                div.outer-container [1913,85 0×811] {ov:hidden}
                                  div.inner-container [1913,85 420×811] {bg:#fcfcfc bl:1px solid #e8e8e8}
                                    cu-time-hub-sidebar-header [1914,85 419×49] {d:flex ai:center p:0px 16px bg:#ffffff bb:1px solid #e8e8e8}
                                      cu3-icon.cu3-icon.icon [1930,100 18×18] {d:flex ai:center jc:center m:0px 8px 0px 0px c:#646464 fs:18.2px lh:18.2px}
                                      p.title [1956,101 329×16] "Aprovações" {fs:16px fw:600 lh:16px}
                                      button [2285,93 32×32] (data-test=close-timesheet-settings type=button) {d:flex ai:center jc:center gap:4px rad:8px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                                        cu3-icon.cu3-icon [2293,101 16×16] {d:flex ai:center jc:center}
                                        span [64,109 1×1] "Fechar barra lateral de aprovação" {pos:absolute m:-1px ov:hidden}
                                    div.body [1914,134 419×212] {p:12px 16px}
                                      div.empty [1930,146 387×188] {d:flex dir:column ai:center p:50px 0px 0px}
                                        cu3-squircle-icon.cu3-squircle-icon.empty-icon.default [2099,196 50×50] {d:grid pos:relative ai:center m:0px 0px 20px cols:50px c:#646464 fs:26px lh:26px}
                                          cu3-icon.cu3-icon.icon [2111,208 26×26] {d:flex ai:center jc:center}
                                        p.empty-title [2036,266 175×14] "Nenhuma aprovação ainda" {m:0px 0px 6px c:#646464 fs:14px fw:500 lh:14px}
                                        p.empty-text [1979,286 290×48] "Tire um tempo para enviar para aprovação, ou selecione outra" {c:#838383 fs:12px lh:16px}
                            cu-time-hub-settings [1913,85 340×811] (data-test=time-hub-settings) {pos:absolute bg:#ffffff bl:1px solid #e8e8e8 sh:#000000/0.106 0px 4px 6px -1px, #000000/0.106 0px 2px 4px -2px ov:hidden auto z:4}
                              div.time-hub-settings.time-hub-settings--v2 [1914,85 339×811]
                                cu-time-hub-sidebar-header [1914,85 339×49] {d:flex ai:center p:0px 16px bg:#ffffff bb:1px solid #e8e8e8}
                                  cu3-icon.cu3-icon.icon [1930,100 18×18] {d:flex ai:center jc:center m:0px 8px 0px 0px c:#646464 fs:18.2px lh:18.2px}
                                  p.title [1956,101 249×16] "Configurações" {fs:16px fw:600 lh:16px}
                                  button [2205,93 32×32] (data-test=close-timesheet-settings type=button) {d:flex ai:center jc:center gap:4px rad:8px c:#646464 fs:16px fw:500 lh:18.2857px cur:pointer}
                                    cu3-icon.cu3-icon [2213,101 16×16] {d:flex ai:center jc:center}
                                    span [1913,109 1×1] {pos:absolute m:-1px ov:hidden}
                                div.time-hub-settings__body [1914,134 339×195] {p:16px 0px}
                                  cu-capacity-editor.capacity-editor [1914,150 339×163] {d:flex dir:column}
                                    div.capacity-editor__content [1914,150 339×114] {d:flex dir:column gap:12px p:12px 16px}
                                      div.capacity-editor__header [1930,162 307×50]
                                        cu-work-schedule-summary-card.work-schedule-summary-card [1930,162 307×50] {d:flex ai:center gap:8px p:8px 12px bg:#f9f9f9 bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:6px}
                                          div.work-schedule-summary-card__icon [1943,174 26×26] {d:flex ai:center jc:center bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:6px c:#646464}
                                            cu3-icon.cu3-icon [1950,181 13×13] {d:flex ai:center jc:center}
                                          div.work-schedule-summary-card__content [1977,171 189×32]
                                            p.work-schedule-summary-card__title [1977,171 189×16] "Horário de trabalho padrão" (data-test=work-schedule-summary-card__title) {fs:14px lh:16.002px}
                                            p.work-schedule-summary-card__summary [1977,187 189×16] "• •" (data-test=work-schedule-summary-card__summary) {c:#838383 fs:12px lh:16.008px}
                                              span.work-schedule-summary-card__workday-range [1977,187 52×16] "seg - sex" {ov:hidden}
                                              span [2041,187 35×15] "8h/dia"
                                              span [2089,187 70×15] "40h/semana"
                                          div.work-schedule-summary-card__actions [2174,175 50×24] {d:flex ai:center gap:4px}
                                            button [2174,175 50×24] "Editar" (data-test=work-schedule-summary-card__edit-button) {d:flex ai:center jc:center gap:4px p:0px 7px rad:6px c:#646464 fs:12px fw:500 lh:16px cur:pointer}
                                      cu-accordion.cu-accordion.capacity-editor__body [1930,224 307×28] (data-test=accordion-dashboard-component) {d:flex dir:column}
                                        div.cu-accordion__toggle [1930,224 307×28] (data-test=accordion__toggle-side-drawer__collapsed expanded=false) {cur:pointer}
                                          div.capacity-editor__accordion-toggle [1930,224 307×28] {d:flex ai:center gap:4px}
                                            button [1930,228 20×20] (data-test=capacity-editor__accordion-toggle-button expanded=false) {d:flex ai:center jc:center gap:4px rad:5px c:#646464 fs:16px fw:500 lh:21.3333px}
                                              cu3-icon.cu3-icon [1932,230 16×16] {d:flex ai:center jc:center}
                                              span [1913,238 1×1] "Expandir capacidade diária" {pos:absolute m:-1px ov:hidden}
                                            div.capacity-editor__row [1954,224 283×28] {d:flex ai:center jc:space-between}
                                              span.capacity-editor__label [1954,230 105×16] "Horas semanais" {fs:14px fw:500 lh:16.002px}
                                              cu-capacity-input.capacity-input [2147,224 90×28] (data-test=capacity-editor__weekly-input) {d:flex ai:center gap:8px}
                                                cu-task-time-estimate-input [2147,224 90×28]
                                                  cu-time-estimates-input.cu-time-estimates-input.cu-task-time-estimate-input__input.cu-task-time-estimate-input__input--v2 [2147,224 90×28] {d:flex pos:relative ai:center c:#343434}
                                                    div.cu-time-estimates-input__container [2147,224 90×28] (data-test=time-estimates-input)
                                        div.cu-accordion__body.cu-accordion__body_animated [1930,252 307×0] (data-test=accordion__docs-sidebar-body__collapsed) {d:grid}
                                    footer.capacity-editor__footer [1914,264 339×49] {d:flex ai:center jc:flex-end gap:8px p:12px 16px bt:1px solid #e8e8e8}
                                      button.capacity-editor__reset [1930,277 84×24] "Redefinir" (data-test=capacity-editor__reset) {d:flex ai:center jc:center gap:4px p:0px 7px m:0px 163.203px 0px 0px rad:6px c:#bbbbbb fs:12px fw:500 lh:16px cur:not-allowed}
                                        cu3-icon.cu3-icon [1938,283 12×12] {d:flex ai:center jc:center}
                                      button [2185,277 52×24] "Salvar" (data-test=capacity-editor__save) {d:flex ai:center jc:center gap:4px p:0px 7px bg:#53b9ab rad:6px c:#ffffff/0.663 fs:12px fw:500 lh:16px cur:not-allowed}
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
  div [0,903 1920×0]
    div [0,903 1920×0]
    div [0,903 1920×0]
```
