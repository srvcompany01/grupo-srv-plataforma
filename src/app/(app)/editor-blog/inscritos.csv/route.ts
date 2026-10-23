import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { inscritos } from '@/servicos/blog'

const celula = (s: string) => `"${s.replace(/"/g, '""')}"`

/** Inscritos da newsletter em CSV (para importar na ferramenta de e-mail). */
export async function GET() {
  await exigirEquipe()
  const lista = await inscritos(await criarClienteServidor())
  const csv = ['nome,email,origem,inscrito_em', ...lista.map((i) => [i.nome, i.email, i.origem, i.em].map(celula).join(','))].join('\n')
  return new Response(`﻿${csv}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="inscritos-blog.csv"' } })
}
