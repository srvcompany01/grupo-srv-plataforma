import type { PapelUsuario } from './acesso'

const PAPEIS: readonly PapelUsuario[] = ['admin', 'gestor', 'membro', 'cliente']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type DadosConvite = {
  email: string
  nome: string
  papel: PapelUsuario
  clienteId?: string
  espacos: { id: string; papel: 'gestor' | 'membro' }[]
}

export function validarConvite(d: DadosConvite): { ok: true; dados: DadosConvite } | { ok: false; erro: string } {
  const email = d.email.trim().toLowerCase()
  const nome = d.nome.trim()
  if (!EMAIL.test(email)) return { ok: false, erro: 'Informe um e-mail válido.' }
  if (!nome) return { ok: false, erro: 'Informe o nome.' }
  if (!PAPEIS.includes(d.papel)) return { ok: false, erro: 'Papel inválido.' }
  if (d.papel === 'cliente') {
    if (!d.clienteId) return { ok: false, erro: 'Escolha o cliente deste usuário.' }
    if (d.espacos.length) return { ok: false, erro: 'Usuário de cliente não participa de departamentos.' }
  } else if (d.clienteId) {
    return { ok: false, erro: 'Só usuários de cliente são vinculados a um cliente.' }
  }
  return { ok: true, dados: { ...d, email, nome, clienteId: d.papel === 'cliente' ? d.clienteId : undefined } }
}

type PessoaOpcao = { id: string; nome: string; avatar: string | null }

/** Opções do seletor de responsáveis: a equipe ativa + responsáveis atuais que saíram (para poder removê-los). */
export function opcoesResponsaveis(equipe: PessoaOpcao[], atuais: PessoaOpcao[]): (PessoaOpcao & { inativo: boolean })[] {
  const ativos = new Set(equipe.map((p) => p.id))
  return [...equipe.map((p) => ({ ...p, inativo: false })), ...atuais.filter((p) => !ativos.has(p.id)).map((p) => ({ ...p, inativo: true }))]
}

/** Para onde ir depois de confirmar um link do e-mail. Sem parâmetro de destino: evita redirecionamento para fora. */
export function destinoAposConfirmar(tipo: string | null): string {
  return tipo === 'invite' || tipo === 'recovery' ? '/login/nova-senha' : '/'
}
