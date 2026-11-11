'use client'

import { MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { perfisGoogleAcao, vincularPerfilGoogleAcao } from '@/app/(app)/clientes/acoes'
import { avisar } from '@/componentes/tarefas/avisar'

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
      <div>
        <button type="button" onClick={carregar} disabled={pendente}><MapPin /> {pendente ? 'Buscando perfis…' : ligado ? 'Trocar perfil' : 'Ligar perfil do Google'}</button>
        {ligado && <button type="button" onClick={() => salvar(null)} disabled={pendente}>Desligar</button>}
      </div>
    )
  }
  if (!perfis.length) return <p>A conta Google da agência não gerencia nenhum perfil do Meu Negócio. Peça ao cliente para adicionar o e-mail da agência como gerente do perfil.</p>
  return (
    <div>
      <select value={escolhido} onChange={(e) => setEscolhido(e.target.value)}>
        {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
      <button type="button" onClick={() => salvar(escolhido)} disabled={pendente || !escolhido}>Ligar</button>
      <button type="button" onClick={() => setPerfis(null)}>Cancelar</button>
    </div>
  )
}
