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
    <ul>
      {[...itens].sort((a, b) => ordem[a.tom] - ordem[b.tom] || b.peso - a.peso).map((i) => {
        const e = ESTILO_TOM[i.tom]
        const Icone = e.icone
        return (
          <li key={i.titulo}>
            <Icone aria-label={ROTULO_TOM[i.tom]} />
            <span><strong>{i.titulo}</strong> <span>· {i.detalhe}</span></span>
          </li>
        )
      })}
    </ul>
  )
}

export function Placar({ nota, itens }: { nota: number; itens: ItemSaude[] }) {
  // Item sem dados (peso 0) não entra no placar.
  const conta = (t: ItemSaude['tom']) => itens.filter((i) => i.tom === t && i.peso > 0).length
  return (
    <div>
      <div>
        <Medidor nota={nota} />
        <SeloTom tom={tomNota(nota)} rotulo={`${ROTULO_TOM[tomNota(nota)]} · pontuação geral`} />
      </div>
      <ul>
        {(['ruim', 'atencao', 'bom'] as const).map((t) => (
          <li key={t}>
            <span>{conta(t)}</span>
            <span>{ROTULO_TOM[t]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CartaoLugar({ d }: { d: Detalhes }) {
  return (
    <div>
      {d.fotos[0] && (
        // eslint-disable-next-line @next/next/no-img-element -- foto do Google pela rota com a chave no servidor
        <img src={`/api/gmn/foto?nome=${encodeURIComponent(d.fotos[0])}`} alt={`Foto de ${d.nome}`} />
      )}
      <div>
        <p>{d.nome}</p>
        <p><Star />{d.nota === null ? 'Sem nota' : n(d.nota)} <span>({n(d.avaliacoes)} avaliações)</span>{d.categoria && <span>· {d.categoria}</span>}</p>
        <p><MapPin />{d.endereco}</p>
        {d.telefone && <p><Phone />{d.telefone}</p>}
        {d.site && <a href={d.site} target="_blank" rel="noreferrer"><Globe />{d.site.replace(/^https?:\/\//, '')}</a>}
        {d.mapa && <a href={d.mapa} target="_blank" rel="noreferrer">Ver no Google Maps <ExternalLink /></a>}
        {d.horario.length > 0 && <details><summary>Horário</summary><ul>{d.horario.map((h) => <li key={h}>{h}</li>)}</ul></details>}
      </div>
    </div>
  )
}

