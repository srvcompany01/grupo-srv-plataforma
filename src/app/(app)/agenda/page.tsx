import { CalendarDays, ChevronLeft, ChevronRight, Lock, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { BotaoGoogle } from '@/componentes/agenda/BotaoGoogle'
import { CompromissoDialog } from '@/componentes/agenda/CompromissoDialog'
import { dataLocal, horaLocal, ocorrencias, semanaDe, somarDias, type Ocorrencia } from '@/dominio/agenda'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarCompromissos } from '@/servicos/agenda'
import { eventosDoGoogle, googleConfigurado, statusGoogle } from '@/servicos/google-agenda'
import { listarEquipe } from '@/servicos/usuarios'

const textoParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const DATA = /^\d{4}-\d{2}-\d{2}$/
const nomeDia = (iso: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')
const AVISO_GOOGLE: Record<string, string> = {
  ok: 'Google Agenda conectado. Seus compromissos já foram enviados para lá.',
  cancelado: 'Conexão com o Google cancelada.',
  erro: 'Não foi possível conectar o Google Agenda. Tente de novo.',
  'sem-config': 'A integração com o Google ainda não foi configurada (GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET).',
}
const ICONE = { privado: Lock, equipe: Users, selecionados: UserCheck }
const horario = (o: Ocorrencia) => (o.diaInteiro ? 'Dia todo' : `${horaLocal(o.inicio)}–${horaLocal(o.fim)}`)

export default async function Agenda({ searchParams }: PageProps<'/agenda'>) {
  const sp = await searchParams
  const eu = await exigirEquipe()
  const hoje = dataDeHoje(new Date())
  const base = textoParam(sp.semana)
  const dias = semanaDe(base && DATA.test(base) && !Number.isNaN(Date.parse(base)) ? base : hoje)
  const sb = await criarClienteServidor()
  const [compromissos, equipe, google, doGoogle] = await Promise.all([
    // Sem a migration da agenda, a página abre vazia em vez de quebrar.
    listarCompromissos(sb, dias[0], dias[6]).catch(() => []),
    listarEquipe(sb),
    statusGoogle(eu.id).catch(() => null),
    eventosDoGoogle(eu.id, dias[0], dias[6]),
  ])
  const todas = [...ocorrencias(compromissos, dias[0], dias[6]), ...doGoogle]
  const podeCompartilhar = eu.papel === 'admin' || eu.papel === 'gestor'
  const outros = equipe.filter((p) => p.id !== eu.id)
  const nomes = new Map(equipe.map((p) => [p.id, p.nome]))
  const aviso = AVISO_GOOGLE[textoParam(sp.google) ?? '']
  const href = (dia: string) => `/agenda?semana=${dia}`

  return (
    <div className="min-h-full bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borda px-4 py-3 md:px-5">
        <h1 className="flex items-center gap-2 text-destaque font-bold text-texto"><CalendarDays className="h-4 w-4" /> Agenda</h1>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center gap-1" aria-label="Semana">
            <Link href={href(somarDias(dias[0], -7))} aria-label="Semana anterior" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronLeft className="h-4 w-4" /></Link>
            <Link href="/agenda" className="rounded-lg px-2 py-1 text-rotulo font-semibold text-texto-2 hover:bg-hover">Hoje</Link>
            <Link href={href(somarDias(dias[0], 7))} aria-label="Próxima semana" className="rounded-lg p-1.5 text-texto-2 hover:bg-hover"><ChevronRight className="h-4 w-4" /></Link>
          </nav>
          {googleConfigurado() && <BotaoGoogle email={google ? google.email : null} />}
          <CompromissoDialog equipe={outros} podeCompartilhar={podeCompartilhar} hoje={dias.includes(hoje) ? hoje : dias[0]} />
        </div>
      </header>

      <main className="space-y-3 p-4 md:p-5">
        {aviso && <p className="rounded-lg border border-borda bg-fundo px-3 py-2 text-rotulo text-texto-2">{aviso}</p>}
        <section className="grid gap-2 md:grid-cols-7" aria-label="Semana">
          {dias.map((dia) => {
            const doDia = todas.filter((o) => dataLocal(o.inicio) === dia)
            return (
              <div key={dia} className={`min-h-28 rounded-xl border p-2 ${dia === hoje ? 'border-petroleo bg-petroleo/5' : 'border-borda'}`}>
                <p className={`mb-1.5 text-legenda font-semibold capitalize ${dia === hoje ? 'text-petroleo' : 'text-texto-3'}`}>{nomeDia(dia)}</p>
                {doDia.length === 0 && <p className="text-micro text-texto-3 md:hidden">Livre</p>}
                <ul className="space-y-1">
                  {doDia.map((o) => {
                    const c = o.compromisso
                    if (!c) {
                      return (
                        <li key={o.id}>
                          <a href={o.google!.link} target="_blank" rel="noreferrer" className="block rounded-md border border-dashed border-borda px-1.5 py-1 text-left hover:bg-hover" title="Evento do seu Google Agenda">
                            <span className="block text-micro tabular-nums text-texto-3">{horario(o)} · Google</span>
                            <span className="block truncate text-legenda text-texto-2">{o.titulo}</span>
                          </a>
                        </li>
                      )
                    }
                    const Icone = ICONE[c.visibilidade]
                    const criador = c.criadoPor === eu.id ? 'você' : nomes.get(c.criadoPor) ?? 'outra pessoa'
                    return (
                      <li key={o.id}>
                        <CompromissoDialog
                          compromisso={c}
                          equipe={outros}
                          podeCompartilhar={podeCompartilhar}
                          podeEditar={c.criadoPor === eu.id || eu.papel === 'admin'}
                          hoje={hoje}
                          className="block w-full rounded-md bg-fundo px-1.5 py-1 text-left hover:bg-hover"
                        >
                          <span className="flex items-center gap-1 text-micro tabular-nums text-texto-3" title={`Criado por ${criador}`}>
                            <Icone className="h-3 w-3 shrink-0" /> {horario(o)}
                          </span>
                          <span className="block truncate text-legenda font-medium text-texto">{o.titulo}</span>
                        </CompromissoDialog>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </section>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-legenda text-texto-3">
          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> só você</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> toda a equipe</span>
          <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> pessoas selecionadas</span>
          <span>tracejado: evento do seu Google Agenda</span>
        </p>
      </main>
    </div>
  )
}
