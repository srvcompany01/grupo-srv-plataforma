import { ArrowLeft, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { exigirEquipe } from '@/infra/supabase/sessao'
import './novo.css'

/**
 * Moldura do design novo (/novo/…): uma barra lateral só, curta. As telas entram aqui uma a uma, reescritas do zero;
 * o que ainda não foi refeito continua na plataforma atual (link "Plataforma atual").
 */
export default async function LayoutNovo({ children }: { children: React.ReactNode }) {
  await exigirEquipe()
  return (
    <div className="nv">
      <nav className="nv-lado" aria-label="Menu">
        <div className="nv-marca"><i>SRV</i>Grupo SRV</div>
        <Link href="/novo/anuncios" className="nv-item" aria-current="page"><Megaphone aria-hidden="true" />Anúncios</Link>
        <span className="nv-secao">Em transição</span>
        <Link href="/home" className="nv-item"><ArrowLeft aria-hidden="true" />Plataforma atual</Link>
      </nav>
      <main className="nv-conteudo">{children}</main>
    </div>
  )
}
