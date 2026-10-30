import type { SlugRede } from '@/dominio/redes-sociais'

/** Logos desenhados em SVG (ladrilho quadrado com cantos leves), no tamanho pedido. */
export function LogoRede({ slug, tamanho = 20 }: { slug: SlugRede; tamanho?: number }) {
  const t = { width: tamanho, height: tamanho, viewBox: '0 0 24 24', 'aria-hidden': true, style: { flex: 'none', borderRadius: Math.round(tamanho * 0.22) } } as const
  switch (slug) {
    case 'instagram':
      return (
        <svg {...t}>
          <defs><linearGradient id="ig-g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#feda75" /><stop offset=".35" stopColor="#fa7e1e" /><stop offset=".6" stopColor="#d62976" /><stop offset=".85" stopColor="#962fbf" /><stop offset="1" stopColor="#4f5bd5" /></linearGradient></defs>
          <rect width="24" height="24" fill="url(#ig-g)" />
          <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" strokeWidth="1.7" />
          <circle cx="16.1" cy="7.9" r="1" fill="#fff" />
        </svg>
      )
    case 'x':
      return (
        <svg {...t}>
          <rect width="24" height="24" fill="#111" />
          <path d="M6 5.5h3.3l3.1 4.3 3.7-4.3h1.9l-4.7 5.5 5.2 7.5h-3.3l-3.4-4.8-4.1 4.8H6.8l5.2-6z" fill="#fff" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...t}>
          <rect width="24" height="24" fill="#0a66c2" />
          <rect x="5.3" y="9.5" width="2.6" height="8.2" fill="#fff" />
          <circle cx="6.6" cy="6.6" r="1.6" fill="#fff" />
          <path d="M10.2 9.5h2.5v1.2c.5-.9 1.6-1.4 2.8-1.4 2.2 0 3.2 1.4 3.2 3.7v4.7h-2.6v-4.2c0-1.1-.4-1.8-1.4-1.8-1.1 0-1.9.8-1.9 2v4h-2.6z" fill="#fff" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...t}>
          <rect width="24" height="24" fill="#ff0000" />
          <path d="M10 8.2v7.6l6.4-3.8z" fill="#fff" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg {...t}>
          <rect width="24" height="24" fill="#111" />
          <path d="M13.2 5h2.3c.2 1.6 1.2 2.7 2.8 2.9v2.3c-1 0-2-.3-2.8-.9v4.7a4.3 4.3 0 1 1-4.3-4.3c.2 0 .4 0 .6.1v2.4a1.9 1.9 0 1 0 1.4 1.8z" fill="#25f4ee" transform="translate(-.5 -.4)" />
          <path d="M13.2 5h2.3c.2 1.6 1.2 2.7 2.8 2.9v2.3c-1 0-2-.3-2.8-.9v4.7a4.3 4.3 0 1 1-4.3-4.3c.2 0 .4 0 .6.1v2.4a1.9 1.9 0 1 0 1.4 1.8z" fill="#fe2c55" transform="translate(.5 .4)" />
          <path d="M13.2 5h2.3c.2 1.6 1.2 2.7 2.8 2.9v2.3c-1 0-2-.3-2.8-.9v4.7a4.3 4.3 0 1 1-4.3-4.3c.2 0 .4 0 .6.1v2.4a1.9 1.9 0 1 0 1.4 1.8z" fill="#fff" />
        </svg>
      )
    case 'pinterest':
      return (
        <svg {...t}>
          <rect width="24" height="24" fill="#e60023" />
          <path d="M12.3 5.2c-3.3 0-5 2.2-5 4.4 0 1.3.7 2.5 1.8 2.9.2.1.3 0 .4-.2l.2-.7c0-.2 0-.3-.1-.5-.4-.5-.6-1-.6-1.8 0-1.6 1.2-3 3.2-3 1.7 0 2.7 1 2.7 2.5 0 1.9-.8 3.4-2.1 3.4-.7 0-1.2-.6-1-1.3.2-.8.6-1.7.6-2.3 0-.5-.3-1-.9-1-.7 0-1.3.7-1.3 1.7 0 .6.2 1 .2 1l-.9 3.8c-.2.9 0 2 0 2.1 0 .1.1.1.2 0 .1-.1 1-1.4 1.3-2.4l.5-2c.3.5 1 .9 1.8.9 2.3 0 3.8-2.1 3.8-4.9 0-2.1-1.8-4.1-4.5-4.1z" fill="#fff" />
        </svg>
      )
    case 'gmn':
      return (
        <svg {...t}>
          <rect width="24" height="24" fill="#fff" stroke="#dadce0" strokeWidth="1" />
          <path d="M12 4.5a5.2 5.2 0 0 0-5.2 5.2c0 3.6 5.2 9.8 5.2 9.8s5.2-6.2 5.2-9.8A5.2 5.2 0 0 0 12 4.5z" fill="#ea4335" />
          <path d="M12 4.5a5.2 5.2 0 0 0-3.7 1.5l3.7 4.3z" fill="#4285f4" />
          <path d="M8.3 6a5.2 5.2 0 0 0-1.5 3.7c0 .8.3 1.7.7 2.5L12 10.3z" fill="#fbbc04" />
          <circle cx="12" cy="9.7" r="2" fill="#fff" />
        </svg>
      )
    case 'blog':
      return (
        <svg {...t}>
          <rect width="24" height="24" fill="#18181b" />
          <rect x="6" y="5.8" width="12" height="2.2" rx=".8" fill="#fff" />
          <rect x="6" y="10.2" width="12" height="1.6" rx=".8" fill="#a1a1aa" />
          <rect x="6" y="13.4" width="12" height="1.6" rx=".8" fill="#a1a1aa" />
          <rect x="6" y="16.6" width="7.5" height="1.6" rx=".8" fill="#a1a1aa" />
        </svg>
      )
  }
}
