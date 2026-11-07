/**
 * Estratégia do cliente: estudo de público, jornada de compra, posicionamento e marca, arquitetura de receita e SWOT.
 * Cada método é um documento por cliente (tabela client_strategy): textos e listas por chave, mais itens marcados
 * (checklist da jornada, arquétipos). O catálogo abaixo diz quais chaves existem; a tela, a página do cliente e o MCP usam o mesmo.
 */

export const METODOS = [
  { id: 'publico', rotulo: 'Estudo de público', curto: 'Público', icone: 'groups' },
  { id: 'jornada', rotulo: 'Jornada de compra', curto: 'Jornada', icone: 'route' },
  { id: 'posicionamento', rotulo: 'Posicionamento e marca', curto: 'Posicionamento', icone: 'diamond' },
  { id: 'receita', rotulo: 'Arquitetura de Receita', curto: 'Receita', icone: 'conversion_path' },
  { id: 'swot', rotulo: 'Análise SWOT', curto: 'SWOT', icone: 'grid_view' },
] as const

export type Metodo = (typeof METODOS)[number]['id']
export const ehMetodo = (x: unknown): x is Metodo => METODOS.some((m) => m.id === x)

export type DadosEstrategia = { textos: Record<string, string>; listas: Record<string, string[]>; marcados: string[] }
export const VAZIO: DadosEstrategia = { textos: {}, listas: {}, marcados: [] }

export type Campo = { chave: string; rotulo: string; tipo: 'texto' | 'lista'; ajuda?: string }

// ───────────────────────────── Estudo de público ─────────────────────────────

export const PERSONA: Campo[] = [
  { chave: 'persona.nome', rotulo: 'Nome da persona', tipo: 'texto' },
  { chave: 'persona.idade', rotulo: 'Idade', tipo: 'texto' },
  { chave: 'persona.genero', rotulo: 'Gênero', tipo: 'texto' },
  { chave: 'persona.local', rotulo: 'Onde mora', tipo: 'texto' },
  { chave: 'persona.profissao', rotulo: 'Profissão', tipo: 'texto' },
  { chave: 'persona.renda', rotulo: 'Renda / classe', tipo: 'texto' },
  { chave: 'persona.familia', rotulo: 'Família', tipo: 'texto' },
  { chave: 'persona.rotina', rotulo: 'Rotina e estilo de vida', tipo: 'texto', ajuda: 'Como é o dia dela, o que consome, do que gosta.' },
  { chave: 'persona.frase', rotulo: 'Uma frase que ela diria', tipo: 'texto' },
]

/** Mapa de empatia (Dave Gray / XPLANE): quatro quadrantes em volta da pessoa, mais dores e ganhos embaixo. */
export const EMPATIA: (Campo & { pergunta: string })[] = [
  { chave: 'empatia.pensa', rotulo: 'Pensa e sente', tipo: 'lista', pergunta: 'O que realmente importa para ela? Preocupações, sonhos, o que não fala em voz alta.' },
  { chave: 'empatia.ve', rotulo: 'Vê', tipo: 'lista', pergunta: 'O que vê no ambiente, nos amigos, no mercado e nas redes?' },
  { chave: 'empatia.ouve', rotulo: 'Ouve', tipo: 'lista', pergunta: 'O que dizem família, amigos, chefe e influenciadores?' },
  { chave: 'empatia.fala', rotulo: 'Fala e faz', tipo: 'lista', pergunta: 'Como age em público, aparência, o que diz aos outros.' },
  { chave: 'empatia.dores', rotulo: 'Dores', tipo: 'lista', pergunta: 'Medos, frustrações e obstáculos.' },
  { chave: 'empatia.ganhos', rotulo: 'Ganhos', tipo: 'lista', pergunta: 'Desejos, necessidades e como mede o sucesso.' },
]

