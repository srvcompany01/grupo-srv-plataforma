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
    <div className="page-shell">
      <div className="flex items-center gap-3">
        <LogoRede slug={rede.slug} tamanho={40} />
        <div>
          <h1 className="text-xl font-semibold">{rede.nome}</h1>
          <p className="text-sm text-[var(--text-2)]">{rede.resumo}</p>
        </div>
        {!rede.conectada && <span className="ml-auto rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-3)]">Conexão em breve</span>}
      </div>
      <h2 className="mt-6 text-sm font-semibold">Funções e relatórios</h2>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rede.funcoes.map((f) => {
          const corpo = (
            <>
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md" style={{ background: 'var(--bg-hover)' }}><Ic n={f.icone} s={20} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{f.rotulo}</span>
                <span className="block text-xs leading-relaxed text-[var(--text-2)]">{f.descricao}</span>
                {!f.href && <span className="mt-1 block text-[10px] uppercase tracking-wide text-[var(--text-3)]">Em breve</span>}
              </span>
            </>
          )
          const cls = 'flex gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elev)] p-4'
          return f.href ? (
            f.externo ? <a key={f.id} href={f.href} target="_blank" rel="noreferrer" className={`${cls} transition-colors hover:border-[var(--border)]`}>{corpo}</a>
              : <Link key={f.id} href={f.href} className={`${cls} transition-colors hover:border-[var(--border)]`}>{corpo}</Link>
          ) : <div key={f.id} className={`${cls} opacity-60`}>{corpo}</div>
        })}
      </div>
      <h2 className="mt-8 text-sm font-semibold">Clientes</h2>
      <div className="mt-2 divide-y divide-[var(--border-soft)] rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elev)]">
        {clientes.map((c) => {
          const on = ligadaNoCliente(c, rede.slug)
          return (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <NomeCliente nome={c.nome} />
              <span className="ml-auto text-xs text-[var(--text-3)]">{on ? 'Conectado' : rede.conectada ? 'Não conectado' : 'Aguardando integração'}</span>
              {on && rede.slug === 'instagram' && <Link href={`/insights?cliente=${c.id}`} className="text-xs text-[var(--primary)] hover:underline">Ver insights</Link>}
              {on && rede.slug === 'gmn' && <Link href={`/gmn?cliente=${c.id}`} className="text-xs text-[var(--primary)] hover:underline">Ver perfil</Link>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
