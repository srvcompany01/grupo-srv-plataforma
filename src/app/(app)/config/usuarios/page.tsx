import { Avatar } from '@/componentes/Avatar'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarArvore } from '@/servicos/espacos'
import { listarUsuarios } from '@/servicos/usuarios'
import { ControlesUsuario } from './ControlesUsuario'
import { FormConvite } from './FormConvite'

const ROTULO_PAPEL = { admin: 'Admin', gestor: 'Gestor', membro: 'Membro', cliente: 'Cliente' } as const

export default async function Usuarios() {
  const eu = await exigirAdmin()
  const sb = await criarClienteServidor()
  const [usuarios, clientes, navegacao] = await Promise.all([listarUsuarios(sb), listarClientes(sb), listarArvore(sb)])
  const espacos = navegacao.espacos.flatMap((e) => [{ id: e.id, nome: e.nome }, ...e.filhos.map((f) => ({ id: f.id, nome: `${e.nome} › ${f.nome}` }))])

  return (
    <div className="space-y-6">
      <FormConvite clientes={clientes.filter((c) => !c.interno).map((c) => ({ id: c.id, nome: c.nome }))} espacos={espacos} />
      <div className="overflow-hidden rounded-lg border border-borda bg-white">
        <table className="w-full text-[13px]">
          <thead className="bg-hover text-left text-[11px] uppercase tracking-wide text-texto-3">
            <tr>
              <th className="px-3 py-2">Pessoa</th>
              <th className="hidden px-3 py-2 md:table-cell">Departamentos / cliente</th>
              <th className="px-3 py-2">Papel</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className={`border-t border-borda ${u.ativo ? '' : 'opacity-50'}`}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar nome={u.nome || u.email} tamanho="h-7 w-7 text-[11px]" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{u.nome || '—'}</div>
                      <div className="truncate text-texto-3">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 py-2 text-texto-2 md:table-cell">
                  {u.cliente
                    ? u.cliente.nome
                    : u.espacos.map((e) => `${e.nome}${e.papel === 'gestor' ? ' (gestor)' : ''}`).join(', ') || '—'}
                </td>
                <td className="px-3 py-2">{u.papel === 'cliente' || u.id === eu.id ? ROTULO_PAPEL[u.papel] : null}</td>
                <td className="px-3 py-2 text-right">
                  {u.id !== eu.id && <ControlesUsuario id={u.id} papel={u.papel} ativo={u.ativo} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
