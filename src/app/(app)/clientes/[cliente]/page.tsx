import Link from 'next/link'
import { notFound } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarCliente, usuariosDoCliente } from '@/servicos/clientes-plataforma'
import { FormConvite } from '../../config/usuarios/FormConvite'
import { editarCliente } from '../acoes'
import { FormCliente } from '../FormCliente'

export default async function Cliente({ params }: PageProps<'/clientes/[cliente]'>) {
  const { cliente: id } = await params
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const cliente = await buscarCliente(sb, id)
  if (!cliente) notFound()
  const admin = eu.papel === 'admin'
  const usuarios = admin && !cliente.interno ? await usuariosDoCliente(sb, id) : []

  return (
    <div className="page-shell max-w-5xl">
      <Link href="/clientes" className="text-[13px] text-texto-2 hover:text-marca">
        ← Clientes
      </Link>
      <h1 className="page-title">{cliente.nome}</h1>
      <FormCliente acao={editarCliente.bind(null, id)} cliente={cliente} podeEditar={admin || eu.papel === 'gestor'} />
      {admin && !cliente.interno && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Acesso ao portal</h2>
          <div className="rounded-xl border border-borda bg-white">
            {usuarios.length === 0 && <p className="px-3 py-2.5 text-[13px] text-texto-3">Nenhum usuário com acesso ao portal.</p>}
            {usuarios.map((u) => (
              <div key={u.id} className={`flex items-center gap-3 border-t border-borda px-3 py-2 text-[13px] first:border-t-0 ${u.ativo ? '' : 'opacity-50'}`}>
                <span className="font-medium">{u.nome}</span>
                <span className="text-texto-3">{u.email}</span>
              </div>
            ))}
          </div>
          <FormConvite clientes={[]} espacos={[]} clienteFixo={id} />
        </section>
      )}
    </div>
  )
}
