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
    <div>
      <FormConvite clientes={clientes.filter((c) => !c.interno).map((c) => ({ id: c.id, nome: c.nome }))} espacos={espacos} />
      <div>
        <table>
          <thead>
            <tr>
              <th>Pessoa</th>
              <th className="hidden">Departamentos / cliente</th>
              <th>Papel</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>
                  <div>
                    <Avatar nome={u.nome || u.email} tamanho="h-7 w-7 text-legenda" />
                    <div>
                      <div>{u.nome || '—'}</div>
                      <div>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden">
                  {u.cliente
                    ? u.cliente.nome
                    : u.espacos.map((e) => `${e.nome}${e.papel === 'gestor' ? ' (gestor)' : ''}`).join(', ') || '—'}
                </td>
                <td>{u.papel === 'cliente' || u.id === eu.id ? ROTULO_PAPEL[u.papel] : null}</td>
                <td>
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
