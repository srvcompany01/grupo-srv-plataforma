'use client'

import { MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { perfisGoogleAcao, vincularPerfilGoogleAcao } from '@/app/(app)/clientes/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo } from '@/lib/ui'

/** Escolher o perfil do Google Meu Negócio do cliente entre os que a conta da agência gerencia. */
export function VincularPerfilGoogle({ clienteId, ligado }: { clienteId: string; ligado: boolean }) {
  const router = useRouter()
  const [perfis, setPerfis] = useState<{ id: string; nome: string }[] | null>(null)
  const [escolhido, setEscolhido] = useState('')
  const [pendente, iniciar] = useTransition()
  const carregar = () =>
    iniciar(async () => {
      const r = await perfisGoogleAcao()
      if ('erro' in r) return void avisar(r)
      setPerfis(r)
      setEscolhido(r[0]?.id ?? '')
    })
  const salvar = (id: string | null) => iniciar(async () => { if (avisar(await vincularPerfilGoogleAcao(clienteId, id), true)) { setPerfis(null); router.refresh() } })

  if (!perfis) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={carregar} disabled={pendente} className={ligado ? botaoFantasma : botaoSecundario}><MapPin className="h-3.5 w-3.5" /> {pendente ? 'Buscando perfis…' : ligado ? 'Trocar perfil' : 'Ligar perfil do Google'}</button>
        {ligado && <button type="button" onClick={() => salvar(null)} disabled={pendente} className={botaoFantasma}>Desligar</button>}
      </div>
    )
  }
  if (!perfis.length) return <p className="text-rotulo text-texto-3">A conta Google da agência não gerencia nenhum perfil do Meu Negócio. Peça ao cliente para adicionar o e-mail da agência como gerente do perfil.</p>
  return (
    <div className="flex flex-wrap gap-2">
      <select value={escolhido} onChange={(e) => setEscolhido(e.target.value)} className={`${campo} h-9 min-w-0 flex-1`}>
        {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
      <button type="button" onClick={() => salvar(escolhido)} disabled={pendente || !escolhido} className={botaoPrimario}>Ligar</button>
      <button type="button" onClick={() => setPerfis(null)} className={botaoFantasma}>Cancelar</button>
    </div>
  )
}
