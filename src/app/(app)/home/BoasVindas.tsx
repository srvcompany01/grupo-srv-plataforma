'use client'

import { useEffect, useState } from 'react'

const FUSO = 'America/Belem'

/** Frase de contexto do topo da Home: saudação pela hora e o resumo do dia. Só calcula a hora depois de montar, para não divergir do servidor. */
export function BoasVindas({ nome, atrasadas, hoje, semana }: { nome: string; atrasadas: number; hoje: number; semana: number }) {
  const [agora, setAgora] = useState<Date | null>(null)
  useEffect(() => {
    const inicio = setTimeout(() => setAgora(new Date()), 0)
    return () => clearTimeout(inicio)
  }, [])
  const hora = agora ? Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hour12: false, timeZone: FUSO }).format(agora)) % 24 : 12
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const resumo = atrasadas + hoje + semana === 0 ? 'Nada pendente nos próximos 7 dias.' : `${atrasadas} atrasada${atrasadas === 1 ? '' : 's'}, ${hoje} para hoje e ${semana} nos próximos 7 dias.`
  return <p className="text-corpo text-texto-2"><b className="font-semibold text-texto">{saudacao}, {nome.split(' ')[0]}.</b> {resumo}</p>
}
