import type { Instrumentation } from 'next'

/** Erro no servidor (página, rota de API, ação ou proxy) em produção vira aviso no sino dos admins. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_RUNTIME === 'edge') return
  try {
    const mensagem = err instanceof Error ? err.message : String(err)
    const digest = typeof err === 'object' && err !== null && 'digest' in err ? String(err.digest) : undefined
    const { avisarErro } = await import('@/servicos/avisos-admin')
    await avisarErro(mensagem, request.path, context.routeType, digest)
  } catch (e) {
    console.error('Aviso de erro', e)
  }
}
