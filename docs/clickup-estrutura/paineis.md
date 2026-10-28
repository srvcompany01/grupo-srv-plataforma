# Estrutura renderizada — Painéis (hub)

URL: https://app.clickup.com/36949648/hubs/dashboards
Nós visíveis: 565 · linhas do esboço: 399
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
                        div.cu-simple-bar__body-items [6,40 52×624] {d:flex pos:relative dir:column ai:center}
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
                          div.cu-simple-bar__body-pinned-hubs [6,230 52×434] (data-test=simple-bar__body-pinned-hubs) {d:flex dir:column ai:center ov:clip}
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
                              div.cu-simple-bar__item-container.cu-simple-bar__item-container_hidden [6,664 52×62] {d:grid pos:relative p:0px 7px cols:38px}
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
                        div.cu-simple-bar__item-dropdown.cu-dropdown [6,664 52×62] {d:flex pos:relative}
                          button.cu-simple-bar__item.cu-simple-bar__item_more.cu-dropdown__toggle [16,670 32×32] (role=button label=Menu suspenso data-test=simple-bar__more expanded=false) {d:flex pos:relative ai:center jc:center m:6px 10px 24px rad:8px c:#ffffff fs:14px fw:500 lh:16px cur:pointer}
                            cu3-icon.cu3-icon.cu-simple-bar__more-icon [23,677 18×18] {d:flex ai:center jc:center fs:18px lh:20.5714px}
                            cu-more-apps-icons.cu-simple-bar__apps [24,678 16×16] {d:grid pos:absolute gap:1px cols:11px 11px}
                              cu-more-apps-icon [24,678 8×8]
                                div.docs.item__icon [24,678 8×8] {d:flex pos:relative ai:center jc:center c:#0880ea fs:11px lh:12.5714px}
                                  cu3-icon.cu3-icon.icon [24,678 8×8] {d:flex pos:relative ai:center jc:center}
                                ↳ (este bloco se repete ×3; último em y=686)
                              cu3-icon.cu3-icon.add [32,686 8×8] {d:flex pos:relative ai:center jc:center fs:11px lh:12.5714px}
                            span.cu-simple-bar__item-label-container [3,702 58×18] {d:flex pos:absolute jc:center wrap:wrap}
                              span.cu-simple-bar__item-label-inner [16,702 27×18] {d:flex}
                                span.cu-simple-bar__item-label-divider [16,702 5×18]
                                span.cu-simple-bar__item-label [21,702 22×18] "Mais" {pos:relative p:2px 0px 0px ov:hidden fs:10px fw:600 ls:-0.25px}
                              span.cu-simple-bar__item-label-divider [43,702 5×18]
                        div.cu-simple-bar__body-divider [6,726 52×50]
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
                                cu-hubs-sidebar [65,41 255×855] {d:flex dir:column}
                                  div.cu-hubs-sidebar-header [65,41 255×44] {d:flex pos:sticky ai:center jc:space-between p:0px 8px 0px 12px bg:#f9f9f9 z:2}
                                    div.cu-hubs-sidebar-header__title-wrapper [77,53 54×20] {d:flex ai:center gap:6px}
                                      span.cu-hubs-sidebar-header__title [77,53 54×20] "Painéis" {fs:16px fw:600 lh:20px}
                                    div.cu-sidebar-header__controls [282,49 30×28] {d:flex ai:center gap:1px}
                                      button.create-new [284,49 28×28] (data-test=hub-sidebar-create-new-button) {d:flex ai:center jc:center gap:4px m:0px 0px 0px 2px bg:#ffffff rad:7px sh:#000000/0.45 0px 0px 1px 0px, #000000/0.15 0px 1px 3px 0px, #000000/0. fs:16px fw:500 lh:18.2857px cur:pointer}
                                        cu3-icon.cu3-icon [290,55 16×16] {d:flex ai:center jc:center}
                                        span [64,63 1×1] "Novo painel" {pos:absolute m:-1px ov:hidden}
                                  div.items-container [65,85 255×811] {p:0px 0px 8px ov:hidden auto}
                                    cu3-nav-item-list [65,85 255×410] (role=tree)
                                      div.quick-filters-container [65,85 255×130] {d:flex pos:relative dir:column gap:2px normal p:0px 0px 12px m:0px 0px 8px}
                                        cu3-nav-item.cu3-nav-item.nav-item-content.is-active [73,85 239×28] (role=treeitem data-test=sidebar-item-link selected=true) {d:flex pos:relative gap:2px 8px p:6px 8px m:0px 8px bg:#000000/0.06 rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                                          cu3-nav-item-icon [81,91 16×16] {d:flex ai:center}
                                            cu3-icon.cu3-icon.nav-item-icon.nav-item-leading-icon [81,91 16×16] {d:flex ai:center jc:center fs:16px lh:18.288px}
                                          div.nav-item-content-inner [105,91 199×16] {d:flex ai:center jc:space-between gap:8px}
                                            cu3-nav-item-content [105,91 199×16] {d:flex ai:center gap:0px 3px}
                                              div.nav-item-content-text [105,91 199×16] {d:flex ai:center gap:normal 3px}
                                                span.nav-item-content-name [105,91 108×16] "Todos os painéis" {ov:hidden}
                                        cu3-nav-item.cu3-nav-item.nav-item-content.has-avatar [73,115 239×28] (role=treeitem data-test=sidebar-item-link selected=false) {d:flex pos:relative gap:2px 6px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                                          cu3-nav-item-icon [81,121 18×16] {d:flex ai:center}
                                            cu3-avatar.cu3-avatar.nav-item-avatar.nav-item-leading-icon [79,119 20×20] {d:flex m:-2px 0px -2px -2px c:#646464}
                                              div.user-bg-black.avatar.has-image [79,119 20×20] (label=Fabricio Saraiva, ,  data-test=avatar-removal-block) {d:flex pos:relative ai:center jc:center bg:#202020 bgimg:url("https://attachments.clickup.com/profilePictures/49188670_WiC.jpg" rad:666px c:#ffffff fs:12px fw:700 lh:13.716px ls:-0.15px}
                                                img.foreground-image-preloader [89,129 1×1] {pos:absolute ov:clip}
                                                span.avatar-initials [89,129 0×0]
                                          div.nav-item-content-inner [105,121 199×16] {d:flex ai:center jc:space-between gap:8px}
                                            cu3-nav-item-content [105,121 183×16] {d:flex ai:center gap:0px 3px c:#646464}
                                              div.nav-item-content-text [105,121 183×16] {d:flex ai:center gap:normal 3px}
                                                span.nav-item-content-name [105,121 85×16] "Meus painéis" {ov:hidden}
                                            cu3-nav-item-end-content [296,121 8×16] {d:flex ai:center jc:flex-end gap:normal 3px}
                                              cu3-nav-item-count [0,0 0×0] {d:contents}
                                                div.nav-item-count [296,121 8×16] {d:flex}
                                                  span.nav-item-postscript [296,121 8×16] "3" {c:#8d8d8d fs:12px lh:16.008px}
                                        cu3-nav-item.cu3-nav-item.nav-item-content.is-ancestor [73,145 239×28] (role=treeitem data-test=sidebar-item-link selected=false) {d:flex pos:relative gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                                          cu3-nav-item-icon [81,151 16×16] {d:flex ai:center}
                                            cu3-icon.cu3-icon.nav-item-icon.nav-item-leading-icon [81,151 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
                                          div.nav-item-content-inner [105,151 199×16] {d:flex ai:center jc:space-between gap:8px}
                                            cu3-nav-item-content [105,151 199×16] {d:flex ai:center gap:0px 3px c:#646464}
                                              div.nav-item-content-text [105,151 199×16] {d:flex ai:center gap:normal 3px}
                                                span.nav-item-content-name [105,151 147×16] "Compartilhado comigo" {ov:hidden}
                                        cu3-nav-item.cu3-nav-item.nav-item-content.is-ancestor [73,175 239×28] (role=treeitem data-test=sidebar-item-link selected=false) {d:flex pos:relative gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                                          cu3-nav-item-icon [81,181 16×16] {d:flex ai:center}
                                            cu3-icon.cu3-icon.nav-item-icon.nav-item-leading-icon [81,181 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
                                          div.nav-item-content-inner [105,181 199×16] {d:flex ai:center jc:space-between gap:8px}
                                            cu3-nav-item-content [105,181 183×16] {d:flex ai:center gap:0px 3px c:#646464}
                                              div.nav-item-content-text [105,181 183×16] {d:flex ai:center gap:normal 3px}
                                                span.nav-item-content-name [105,181 49×16] "Privado" {ov:hidden}
                                            cu3-nav-item-end-content [296,181 8×16] {d:flex ai:center jc:flex-end gap:normal 3px}
                                              cu3-nav-item-count [0,0 0×0] {d:contents}
                                                div.nav-item-count [296,181 8×16] {d:flex}
                                                  span.nav-item-postscript [296,181 8×16] "3" {c:#8d8d8d fs:12px lh:16.008px}
                                      cu-hubs-sidebar-section.cu-hubs-sidebar-section [65,223 255×136] {p:0px 0px 16px}
                                        cu-sidebar-items-group [0,0 0×0] (data-test=hub-section) {d:contents}
                                          div.menu-separator [77,223 231×0] {m:0px 12px}
                                          h3.menu-subtitle [79,223 225×16] "Favoritos" {m:8px 16px 8px 14px c:#838383 fs:12px fw:500 lh:16.008px}
                                          div.empty-state.with-background [81,247 223×88] {d:flex dir:column ai:center p:16px m:8px 16px bg:#ffffff bgimg:url("https://app-cdn.clickup.com/pt-BR/media/favorites-background-TGVD rad:10px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px}
                                            cu3-icon.cu3-icon.empty-state-icon [185,263 16×16] {d:flex ai:center jc:center m:0px 0px 8px c:#ffc53d fs:16px lh:16px}
                                            h3.empty-state-text [97,287 191×32] "Marque um Painéis com estrela para que apareça aqui" {c:#838383 fs:12px lh:16.008px}
                                      cu-hubs-sidebar-section.cu-hubs-sidebar-section [65,367 255×128] {p:0px 0px 16px}
                                        cu-sidebar-items-group [0,0 0×0] (data-test=hub-section) {d:contents}
                                          div.menu-separator [77,367 231×0] {m:0px 12px}
                                          h3.menu-subtitle [79,367 225×16] "Recentes" {m:8px 16px 8px 14px c:#838383 fs:12px fw:500 lh:16.008px}
                                          cu-sidebar-dropdown-menu-item.sidebar-dropdown-menu-item [65,391 255×28]
                                            a.cu3-nav-item.nav-item-content.is-ancestor [73,391 239×28] (role=treeitem data-test=hub-section__item selected=false) {d:flex pos:relative gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                                              cu3-nav-item-icon [81,397 16×16] {d:flex ai:center}
                                                div.nav-item-icon-container.nav-item-leading-icon [81,397 16×16] {d:flex ai:center jc:center c:#646464}
                                                  cu-sidebar-item-icon [81,397 16×16] {d:flex ai:center}
                                                    cu3-view-icon.view-icon [0,0 0×0] {d:contents}
                                              div.nav-item-content-inner [105,397 199×16] {d:flex ai:center jc:space-between gap:8px}
                                                cu3-nav-item-content [105,397 199×16] {d:flex ai:center gap:0px 3px c:#646464}
                                                  div.nav-item-content-text [105,397 199×16] {d:flex ai:center gap:normal 3px}
                                                    span.nav-item-content-name [105,397 70×16] {ov:hidden}
                                            ↳ (este bloco se repete ×3; último em y=451)
                                      span [64,494 1×1] "Use as setas para cima e para baixo para navegar entre os it" {pos:absolute m:-1px ov:hidden}
                                  cu-hubs-sidebar-footer [65,896 255×0]
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
                          cu-view-item-hub-dashboards [321,85 1592×855] (data-test=view-item-hub-dashboards__dashboards-hub) {d:flex dir:column ai:center bg:#ffffff}
                            div.cu-hub-widget-header [321,85 1592×44] {pos:sticky bg:#ffffff z:1}
                              cu-hub-bar [321,85 1592×44]
                                div.cu-hub-bar [321,85 1592×44] {d:flex pos:relative ai:center jc:space-between p:0px 8px 0px 12px bg:#ffffff}
                                  div.cu-hub-bar__title-wrapper [333,98 112×18] {d:flex ai:center gap:4px}
                                    cu-hub-bar-title [333,98 112×18]
                                      div.cu-hub-bar__title [333,98 112×18] "Todos os painéis" (data-test=hub-bar__Todos os painéis) {d:flex fs:14px fw:600 lh:17.5px}
                                  div.cu-hub-bar__actions-wrapper [1796,93 109×28] {d:flex ai:center gap:4px}
                                    cu-hub-create-menu [1796,93 109×28] {d:flex ai:center}
                                      button.create-button [1796,93 88×28] "Novo painel" (data-test=hub-create-menu__create-button) {d:flex ai:center jc:center gap:4px p:0px 2px 0px 7px bg:#12a594 rad:7px 0px 0px 7px c:#ffffff fs:14px fw:500 lh:16px cur:pointer}
                                      button.chevron-button [1884,93 21×28] (role=button data-test=hub-create-menu__create-button-dropdown type=button haspopup=menu expanded=false) {d:flex ai:center jc:center gap:4px p:0px 4px 0px 2px bg:#12a594 rad:0px 7px 7px 0px c:#ffffff fs:14px fw:500 lh:16px cur:pointer}
                                        cu3-icon.cu3-icon [1886,100 14×14] {d:flex ai:center jc:center}
                                        span [320,107 1×1] "Opções de Novo painel" {pos:absolute m:-1px ov:hidden}
                            cu-hub-content [321,129 1592×342] {m:0px 0px 44px}
                              div.main-container [0,0 0×0] {d:contents}
                                cu-widget-container.cu-hub-widget-container.start-with-dashboard-template.hubs-sidebar [321,129 1581×124] {d:grid gap:16px cols:1581px}
                                  cu-widget-renderer.cu-widget-container__widget-item [321,129 1581×124]
                                    ngxd-do-check-hook [321,129 0×0]
                                    cu-widget-start-with-dashboard-template [321,137 1581×92] (data-test=dashboard-hub__start-with-template)
                                      cu-templates-accordion [333,137 1561×92] {m:8px 8px 24px 12px}
                                        div.header [333,137 1561×20] {d:flex ai:center gap:4px}
                                          p.text [333,139 49×16] "Modelos" {c:#838383 fs:12px fw:500 lh:16.008px}
                                          button.hide-button.text [386,137 57×20] "Ocultar" {d:flex ai:center jc:center gap:2px p:0px 6px rad:5px c:#838383 fs:12px fw:500 lh:16px cur:pointer}
                                        cu-template-list.body [333,157 1561×72] {p:8px 0px 0px}
                                          div.wrapper [333,165 1342×64] {d:grid gap:10px cols:440.812px 440.812px 440.828px 0px 0px 0px}
                                            cu-template-item [333,165 441×64] (data-test=get-started-with-template)
                                              button.card-button [333,165 441×64] {d:flex ai:center jc:center gap:4px rad:12px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                                                cu-template-card [333,165 441×64] {d:flex pos:relative ai:center gap:12px p:12px bg:#ffffff rad:12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.055 0px 1px 2px 0px}
                                                  img.template-card-icon [345,177 40×40] {ov:clip}
                                                  div.content [397,179 150×36]
                                                    div.title [397,179 150×16] "Painel simples" {d:flex ai:center m:0px 0px 2px ov:hidden c:#202020 lh:16.002px}
                                                    div.description [397,197 150×18] "Gerencie e priorize tarefas" {ov:hidden c:#838383 fs:12px fw:400 lh:18px}
                                              ↳ (este bloco se repete ×3; último em y=165)
                                cu-widget-container.cu-hub-widget-container.cu-hub-widget-container--fill [321,253 1581×218] {d:grid gap:16px cols:1581px}
                                  cu-widget-renderer.cu-widget-container__widget-item [321,253 1581×218]
                                    ngxd-do-check-hook [321,253 0×0]
                                    cu-widget-all-dashboards-component [321,253 1581×218]
                                      cu-widget-filters [321,253 1581×49] {pos:sticky z:10}
                                        cu-widget-quick-filters.widget-quick-filters.tags-hidden [321,253 1581×49] {d:flex jc:space-between p:8px 8px 8px 12px bg:#ffffff bb:1px solid #f0f0f0}
                                          div.advanced-controls [333,261 1561×32] {d:flex ai:center jc:flex-end gap:4px}
                                            button.advanced-controls__search [1789,261 105×32] "Pesquisar" (data-test=advanced-controls__search__expand) {d:flex ai:center jc:center gap:4px p:0px 11px m:0px 0px 0px 1359.45px rad:8px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                                              cu3-icon.cu3-icon [1797,269 16×16] {d:flex ai:center jc:center m:0px 0px 0px -4px fs:16px lh:18.2857px}
                                            div.filters-and-sorting.tags-hidden [333,265 93×24] {d:flex gap:4px}
                                              cu-widget-sorting-dropdown.sorting-dropdown [333,265 93×24]
                                                button.menu-trigger [333,265 93×24] (role=button type=button haspopup=menu expanded=false) {d:flex ai:center jc:center gap:4px p:4px 6px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:12px ov:hidden c:#646464 fs:12px fw:500 lh:16.008px cur:pointer}
                                                  cu3-icon.cu3-icon [340,270 14×14] {d:flex ai:center jc:center fs:14px lh:18.676px}
                                                  span [358,269 61×16] "Classificar"
                                      cu-widget-table.cu-widget-table [321,302 1581×169] {pos:relative}
                                        cu-widget-table-wrapper.cu-widget-table-wrapper [321,302 1581×169]
                                          div.table-wrapper [321,302 1581×169] (role=tabpane) {pos:relative}
                                            div.table-wrapper__inner [321,302 1581×169] {pos:relative ov:hidden}
                                              cu-columns-controller.table-column-controller [1836,305 26×26] {pos:absolute z:2}
                                                div.cu-dropdown [1836,305 26×26] {pos:relative}
                                                  button.columns-controller-button.cu-dropdown__toggle [1836,305 26×26] (role=button data-test=columns-controller__dropdown-toggle type=button expanded=false) {d:inline-flex ai:center jc:center gap:4px rad:8px c:#838383 fs:16px fw:500 lh:18.2857px cur:pointer}
                                                    cu3-icon.cu3-icon [1841,310 16×16] {d:flex ai:center jc:center}
                                                    span [1835,318 1×1] "Adicionar uma coluna" {pos:absolute m:-1px ov:hidden}
                                              cdk-table [357,302 1509×137] (role=table data-test=hub-table) {pos:relative m:0px 36px 32px}
                                                cdk-header-row [357,302 1509×32] (role=row data-test=hub-table__row-header) {d:flex}
                                                  cdk-header-cell [357,302 774×32] (role=columnheader data-test=hub-table__cell-name__header) {d:flex ai:center gap:4px}
                                                    div.sort-header-container [357,302 54×32] (role=button) {d:flex ai:center rad:6px cur:pointer}
                                                    ↳ (este bloco se repete ×6; último em y=302)
                                                  cu-widget-table-columns-controller-header [1831,302 35×32] {d:flex ai:center}
                                                cdk-row [309,333 1605×36] (role=row data-test=hub-table__row) {d:flex pos:relative p:0px 48px m:-1px -48px 0px bt:1px solid #f0f0f0 bb:1px solid #f0f0f0}
                                                  cdk-cell [357,334 774×34] (role=cell data-test=hub-table__cell-name__content) {d:flex ai:center gap:4px p:0px 12px 0px 6px c:#646464 fs:14px lh:14px}
                                                    cu-dashboard-name-cell [363,331 756×40]
                                                    ↳ (este bloco se repete ×7; último em y=334)
                                                  ↳ (este bloco se repete ×3; último em y=403)
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
