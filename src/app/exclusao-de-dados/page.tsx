import type { Metadata } from 'next'
import Link from 'next/link'
import { contextoMarca } from '@/servicos/blog'

export const metadata: Metadata = { title: 'Exclusão de dados · Plataforma Grupo SRV' }
export const revalidate = 3600

/** Instruções de exclusão de dados (pública; exigida pela Meta e pelo Google para os apps da plataforma). */
export default async function ExclusaoDeDados() {
  const marca = await contextoMarca().catch(() => ({}) as Record<string, string | boolean>)
  const email = typeof marca.institutional_email === 'string' ? marca.institutional_email : ''
  const telefone = typeof marca.institutional_phone === 'string' ? marca.institutional_phone : ''
  return (
    <main>
      <h1>Exclusão de dados</h1>
      <p>Plataforma Grupo SRV (app.gruposrv.com.br)</p>
      <p>A Plataforma Grupo SRV é o sistema interno da agência Grupo SRV. Ela acessa dados do Facebook, do Instagram e do Google somente das empresas que a agência atende e com autorização delas. Veja como remover o acesso e pedir a exclusão dos dados.</p>

      <h2>1. Remover o acesso do aplicativo</h2>
      <ol>
        <li>No Facebook, abra <strong>Configurações e privacidade → Configurações → Integrações comerciais</strong> (ou <strong>Apps e sites</strong>).</li>
        <li>Encontre <strong>Plataforma Grupo SRV</strong> e clique em <strong>Remover</strong>.</li>
        <li>No Instagram, abra <strong>Configurações → Apps e sites</strong> e remova o mesmo aplicativo.</li>
        <li>Se a sua empresa compartilhou Página, Instagram ou conta de anúncios com a Grupo SRV no Gerenciador de Negócios, remova o parceiro em <strong>Configurações do negócio → Usuários → Parceiros</strong>.</li>
      </ol>

      <h2>2. Pedir a exclusão dos dados guardados</h2>
      <p>Para apagar os dados que a plataforma guardou (métricas, posts agendados, relatórios e cadastro), envie um pedido informando o nome da empresa e o perfil ou Página:</p>
      <ul>
        {email && <li>E-mail: <a href={`mailto:${email}`}>{email}</a></li>}
        {telefone && <li>WhatsApp ou telefone: {telefone}</li>}
        {!email && !telefone && <li>Pelos canais de atendimento da Grupo SRV (o mesmo contato usado com a agência).</li>}
      </ul>
      <p>Confirmamos o pedido e concluímos a exclusão em até 30 dias, mantendo apenas o que a lei exigir guardar.</p>

      <p>
        <Link href="/privacidade">Política de Privacidade</Link>
        <Link href="/sobre">Sobre a plataforma</Link>
      </p>
    </main>
  )
}
