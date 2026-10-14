/** Quem pode usar o assistente. Começa só com administradores; para liberar a equipe toda, acrescente 'gestor' e 'membro'. */
export const PAPEIS_DA_IA: readonly string[] = ['admin']
export const papelPodeUsarIA = (papel: string) => PAPEIS_DA_IA.includes(papel)
