import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { ehRobo, origemDaBio, slugValido } from '@/dominio/bio'
import { lerQuizDaPagina, mensagemComRespostas, resolverRespostas, urlDoWhatsapp } from '@/dominio/bio-quiz'
import { criarClientePublico } from '@/infra/supabase/publico'
import { hashDoVisitante } from '../visitante'

const SEM_CACHE = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }

/**
 * Quiz da página da bio. `iniciar`: a pessoa tocou no botão do WhatsApp (conta o toque). `concluir`: respondeu a todas as
 * perguntas, conta um lead orgânico (uma vez por pessoa por dia) e só então recebe o link do WhatsApp, com as respostas
 * na mensagem. Robôs não contam e nunca recebem o número.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slugValido(slug)) return new Response(null, { status: 404 })
  const h = await headers()
  if (ehRobo(h.get('user-agent'))) return new Response(null, { status: 204 })
  const corpo = (await req.json().catch(() => ({}))) as { acao?: unknown; escolhas?: unknown; origem?: unknown }
  const sb = criarClientePublico()
  if (corpo.acao === 'iniciar') {
    await sb.rpc('bio_botao', { p_slug: slug, p_botao: 'whatsapp', p_contar: true })
    return new Response(null, { status: 204, headers: SEM_CACHE })
  }
  if (corpo.acao !== 'concluir') return new Response(null, { status: 400 })
  const { data: bruto } = await sb.rpc('bio_quiz_pagina', { p_slug: slug })
  const respostas = resolverRespostas(lerQuizDaPagina(bruto).perguntas, corpo.escolhas)
  if (!respostas) return NextResponse.json({ erro: 'Responda a todas as perguntas.' }, { status: 400, headers: SEM_CACHE })
  const origem = origemDaBio(typeof corpo.origem === 'string' ? corpo.origem : null)
  const { data, error } = await sb.rpc('bio_lead', { p_slug: slug, p_origem: origem, p_hash: hashDoVisitante(slug, h), p_respostas: respostas })
  if (error) {
    console.error('bio_lead', slug, error.code, error.message)
    return NextResponse.json({ erro: 'Não foi possível abrir o WhatsApp agora.', codigo: error.code }, { status: 500, headers: SEM_CACHE })
  }
  const d = data?.[0]
  if (!d?.whatsapp) {
    console.error('bio_lead sem WhatsApp', slug)
    return NextResponse.json({ erro: 'WhatsApp indisponível.', codigo: 'sem-whatsapp' }, { status: 404, headers: SEM_CACHE })
  }
  return NextResponse.json({ url: urlDoWhatsapp(d.whatsapp, mensagemComRespostas(d.mensagem ?? '', respostas)) }, { headers: SEM_CACHE })
}
