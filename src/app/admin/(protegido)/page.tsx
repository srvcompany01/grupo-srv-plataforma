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
      <main>
        <div>
          <h1>Clientes</h1>
          <span>
            {lista.length} {lista.length === 1 ? 'cliente' : 'clientes'} · {pendentes} aguardando aprovação
          </span>
        </div>

        <div>
          <div className="hidden sm:grid">
            <span>Nome</span>
            <span>Pendentes</span>
            <span>Ações</span>
          </div>
          <ul>
            {lista.map((c) => (
              <li
                key={c.id}
              >
                <Link href={`/admin/clientes/${c.id}`}>
                  <Avatar nome={c.nome} />
                  <span>{c.nome}</span>
                  {!c.ativo && <span>desativado</span>}
                </Link>
                <span>
                  {c.pendentes > 0 ? (
                    <span>
                      {c.pendentes} aguardando
                    </span>
                  ) : (
                    <span className="hidden sm:inline">—</span>
                  )}
                </span>
                <div>
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
          <div>
            <FormNovoCliente />
          </div>
        </div>
      </main>
    </>
  )
}
