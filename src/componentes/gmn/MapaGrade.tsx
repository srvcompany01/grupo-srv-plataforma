import { corDaPosicao, pixel, rotuloPosicao, zoomParaCaber, type Ponto, type PontoGrade } from '@/dominio/gmn'

const LADO = 640

/**
 * Mapa do geogrid sem biblioteca: as imagens (tiles) do OpenStreetMap montadas num quadro de 640 px que escala com a
 * tela, e uma bolinha por ponto com a posição do cliente (cor pela faixa). Estático: sem arrastar nem zoom.
 */
export function MapaGrade({ centro, pontos, rotulo }: { centro: Ponto; pontos: PontoGrade[]; rotulo: string }) {
  const zoom = zoomParaCaber(pontos.length ? pontos : [centro], LADO)
  // O zoom é inteiro: amplia o mapa (até 2x) para a grade preencher ~85% do quadro.
  const px = (pontos.length ? pontos : [centro]).map((p) => pixel(p, zoom))
  const extensao = Math.max(Math.max(...px.map((p) => p.x)) - Math.min(...px.map((p) => p.x)), Math.max(...px.map((p) => p.y)) - Math.min(...px.map((p) => p.y)), 1)
  const escala = Math.min(2, Math.max(1, (LADO * 0.85) / extensao))
  const meio = pixel(centro, zoom)
  const origem = { x: meio.x * escala - LADO / 2, y: meio.y * escala - LADO / 2 }
  const tile = 256 * escala
  const tiles: { x: number; y: number }[] = []
  for (let tx = Math.floor(origem.x / tile); tx <= Math.floor((origem.x + LADO) / tile); tx++) {
    for (let ty = Math.floor(origem.y / tile); ty <= Math.floor((origem.y + LADO) / tile); ty++) tiles.push({ x: tx, y: ty })
  }
  const pct = (v: number) => `${(v / LADO) * 100}%`
  const pos = (p: Ponto) => {
    const q = pixel(p, zoom)
    return { left: pct(q.x * escala - origem.x), top: pct(q.y * escala - origem.y) }
  }
  // Bolinha do tamanho do espaço entre pontos vizinhos (sem encostar), entre 4% e 8% do mapa.
  const lado = Math.round(Math.sqrt(pontos.length)) || 1
  const passo = lado > 1 ? (extensao * escala) / (lado - 1) : LADO * 0.08
  const bolinha = (Math.min(Math.max(passo * 0.72, LADO * 0.04), LADO * 0.08) / LADO) * 100
  return (
    <figure className="space-y-1">
      <div className="@container relative aspect-square w-full overflow-hidden rounded-xl border border-borda bg-[#e8e4da]" role="img" aria-label={rotulo}>
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element -- tiles públicos do OpenStreetMap
          <img
            key={`${t.x}-${t.y}`}
            src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
            alt=""
            loading="lazy"
            className="absolute max-w-none select-none"
            style={{ left: pct(t.x * tile - origem.x), top: pct(t.y * tile - origem.y), width: pct(tile), height: pct(tile) }}
          />
        ))}
        {pontos.map((p, i) => {
          const c = corDaPosicao(p.posicao)
          const noEndereco = i === Math.floor(pontos.length / 2)
          return (
            <span
              key={i}
              title={`${p.posicao ? `${p.posicao}º lugar neste ponto` : 'Fora do top 20 neste ponto'}${noEndereco ? ' (endereço do cliente)' : ''}`}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-bold shadow-md ${noEndereco ? 'border-[#1d6fe0] ring-4 ring-[#1d6fe0]/35' : 'border-white'}`}
              style={{ ...pos(p), width: `${bolinha}%`, height: `${bolinha}%`, fontSize: `${bolinha * 0.42}cqw`, background: c.fundo, color: c.texto }}
            >
              {rotuloPosicao(p.posicao)}
            </span>
          )
        })}
      </div>
      <figcaption className="text-micro text-texto-3">Mapa © colaboradores do OpenStreetMap. Anel azul: o ponto no endereço do cliente.</figcaption>
    </figure>
  )
}

/** Medidor semicircular da nota de saúde (0 a 100). */
export function Medidor({ nota }: { nota: number }) {
  const ang = Math.PI * (1 - nota / 100)
  const ponta = { x: 100 + 70 * Math.cos(ang), y: 100 - 70 * Math.sin(ang) }
  const arco = (de: number, ate: number, cor: string) => {
    const a = Math.PI * (1 - de / 100)
    const b = Math.PI * (1 - ate / 100)
    return <path d={`M ${100 + 85 * Math.cos(a)} ${100 - 85 * Math.sin(a)} A 85 85 0 0 1 ${100 + 85 * Math.cos(b)} ${100 - 85 * Math.sin(b)}`} stroke={cor} strokeWidth="14" fill="none" />
  }
  return (
    <svg viewBox="0 0 200 120" className="mx-auto w-full max-w-64" role="img" aria-label={`Nota ${nota} de 100`}>
      {arco(0, 60, '#d64545')}
      {arco(60, 80, '#eda100')}
      {arco(80, 100, '#1f8a4c')}
      <line x1="100" y1="100" x2={ponta.x} y2={ponta.y} stroke="#1f1f1f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="100" r="6" fill="#1f1f1f" />
      <text x="100" y="118" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1f1f1f">{nota}</text>
    </svg>
  )
}
