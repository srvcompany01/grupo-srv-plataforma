import { ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import { escopoPedido } from '@/dominio/oauth'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { clienteOAuth } from '@/servicos/oauth'
import { decidirAcao } from './acoes'

export const metadata = { title: 'Conectar ao Claude · Grupo SRV' }

const Cartao = ({ children }: { children: React.ReactNode }) => (
  <main>
    <div>{children}</div>
  </main>
)

/** Tela de consentimento do OAuth: a pessoa logada autoriza o app do Claude a usar a plataforma por ela. */
export default async function Autorizar({ searchParams }: PageProps<'/oauth/autorizar'>) {
  const sp = await searchParams
  const v = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const cliente = await clienteOAuth(v('client_id'))
  if (!cliente || !cliente.retornos.includes(v('redirect_uri'))) {
    return <Cartao><h1>Pedido inválido</h1><p>Este pedido de conexão não é válido. Remova o conector no Claude e adicione de novo.</p></Cartao>
  }
  if (v('response_type') !== 'code' || v('code_challenge_method') !== 'S256' || !v('code_challenge')) {
    const d = new URL(v('redirect_uri'))
    d.searchParams.set('error', 'invalid_request')
    if (v('state')) d.searchParams.set('state', v('state'))
    redirect(d.toString())
  }
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel === 'cliente') {
    const aqui = `/oauth/autorizar?${new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === 'string'))}`
    return (
      <Cartao>
        <h1>Conectar o Claude à plataforma</h1>
        <p>{eu?.papel === 'cliente' ? 'A conexão com o Claude é só para a equipe da agência.' : 'Entre com sua conta da equipe para autorizar.'}</p>
        {eu?.papel !== 'cliente' && <a href={`/oauth/entrar?voltar=${encodeURIComponent(aqui)}`}>Entrar na plataforma</a>}
      </Cartao>
    )
  }
  const escrita = escopoPedido(v('scope')) === 'write'
  return (
    <Cartao>
      <div>
        <span><ShieldCheck /></span>
        <div>
          <h1>Conectar {cliente.nome || 'o app do Claude'}</h1>
          <p>à Plataforma Grupo SRV</p>
        </div>
      </div>
      <p>
        O Claude vai usar a plataforma <strong>como {eu.nome}</strong>, com as mesmas permissões que você tem aqui: ver clientes, tarefas, anúncios e insights e, se você permitir, criar e alterar (campanhas sempre nascem pausadas; ativar e mudar orçamento pedem aprovação na aba Anúncios).
      </p>
      <form action={decidirAcao}>
        {['client_id', 'redirect_uri', 'state', 'code_challenge', 'scope'].map((k) => <input key={k} type="hidden" name={k} value={v(k)} />)}
        <fieldset>
          <legend>Permissão</legend>
          <label><input type="radio" name="escopo" value="write" defaultChecked={escrita} /> <span><strong>Ler e criar/alterar</strong> (recomendado para criar campanhas e tarefas pelo Claude)</span></label>
          <label><input type="radio" name="escopo" value="read" defaultChecked={!escrita} /> <span><strong>Só ler</strong> (monitorar, sem mudar nada)</span></label>
        </fieldset>
        <div>
          <button name="decisao" value="cancelar">Cancelar</button>
          <button name="decisao" value="autorizar">Autorizar</button>
        </div>
      </form>
      <p>Você vê e revoga esta conexão em Configurações → Integrações (token &quot;App do Claude&quot;).</p>
    </Cartao>
  )
}
