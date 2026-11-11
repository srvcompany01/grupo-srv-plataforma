'use client'

import { useState } from 'react'
import { normalizarHex } from '@/dominio/campos-gestao'
import { CORES_PERSONALIZACAO } from '@/dominio/personalizacao'

export function SeletorCor({ cor, onChange }: { cor: string; onChange: (cor: string) => void }) {
  const [texto, setTexto] = useState(cor)
  const valido = normalizarHex(texto) !== null
  const aplicar = (valor: string) => {
    setTexto(valor)
    const hex = normalizarHex(valor)
    if (hex) onChange(hex)
  }
  return (
    <div>
      <div>
        {CORES_PERSONALIZACAO.map((c) => (
          <button key={c} type="button" aria-label={`Cor ${c}`} onClick={() => aplicar(c)} style={{ background: c }} />
        ))}
      </div>
      <div>
        <input type="color" aria-label="Escolher cor" value={normalizarHex(texto) ?? cor} onChange={(e) => aplicar(e.target.value)} />
        <input value={texto} onChange={(e) => aplicar(e.target.value)} maxLength={7} placeholder="#70262D" aria-label="Cor em HEX" aria-invalid={!valido} />
        {!valido && <span>Use #RRGGBB</span>}
      </div>
    </div>
  )
}

