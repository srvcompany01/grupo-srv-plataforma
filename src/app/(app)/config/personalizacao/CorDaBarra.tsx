'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'
import { COOKIE_COR_BARRA, COR_BARRA_PADRAO, CORES_BARRA, variaveisBarra } from '@/dominio/barra'
import { normalizarHex } from '@/dominio/campos-gestao'

function gravarCor(hex: string) {
  document.cookie = hex === COR_BARRA_PADRAO ? `${COOKIE_COR_BARRA}=; path=/; max-age=0` : `${COOKIE_COR_BARRA}=${encodeURIComponent(hex)}; path=/; max-age=31536000; samesite=lax`
}

/** Cor da faixa de ícones: predefinidas ou HEX livre. Vale já na tela e fica gravada neste navegador. */
export function CorDaBarra({ inicial }: { inicial: string }) {
  const [cor, setCor] = useState(inicial)
  const [texto, setTexto] = useState(inicial)

  const aplicar = (hex: string) => {
    setCor(hex)
    setTexto(hex)
    for (const faixa of document.querySelectorAll<HTMLElement>('.cs-faixa'))
      for (const [k, v] of Object.entries(variaveisBarra(hex))) faixa.style.setProperty(k, v)
    gravarCor(hex)
  }
  const digitar = (valor: string) => {
    setTexto(valor)
    const hex = normalizarHex(valor)
    if (hex) aplicar(hex)
  }
  const invalido = !!texto && !normalizarHex(texto)

  return (
    <section className="cb">
      <h2>Cor da barra lateral</h2>
      <p>Os ícones se ajustam sozinhos para continuar legíveis. A escolha vale para este navegador.</p>
      <div className="cb-cores" role="radiogroup" aria-label="Cor da barra lateral">
        {CORES_BARRA.map((c) => (
          <button key={c.hex} type="button" role="radio" aria-checked={cor === c.hex} title={c.nome} aria-label={c.nome} onClick={() => aplicar(c.hex)} style={{ background: c.hex }}>
            {cor === c.hex && <Check style={{ color: variaveisBarra(c.hex)['--faixa-icone'] }} />}
          </button>
        ))}
      </div>
      <label className="cb-hex">
        Outra cor (HEX)
        <span>
          <i style={{ background: cor }} />
          <input value={texto} onChange={(e) => digitar(e.target.value)} placeholder="#0b0b0c" maxLength={7} spellCheck={false} aria-invalid={invalido || undefined} />
        </span>
        {invalido && <small>Use o formato #RRGGBB.</small>}
      </label>
      {cor !== COR_BARRA_PADRAO && <button type="button" className="cb-padrao" onClick={() => aplicar(COR_BARRA_PADRAO)}>Voltar ao padrão</button>}
    </section>
  )
}
