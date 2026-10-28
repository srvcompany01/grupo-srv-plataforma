import Link from 'next/link'
import type { LinhaResumo } from '@/dominio/resumo'
import { NomeCliente } from '@/componentes/NomeCliente'

/** Tabela compacta de totais (departamento ou cliente), cada linha leva para a tela correspondente. */
export function TabelaResumo({ titulo, descricao, linhas, href, clientes }: { titulo: string; descricao: string; linhas: LinhaResumo[]; href: (linha: LinhaResumo) => string; /** Linhas são clientes: nome em destaque (negrito e azul). */ clientes?: boolean }) {
  return (
    <section className="overflow-hidden rounded-lg border border-borda bg-white shadow-cartao">
      <div className="border-b border-borda px-4 py-3">
        <h2 className="text-corpo font-semibold">{titulo}</h2>
        <p className="text-rotulo text-texto-3">{descricao}</p>
      </div>
      {linhas.length === 0 ? (
        <p className="px-4 py-6 text-center text-rotulo text-texto-3">Sem tarefas para mostrar.</p>
      ) : (
        <table className="w-full text-rotulo">
          <thead>
            <tr className="text-left text-legenda text-texto-3">
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-2 py-2 text-right font-medium">Total</th>
              <th className="px-2 py-2 text-right font-medium">Andamento</th>
              <th className="px-2 py-2 text-right font-medium">Concluídas</th>
              <th className="px-4 py-2 text-right font-medium">Atrasadas</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-t border-borda hover:bg-hover">
                <td className="max-w-0 truncate px-4 py-2">{clientes ? <NomeCliente nome={l.nome} href={href(l)} /> : <Link href={href(l)} className="font-medium hover:text-marca">{l.nome}</Link>}</td>
                <td className="px-2 py-2 text-right tabular-nums">{l.total}</td>
                <td className="px-2 py-2 text-right tabular-nums">{l.emAndamento}</td>
                <td className="px-2 py-2 text-right tabular-nums">{l.concluidas}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${l.atrasadas ? 'font-semibold text-perigo' : 'text-texto-3'}`}>{l.atrasadas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
