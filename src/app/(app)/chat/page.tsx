import { redirect } from 'next/navigation'

/** /chat abre o canal geral. */
export default function Chat() {
  redirect('/chat/geral')
}
