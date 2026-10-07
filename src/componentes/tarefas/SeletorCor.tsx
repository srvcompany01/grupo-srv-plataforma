'use client'

import { useState } from 'react'
import { normalizarHex } from '@/dominio/campos-gestao'
import { CORES_PERSONALIZACAO } from '@/dominio/personalizacao'
import { campo as estiloCampo } from '@/lib/ui'

export function SeletorCor({ cor, onChange }: { cor: string; onChange: (cor: string) => void }) {
  const [texto, setTexto] = useState(cor)
  const valido = normalizarHex(texto) !== null
  const aplicar = (valor: string) => {
    setTexto(valor)
    const hex = normalizarHex(valor)
    if (hex) onChange(hex)
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {CORES_PERSONALIZACAO.map((c) => (
          <button key={c} type="button" aria-label={`Cor ${c}`} onClick={() => aplicar(c)} className={`h-6 w-6 rounded-full border-2 ${normalizarHex(texto) === c ? 'border-texto' : 'border-white ring-1 ring-borda'}`} style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" aria-label="Escolher cor" value={normalizarHex(texto) ?? cor} onChange={(e) => aplicar(e.target.value)} className="h-9 w-10 cursor-pointer rounded-md border border-borda bg-white p-1" />
        <input value={texto} onChange={(e) => aplicar(e.target.value)} maxLength={7} placeholder="#D11A22" aria-label="Cor em HEX" aria-invalid={!valido} className={`${estiloCampo} w-32 font-mono ${valido ? '' : 'border-perigo-borda'}`} />
        {!valido && <span className="text-xs text-perigo">Use #RRGGBB</span>}
      </div>
    </div>
  )
}

