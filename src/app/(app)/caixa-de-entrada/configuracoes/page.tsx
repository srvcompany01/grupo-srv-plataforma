import Link from 'next/link'
import { Ic } from '@/componentes/app/Ic'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarFicha } from '@/servicos/caixa-de-entrada'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { driveConfigurado, emailDaContaDoDrive } from '@/servicos/google-drive'
import { FichaDeConteudo } from '../FichaDeConteudo'
import { SeletorCliente } from '../SeletorCliente'

/** Configurações da caixa de entrada: a ficha de conteúdo (pasta do Drive, tom, hashtags, chamada) de cada cliente. */
export default async function ConfiguracoesDaCaixa({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await exigirEquipe()
  const sp = await searchParams
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb).catch(() => [])).filter((c) => !c.interno && c.status !== 'encerrado')
  const pedido = Array.isArray(sp.cliente) ? sp.cliente[0] : sp.cliente
  const cliente = clientes.find((c) => c.id === pedido) ?? clientes[0]
  const ficha = cliente ? await buscarFicha(sb, cliente.id) : null
  const drive = driveConfigurado()
  const email = emailDaContaDoDrive()
  return (
    <div>
      <header className="sticky top-0 z-10 flex h-10 items-center gap-2 border-b border-borda-fraca bg-white px-3">
        <Link href="/caixa-de-entrada" className="text-[13px] text-texto-2 hover:text-texto">Caixa de entrada</Link>
        <span className="text-texto-3">/</span>
        <h1 className="flex items-center gap-2 text-destaque font-semibold"><Ic n="settings" s={16} style={{ color: 'var(--text-2)' }} /> Configurações</h1>
        <div className="ml-auto"><SeletorCliente clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={cliente?.id ?? ''} base="/caixa-de-entrada/configuracoes" /></div>
      </header>
      <div className="mx-auto grid max-w-[1000px] gap-4 p-3 md:grid-cols-[minmax(0,1.3fr)_minmax(260px,1fr)]">
        {cliente && ficha ? <FichaDeConteudo key={cliente.id} clienteId={cliente.id} clienteNome={cliente.nome} ficha={ficha} /> : <p className="text-corpo text-texto-3">Nenhum cliente ativo cadastrado.</p>}
        <aside className="h-fit space-y-2 rounded-lg border border-borda p-3 text-[13px]">
          <h2 className="font-semibold">Google Drive</h2>
          {drive ? (
            <>
              <p className="text-texto-2">Integração ligada. Compartilhe a pasta do cliente, como <b>Leitor</b>, com este e-mail:</p>
              <p className="break-all rounded bg-[var(--bg-active)] px-2 py-1 font-mono text-[12px]">{email ?? '—'}</p>
              <p className="text-texto-3">Depois cole o link da pasta na ficha ao lado. Pastas com “orgânico” ou “anúncio” no nome são reconhecidas sozinhas.</p>
            </>
          ) : (
            <p className="text-texto-2">Ainda não ligada: falta a variável <code>GOOGLE_DRIVE_SA_JSON</code> (chave da conta de serviço) no servidor.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
