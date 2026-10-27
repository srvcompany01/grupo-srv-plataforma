import { Link2, Settings2 } from 'lucide-react'
import { Modulo } from '@/componentes/Modulo'
import { urlDaBio, type ResumoBio } from '@/dominio/bio'
import { urlLeitura } from '@/infra/r2'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { paginaBioDoCliente, perguntasDoCliente } from '@/servicos/bio'
import type { Cliente } from '@/servicos/clientes-plataforma'
import { linkBioDoCliente } from '@/servicos/performance'
import { LinkBio, QuizBio } from '../performance/Formularios'

/** Criar e configurar a página da bio do cliente: logo, mensagem, botões e os endereços para bio, stories e anúncios. */
export async function ConfigurarBio({ c, r }: { c: Cliente; r: ResumoBio | null }) {
  const sb = await criarClienteServidor()
  const [bio, pagina] = await Promise.all([linkBioDoCliente(sb, c.id), paginaBioDoCliente(sb, c.id)])
  const logo = pagina.logo ? await urlLeitura(pagina.logo).catch(() => null) : null
  return (
    <Modulo icone={Link2} titulo="Configurar a página" descricao="Página simples com a logo do cliente e os botões dele (sem a marca da agência): cada clique, visualização e toque são contados">
      <LinkBio
        clienteId={c.id}
        url={bio?.slug ? urlDaBio(bio.slug) : null}
        urls={bio?.slug ? [{ rotulo: 'Link da bio', url: urlDaBio(bio.slug) }, { rotulo: 'Stories', url: urlDaBio(bio.slug, 'story') }, { rotulo: 'Anúncios', url: urlDaBio(bio.slug, 'anuncio') }] : []}
        mensagem={bio?.mensagem ?? 'Olá! Vim pelo Instagram 😊'}
        whatsapp={bio?.whatsapp ?? null}
        logo={logo}
        links={pagina.links}
        resumo={{ porOrigem: (r?.porOrigem ?? []).map((o) => ({ origem: o.origem, cliques: o.cliques })), porBotao: (r?.botoes ?? []).filter((b) => b.toques > 0).map((b) => ({ botao: b.rotulo, cliques: b.toques })) }}
      />
    </Modulo>
  )
}

/** Perguntas do quiz do cliente. */
export async function ConfigurarQuiz({ c }: { c: Cliente }) {
  const perguntas = await perguntasDoCliente(await criarClienteServidor(), c.id)
  return (
    <Modulo icone={Settings2} titulo="Perguntas do quiz" descricao="O que a pessoa responde antes de o WhatsApp abrir">
      <QuizBio key={JSON.stringify(perguntas)} clienteId={c.id} perguntas={perguntas} />
    </Modulo>
  )
}
