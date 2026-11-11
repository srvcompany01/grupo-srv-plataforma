'use client'

import { formatarContaGoogleAds } from '@/dominio/google'
import { useActionState } from 'react'
import type { Resultado } from '@/servicos/acao'
import type { Cliente } from '@/servicos/clientes-plataforma'

type Acao = (estado: Resultado, form: FormData) => Promise<Resultado>

/** `embutido`: sem moldura própria (quando já está dentro de um módulo da página). */
export function FormCliente({ acao, cliente, podeEditar, embutido }: { acao: Acao; cliente?: Cliente; podeEditar: boolean; embutido?: boolean }) {
  const [estado, enviar, enviando] = useActionState(acao, null)
  const c = (rotuloCampo: string, nome: string, valor?: string | null, tipo = 'text') => (
    <label>
      <span>{rotuloCampo}</span>
      <input name={nome} type={tipo} defaultValue={valor ?? ''} disabled={!podeEditar} />
    </label>
  )
  return (
    <form action={enviar}>
      <div>
        {c('Nome', 'nome', cliente?.nome)}
        {c('Razão social', 'razaoSocial', cliente?.razaoSocial)}
        {c('CNPJ / CPF', 'documento', cliente?.documento)}
        {c('E-mail', 'email', cliente?.email, 'email')}
        <label>
          <span>Status</span>
          <select name="status" defaultValue={cliente?.status ?? 'ativo'} disabled={!podeEditar}>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </label>
      </div>
      <label>
        <span>Biblioteca de anúncios do Meta</span>
        <input name="metaPagina" defaultValue={cliente?.metaPaginaId ?? ''} disabled={!podeEditar} placeholder="Cole o link da Biblioteca de Anúncios do cliente ou o ID da página" />
        <span>Em facebook.com/ads/library, busque a página do cliente e copie o link (ele tem view_all_page_id=...).</span>
      </label>
      <label>
        <span>Conta de anúncios do Meta</span>
        <input name="metaConta" defaultValue={cliente?.metaContaId ? `act_${cliente.metaContaId}` : ''} disabled={!podeEditar} placeholder="act_123456789 ou o link do Gerenciador de Anúncios" />
        <span>Mostra os anúncios ativos com impressões, cliques, CTR e visualizações aqui e no portal do cliente. A conta precisa estar liberada para o usuário do sistema do Meta.</span>
      </label>
      <label>
        <span>WhatsApp do cliente</span>
        <input name="whatsapp" defaultValue={cliente?.whatsapp ?? ''} disabled={!podeEditar} placeholder="91 99999-9999" inputMode="tel" />
        <span>O número do próprio cliente, o contato dele com a agência. Para onde enviamos os relatórios.</span>
      </label>
      <label>
        <span>WhatsApp de atendimento</span>
        <input name="whatsappAtendimento" defaultValue={cliente?.whatsappAtendimento ?? ''} disabled={!podeEditar} placeholder="91 99999-9999" inputMode="tel" />
        <span>Onde chegam os leads do cliente (a equipe de atendimento dele). É o botão do WhatsApp da página da bio, com a mensagem pronta.</span>
      </label>
      <label>
        <span>Conta do Google Ads</span>
        <input name="googleAds" defaultValue={cliente?.googleAdsId ? formatarContaGoogleAds(cliente.googleAdsId) : ''} disabled={!podeEditar} placeholder="123-456-7890" />
        <span>O número que aparece no topo do Google Ads do cliente. A conta precisa estar ligada à MCC da agência.</span>
      </label>
      {estado?.erro && <p>{estado.erro}</p>}
      {estado?.ok && <p>{estado.ok}</p>}
      {podeEditar && (
        <button disabled={enviando}>
          {cliente ? 'Salvar' : 'Cadastrar cliente'}
        </button>
      )}
    </form>
  )
}
