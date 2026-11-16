/** A mesma hora de Belém usada nos indicadores, sem trocar a saudação após a página aparecer. */
export function BoasVindas({ nome, agora }: { nome: string; agora: string }) {
  const hora = Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Belem' }).format(new Date(agora))) % 24
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  return <h1 className="hm-boas">{saudacao}, {nome.trim().split(/\s+/)[0]}<span>.</span></h1>
}
