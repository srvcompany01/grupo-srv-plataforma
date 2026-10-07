'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import type { CronometroAtivo, RegistroTempo } from '@/servicos/tempo'
import { DetalheTarefa, type PropsDetalhe } from '../DetalheTarefa'

export type PropsTela = Omit<PropsDetalhe, 'noPainel'> & {
  tempo: RegistroTempo[]
  cronometro: CronometroAtivo | null
  pessoas: { id: string; nome: string; avatar: string | null }[]
  emJanela: boolean
}

/** Esqueleto da tela: coluna principal rolável + coluna Atividade (400px; aba abaixo de lg). */
export function TelaTarefa({ tempo, cronometro, pessoas, emJanela, ...detalhe }: PropsTela) {
  void tempo
  void cronometro
  void pessoas
  const [aba, setAba] = useState<'detalhes' | 'atividade'>('detalhes')
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)} className="shrink-0 border-b border-borda px-3 pt-2 lg:hidden">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="atividade">Atividade</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_400px]">
        <div className={`min-h-0 overflow-y-auto p-5 md:px-8 ${aba === 'detalhes' ? '' : 'hidden lg:block'}`}>
          <DetalheTarefa {...detalhe} noPainel={emJanela} />
        </div>
        <aside className={`min-h-0 flex-col overflow-y-auto border-l border-borda bg-fundo ${aba === 'atividade' ? 'flex' : 'hidden lg:flex'}`}>
          <h2 className="border-b border-borda px-4 py-3 text-[14px] font-semibold">Atividade</h2>
        </aside>
      </div>
    </div>
  )
}