export const PROBLEMAS: (Campo & { cor: string })[] = [
  { chave: 'dores', rotulo: 'Dores', tipo: 'lista', ajuda: 'O que incomoda no dia a dia.', cor: '#ef4444' },
  { chave: 'problemas', rotulo: 'Problemas', tipo: 'lista', ajuda: 'Situações concretas que precisam de solução.', cor: '#f97316' },
  { chave: 'desafios', rotulo: 'Desafios', tipo: 'lista', ajuda: 'O que tenta alcançar e não consegue sozinha.', cor: '#eab308' },
  { chave: 'medos', rotulo: 'Medos', tipo: 'lista', ajuda: 'O que tem receio que aconteça (inclusive ao comprar).', cor: '#a855f7' },
  { chave: 'desejos', rotulo: 'Desejos e sonhos', tipo: 'lista', ajuda: 'Onde quer chegar; a vida ideal.', cor: '#22c55e' },
  { chave: 'objecoes', rotulo: 'Objeções', tipo: 'lista', ajuda: 'Por que não compraria: preço, confiança, tempo…', cor: '#64748b' },
]

/** Jobs to be done (Christensen): o "trabalho" que a pessoa contrata o produto para fazer. */
export const JTBD: Campo[] = [
  { chave: 'jtbd.funcional', rotulo: 'Funcional', tipo: 'lista', ajuda: 'A tarefa prática a resolver.' },
  { chave: 'jtbd.emocional', rotulo: 'Emocional', tipo: 'lista', ajuda: 'Como quer se sentir.' },
  { chave: 'jtbd.social', rotulo: 'Social', tipo: 'lista', ajuda: 'Como quer ser visto pelos outros.' },
]

/** Níveis de consciência (Eugene Schwartz, Breakthrough Advertising). */
export const CONSCIENCIA = [
  { id: 'inconsciente', nome: 'Inconsciente', desc: 'Não sabe que tem o problema.', comunicar: 'Histórias e conteúdo que revelam o problema.' },
  { id: 'problema', nome: 'Consciente do problema', desc: 'Sente a dor, não conhece soluções.', comunicar: 'Nomear a dor e mostrar que tem saída.' },
  { id: 'solucao', nome: 'Consciente da solução', desc: 'Sabe que existem soluções, não conhece a sua.', comunicar: 'Mostrar o método e por que o seu é diferente.' },
  { id: 'produto', nome: 'Consciente do produto', desc: 'Conhece a marca, ainda não comprou.', comunicar: 'Provas, depoimentos, garantia e quebra de objeções.' },
  { id: 'total', nome: 'Totalmente consciente', desc: 'Já quer comprar; espera a condição certa.', comunicar: 'Oferta direta, urgência e facilidade.' },
] as const

export const PUBLICO_EXTRA: Campo[] = [
  { chave: 'consciencia', rotulo: 'Nível de consciência predominante', tipo: 'texto' },
  { chave: 'gatilhos', rotulo: 'Gatilhos de compra', tipo: 'lista', ajuda: 'O que faz decidir agora (data, evento, dor que aperta).' },
  { chave: 'canais', rotulo: 'Onde está', tipo: 'lista', ajuda: 'Redes, sites, lugares, influenciadores que segue.' },
  { chave: 'linguagem', rotulo: 'Como fala', tipo: 'lista', ajuda: 'Palavras e expressões que usa para descrever o problema.' },
]

// ───────────────────────────── Jornada de compra ─────────────────────────────

