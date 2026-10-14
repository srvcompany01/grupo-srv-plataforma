import { NextResponse } from 'next/server'
import { dataDeHoje } from '@/dominio/filtros'
import { conversar, type Mensagem } from '@/ia/agente'
import { chamarProvedor, configIA } from '@/ia/modelo'
import { papelPodeUsarIA } from '@/ia/acesso'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'

export const maxDuration = 60

/** Assistente da plataforma (Fase 1: só consulta). Age como a pessoa logada: a RLS decide o que ela vê. */
export async function POST(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || !papelPodeUsarIA(eu.papel)) return NextResponse.json({ erro: 'Sem acesso.' }, { status: 403 })
  const config = configIA()
  if (!config) return NextResponse.json({ erro: 'A IA ainda não foi configurada (falta a chave IA_API_KEY).' }, { status: 503 })

  const corpo = (await req.json().catch(() => null)) as { mensagens?: Mensagem[]; caminho?: string } | null
  const mensagens = (corpo?.mensagens ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
  if (mensagens.length === 0 || mensagens.at(-1)?.role !== 'user') return NextResponse.json({ erro: 'Escreva uma pergunta.' }, { status: 400 })

  try {
    const resposta = await conversar({
      mensagens,
      ctx: { sb: await criarClienteServidor(), userId: eu.id, nome: eu.nome, papel: eu.papel, escopo: 'read' },
      caminho: String(corpo?.caminho ?? '/').slice(0, 200),
      hoje: dataDeHoje(new Date()),
      chamar: chamarProvedor(config),
    })
    return NextResponse.json({ resposta })
  } catch (e) {
    console.error('IA', e)
    return NextResponse.json({ erro: e instanceof Error ? e.message : 'Não foi possível consultar a IA.' }, { status: 502 })
  }
}
