import Link from 'next/link'
import type { LinhaResumo } from '@/dominio/resumo'
import { NomeCliente } from '@/componentes/NomeCliente'

/** Tabela compacta de totais (departamento ou cliente), cada linha leva para a tela correspondente. */
export function TabelaResumo({ titulo, descricao, linhas, href, clientes }: { titulo: string; descricao: string; linhas: LinhaResumo[]; href: (linha: LinhaResumo) => string; /** Linhas são clientes: nome em destaque (negrito e azul). */ clientes?: boolean }) {
  return (
    <section>
      <div>
        <h2>{titulo}</h2>
        <p>{descricao}</p>
      </div>
      {linhas.length === 0 ? (
        <p>Sem tarefas para mostrar.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Total</th>
              <th>Andamento</th>
              <th>Concluídas</th>
              <th>Atrasadas</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id}>
                <td>{clientes ? <NomeCliente nome={l.nome} href={href(l)} /> : <Link href={href(l)}>{l.nome}</Link>}</td>
                <td>{l.total}</td>
                <td>{l.emAndamento}</td>
                <td>{l.concluidas}</td>
                <td>{l.atrasadas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