export const ETAPAS_JORNADA = [
  {
    id: 'descoberta', nome: 'Descoberta', impressao: 'Eu sei',
    representa: 'Exposição do consumidor à marca por anúncios e/ou recomendações de outras pessoas.',
    acontece: ['Sendo exposto a anúncios online', 'Descobrindo a marca por conteúdo gratuito', 'Recomendações de influenciadores', 'Recomendações de familiares e amigos'],
    influencia: ['Gerenciando os anúncios online', 'Fazendo parcerias com influenciadores relevantes no setor do cliente'],
    simples: ['Conjunto de anúncios de exploração focando em uma única oferta', 'Parcerias com pequenos influenciadores relevantes no setor do cliente'],
    complexo: ['Conjunto de anúncios de exploração para múltiplas ofertas, públicos e plataformas', 'Parcerias com influenciadores relevantes no setor do cliente', 'Criação e distribuição de conteúdo relevante para atrair audiência'],
  },
  {
    id: 'atracao', nome: 'Atração', impressao: 'Eu gosto',
    representa: 'Algumas marcas despertam o interesse do consumidor o suficiente para que ele dê atenção e lembre da marca.',
    acontece: ['Clicando em um anúncio para ir até um site de conteúdo, uma página de vendas, um formulário etc.'],
    influencia: ['Com design, copy e audiovisual chamativos', 'Direcionando o tráfego para as pessoas certas com mensagens alinhadas'],
    simples: ['Anúncios de produção enxuta: fotos e vídeos de celular, artes simples', 'Segmentando os anúncios dentro do que o orçamento permitir'],
    complexo: ['Anúncios de produção enxuta: fotos e vídeos de celular, artes simples', 'Anúncios de produção sofisticada com bom design, audiovisual e copywriting', 'Diferentes anúncios e páginas com personalizações para diferentes ofertas e grupos de consumidores'],
  },
  {
    id: 'consideracao', nome: 'Consideração', impressao: 'Quero saber mais',
    representa: 'Depois de ser atraído, algumas marcas passam pelo filtro e o consumidor pesquisa ativamente para obter mais informações sobre elas.',
    acontece: ['Falando com um time de vendas', 'Conversando com conhecidos', 'Pesquisando e perguntando em fóruns e comunidades', 'Testando o produto na loja'],
    influencia: ['Garantindo acessibilidade de informações sobre a oferta', 'Com um time disponível para tirar dúvidas', 'Com um bom FAQ acessível', 'Com uma boa área de depoimentos de clientes', 'Monitorando as avaliações online da empresa'],
    simples: ['Informações acessíveis sobre a oferta', 'Time (ainda que de uma pessoa) disponível para tirar dúvidas'],
    complexo: ['Informações acessíveis sobre a oferta', 'Time (ainda que de uma pessoa) disponível para tirar dúvidas', 'FAQ acessível e completo', 'Área de depoimentos de clientes', 'Serviço de sucesso do cliente para minimizar avaliações negativas'],
  },
  {
    id: 'acao', nome: 'Ação', impressao: 'Vou comprar',
    representa: 'O consumidor decide comprar e interage de forma mais profunda ao longo da experiência de consumo do produto ou serviço.',
    acontece: ['Comprando na loja física, no e-commerce ou delivery', 'Assinando o contrato do serviço', 'Consumindo o produto ou serviço'],
    influencia: ['Aprimorando e treinando o time comercial', 'Otimizando o checkout, as páginas de vendas e as mensagens de WhatsApp', 'Testando scripts de vendas diferentes', 'Com ofertas de downsell para quem não comprar a oferta principal'],
    simples: ['Estratégias "humanizadas" de conversão: venda 1 a 1 no WhatsApp, ligação ou visita'],
    complexo: ['Estratégias "humanizadas" de conversão: venda 1 a 1 no WhatsApp, ligação ou visita', 'Estratégias escaláveis de conversão: venda direto no checkout, venda por VSL', 'Treinamento de time comercial', 'Desenvolvimento de apresentações comerciais', 'Ofertas de cross-sell e upsell para elevar o valor médio de compra'],
  },
  {
    id: 'apologia', nome: 'Apologia', impressao: 'Eu recomendo',
    representa: 'Dependendo da experiência, o consumidor desenvolve fidelidade à empresa: retenção, recompra e defesa da marca.',
    acontece: ['Continuando a comprar o produto ou serviço', 'Mantendo a assinatura ativa', 'Recomendando a marca a outros consumidores'],
    influencia: ['Ajudando o cliente a criar uma experiência memorável para o consumidor', 'Aumentando a indicação ativa com incentivos'],
    simples: ['Programas de indicação ativa com incentivos'],
    complexo: ['Programas de indicação ativa com incentivos', 'Processo de "encantamento" pós-compra para criar uma experiência memorável'],
  },
] as const

