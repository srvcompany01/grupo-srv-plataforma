import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Plataforma Grupo SRV' }

/** Página pública da plataforma (página inicial exigida pelo Google na verificação da marca do app OAuth). */
export default function Sobre() {
  return (
    <main>
      <h1>Plataforma Grupo SRV</h1>
      <p>A Plataforma Grupo SRV é o sistema interno da agência de marketing Grupo SRV. Nossa equipe usa a plataforma para organizar tarefas e projetos dos clientes, planejar e aprovar posts de redes sociais e acompanhar os resultados das campanhas de anúncios que gerenciamos.</p>
      <p>Com a autorização da conta Google da agência, a plataforma lê os resultados das campanhas do Google Ads e as métricas dos perfis do Google Meu Negócio dos clientes que a agência gerencia, e publica nesses perfis os posts aprovados pelos clientes. Pessoas da equipe também podem ligar o próprio Google Agenda para sincronizar compromissos.</p>
      <p>O acesso é restrito à equipe da agência e aos clientes, por link próprio.</p>
      <p>
        <Link href="/privacidade">Política de Privacidade</Link>
        <Link href="/login">Entrar</Link>
      </p>
    </main>
  )
}
