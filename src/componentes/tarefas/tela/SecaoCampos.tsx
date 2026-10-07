'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { separarCamposVazios, type DefinicaoCampo } from '@/dominio/personalizacao'
import type { Pessoa } from '@/dominio/tarefas'
import { CamposPersonalizados } from '../CamposPersonalizados'

const CHAVE = 'tarefa:ocultarVazios'

function lerPreferencia(): boolean {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}

export function SecaoCampos({ tarefaId, campos, equipe }: { tarefaId: string; campos: DefinicaoCampo[]; equipe: Pessoa[] }) {
  const [aberta, setAberta] = useState(true)
  const [ocultar, setOcultar] = useState(false)
  // A preferência só existe no navegador: lê depois da hidratação para não divergir do HTML do servidor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOcultar(lerPreferencia())
  }, [])
  if (campos.length === 0) return null
  const { preenchidos, vazios } = separarCamposVazios(campos)
  const visiveis = ocultar ? preenchidos : campos

  function alternar() {
    const novo = !ocultar
    setOcultar(novo)
    try {
      localStorage.setItem(CHAVE, novo ? '1' : '0')
    } catch {
      // sem armazenamento: a escolha vale só nesta tela
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-3">
        <button onClick={() => setAberta(!aberta)} className="flex items-center gap-1 text-[13px] font-semibold hover:text-marca" aria-expanded={aberta}>
          {aberta ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Campos
        </button>
        {aberta && vazios.length > 0 && (
          <button onClick={alternar} className="text-[12px] text-texto-3 hover:text-texto">
            {ocultar ? `Mostrar ${vazios.length} campos vazios` : `Ocultar ${vazios.length} campos vazios`}
          </button>
        )}
      </div>
      {aberta && <CamposPersonalizados tarefaId={tarefaId} campos={visiveis} equipe={equipe} />}
    </section>
  )
}
