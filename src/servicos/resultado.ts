/** Extrai `data` de uma resposta do Supabase, lançando o erro se houver. */
export function dados<T>(r: { data: T | null; error: unknown }): T {
  if (r.error) throw r.error
  return r.data as T
}
