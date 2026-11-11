import { Building2, Eye, FileText, Mail, Plus, UserPen } from 'lucide-react'
import Link from 'next/link'
import { ContextoMarca } from '@/componentes/blog/ContextoMarca'
import { GerenciarAutores } from '@/componentes/blog/GerenciarAutores'
import { ImportarArtigo } from '@/componentes/blog/ImportarArtigo'
import { somarDias } from '@/dominio/agenda'
import { dataDeHoje } from '@/dominio/filtros'
import { SeloTom } from '@/componentes/insights/tom'
import { Modulo } from '@/componentes/Modulo'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { CAMPOS_MARCA, autores, contextoMarca, desempenho, inscritos, postsDaEquipe } from '@/servicos/blog'

const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })

/** Área da equipe para o blog público (www.gruposrv.com.br/blog): artigos, autores e inscritos da newsletter. */
export default async function EditorBlog() {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const agora = new Date()
  const hoje = dataDeHoje(agora)
  const [posts, listaAutores, lista, marca, numeros] = await Promise.all([postsDaEquipe(sb), autores(sb), inscritos(sb), contextoMarca(), desempenho(sb, somarDias(hoje, -90))])
  const situacao = (p: (typeof posts)[number]) => (p.status === 'rascunho' ? 'Rascunho' : p.status === 'revisao' ? 'Em revisão' : p.publicadoEmBruto && new Date(p.publicadoEmBruto) > agora ? 'Agendado' : 'Publicado')
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')
  const publicados = posts.filter((p) => situacao(p) === 'Publicado')
  return (
    <div>
      <div>
        <div>
          <p>Site · SEO</p>
          <h1>Blog</h1>
        </div>
        <div>
          <a href="/blog" target="_blank" rel="noreferrer"><Eye /> Ver o blog</a>
          <ImportarArtigo />
          <Link href="/editor-blog/novo"><Plus /> Novo artigo</Link>
        </div>
      </div>

      <div>
        {[
          ['Publicados', publicados.length],
          ['Rascunhos e agendados', posts.length - publicados.length],
          ['Visitas (total)', publicados.reduce((s, p) => s + p.visitas, 0)],
          ['Cliques no CTA (90 dias)', [...numeros.values()].reduce((s, d) => s + d.cliquesCta + d.cliquesCta2, 0)],
          ['Inscritos na newsletter', lista.length],
        ].map(([r, v]) => (
          <div key={r}>
            <p>{r}</p>
            <p>{Number(v).toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

      <Modulo icone={FileText} titulo="Artigos" descricao="Clique para editar. Publicado com data futura = agendado (entra no ar sozinho).">
        {posts.length === 0 ? (
          <p>Nenhum artigo ainda. Comece pelo guia completo de cada categoria (o “pilar”).</p>
        ) : (
          <div>
            <table>
              <thead>
                <tr>
                  <th>Artigo</th>
                  <th>Categoria</th>
                  <th>Situação</th>
                  <th>Data</th>
                  <th>Visitas</th>
                  <th title="Leram pelo menos metade (90 dias)">Leitura 50%</th>
                  <th title="Cliques no CTA ÷ visitas (90 dias)">Taxa do CTA</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => {
                  const s = situacao(p)
                  const d = numeros.get(p.id)
                  const atrasada = !!p.revisarEm && p.revisarEm <= hoje
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/editor-blog/${p.id}`}>{p.titulo}</Link>
                        <p>{p.palavraChave ? `Palavra-chave: ${p.palavraChave}` : 'Sem palavra-chave'}{p.pilar ? ' · Guia completo' : ''}{p.revisado ? ' · ✓ revisado' : ''}{atrasada ? '' : p.revisarEm ? ` · revisar em ${p.revisarEm.split('-').reverse().join('/')}` : ''}</p>
                        {atrasada && <SeloTom tom="atencao" rotulo="Hora de revisar o conteúdo" />}
                      </td>
                      <td>{p.categoria ? <span><span style={{ background: p.categoria.cor }} />{p.categoria.nome}</span> : '—'}</td>
                      <td><SeloTom tom={s === 'Publicado' ? 'bom' : s === 'Rascunho' ? 'neutro' : 'atencao'} rotulo={s} /></td>
                      <td>{p.publicadoEmBruto && s !== 'Rascunho' ? quando.format(new Date(p.publicadoEmBruto)) : '—'}</td>
                      <td>{p.visitas.toLocaleString('pt-BR')}</td>
                      <td>{d ? pct(d.rolagem['50'], d.visitas) : '—'}</td>
                      <td>{d ? pct(d.cliquesCta + d.cliquesCta2, d.visitas) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modulo>

      <Modulo icone={Building2} titulo="Contexto da marca" descricao="Usado pela IA ao escrever e nos dados da empresa que o Google e as IAs leem. Também define se robôs que só treinam IA podem ler o blog.">
        <ContextoMarca inicial={marca} campos={CAMPOS_MARCA} />
      </Modulo>

      <div>
        <Modulo icone={UserPen} titulo="Autores" descricao="Quem assina os artigos: nome, cargo e uma bio curta mostram experiência (o Google valoriza)">
          <GerenciarAutores autores={listaAutores} />
        </Modulo>
        <Modulo icone={Mail} titulo="Newsletter" descricao={`${lista.length} inscritos pelo blog`} acoes={lista.length > 0 ? <a href="/editor-blog/inscritos.csv">Baixar CSV</a> : undefined}>
          {lista.length === 0 ? (
            <p>Ninguém se inscreveu ainda.</p>
          ) : (
            <ul>
              {lista.slice(0, 100).map((i) => (
                <li key={i.email}><span>{i.nome ? `${i.nome} · ` : ''}{i.email}</span><span>{quando.format(new Date(i.em)).slice(0, 8)}</span></li>
              ))}
            </ul>
          )}
        </Modulo>
      </div>
    </div>
  )
}
