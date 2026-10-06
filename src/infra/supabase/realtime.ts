import WebSocket from 'ws'

/**
 * O supabase-js exige WebSocket nativo (Node 22+). No Node 20 (máquina local) passamos o `ws`.
 * Não usamos realtime; isto só evita que a criação do cliente quebre.
 */
export const opcoesRealtime = globalThis.WebSocket
  ? undefined
  : { transport: WebSocket as unknown as NonNullable<import('@supabase/supabase-js').SupabaseClientOptions<'public'>['realtime']>['transport'] }
