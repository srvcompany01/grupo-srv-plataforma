import { Esqueleto } from '@/componentes/Esqueleto'

export default function Carregando() {
  return (
    <div className="page-shell" role="status" aria-label="Carregando">
      <Esqueleto className="h-6 w-32" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <Esqueleto key={i} className="h-[72px]" />)}
      </div>
      <div className="space-y-1">
        {Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="h-8" />)}
      </div>
    </div>
  )
}
