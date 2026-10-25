import { corDaPosicao, pixel, rotuloPosicao, zoomParaCaber, type Ponto, type PontoGrade } from '@/dominio/gmn'

const LADO = 640

/**
 * Mapa do geogrid sem biblioteca: as imagens (tiles) do OpenStreetMap montadas num quadro de 640 px que escala com a
 * tela, e uma bolinha por ponto com a posição do cliente (cor pela faixa). Estático: sem arrastar nem zoom.
 */
export function MapaGrade({ centro, pontos, rotulo }: { centro: Ponto; pontos: PontoGrade[]; rotulo: string }) {
  const zoom = zoomParaCaber(pontos.length ? pontos : [centro], LADO)
  const meio = pixel(centro, zoom)
  const origem = { x: meio.x - LADO / 2, y: meio.y - LADO / 2 }
  const tiles: { x: number; y: number }[] = []
  for (let tx = Math.floor(origem.x / 256); tx <= Math.floor((origem.x + LADO) / 256); tx++) {
    for (let ty = Math.floor(origem.y / 256); ty <= Math.floor((origem.y + LADO) / 256); ty++) tiles.push({ x: tx, y: ty })
  }
  const pct = (v: number) => `${(v / LADO) * 100}%`
  const pos = (p: Ponto) => {
    const q = pixel(p, zoom)
    return { left: pct(q.x - origem.x), top: pct(q.y - origem.y) }
  }
  return (
    <figure className="space-y-1">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-borda bg-[#e8e4da]" role="img" aria-label={rotulo}>
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element -- tiles públicos do OpenStreetMap
          <img
            key={`${t.x}-${t.y}`}
            src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
            alt=""
            loading="lazy"
            className="absolute max-w-none select-none"
            style={{ left: pct(t.x * 256 - origem.x), top: pct(t.y * 256 - origem.y), width: pct(256), height: pct(256) }}
          />
        ))}
        {pontos.map((p, i) => {
          const c = corDaPosicao(p.posicao)
          return (
            <span
              key={i}
              title={p.posicao ? `${p.posicao}º lugar neste ponto` : 'Fora do top 20 neste ponto'}
              className="absolute flex h-[7%] min-h-6 w-[7%] min-w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[clamp(9px,1.6vw,13px)] font-bold shadow-md"
              style={{ ...pos(p), background: c.fundo, color: c.texto }}
            >
              {rotuloPosicao(p.posicao)}
            </span>
          )
        })}
        <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1d6fe0] shadow" style={pos(centro)} title="Endereço do cliente" />
      </div>
      <figcaption className="text-micro text-texto-3">Mapa © colaboradores do OpenStreetMap. Ponto azul: endereço do cliente.</figcaption>
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
