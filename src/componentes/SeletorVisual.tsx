'use client'

import { IconeVisual } from '@/componentes/IconeVisual'
import { CORES_PERSONALIZACAO, EMOJIS_PERSONALIZACAO, ICONES_PERSONALIZACAO } from '@/dominio/personalizacao'

import styles from './SeletorVisual.module.css'

export type EstadoVisual = { cor: string; icone: string; emoji: string | null }

export function SeletorVisual({ valor, onChange }: { valor: EstadoVisual; onChange: (valor: EstadoVisual) => void }) {
  return (
    <div className={styles.seletor}>
      <div className={styles.grupo}>
        <p>Cor</p>
        <div className={`${styles.opcoes} ${styles.cores}`}>
          {CORES_PERSONALIZACAO.map((cor) => (
            <button
              key={cor}
              type="button"
              aria-label={`Cor ${cor}`}
              aria-pressed={valor.cor === cor}
              onClick={() => onChange({ ...valor, cor })}
              style={{ background: cor }}
            />
          ))}
        </div>
      </div>

      <div className={styles.grupo}>
        <p>Ícone</p>
        <div className={styles.opcoes}>
          {ICONES_PERSONALIZACAO.map((icone) => (
            <button
              key={icone}
              type="button"
              title={icone}
              aria-label={`Ícone ${icone}`}
              aria-pressed={!valor.emoji && valor.icone === icone}
              onClick={() => onChange({ ...valor, icone, emoji: null })}
            >
              <IconeVisual icone={icone} />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grupo}>
        <p>Ou use um emoji</p>
        <div className={styles.opcoes}>
          {EMOJIS_PERSONALIZACAO.map((emoji) => (
            <button
              key={emoji}
              aria-label={`Emoji ${emoji}`}
              aria-pressed={valor.emoji === emoji}
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
