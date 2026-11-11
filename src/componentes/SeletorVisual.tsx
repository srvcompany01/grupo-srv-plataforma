'use client'

import { IconeVisual } from '@/componentes/IconeVisual'
import { CORES_PERSONALIZACAO, EMOJIS_PERSONALIZACAO, ICONES_PERSONALIZACAO } from '@/dominio/personalizacao'

export type EstadoVisual = { cor: string; icone: string; emoji: string | null }

export function SeletorVisual({ valor, onChange }: { valor: EstadoVisual; onChange: (valor: EstadoVisual) => void }) {
  return (
    <div>
      <div>
        <p>Cor</p>
        <div>
          {CORES_PERSONALIZACAO.map((cor) => (
            <button
              key={cor}
              type="button"
              aria-label={`Cor ${cor}`}
              onClick={() => onChange({ ...valor, cor })}
              style={{ background: cor }}
            />
          ))}
        </div>
      </div>

      <div>
        <p>Ícone Lucide</p>
        <div>
          {ICONES_PERSONALIZACAO.map((icone) => (
            <button
              key={icone}
              type="button"
              title={icone}
              onClick={() => onChange({ ...valor, icone, emoji: null })}
            >
              <IconeVisual icone={icone} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p>Ou use um emoji</p>
        <div>
          {EMOJIS_PERSONALIZACAO.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange({ ...valor, emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
