import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LogoRede } from '@/componentes/redes/LogoRede'
import { NomeCliente } from '@/componentes/NomeCliente'
import { Ic } from '@/componentes/app/Ic'
import { ligadaNoCliente, redePorSlug } from '@/dominio/redes-sociais'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'

export default async function PaginaRede({ params }: { params: Promise<{ rede: string }> }) {
  await exigirEquipe()
  const rede = redePorSlug((await params).rede)
  if (!rede) notFound()
  const sb = await criarClienteServidor()
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
  return (
    <div>
      <div>
        <LogoRede slug={rede.slug} tamanho={40} />
        <div>
          <h1>{rede.nome}</h1>
          <p>{rede.resumo}</p>
        </div>
        {!rede.conectada && <span>Conexão em breve</span>}
      </div>
      <h2>Funções e relatórios</h2>
      <div>
        {rede.funcoes.map((f) => {
          const corpo = (
            <>
              <span style={{ background: 'var(--bg-hover)' }}><Ic n={f.icone} s={20} /></span>
              <span>
                <span>{f.rotulo}</span>
                <span>{f.descricao}</span>
                {!f.href && <span>Em breve</span>}
              </span>
            </>
          )
          return f.href ? (
            f.externo ? <a key={f.id} href={f.href} target="_blank" rel="noreferrer">{corpo}</a>
              : <Link key={f.id} href={f.href}>{corpo}</Link>
          ) : <div key={f.id}>{corpo}</div>
        })}
      </div>
      <h2>Clientes</h2>
      <div>
        {clientes.map((c) => {
          const on = ligadaNoCliente(c, rede.slug)
          return (
            <div key={c.id}>
              <NomeCliente nome={c.nome} />
              <span>{on ? 'Conectado' : rede.conectada ? 'Não conectado' : 'Aguardando integração'}</span>
              {on && rede.slug === 'instagram' && <Link href={`/insights?cliente=${c.id}`}>Ver insights</Link>}
              {on && rede.slug === 'gmn' && <Link href={`/gmn?cliente=${c.id}`}>Ver perfil</Link>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
