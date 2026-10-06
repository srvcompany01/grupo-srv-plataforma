'use client'

import { IconeVisual } from '@/componentes/IconeVisual'
import { CORES_PERSONALIZACAO, EMOJIS_PERSONALIZACAO, ICONES_PERSONALIZACAO } from '@/dominio/personalizacao'

export type EstadoVisual = { cor: string; icone: string; emoji: string | null }

export function SeletorVisual({ valor, onChange }: { valor: EstadoVisual; onChange: (valor: EstadoVisual) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-semibold text-texto-2">Cor</p>
        <div className="flex flex-wrap gap-2">
          {CORES_PERSONALIZACAO.map((cor) => (
            <button
              key={cor}
              type="button"
              aria-label={`Cor ${cor}`}
              onClick={() => onChange({ ...valor, cor })}
              className={`h-7 w-7 rounded-full transition ${valor.cor === cor ? 'ring-2 ring-texto ring-offset-2' : 'hover:scale-110'}`}
              style={{ background: cor }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold text-texto-2">Ícone Lucide</p>
        <div className="grid grid-cols-8 gap-1.5">
          {ICONES_PERSONALIZACAO.map((icone) => (
            <button
              key={icone}
              type="button"
              title={icone}
              onClick={() => onChange({ ...valor, icone, emoji: null })}
              className={`flex h-8 items-center justify-center rounded-lg border transition ${valor.icone === icone && !valor.emoji ? 'border-texto bg-texto text-white' : 'border-borda bg-white text-texto-2 hover:bg-hover'}`}
            >
              <IconeVisual icone={icone} className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold text-texto-2">Ou use um emoji</p>
        <div className="grid grid-cols-8 gap-1.5">
          {EMOJIS_PERSONALIZACAO.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange({ ...valor, emoji })}
              className={`flex h-8 items-center justify-center rounded-lg border text-base transition ${valor.emoji === emoji ? 'border-texto bg-hover' : 'border-borda bg-white hover:bg-hover'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
