import { Sparkles } from 'lucide-react'
import { CopiarTexto } from '@/componentes/CopiarTexto'
import { Modulo } from '@/componentes/Modulo'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarTokens } from '@/servicos/api-tokens'
import { GerenciarTokens } from './GerenciarTokens'

export default async function Integracoes() {
  await exigirAdmin()
  const tokens = await listarTokens(await criarClienteServidor())
  const urlMcp = `${process.env.NEXT_PUBLIC_URL_BASE ?? 'https://app.gruposrv.com.br'}/api/mcp`
  return (
    <div className="space-y-4">
      <Modulo icone={Sparkles} titulo="App do Claude (claude.ai, desktop e celular)" descricao="Conecte uma vez e peça ao Claude para monitorar e criar anúncios, tarefas e posts pela plataforma">
        <div className="space-y-2 text-rotulo">
          <ol className="list-decimal space-y-1 pl-5 text-texto-2">
            <li>No Claude: <strong>Configurações → Conectores → Adicionar conector personalizado</strong>.</li>
            <li>Nome: <strong>Plataforma Grupo SRV</strong>. URL do servidor remoto:</li>
          </ol>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-borda bg-fundo px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-semibold">{urlMcp}</code>
            <CopiarTexto texto={urlMcp} rotulo="Copiar URL" />
          </div>
          <ol start={3} className="list-decimal space-y-1 pl-5 text-texto-2">
            <li>Clique em <strong>Conectar</strong>: abre a plataforma, você entra e clica em <strong>Autorizar</strong>.</li>
            <li>Numa conversa, ative o conector no menu de ferramentas e comece por &quot;descreva a plataforma&quot;.</li>
          </ol>
          <p className="text-legenda text-texto-3">Cada pessoa conecta com a própria conta e o Claude age com as permissões dela. A conexão aparece abaixo como token &quot;App do Claude&quot; e pode ser revogada a qualquer momento.</p>
        </div>
      </Modulo>
      <GerenciarTokens tokens={tokens} urlMcp={urlMcp} />
    </div>
  )
}
