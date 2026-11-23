import { AbasConfig } from './AbasConfig'
import s from './config.module.css'

export default function LayoutConfig({ children }: LayoutProps<'/config'>) {
  return (
    <div className={s.pagina}>
      <header className={s.cabecalho}>
        <p>Administração</p>
        <h1>Configurações</h1>
      </header>
      <AbasConfig />
      <div className={s.conteudo}>{children}</div>
    </div>
  )
}
