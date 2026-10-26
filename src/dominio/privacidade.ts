/**
 * Tira dados pessoais do texto antes de guardar ou mandar para a IA: e-mail, CNPJ, CPF, cartão e telefone. O nome da
 * pessoa nunca é guardado; este mascaramento cobre o que ela digita na conversa.
 */
const REGRAS: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[e-mail]'],
  [/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{14}\b/g, '[cnpj]'],
  [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[cpf]'],
  [/\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}\b|\b\d{16}\b/g, '[cartão]'],
  // Telefone brasileiro: +55, DDD opcional entre parênteses e 8 ou 9 dígitos com hífen ou espaço. Preço ("1.250,00") não casa.
  [/(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?9?\d{4}[\s.-]\d{4}\b/g, '[telefone]'],
  // 11 dígitos colados podem ser celular com DDD ou CPF: some de qualquer jeito.
  [/\b(?:\+?55)?\d{11}\b/g, '[cpf ou telefone]'],
]

export function mascararTexto(texto: string): string {
  return REGRAS.reduce((t, [re, troca]) => t.replace(re, troca), texto)
}
