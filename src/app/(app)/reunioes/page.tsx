import { FileText, Mic, NotebookPen } from 'lucide-react'
import Link from 'next/link'
import { Modulo } from '@/componentes/Modulo'
import { Gravador } from '@/componentes/reunioes/Gravador'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarDocumentos } from '@/servicos/documentos'
import { notetakerConfigurado } from '@/servicos/notetaker'
import { dados } from '@/servicos/resultado'

// A ata de uma reunião longa pode levar alguns minutos para a IA gerar.
export const maxDuration = 300

const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Notetaker: grava (ou recebe) a reunião e a IA escreve a ata como documento. */
export default async function Reunioes() {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const [clientes, listas, docs] = await Promise.all([
    listarClientes(sb),
    sb.from('lists').select('id, name').is('archived_at', null).order('name').then(dados),
    listarDocumentos(sb).catch(() => []),
  ])
  const atas = docs.filter((d) => d.titulo.startsWith('Ata — ') && !d.arquivadoEm).slice(0, 12)

  return (
    <div className="page-shell">
      <div>
        <p className="eyebrow">Notetaker</p>
        <h1 className="page-title mt-1">Reuniões</h1>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Modulo icone={Mic} titulo="Nova reunião" descricao="Grave a reunião (presencial ou online) ou envie a gravação; a IA escreve a ata com resumo, decisões e próximos passos">
          {notetakerConfigurado() ? (
            <Gravador clientes={clientes.filter((c) => !c.interno && c.status !== 'encerrado').map((c) => ({ id: c.id, nome: c.nome }))} listas={listas.map((l) => ({ id: l.id, nome: l.name }))} />
          ) : (
            <p className="rounded-lg border border-aviso-fundo bg-aviso-fundo/40 px-3 py-2 text-rotulo text-aviso-forte">O notetaker precisa de uma chave do Gemini: configure GEMINI_API_KEY na Vercel (ou use o Gemini como IA da plataforma).</p>
          )}
        </Modulo>
        <Modulo icone={NotebookPen} titulo="Últimas atas" descricao="Ficam em Documentos, com a transcrição numa página separada">
          {atas.length === 0 ? (
            <p className="py-6 text-center text-rotulo text-texto-3">Nenhuma ata ainda.</p>
          ) : (
            <ul className="divide-y divide-borda">
              {atas.map((d) => (
                <li key={d.id}>
                  <Link href={`/documentos/${d.id}`} className="flex items-center gap-2 py-2 text-rotulo hover:text-marca">
                    <FileText className="h-4 w-4 shrink-0 text-texto-3" />
                    <span className="min-w-0 flex-1 truncate">{d.titulo.replace(/^Ata — /, '')}</span>
                    <span className="shrink-0 text-legenda text-texto-3">{dia.format(new Date(d.atualizadoEm))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Modulo>
      </div>
    </div>
  )
}
