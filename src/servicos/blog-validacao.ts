import 'server-only'
import { PLACEHOLDER, SITE } from '@/dominio/blog'

export type Verificacao = { item: string; situacao: 'aprovado' | 'corrigir' | 'nao_aplicavel'; detalhe?: string }

const buscar = (url: string, metodo: 'GET' | 'HEAD' = 'GET') => fetch(url, { method: metodo, redirect: 'manual', cache: 'no-store', headers: { 'User-Agent': 'GrupoSRV-Validador/1.0' }, signal: AbortSignal.timeout(15_000) })

/**
 * Validação técnica do artigo já no ar (a página pública, como o Google vê): status 200, robots, canonical, H1,
 * dados estruturados, imagem de compartilhamento, sitemap, links e marcadores esquecidos.
 */
export async function validarPublicado(slug: string, canonicalEsperado: string, indexar: boolean): Promise<Verificacao[]> {
  const url = `${SITE}/blog/${slug}`
  const r: Verificacao[] = []
  const ok = (item: string, cond: boolean, detalhe?: string) => r.push({ item, situacao: cond ? 'aprovado' : 'corrigir', detalhe: cond ? undefined : detalhe })
  let html = ''
  try {
    const resp = await buscar(url)
    ok('Página responde 200 (pública, sem login)', resp.status === 200, `Respondeu ${resp.status}${resp.headers.get('location') ? ` → ${resp.headers.get('location')}` : ''}.`)
    html = resp.status === 200 ? await resp.text() : ''
  } catch (e) {
    r.push({ item: 'Página responde 200 (pública, sem login)', situacao: 'corrigir', detalhe: e instanceof Error ? e.message : 'Não respondeu.' })
    return r
  }
  if (!html) return r
  const meta = (nome: string) => html.match(new RegExp(`<meta[^>]+(?:name|property)="${nome}"[^>]+content="([^"]*)"`, 'i'))?.[1] ?? html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${nome}"`, 'i'))?.[1] ?? null
  const robots = meta('robots') ?? ''
  if (indexar) ok('Sem "noindex" por engano', !/noindex/i.test(robots), `robots = "${robots}"`)
  else r.push({ item: 'Marcado para não aparecer no Google (noindex)', situacao: /noindex/i.test(robots) ? 'aprovado' : 'corrigir', detalhe: `robots = "${robots}"` })
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ?? null
  ok('Canonical correto', canonical === canonicalEsperado, `Encontrado: ${canonical ?? 'nenhum'}; esperado: ${canonicalEsperado}`)
  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length
  ok('Um único H1', h1 === 1, `Encontrados ${h1}.`)
  const blocos = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) => m[1])
  let tipos: string[] = []
  try {
    tipos = blocos.flatMap((b) => {
      const j = JSON.parse(b) as { '@type'?: string; '@graph'?: { '@type'?: string }[] }
      return [j['@type'], ...(j['@graph'] ?? []).map((g) => g['@type'])].filter((t): t is string => !!t)
    })
    ok('Dados estruturados válidos (BlogPosting e BreadcrumbList)', tipos.includes('BlogPosting') && tipos.includes('BreadcrumbList'), `Tipos encontrados: ${tipos.join(', ') || 'nenhum'}.`)
  } catch {
    ok('Dados estruturados válidos (BlogPosting e BreadcrumbList)', false, 'JSON-LD com erro de sintaxe.')
  }
  const og = meta('og:image')
  if (og) {
    const img = await buscar(og, 'HEAD').catch(() => null)
    ok('Imagem de compartilhamento (og:image) abre', img?.status === 200, `og:image respondeu ${img?.status ?? 'erro'}.`)
  } else r.push({ item: 'Imagem de compartilhamento (og:image)', situacao: 'corrigir', detalhe: 'Sem capa: o artigo aparece sem imagem no WhatsApp e nas redes.' })
  ok('Título e descrição para redes (og:title, og:description)', !!meta('og:title') && !!meta('og:description'), 'Faltam metadados Open Graph.')
  ok('Atributo de idioma pt-BR', /<html[^>]+lang="pt-BR"/i.test(html), 'A página não declara lang="pt-BR".')
  if (indexar) {
    const mapa = await buscar(`${SITE}/sitemap.xml`).then((x) => x.text()).catch(() => '')
    ok('Está no mapa do site (sitemap.xml)', mapa.includes(`/blog/${slug}<`), 'O mapa do site é atualizado em até 10 minutos depois de publicar.')
  }
  const texto = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')
  ok('Sem marcadores esquecidos no texto publicado', !PLACEHOLDER.test(texto), 'Há texto como [inserir…], TODO ou SEU-DOMINIO na página.')
  const internos = [...new Set([...html.matchAll(/<a[^>]+href="(\/(?:blog\/[a-z0-9-]+|maquinadevendas|calculadora)[^"#]*)"/gi)].map((m) => m[1].split('?')[0]))].slice(0, 25)
  const quebrados: string[] = []
  await Promise.all(internos.map(async (l) => {
    const x = await buscar(`${SITE}${l}`, 'HEAD').catch(() => null)
    if (!x || x.status >= 400) quebrados.push(`${l} (${x?.status ?? 'erro'})`)
  }))
  ok(`Links internos funcionando (${internos.length} verificados)`, !quebrados.length, `Quebrados: ${quebrados.join(', ')}`)
  return r
}

/** Avisa o IndexNow (Bing, Yandex e outros) que a URL mudou. Só se houver INDEXNOW_KEY na Vercel. */
export async function avisarIndexNow(urls: string[]): Promise<void> {
  const chave = process.env.INDEXNOW_KEY?.trim()
  if (!chave || !urls.length) return
  await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE).host, key: chave, keyLocation: `${SITE}/blog/indexnow.txt`, urlList: urls }),
    signal: AbortSignal.timeout(10_000),
  }).catch((e) => console.error('IndexNow', e))
}
