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
    <div>
      <div>
        <p>Notetaker</p>
        <h1>Reuniões</h1>
      </div>
      <div>
        <Modulo icone={Mic} titulo="Nova reunião" descricao="Grave a reunião (presencial ou online) ou envie a gravação; a IA escreve a ata com resumo, decisões e próximos passos">
          {notetakerConfigurado() ? (
            <Gravador clientes={clientes.filter((c) => !c.interno && c.status !== 'encerrado').map((c) => ({ id: c.id, nome: c.nome }))} listas={listas.map((l) => ({ id: l.id, nome: l.name }))} />
          ) : (
            <p>O notetaker precisa de uma chave do Gemini: configure GEMINI_API_KEY na Vercel (ou use o Gemini como IA da plataforma).</p>
          )}
        </Modulo>
        <Modulo icone={NotebookPen} titulo="Últimas atas" descricao="Ficam em Documentos, com a transcrição numa página separada">
          {atas.length === 0 ? (
            <p>Nenhuma ata ainda.</p>
          ) : (
            <ul>
              {atas.map((d) => (
                <li key={d.id}>
                  <Link href={`/documentos/${d.id}`}>
                    <FileText />
                    <span>{d.titulo.replace(/^Ata — /, '')}</span>
                    <span>{dia.format(new Date(d.atualizadoEm))}</span>
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
