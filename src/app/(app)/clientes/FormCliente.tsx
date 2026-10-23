'use client'

import { formatarContaGoogleAds } from '@/dominio/google'
import { useActionState } from 'react'
import { botaoPrimario, campo, rotulo } from '@/lib/ui'
import type { Resultado } from '@/servicos/acao'
import type { Cliente } from '@/servicos/clientes-plataforma'

type Acao = (estado: Resultado, form: FormData) => Promise<Resultado>

/** `embutido`: sem moldura própria (quando já está dentro de um módulo da página). */
export function FormCliente({ acao, cliente, podeEditar, embutido }: { acao: Acao; cliente?: Cliente; podeEditar: boolean; embutido?: boolean }) {
  const [estado, enviar, enviando] = useActionState(acao, null)
  const c = (rotuloCampo: string, nome: string, valor?: string | null, tipo = 'text') => (
    <label className="space-y-1">
      <span className={rotulo}>{rotuloCampo}</span>
      <input name={nome} type={tipo} defaultValue={valor ?? ''} disabled={!podeEditar} className={campo} />
    </label>
  )
  return (
    <form action={enviar} className={embutido ? 'space-y-3' : 'space-y-3 rounded-lg border border-borda bg-white p-4'}>
      <div className="grid gap-3 md:grid-cols-2">
        {c('Nome', 'nome', cliente?.nome)}
        {c('Razão social', 'razaoSocial', cliente?.razaoSocial)}
        {c('CNPJ / CPF', 'documento', cliente?.documento)}
        {c('E-mail', 'email', cliente?.email, 'email')}
        {c('Telefone', 'telefone', cliente?.telefone)}
        <label className="space-y-1">
          <span className={rotulo}>Status</span>
          <select name="status" defaultValue={cliente?.status ?? 'ativo'} disabled={!podeEditar} className={campo}>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </label>
      </div>
      <label className="block space-y-1">
        <span className={rotulo}>Biblioteca de anúncios do Meta</span>
        <input name="metaPagina" defaultValue={cliente?.metaPaginaId ?? ''} disabled={!podeEditar} className={campo} placeholder="Cole o link da Biblioteca de Anúncios do cliente ou o ID da página" />
        <span className="block text-legenda text-texto-3">Em facebook.com/ads/library, busque a página do cliente e copie o link (ele tem view_all_page_id=...).</span>
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Conta de anúncios do Meta</span>
        <input name="metaConta" defaultValue={cliente?.metaContaId ? `act_${cliente.metaContaId}` : ''} disabled={!podeEditar} className={campo} placeholder="act_123456789 ou o link do Gerenciador de Anúncios" />
        <span className="block text-legenda text-texto-3">Mostra os anúncios ativos com impressões, cliques, CTR e visualizações aqui e no portal do cliente. A conta precisa estar liberada para o usuário do sistema do Meta.</span>
      </label>
      <label className="block space-y-1">
        <span className={rotulo}>Conta do Google Ads</span>
        <input name="googleAds" defaultValue={cliente?.googleAdsId ? formatarContaGoogleAds(cliente.googleAdsId) : ''} disabled={!podeEditar} className={campo} placeholder="123-456-7890" />
        <span className="block text-legenda text-texto-3">O número que aparece no topo do Google Ads do cliente. A conta precisa estar ligada à MCC da agência.</span>
      </label>
      {estado?.erro && <p className="text-sm text-perigo">{estado.erro}</p>}
      {estado?.ok && <p className="text-sm text-sucesso-forte">{estado.ok}</p>}
      {podeEditar && (
        <button disabled={enviando} className={botaoPrimario}>
          {cliente ? 'Salvar' : 'Cadastrar cliente'}
        </button>
      )}
    </form>
  )
}
