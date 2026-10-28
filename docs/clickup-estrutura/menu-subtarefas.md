# Estrutura renderizada — Estado — menu Subtarefas

URL: https://app.clickup.com/36949648/v/l/li/1400430000007645
Nós visíveis: 14 · linhas do esboço: 14
Legenda: `tag.classe [x,y largura×altura] "texto" (atributos) {estilos que mudam em relação ao pai}`. d=display, dir=flex-direction, ai/jc=alinhamento, p=padding, m=margin, bg=fundo, bt/bb/bl/br=bordas, rad=raio, sh=sombra, c=cor do texto, fs/fw/lh=fonte. Capturado a 1920×903.

```
div [0,0 1920×903] {d:flex pos:absolute dir:column z:1000 c:#202020 fs:13px fw:400 lh:13px cur:default}
  div [408,199 200×171] {d:flex pos:absolute z:1000}
    cu-view-subtasks-type-dropdown [408,199 200×171]
      cu3-menu.cu3-menu.menu.cu3-menu-position-below [408,199 200×171] (role=menu) {d:grid p:8px 0px bg:#ffffff rad:12px sh:#000000/0.267 0px 0px 1px 0px, #000000/0.106 0px 4px 6px -1px, #000000 ov:hidden auto cols:200px}
        cu3-menu-heading.cu3-menu-heading [408,207 200×28] "Mostrar subtarefas" {d:flex ai:center p:6px 20px 6px 16px c:#838383 fs:12px fw:500 lh:16.008px}
        cu3-menu-item-select.cu3-menu-item.checked [416,235 184×29] (role=menuitemradio checked=true) {d:flex gap:2px 8px p:6px 8px m:0px 8px rad:7px wrap:wrap fs:14px fw:500 lh:16.002px cur:pointer}
          span.label [424,241 144×17] "Recolhidas"
            span.default-text [500,242 57×15] "(padrão)" {p:0px 4px c:#8d8d8d fs:12px fw:400 lh:16.008px}
          cu3-icon.cu3-icon.check [576,241 16×16] {d:flex ai:center jc:center c:#067a6f fs:16px lh:18.288px}
        cu3-menu-item-select.cu3-menu-item [416,266 184×28] (role=menuitemradio checked=false) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          span.label [424,272 168×16] "Expandidas"
        cu3-menu-item-select.cu3-menu-item [416,296 184×66] (role=menuitemradio checked=false) {d:flex gap:2px 8px p:6px 8px m:2px 8px 0px rad:7px wrap:wrap fs:14px lh:16.002px cur:pointer}
          span.label [424,302 168×16] "Separar"
          span.description [424,320 168×36] "Usar isto para filtrar subtarefas" {c:#646464 fs:12px lh:18px}
```
