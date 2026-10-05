import Link from 'next/link'
import { dbAdmin } from '@/infra/admin'
import { CopiarLink } from '@/componentes/CopiarLink'
import { FormNovoCliente } from '@/componentes/FormNovoCliente'
import { urlBase } from '@/lib/url'
import { listarClientes } from '@/servicos/clientes'
import { acaoDefinirAtivo, acaoRegenerarToken } from './acoes'
import { BotaoConfirmar } from '@/componentes/BotaoConfirmar'

export default async function Clientes() {
  const lista = await listarClientes(await dbAdmin())
  const base = await urlBase()
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <FormNovoCliente />
      {lista.length === 0 && <p className="text-neutral-500">Nenhum cliente ainda.</p>}
      <ul className="divide-y divide-neutral-200 rounded-2xl bg-white shadow-sm">
        {lista.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href={`/admin/clientes/${c.id}`} className="font-medium hover:underline">
                {c.nome}
              </Link>
              <p className="text-sm text-neutral-500">
                {c.pendentes > 0 ? `${c.pendentes} aguardando aprovação` : 'Nada pendente'}
                {!c.ativo && ' · desativado'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
    </main>
  )
}
