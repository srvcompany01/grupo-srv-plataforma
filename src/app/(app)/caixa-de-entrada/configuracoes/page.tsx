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
      <header>
        <Link href="/caixa-de-entrada">Caixa de entrada</Link>
        <span>/</span>
        <h1><Ic n="settings" s={16} style={{ color: 'var(--text-2)' }} /> Configurações</h1>
        <div><SeletorCliente clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} atual={cliente?.id ?? ''} base="/caixa-de-entrada/configuracoes" /></div>
      </header>
      <div>
        {cliente && ficha ? <FichaDeConteudo key={cliente.id} clienteId={cliente.id} clienteNome={cliente.nome} ficha={ficha} /> : <p>Nenhum cliente ativo cadastrado.</p>}
        <aside>
          <h2>Google Drive</h2>
          {drive ? (
            <>
              <p>Integração ligada. Compartilhe a pasta do cliente, como <b>Leitor</b>, com este e-mail:</p>
              <p>{email ?? '—'}</p>
              <p>Depois cole o link da pasta na ficha ao lado. Pastas com “orgânico” ou “anúncio” no nome são reconhecidas sozinhas.</p>
            </>
          ) : (
            <p>Ainda não ligada: falta a variável <code>GOOGLE_DRIVE_SA_JSON</code> (chave da conta de serviço) no servidor.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