export type NivelChecklist = 'simples' | 'complexo'
/** Id do item do checklist (padrão ou acrescentado): marcado = está em `marcados`. */
export const idDoCheck = (nivel: NivelChecklist, etapa: string, texto: string) => `${nivel}.${etapa}:${texto}`

// ───────────────────────────── Posicionamento e marca ─────────────────────────────

/** Círculo dourado (Simon Sinek): do porquê para o quê. */
export const CIRCULO: Campo[] = [
  { chave: 'circulo.porque', rotulo: 'Por quê', tipo: 'texto', ajuda: 'O propósito: por que a marca existe além de lucrar.' },
  { chave: 'circulo.como', rotulo: 'Como', tipo: 'texto', ajuda: 'O jeito único de entregar: método, processo, valores.' },
  { chave: 'circulo.oque', rotulo: 'O quê', tipo: 'texto', ajuda: 'Os produtos e serviços.' },
]

/** Declaração de posicionamento (modelo de Geoffrey Moore), lida como uma frase de lacunas. */
export const DECLARACAO: (Campo & { antes: string })[] = [
  { chave: 'pos.publico', rotulo: 'Público', tipo: 'texto', antes: 'Para' },
  { chave: 'pos.necessidade', rotulo: 'Necessidade', tipo: 'texto', antes: 'que' },
  { chave: 'pos.marca', rotulo: 'Marca', tipo: 'texto', antes: ',' },
  { chave: 'pos.categoria', rotulo: 'Categoria', tipo: 'texto', antes: 'é' },
  { chave: 'pos.beneficio', rotulo: 'Benefício principal', tipo: 'texto', antes: 'que' },
  { chave: 'pos.concorrente', rotulo: 'Alternativa / concorrente', tipo: 'texto', antes: '. Diferente de' },
  { chave: 'pos.diferencial', rotulo: 'Diferencial', tipo: 'texto', antes: ', nós' },
]

export const MARCA: Campo[] = [
  { chave: 'bigidea', rotulo: 'Big idea', tipo: 'texto', ajuda: 'A ideia central que conecta toda a comunicação, em uma frase.' },
  { chave: 'bigidea.explica', rotulo: 'Por que essa ideia', tipo: 'texto' },
  { chave: 'proposta', rotulo: 'Proposta de valor', tipo: 'texto', ajuda: 'O que o cliente ganha, para quem e por que só aqui.' },
  { chave: 'slogan', rotulo: 'Slogan / assinatura', tipo: 'texto' },
  { chave: 'manifesto', rotulo: 'Manifesto', tipo: 'texto', ajuda: 'Texto curto com a crença da marca, para inspirar time e público.' },
  { chave: 'valores', rotulo: 'Valores', tipo: 'lista' },
  { chave: 'personalidade', rotulo: 'Personalidade', tipo: 'lista', ajuda: 'Se a marca fosse uma pessoa: adjetivos.' },
  { chave: 'somos', rotulo: 'Somos', tipo: 'lista' },
  { chave: 'naosomos', rotulo: 'Não somos', tipo: 'lista' },
  { chave: 'pilares', rotulo: 'Pilares de comunicação', tipo: 'lista', ajuda: 'Os grandes temas sobre os quais a marca fala.' },
  { chave: 'mensagens', rotulo: 'Mensagens-chave', tipo: 'lista' },
  { chave: 'palavras.usar', rotulo: 'Palavras que usamos', tipo: 'lista' },
  { chave: 'palavras.evitar', rotulo: 'Palavras que evitamos', tipo: 'lista' },
  { chave: 'tom.exemplos', rotulo: 'Exemplos de frases no tom', tipo: 'lista' },
]

