import { ExternalLink, Globe, MapPin, Phone, Star } from 'lucide-react'
import { Medidor } from '@/componentes/gmn/MapaGrade'
import { ESTILO_TOM, SeloTom } from '@/componentes/insights/tom'
import type { ItemSaude } from '@/dominio/gmn'
import type { Detalhes } from '@/servicos/places'

const n = (v: number) => v.toLocaleString('pt-BR')
export const tomNota = (nota: number) => (nota >= 80 ? 'bom' : nota >= 60 ? 'atencao' : 'ruim')
export const ROTULO_TOM = { ruim: 'Fraco', atencao: 'Razoável', bom: 'Bom' } as const

/** Itens da análise, do pior para o melhor, com placar Fraco / Razoável / Bom. */
export function ItensSaude({ itens }: { itens: ItemSaude[] }) {
  const ordem = { ruim: 0, atencao: 1, bom: 2 } as const
  return (
    <ul className="space-y-1.5">
      {[...itens].sort((a, b) => ordem[a.tom] - ordem[b.tom] || b.peso - a.peso).map((i) => {
        const e = ESTILO_TOM[i.tom]
        const Icone = e.icone
        return (
          <li key={i.titulo} className={`flex gap-2 rounded-lg border px-3 py-2 text-rotulo ${e.fundo} ${e.borda}`}>
            <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${e.texto}`} aria-label={ROTULO_TOM[i.tom]} />
            <span className="min-w-0 flex-1"><strong className="text-texto">{i.titulo}</strong> <span className="text-texto-2">· {i.detalhe}</span></span>
          </li>
        )
      })}
    </ul>
  )
}

export function Placar({ nota, itens }: { nota: number; itens: ItemSaude[] }) {
  const conta = (t: ItemSaude['tom']) => itens.filter((i) => i.tom === t).length
  return (
    <div className="grid items-center gap-4 sm:grid-cols-2">
      <div className="text-center">
        <Medidor nota={nota} />
        <SeloTom tom={tomNota(nota)} rotulo={`${ROTULO_TOM[tomNota(nota)]} · pontuação geral`} />
      </div>
      <ul className="space-y-2">
        {(['ruim', 'atencao', 'bom'] as const).map((t) => (
          <li key={t} className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-corpo font-bold text-white ${ESTILO_TOM[t].forte}`}>{conta(t)}</span>
            <span className={`text-corpo font-semibold ${ESTILO_TOM[t].texto}`}>{ROTULO_TOM[t]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CartaoLugar({ d }: { d: Detalhes }) {
  return (
    <div className="overflow-hidden rounded-xl border border-borda bg-white">
      {d.fotos[0] && (
        // eslint-disable-next-line @next/next/no-img-element -- foto do Google pela rota com a chave no servidor
        <img src={`/api/gmn/foto?nome=${encodeURIComponent(d.fotos[0])}`} alt={`Foto de ${d.nome}`} className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="space-y-2 p-3 text-rotulo">
        <p className="text-corpo font-bold text-texto">{d.nome}</p>
        <p className="flex items-center gap-1.5 text-texto-2"><Star className="h-4 w-4 fill-[#eda100] text-[#eda100]" />{d.nota === null ? 'Sem nota' : n(d.nota)} <span className="text-texto-3">({n(d.avaliacoes)} avaliações)</span>{d.categoria && <span className="text-texto-3">· {d.categoria}</span>}</p>
        <p className="flex gap-1.5 text-texto-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{d.endereco}</p>
        {d.telefone && <p className="flex items-center gap-1.5 text-texto-2"><Phone className="h-3.5 w-3.5" />{d.telefone}</p>}
        {d.site && <a href={d.site} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-[#1d6fe0] hover:underline"><Globe className="h-3.5 w-3.5 shrink-0" />{d.site.replace(/^https?:\/\//, '')}</a>}
        {d.mapa && <a href={d.mapa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1d6fe0] hover:underline">Ver no Google Maps <ExternalLink className="h-3 w-3" /></a>}
        {d.horario.length > 0 && <details className="text-legenda text-texto-2"><summary className="cursor-pointer font-semibold">Horário</summary><ul className="mt-1 space-y-0.5">{d.horario.map((h) => <li key={h}>{h}</li>)}</ul></details>}
      </div>
    </div>
  )
}

