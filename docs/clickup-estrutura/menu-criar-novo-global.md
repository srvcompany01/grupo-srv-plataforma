# Estrutura renderizada — Estado — menu Criar (+) do painel

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 67 · linhas do esboço: 46
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
div [0,0 1920×903] {pos:fixed z:1000 c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
  div [0,0 1920×903] {d:flex pos:absolute dir:column z:1000}
    div [266,85 275×562] {d:flex pos:absolute z:1000}
      cu-global-creation-menu [266,85 275×562]
        cu-sidebar-creation-menu-simple [266,85 275×562]
          cu3-combo-box.cu3-combo-box.container.cu3-menu-position-below [266,85 275×562] (role=menu data-test=sidebar-creation-menu-simple__container) {d:grid p:8px 0px bg:#ffffff rad:12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 ov:hidden auto cols:275px}
            cu3-menu-heading.cu3-menu-heading [266,93 275×28] "Criar" {d:flex ai:center p:6px 20px 6px 16px c:#838383 fs:12px fw:500 lh:16.008px}
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item.active [274,121 259×28] (role=option data-test=sidebar-creation-menu-item-task) {d:flex gap:2px 8px p:6px 8px m:0px 8px bg:#000000/0.06 rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [282,127 16×16] {d:flex ai:center jc:center fs:16px lh:18.288px}
              span.label [306,127 190×16] "Tarefa"
              span.postscript [504,127 21×16] "⌥ T" {c:#8d8d8d fs:12px lh:16.008px}
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item [274,151 259×28] (role=option data-test=sidebar-creation-menu-item-message) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [282,157 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
              span.label [306,157 189×16] "Mensagem"
              span.postscript [503,157 22×16] "⌘ G" {c:#8d8d8d fs:12px lh:16.008px}
            hr [266,187 275×1] {m:8px 0px bt:1px solid #f0f0f0 ov:hidden c:#808080}
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item [274,196 259×66] (role=option data-test=sidebar-creation-menu-item-list) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [282,202 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
              span.label [306,202 219×16] "Lista"
              span.description [306,220 219×36] "Acompanhe tarefas, projetos, pessoas e muito mais" {m:0px 0px 0px 24px c:#646464 fs:12px lh:18px}
              ↳ (este bloco se repete ×3; último em y=314)
            hr [266,388 275×1] {m:8px 0px bt:1px solid #f0f0f0 ov:hidden c:#808080}
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item [274,397 259×28] (role=option data-test=sidebar-creation-menu-item-doc) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-view-icon.icon [0,0 0×0] {d:contents c:#646464 fs:16px lh:18.288px}
                div.view-icon-container.view-type-9 [282,403 16×16] {d:flex pos:relative ai:center jc:center c:#0091ff}
                  cu3-icon.cu3-icon.view-icon [282,403 16×16] {d:flex pos:relative ai:center jc:center}
              span.label [306,403 219×16] "Documento"
              ↳ (este bloco se repete ×4; último em y=487)
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item [274,517 259×28] (role=option data-test=sidebar-creation-menu-item-clip) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [282,523 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
              span.label [306,523 219×16] "Clipe"
            hr [266,553 275×1] {m:8px 0px bt:1px solid #f0f0f0 ov:hidden c:#808080}
            cu3-combo-box-item.cu3-menu-item.cu3-combo-box-item [274,562 259×28] (role=option data-test=sidebar-creation-menu-item-section) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
              cu3-icon.cu3-icon.icon [282,568 16×16] {d:flex ai:center jc:center c:#646464 fs:16px lh:18.288px}
              span.label [306,568 219×16] "Personalize sua barra lateral"
            div.sticky-actions [266,590 275×57] {pos:sticky p:8px 0px m:0px 0px -8px bg:#ffffff z:1}
              hr [266,598 275×1] {m:0px 0px 8px bt:1px solid #f0f0f0 ov:hidden c:#808080}
              cu3-combo-box-item-holder [266,607 275×32] {p:0px 8px}
                cu3-button-group.align-stretched.aligned [274,607 259×32] {d:flex ai:center gap:8px}
                  button.truncated [274,607 126×32] (role=option data-test=sidebar-creation-menu-item-import) {d:flex ai:center jc:center gap:4px p:0px 11px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:8px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                    cu3-icon.cu3-icon [299,616 14×14] {d:flex ai:center jc:center}
                    span.truncated-label [317,615 57×16] "Importar" {ov:hidden}
                  button.truncated [408,607 126×32] (role=option data-test=sidebar-creation-menu-item-explore) {d:flex ai:center jc:center gap:4px p:0px 11px bg:#ffffff bt:1px solid #e8e8e8 bb:1px solid #e8e8e8 bl:1px solid #e8e8e8 br:1px solid #e8e8e8 rad:8px c:#646464 fs:14px fw:500 lh:16px cur:pointer}
                    cu3-icon.cu3-icon [433,616 14×14] {d:flex ai:center jc:center}
                    span.truncated-label [451,615 56×16] "Modelos" {ov:hidden}
cu-page-modal [0,903 0×0] {c:#202020 fs:13px fw:400 lh:13px cur:default tt:none ls:normal}
```