/** As 4 dimensões de tom de voz (Nielsen Norman Group): 0 = esquerda … 4 = direita. */
export const TOM = [
  { chave: 'tom.formal', esq: 'Formal', dir: 'Descontraído' },
  { chave: 'tom.serio', esq: 'Sério', dir: 'Divertido' },
  { chave: 'tom.respeitoso', esq: 'Respeitoso', dir: 'Irreverente' },
  { chave: 'tom.entusiasmado', esq: 'Entusiasmado', dir: 'Objetivo' },
] as const

/** Os 12 arquétipos de marca (Margaret Mark e Carol Pearson, a partir de Jung). Marcados em `arq.<id>` (até 2: principal e secundário). */
export const ARQUETIPOS = [
  { id: 'inocente', nome: 'Inocente', desc: 'Otimismo, simplicidade, pureza.' },
  { id: 'explorador', nome: 'Explorador', desc: 'Liberdade, descoberta, aventura.' },
  { id: 'sabio', nome: 'Sábio', desc: 'Conhecimento, verdade, análise.' },
  { id: 'heroi', nome: 'Herói', desc: 'Coragem, superação, conquista.' },
  { id: 'foradalei', nome: 'Fora da lei', desc: 'Ruptura, rebeldia, revolução.' },
  { id: 'mago', nome: 'Mago', desc: 'Transformação, sonhos realizados.' },
  { id: 'comum', nome: 'Pessoa comum', desc: 'Pertencimento, proximidade, honestidade.' },
  { id: 'amante', nome: 'Amante', desc: 'Prazer, beleza, intimidade.' },
  { id: 'bobo', nome: 'Bobo da corte', desc: 'Alegria, humor, leveza.' },
  { id: 'cuidador', nome: 'Cuidador', desc: 'Proteção, acolhimento, generosidade.' },
  { id: 'criador', nome: 'Criador', desc: 'Originalidade, imaginação, expressão.' },
  { id: 'governante', nome: 'Governante', desc: 'Controle, liderança, exclusividade.' },
] as const

// ───────────────────────────── Arquitetura de Receita ─────────────────────────────

/** Modelo "bowtie" (Jacco van der Kooij / Winning by Design, Revenue Architecture): aquisição à esquerda, o fechamento no nó, expansão à direita. */
export const ETAPAS_RECEITA = [
  { id: 'consciencia', nome: 'Consciência', original: 'Awareness', lado: 'aquisicao', resp: 'Marketing', desc: 'O público percebe o problema e conhece a marca.', conta: 'Alcance, visitantes' },
  { id: 'educacao', nome: 'Educação', original: 'Education', lado: 'aquisicao', resp: 'Marketing', desc: 'Aprende sobre a solução e vira lead.', conta: 'Leads' },
  { id: 'selecao', nome: 'Seleção', original: 'Selection', lado: 'aquisicao', resp: 'Vendas', desc: 'Compara opções; vira oportunidade ou proposta.', conta: 'Oportunidades, propostas' },
  { id: 'compromisso', nome: 'Compromisso', original: 'Commit', lado: 'centro', resp: 'Vendas', desc: 'Fecha a compra: o nó da gravata.', conta: 'Clientes novos' },
  { id: 'onboarding', nome: 'Onboarding', original: 'Onboarding', lado: 'expansao', resp: 'Sucesso do cliente', desc: 'Primeira experiência e primeiro resultado.', conta: 'Clientes ativados' },
  { id: 'impacto', nome: 'Impacto', original: 'Impact', lado: 'expansao', resp: 'Sucesso do cliente', desc: 'Percebe o valor de forma recorrente: fica e recompra.', conta: 'Clientes retidos' },
  { id: 'expansao', nome: 'Expansão', original: 'Growth', lado: 'expansao', resp: 'Sucesso do cliente', desc: 'Compra mais (upsell, cross-sell) e indica.', conta: 'Clientes que expandem' },
] as const

