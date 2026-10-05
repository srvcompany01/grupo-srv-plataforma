import Link from 'next/link'
import { Avatar } from '@/componentes/Avatar'
import { BotaoConfirmar } from '@/componentes/BotaoConfirmar'
import { Cabecalho } from '@/componentes/Cabecalho'
import { CopiarLink } from '@/componentes/CopiarLink'
import { FormNovoCliente } from '@/componentes/FormNovoCliente'
import { dbAdmin } from '@/infra/admin'
import { urlBase } from '@/lib/url'
import { listarClientes } from '@/servicos/clientes'
import { acaoDefinirAtivo, acaoRegenerarToken } from './acoes'

export default async function Clientes() {
  const lista = await listarClientes(await dbAdmin())
  const base = await urlBase()
  const pendentes = lista.reduce((s, c) => s + c.pendentes, 0)

  return (
    <>
      <Cabecalho trilha={[{ rotulo: 'Clientes' }]} />
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mb-4 flex items-baseline gap-3">
          <h1 className="text-lg font-semibold">Clientes</h1>
          <span className="text-sm text-texto-3">
            {lista.length} {lista.length === 1 ? 'cliente' : 'clientes'} · {pendentes} aguardando aprovação
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-borda bg-white">
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_440px] gap-4 border-b border-borda px-4 py-2 text-xs font-medium text-texto-3 sm:grid">
            <span>Nome</span>
            <span>Pendentes</span>
            <span className="text-right">Ações</span>
          </div>
          <ul className="divide-y divide-borda">
            {lista.map((c) => (
              <li
                key={c.id}
                className={`grid gap-2 px-4 py-2.5 transition hover:bg-hover sm:grid-cols-[minmax(0,1fr)_140px_440px] sm:items-center sm:gap-4 ${c.ativo ? '' : 'opacity-55'}`}
              >
                <Link href={`/admin/clientes/${c.id}`} className="flex min-w-0 items-center gap-2.5">
                  <Avatar nome={c.nome} />
                  <span className="truncate font-medium hover:text-marca">{c.nome}</span>
                  {!c.ativo && <span className="rounded bg-hover px-1.5 text-[11px] text-texto-2">desativado</span>}
                </Link>
                <span className={c.pendentes > 0 ? '' : 'hidden sm:inline'}>
                  {c.pendentes > 0 ? (
                    <span className="inline-flex h-[22px] items-center rounded-[5px] bg-marca-fundo px-2 text-xs font-semibold text-marca-escura">
                      {c.pendentes} aguardando
                    </span>
                  ) : (
                    <span className="hidden text-xs text-texto-3 sm:inline">—</span>
                  )}
                </span>
                <div className="-ml-3 flex flex-wrap gap-0.5 sm:ml-0 sm:justify-end">
                  {c.ativo && <CopiarLink nome={c.nome} url={`${base}/c/${c.token}`} />}
                  <BotaoConfirmar
                    acao={acaoRegenerarToken.bind(null, c.id)}
                    pergunta={`Gerar novo link para ${c.nome}? O link atual deixa de funcionar.`}
                  >
                    Gerar novo link
                  </BotaoConfirmar>
                  <BotaoConfirmar
                    acao={acaoDefinirAtivo.bind(null, c.id, !c.ativo)}
                    pergunta={c.ativo ? `Desativar ${c.nome}? O link para de funcionar.` : undefined}
                  >
                    {c.ativo ? 'Desativar' : 'Reativar'}
                  </BotaoConfirmar>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-borda">
            <FormNovoCliente />
          </div>
        </div>
      </main>
    </>
  )
}
