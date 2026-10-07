import Link from 'next/link'
import { notFound } from 'next/navigation'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { iniciais } from '@/dominio/clientes-galeria'
import { capasDosClientes, listarCamposCliente, valoresDosClientes } from '@/servicos/clientes-galeria'
import { buscarCliente, usuariosDoCliente } from '@/servicos/clientes-plataforma'
import { FormConvite } from '../../config/usuarios/FormConvite'
import { editarCliente } from '../acoes'
import { FormCliente } from '../FormCliente'
import { CamposCliente } from './CamposCliente'
import { SeletorCapa } from './SeletorCapa'

export default async function Cliente({ params }: PageProps<'/clientes/[cliente]'>) {
  const { cliente: id } = await params
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const cliente = await buscarCliente(sb, id)
  if (!cliente) notFound()
  const admin = eu.papel === 'admin'
  const podeGerir = admin || eu.papel === 'gestor'
  const [campos, valores, capas] = await Promise.all([listarCamposCliente(sb), valoresDosClientes(sb), capasDosClientes(sb)])
  const capa = capas[id]
  const usuarios = admin && !cliente.interno ? await usuariosDoCliente(sb, id) : []

  return (
    <div className="page-shell max-w-5xl">
      <Link href="/clientes" className="text-corpo text-texto-2 hover:text-marca">
        ← Clientes
      </Link>
      <h1 className="page-title">{cliente.nome}</h1>
      <section className="space-y-3">
        <div className="relative aspect-[16/5] w-full overflow-hidden rounded-xl border border-borda" style={{ background: cliente.cor }}>
          {capa?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- origem externa (Unsplash) ou URL assinada do R2
            <img src={capa.url} alt="" width={1200} height={375} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[40px] font-bold tracking-[0.08em] text-white/90">{iniciais(cliente.nome)}</span>
          )}
          {capa?.credito && <span className="absolute bottom-1.5 right-2 rounded bg-black/50 px-1.5 py-0.5 text-legenda text-white/90">{capa.credito}</span>}
        </div>
        {podeGerir && <SeletorCapa clienteId={id} temCapa={!!capa?.url} />}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Informações da galeria</h2>
        <CamposCliente clienteId={id} campos={campos} valores={valores[id] ?? {}} podeEditar={podeGerir} />
      </section>
      <FormCliente acao={editarCliente.bind(null, id)} cliente={cliente} podeEditar={podeGerir} />
      {admin && !cliente.interno && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Acesso ao portal</h2>
          <div className="rounded-xl border border-borda bg-white">
            {usuarios.length === 0 && <p className="px-3 py-2.5 text-corpo text-texto-3">Nenhum usuário com acesso ao portal.</p>}
            {usuarios.map((u) => (
              <div key={u.id} className={`flex items-center gap-3 border-t border-borda px-3 py-2 text-corpo first:border-t-0 ${u.ativo ? '' : 'opacity-50'}`}>
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