export const CAMPOS_ETAPA_RECEITA = [
  { sufixo: 'volume', rotulo: 'Volume', ajuda: 'Quantos chegam nesta etapa por mês.' },
  { sufixo: 'conversao', rotulo: 'Conversão para a próxima (%)', ajuda: '' },
  { sufixo: 'tempo', rotulo: 'Tempo médio na etapa', ajuda: 'Ex.: 3 dias.' },
] as const

export const NUMEROS_RECEITA: Campo[] = [
  { chave: 'num.ticket', rotulo: 'Ticket médio (R$)', tipo: 'texto' },
  { chave: 'num.cac', rotulo: 'CAC: custo para adquirir um cliente (R$)', tipo: 'texto' },
  { chave: 'num.ltv', rotulo: 'LTV: quanto um cliente deixa no total (R$)', tipo: 'texto' },
  { chave: 'num.churn', rotulo: 'Churn mensal (%)', tipo: 'texto' },
  { chave: 'num.recorrente', rotulo: 'Receita recorrente por mês (R$)', tipo: 'texto' },
  { chave: 'num.meta', rotulo: 'Meta de receita por mês (R$)', tipo: 'texto' },
]

/** Número digitado em pt-BR ("R$ 1.234,50", "12%") → número; vazio ou inválido = null. */
export function numero(t: string | undefined): number | null {
  const limpo = (t ?? '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  if (!limpo) return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

// ───────────────────────────── SWOT ─────────────────────────────

export const SWOT = [
  { chave: 'swot.forcas', rotulo: 'Forças', letra: 'S', ajuda: 'Interno · ajuda: o que fazemos bem, recursos, diferenciais.', cor: '#22c55e' },
  { chave: 'swot.fraquezas', rotulo: 'Fraquezas', letra: 'W', ajuda: 'Interno · atrapalha: o que falta, onde perdemos.', cor: '#ef4444' },
  { chave: 'swot.oportunidades', rotulo: 'Oportunidades', letra: 'O', ajuda: 'Externo · ajuda: tendências, mercado, brechas dos concorrentes.', cor: '#3b82f6' },
  { chave: 'swot.ameacas', rotulo: 'Ameaças', letra: 'T', ajuda: 'Externo · atrapalha: concorrência, crise, mudanças de regra.', cor: '#f59e0b' },
] as const

/** Matriz cruzada (TOWS): transforma o SWOT em ações. */
export const TOWS = [
  { chave: 'tows.fo', rotulo: 'Forças × Oportunidades', ajuda: 'Usar as forças para aproveitar as oportunidades (ofensiva).' },
  { chave: 'tows.fa', rotulo: 'Forças × Ameaças', ajuda: 'Usar as forças para se defender das ameaças (confronto).' },
  { chave: 'tows.fro', rotulo: 'Fraquezas × Oportunidades', ajuda: 'Corrigir fraquezas para aproveitar oportunidades (reforço).' },
  { chave: 'tows.fra', rotulo: 'Fraquezas × Ameaças', ajuda: 'Reduzir fraquezas que as ameaças exploram (defensiva).' },
] as const

// ───────────────────────────── Catálogo ─────────────────────────────

const lista = (chave: string, rotulo: string, ajuda?: string): Campo => ({ chave, rotulo, tipo: 'lista', ajuda })
const texto = (chave: string, rotulo: string, ajuda?: string): Campo => ({ chave, rotulo, tipo: 'texto', ajuda })

/** Todas as chaves de cada método (o que conta no preenchimento e o que o MCP aceita). */
export const CAMPOS: Record<Metodo, Campo[]> = {
  publico: [...PERSONA, ...EMPATIA, ...PROBLEMAS, ...JTBD, ...PUBLICO_EXTRA],
  jornada: ETAPAS_JORNADA.flatMap((e, i) => [
    lista(`acontece.${e.id}`, `${e.nome} · como acontece`),
    lista(`influencia.${e.id}`, `${e.nome} · como você influencia`),
    lista(`extra.simples.${e.id}`, `${e.nome} · itens a mais no checklist simples`),
    lista(`extra.complexo.${e.id}`, `${e.nome} · itens a mais no checklist complexo`),
    ...(i < ETAPAS_JORNADA.length - 1 ? [texto(`conv.${e.id}`, `Conversão de "${e.impressao}" para "${ETAPAS_JORNADA[i + 1].impressao}" (%)`)] : []),
  ]),
  posicionamento: [...CIRCULO, ...DECLARACAO, ...MARCA, ...TOM.map((t) => texto(t.chave, `Tom: ${t.esq} (0) ↔ ${t.dir} (4)`))],
  receita: [
    ...ETAPAS_RECEITA.flatMap((e) => [...CAMPOS_ETAPA_RECEITA.map((c) => texto(`${c.sufixo}.${e.id}`, `${e.nome} · ${c.rotulo}`)), lista(`acoes.${e.id}`, `${e.nome} · ações`)]),
    ...NUMEROS_RECEITA,
  ],
  swot: [...SWOT.map((s) => lista(s.chave, s.rotulo, s.ajuda)), ...TOWS.map((t) => lista(t.chave, t.rotulo, t.ajuda))],
}

/** Campos que contam no "% preenchido" (os acréscimos de checklist são opcionais). */
const contaNoPreenchimento = (c: Campo) => !c.chave.startsWith('extra.')

const CHAVE = /^[a-z0-9_.]{1,60}$/
const LIMITE_TEXTO = 4000
const LIMITE_ITEM = 500
const LIMITE_ITENS = 60

/** Limpa o que veio do navegador, do banco ou da IA: só chaves válidas, textos aparados, sem vazios, com limites. */
export function normalizar(x: unknown): DadosEstrategia {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
  const textos: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj(o.textos))) {
    const t = typeof v === 'string' ? v.trim().slice(0, LIMITE_TEXTO) : ''
    if (CHAVE.test(k) && t) textos[k] = t
  }
  const listas: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(obj(o.listas))) {
    const itens = (Array.isArray(v) ? v : []).filter((i): i is string => typeof i === 'string').map((i) => i.trim().slice(0, LIMITE_ITEM)).filter(Boolean).slice(0, LIMITE_ITENS)
    if (CHAVE.test(k) && itens.length) listas[k] = itens
  }
  const marcados = [...new Set((Array.isArray(o.marcados) ? o.marcados : []).filter((i): i is string => typeof i === 'string' && i.length > 0 && i.length <= 600))].slice(0, 400)
  return { textos, listas, marcados }
}

/** Junta uma alteração parcial ao documento (só as chaves enviadas mudam; texto vazio ou lista vazia apaga a chave). */
export function mesclar(atual: DadosEstrategia, parcial: Partial<DadosEstrategia>): DadosEstrategia {
  return normalizar({ textos: { ...atual.textos, ...parcial.textos }, listas: { ...atual.listas, ...parcial.listas }, marcados: parcial.marcados ?? atual.marcados })
}

/** Chaves enviadas que não existem no método (para avisar a IA). */
export const chavesInvalidas = (metodo: Metodo, chaves: string[]) => {
  const validas = new Set(CAMPOS[metodo].map((c) => c.chave))
  return chaves.filter((k) => !validas.has(k))
}

/** Fração (0–1) dos campos do método que têm alguma coisa. */
export function preenchimento(metodo: Metodo, d: DadosEstrategia): number {
  const campos = CAMPOS[metodo].filter(contaNoPreenchimento)
  const cheios = campos.filter((c) => (c.tipo === 'texto' ? !!d.textos[c.chave] : !!d.listas[c.chave]?.length)).length
  return campos.length ? cheios / campos.length : 0
}
