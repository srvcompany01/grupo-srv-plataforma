/**
 * Convida o primeiro administrador.
 * Uso: npm run criar-admin -- <email> "<nome>"
 * O link do e-mail leva a NEXT_PUBLIC_URL_BASE (ou http://localhost:3000) para definir a senha.
 */
import { createClient } from '@supabase/supabase-js'

async function main() {
  const [email, nome] = process.argv.slice(2)
  if (!email || !nome) {
    console.error('Uso: npm run criar-admin -- <email> "<nome>"')
    process.exit(1)
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const base = process.env.NEXT_PUBLIC_URL_BASE ?? 'http://localhost:3000'
  const { data, error } = await sb.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
    data: { full_name: nome },
    redirectTo: `${base}/auth/confirmar`,
  })
  if (error || !data.user) {
    console.error('Falha ao convidar:', error?.message)
    process.exit(1)
  }
  const { error: erroPerfil } = await sb
    .from('profiles')
    .update({ role: 'admin', active: true, full_name: nome })
    .eq('id', data.user.id)
  if (erroPerfil) {
    console.error('Usuário criado, mas falhou ao definir como admin:', erroPerfil.message)
    process.exit(1)
  }
  console.log(`Convite enviado para ${email}. Abra o e-mail para definir a senha.`)
}

main()
