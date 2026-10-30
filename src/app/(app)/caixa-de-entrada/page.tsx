import { Ic } from '@/componentes/app/Ic'
import { driveConfigurado, emailDaContaDoDrive } from '@/servicos/google-drive'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarFicha, listarCaixa } from '@/servicos/caixa-de-entrada'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { EnviarVideos } from './EnviarVideos'
import { FichaDeConteudo } from './FichaDeConteudo'
import { ListaDaCaixa } from './ListaDaCaixa'
import { PainelDrive } from './PainelDrive'
import { SeletorCliente } from './SeletorCliente'

// A cópia do Drive e a análise do vídeo rodam depois da resposta: precisam de tempo.
export const maxDuration = 300

export default async function CaixaDeEntrada({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await exigirEquipe()
  const sp = await searchParams
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb).catch(() => [])).filter((c) => !c.interno && c.status !== 'encerrado')
  const pedido = Array.isArray(sp.cliente) ? sp.cliente[0] : sp.cliente
  const cliente = clientes.find((c) => c.id === pedido) ?? clientes[0]
  const [itens, ficha] = cliente ? await Promise.all([listarCaixa(sb, { clienteId: cliente.id }), buscarFicha(sb, cliente.id)]) : [[], null]

  return (
    <div>
      <header className="sticky top-0 z-10 flex h-10 items-center gap-3 border-b border-borda-fraca bg-white px-3">
        <h1 className="flex items-center gap-2 text-destaque font-semibold"><Ic n="move_to_inbox" s={16} style={{ color: 'var(--text-2)' }} /> Caixa de entrada</h1>
        <span className="text-rotulo text-texto-3">vídeos que chegam e viram posts</span>
        <div className="ml-auto"><SeletorCliente clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={cliente?.id ?? ''} /></div>
      </header>
      {!cliente || !ficha ? (
        <p className="p-6 text-corpo text-texto-3">Nenhum cliente ativo cadastrado.</p>
      ) : (
        <div className="mx-auto grid max-w-[1200px] gap-4 p-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
          <div className="min-w-0 space-y-4">
            <EnviarVideos clienteId={cliente.id} />
            <PainelDrive clienteId={cliente.id} temPasta={!!ficha.pastaDrive} configurado={driveConfigurado()} emailDaConta={emailDaContaDoDrive()} />
            <ListaDaCaixa itens={itens} />
          </div>
          <FichaDeConteudo key={cliente.id} clienteId={cliente.id} clienteNome={cliente.nome} ficha={ficha} />
        </div>
      )}
    </div>
  )
}
