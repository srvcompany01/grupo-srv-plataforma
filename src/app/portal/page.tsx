import { FileText } from 'lucide-react'
import Link from 'next/link'
import { Marca } from '@/componentes/Marca'
import { BotaoSair } from '@/componentes/app/BotaoSair'
import { exigirCliente } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarDocumentos } from '@/servicos/documentos'

const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export default async function Portal() {
  const eu = await exigirCliente()
  // A RLS entrega só os documentos que a equipe liberou para este cliente.
  const docs = await listarDocumentos(await criarClienteServidor()).catch(() => [])
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Marca tamanho="h-11 w-11 text-lg" />
          <h1 className="text-xl font-semibold">Olá, {eu.nome || 'cliente'}!</h1>
        </div>
        <BotaoSair />
      </div>
      <section className="space-y-2">
        <h2 className="text-rotulo font-bold uppercase tracking-rotulo text-texto-3">Documentos para você</h2>
        {docs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-borda p-6 text-center text-corpo text-texto-3">Nenhum documento disponível por enquanto.</p>
        ) : (
          docs.map((d) => (
            <Link key={d.id} href={`/portal/documentos/${d.id}`} className="flex items-center gap-3 rounded-lg border border-borda bg-white p-3 hover:border-marca-clara">
              <FileText className="h-4 w-4 text-texto-3" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-corpo font-semibold text-texto">{d.titulo}</span>
                <span className="block text-legenda text-texto-3">Atualizado em {dia.format(new Date(d.atualizadoEm))}</span>
              </span>
            </Link>
          ))
        )}
      </section>
    </main>
  )
}
