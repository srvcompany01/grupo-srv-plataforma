import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Política de Privacidade · Plataforma Grupo SRV' }

/** Política de Privacidade da plataforma (pública; exigida pelo Google para o app OAuth). */
export default function Privacidade() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-12 text-corpo text-texto [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="text-2xl font-bold">Política de Privacidade</h1>
      <p className="text-texto-3">Plataforma Grupo SRV · atualizada em 23/10/2026</p>
      <p>Esta política explica como a Plataforma Grupo SRV (app.gruposrv.com.br), sistema interno da agência Grupo SRV, trata os dados das pessoas da equipe, dos clientes e das contas conectadas.</p>

      <h2>Dados que tratamos</h2>
      <ul>
        <li>Dados da equipe: nome, e-mail, papel e o uso da plataforma (tarefas, comentários, horários de atividade).</li>
        <li>Dados dos clientes da agência: cadastro, conteúdos, aprovações e o nome de quem aprovou.</li>
        <li>Dados das contas Google conectadas, somente com autorização: resultados das campanhas do Google Ads (investimento, impressões, cliques, conversões), métricas dos perfis do Google Meu Negócio (visualizações, ligações, rotas, cliques no site) e, para quem liga o Google Agenda, os eventos da agenda.</li>
        <li>Dados das contas Meta conectadas: resultados dos anúncios e publicação de posts aprovados.</li>
      </ul>

      <h2>Como usamos</h2>
      <ul>
        <li>Para mostrar à equipe e ao cliente os resultados das campanhas e perfis que a agência gerencia.</li>
        <li>Para publicar, no horário combinado, os posts aprovados pelo cliente.</li>
        <li>Para sincronizar os compromissos da agenda de quem conectou o Google Agenda.</li>
      </ul>
      <p>O uso de informações recebidas das APIs do Google segue a <a className="text-petroleo underline" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado. Não vendemos dados, não usamos dados do Google para publicidade e não os compartilhamos com terceiros, exceto quando a lei exigir.</p>

      <h2>Armazenamento e segurança</h2>
      <p>Os dados ficam em provedores de nuvem com acesso restrito. As chaves de acesso às contas conectadas ficam só no servidor e nunca são mostradas na tela.</p>

      <h2>Seus direitos e como desconectar</h2>
      <p>A conta Google pode ser desconectada a qualquer momento pela própria plataforma ou em myaccount.google.com/permissions. Pedidos de acesso, correção ou exclusão de dados (LGPD) podem ser feitos pelos canais de atendimento da Grupo SRV.</p>

      <p><Link href="/sobre" className="font-semibold text-petroleo hover:underline">Sobre a plataforma</Link></p>
    </main>
  )
}
