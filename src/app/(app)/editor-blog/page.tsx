import { Eye, FileText, Mail, Plus, UserPen } from 'lucide-react'
import Link from 'next/link'
import { GerenciarAutores } from '@/componentes/blog/GerenciarAutores'
import { SeloTom } from '@/componentes/insights/tom'
import { Modulo } from '@/componentes/Modulo'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { autores, inscritos, postsDaEquipe } from '@/servicos/blog'
import { botaoPrimario } from '@/lib/ui'

const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Área da equipe para o blog público (www.gruposrv.com.br/blog): artigos, autores e inscritos da newsletter. */
export default async function EditorBlog() {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const [posts, listaAutores, lista] = await Promise.all([postsDaEquipe(sb), autores(sb), inscritos(sb)])
  const agora = new Date()
  const situacao = (p: (typeof posts)[number]) => (p.status === 'rascunho' ? 'Rascunho' : p.publicadoEmBruto && new Date(p.publicadoEmBruto) > agora ? 'Agendado' : 'Publicado')
  const publicados = posts.filter((p) => situacao(p) === 'Publicado')
  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Site · SEO</p>
          <h1 className="page-title mt-1">Blog</h1>
        </div>
        <div className="flex gap-2">
          <a href="/blog" target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-borda bg-white px-3 text-rotulo font-medium hover:bg-hover"><Eye className="h-3.5 w-3.5" /> Ver o blog</a>
          <Link href="/editor-blog/novo" className={botaoPrimario}><Plus className="h-3.5 w-3.5" /> Novo artigo</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Publicados', publicados.length],
          ['Rascunhos e agendados', posts.length - publicados.length],
          ['Visitas (total)', publicados.reduce((s, p) => s + p.visitas, 0)],
          ['Inscritos na newsletter', lista.length],
        ].map(([r, v]) => (
          <div key={r} className="rounded-xl border border-borda bg-white p-3">
            <p className="text-micro text-texto-3">{r}</p>
            <p className="text-destaque font-bold tabular-nums">{Number(v).toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

      <Modulo icone={FileText} titulo="Artigos" descricao="Clique para editar. Publicado com data futura = agendado (entra no ar sozinho).">
        {posts.length === 0 ? (
          <p className="py-8 text-center text-corpo text-texto-3">Nenhum artigo ainda. Comece pelo guia completo de cada categoria (o “pilar”).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-rotulo">
              <thead>
                <tr className="border-b border-borda text-left text-legenda text-texto-3">
                  <th className="py-2 pr-3 font-medium">Artigo</th>
                  <th className="py-2 pr-3 font-medium">Categoria</th>
                  <th className="py-2 pr-3 font-medium">Situação</th>
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 text-right font-medium">Visitas</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => {
                  const s = situacao(p)
                  return (
                    <tr key={p.id} className="border-b border-borda/60 last:border-0">
                      <td className="py-2 pr-3">
                        <Link href={`/editor-blog/${p.id}`} className="font-medium text-texto hover:underline">{p.titulo}</Link>
                        <p className="text-micro text-texto-3">{p.palavraChave ? `Palavra-chave: ${p.palavraChave}` : 'Sem palavra-chave'}{p.pilar ? ' · Guia completo' : ''}</p>
                      </td>
                      <td className="py-2 pr-3">{p.categoria ? <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: p.categoria.cor }} />{p.categoria.nome}</span> : '—'}</td>
                      <td className="py-2 pr-3"><SeloTom tom={s === 'Publicado' ? 'bom' : s === 'Agendado' ? 'atencao' : 'neutro'} rotulo={s} /></td>
                      <td className="py-2 pr-3 text-texto-2">{p.publicadoEmBruto && s !== 'Rascunho' ? quando.format(new Date(p.publicadoEmBruto)) : '—'}</td>
                      <td className="py-2 text-right tabular-nums">{p.visitas.toLocaleString('pt-BR')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modulo>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <Modulo icone={UserPen} titulo="Autores" descricao="Quem assina os artigos: nome, cargo e uma bio curta mostram experiência (o Google valoriza)">
          <GerenciarAutores autores={listaAutores} />
        </Modulo>
        <Modulo icone={Mail} titulo="Newsletter" descricao={`${lista.length} inscritos pelo blog`} acoes={lista.length > 0 ? <a href="/editor-blog/inscritos.csv" className="text-rotulo font-semibold text-petroleo hover:underline">Baixar CSV</a> : undefined}>
          {lista.length === 0 ? (
            <p className="py-4 text-center text-rotulo text-texto-3">Ninguém se inscreveu ainda.</p>
          ) : (
            <ul className="max-h-72 divide-y divide-borda overflow-y-auto text-rotulo">
              {lista.slice(0, 100).map((i) => (
                <li key={i.email} className="flex justify-between gap-2 py-1.5"><span className="truncate">{i.nome ? `${i.nome} · ` : ''}{i.email}</span><span className="shrink-0 text-legenda text-texto-3">{quando.format(new Date(i.em)).slice(0, 8)}</span></li>
              ))}
            </ul>
          )}
        </Modulo>
      </div>
    </div>
  )
}
