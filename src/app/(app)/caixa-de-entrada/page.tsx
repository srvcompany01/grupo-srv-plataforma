import Link from 'next/link'
import { Ic } from '@/componentes/app/Ic'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarCaixa } from '@/servicos/caixa-de-entrada'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { driveConfigurado, emailDaContaDoDrive } from '@/servicos/google-drive'
import { AreaDeEntrada } from './AreaDeEntrada'

// A cópia do Drive e a análise do vídeo rodam depois da resposta: precisam de tempo.
export const maxDuration = 300

export default async function CaixaDeEntrada() {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb).catch(() => [])).filter((c) => !c.interno && c.status !== 'encerrado')
  const itens = await listarCaixa(sb)
  return (
    <div>
      <header className="sticky top-0 z-10 flex h-10 items-center gap-3 border-b border-borda-fraca bg-white px-3">
        <h1 className="flex items-center gap-2 text-destaque font-semibold"><Ic n="move_to_inbox" s={16} style={{ color: 'var(--text-2)' }} /> Caixa de entrada</h1>
        <span className="hidden text-rotulo text-texto-3 sm:inline">vídeos que chegam e viram posts</span>
        <Link href="/caixa-de-entrada/configuracoes" className="b-ghost ml-auto"><Ic n="settings" s={16} />Configurações</Link>
      </header>
      <AreaDeEntrada clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} itens={itens} driveConfigurado={driveConfigurado()} emailDaConta={emailDaContaDoDrive()} />
    </div>
  )
}
