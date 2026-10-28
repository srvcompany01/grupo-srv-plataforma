# Estrutura renderizada — Estado — menu do seletor de workspace

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 74 · linhas do esboço: 66
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
div [0,0 1920×903] {pos:fixed z:1000 c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
  div [0,0 1920×903] {d:flex pos:absolute dir:column z:1000}
    div [6,39 320×428] {d:flex pos:absolute z:1000}
      cu-workspace-picker [6,39 320×428]
        cu3-menu.cu3-menu.cu3-menu-position-below [6,39 320×428] (role=menu) {d:grid p:8px 0px 0px bg:#ffffff rad:8px 12px 12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 ov:hidden auto cols:320px}
          div.workspace-picker [6,47 320×372] (data-test=workspace-picker__body-menu) {d:flex dir:column ov:hidden auto}
            div.selected-workspace [6,47 320×88]
              cu-workspace-picker-item.workspace [6,47 320×56]
                div.workspace.selected [6,47 320×56] (data-test=workspace-picker-item__Srv Company) {d:flex ai:center gap:12px p:4px 12px 12px rad:8px}
                  div.workspace-content [18,51 296×40] {d:flex ai:center gap:12px}
                    div.avatar.avatar-clickable [18,51 40×40]
                      cu3-avatar.cu3-avatar [18,51 40×40]
                        div.space-bg-azure-blue.space-avatar [18,51 40×40] (label=Srv Company, ,  data-test=avatar-removal-block) {d:flex pos:relative ai:center jc:center bg:#0091ff bt:1px solid #000000/0.06 bb:1px solid #000000/0.06 bl:1px solid #000000/0.06 br:1px solid #000000/0.06 rad:10px c:#ffffff fs:18px fw:700 lh:18px}
                          span.avatar-initials [32,62 12×18] "S"
                    div.workspace-info [70,53 244×37] {d:flex dir:column ai:flex-start gap:2px}
                      div.title [70,53 244×20] "Srv Company" {ov:hidden fs:16px fw:500 lh:20px}
                      div.details [70,75 169×15] {d:flex ov:hidden c:#838383 fs:12px fw:500 lh:15px}
                        div.details-wrapper [70,75 73×15] {d:flex dir:row-reverse ai:center jc:flex-end gap:4px}
                          span.plan [70,75 73×15] "Free Forever"
                        a.upgrade-button [143,75 97×15] {cur:pointer}
                          span.upgrade-button-text [156,75 83×16] {bb:1px solid #838383}
                            cu-ai-shimmer-text [156,75 83×15]
                              span.cu-ai-shimmer-text.cu-ai-shimmer-text--shimmer [156,75 83×15] {bg:#838383 bgimg:linear-gradient(250deg, #000000/0 calc(50% - 50.5529px), #35bae6, #a43}
                                span.cu-ai-shimmer-text_inner [156,75 83×15] "Fazer upgrade" {ov:hidden c:#000000/0}
              div.workspace-picker-actions [6,103 320×32] {d:flex gap:6px p:0px 12px 4px}
                cu3-menu-item.cu3-menu-item.workspace-picker-action-button [18,103 145×28] (role=menuitem) {d:flex ai:center jc:center gap:4px p:4px 8px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:7px wrap:wrap c:#646464 fs:14px fw:500 lh:16.002px cur:pointer}
                  cu3-icon.cu3-icon.icon [32,109 16×16] {d:flex ai:center jc:center fs:16px lh:18.288px}
                  span.label [52,109 96×16] "Configurações"
                cu3-menu-item.cu3-menu-item.workspace-picker-action-button [169,103 145×28] (role=menuitem data-test=workspace-picker__manage-users) {d:flex ai:center jc:center gap:4px p:4px 8px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:7px wrap:wrap c:#646464 fs:14px fw:500 lh:16.002px cur:pointer}
                  cu3-icon.cu3-icon.icon [204,109 16×16] {d:flex ai:center jc:center fs:16px lh:18.288px}
                  span.label [224,109 55×16] "Pessoas"
            hr.workspace-picker-separator [6,143 320×1] {m:8px 0px bt:1px solid #f0f0f0 ov:hidden c:#808080}
            div [6,152 320×176]
              cu3-menu-heading.cu3-menu-heading.header [6,152 320×28] "Gerenciar" {d:flex ai:center p:6px 20px 6px 16px c:#838383 fs:12px fw:500 lh:16.008px}
              cu3-menu-item.cu3-menu-item.app-center-menu-item [14,180 304×28] (role=menuitem data-test=workspace-picker__manage-item-appCenter) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                cu3-icon.cu3-icon.icon [22,186 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
                span.label [46,186 264×16] "Aplicativos" {d:flex ai:center gap:8px}
              cu3-menu-item.cu3-menu-item [14,210 304×28] (role=menuitem data-test=workspace-picker__manage-item-templates) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                cu3-icon.cu3-icon.icon [22,216 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
                span.label [46,216 264×16] "Modelos"
                ↳ (este bloco se repete ×4; último em y=300)
            hr.workspace-picker-separator [6,336 320×1] {m:8px 0px bt:1px solid #f0f0f0 ov:hidden c:#808080}
            div.workspace-list-container [6,337 320×82] {p:8px 0px m:-8px 0px 0px bg:#ffffff}
              div.workspace-list [6,345 320×66]
                div.switch-workspaces-wrapper [6,345 320×28] {d:flex pos:sticky ai:center bg:#ffffff z:5}
                  cu3-menu-heading.cu3-menu-heading.header.no-padding-bottom [6,345 320×28] "Alternar Espaços de trabalho" {d:flex ai:center p:6px 16px c:#838383 fs:12px fw:500 lh:16.008px}
                div.workspace-picker-item-container [6,373 320×38] {p:6px 0px 0px}
                  cu3-menu-item.cu3-menu-item.workspace-item [14,379 304×32] (role=menuitem data-test=workspace-picker__switch-item-9013092453) {d:flex gap:2px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
                    span.label [14,379 304×32]
                      cu-workspace-picker-item [14,379 304×32]
                        div.workspace [14,379 304×32] (data-test=workspace-picker-item__Srv Agência) {d:flex ai:center gap:12px p:4px 8px rad:8px}
                          div.workspace-content [22,383 288×24] {d:flex ai:center gap:8px}
                            div.avatar [22,383 24×24]
                              cu3-avatar.cu3-avatar [22,383 24×24]
                                div.space-bg-black.space-avatar [22,383 24×24] (label=Srv Agência, ,  data-test=avatar-removal-block) {d:flex pos:relative ai:center jc:center bg:#1e1f24 bt:1px solid #000000/0.06 bb:1px solid #000000/0.06 bl:1px solid #000000/0.06 br:1px solid #000000/0.06 rad:6px c:#ffffff fs:12px fw:700 lh:13.716px}
                                  span.avatar-initials [30,388 8×14] "S"
                            div.workspace-info [54,387 256×16] {d:flex ai:center gap:8px}
                              div.title [54,387 77×16] "Srv Agência" {ov:hidden}
                              div.details [139,395 0×0] {d:flex c:#838383 fs:12px fw:500 lh:15px}
                                div.details-wrapper [139,395 0×0] {d:flex dir:row-reverse ai:center jc:flex-end gap:4px}
          div.footer [6,419 320×48] {pos:sticky p:8px 0px 12px bg:#ffffff z:5}
            cu3-menu-item.cu3-menu-item.create-workspace-item [18,427 296×28] (role=menuitem data-test=workspace-picker__add-new-workspace) {d:flex ai:center jc:center gap:2px 4px p:4px 8px m:0px 12px bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [76,433 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
              span.label [96,433 159×16]
                span [96,432 159×17] "Criar Espaço de trabalho" (data-test=workspace-picker__add)
cu-page-modal [0,903 0×0] {c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
```
