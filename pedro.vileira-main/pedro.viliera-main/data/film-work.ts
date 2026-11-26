// ✏️ PEDRO — TODO O CONTEÚDO DA SEÇÃO "FILM WORK" FICA AQUI (textos, vídeos, funções, ferramentas e créditos).
// 🎬 Vídeos: coloque os arquivos em /public/videos/film-work/ (01.mp4 ... 05.mp4). Enquanto o arquivo não existir,
//    o site mostra um espaço reservado ("placeholder") no lugar — nada quebra.
export type FilmProject = {
  brand: string;        // ✏️ nome da empresa ou marca
  description: string;  // ✏️ breve descrição do projeto
  role: string;         // ✏️ sua função na produção
  tools: string;        // ✏️ ferramentas utilizadas
  credits: string;      // ✏️ créditos do cliente e da produção (use " / " para separar linhas)
  video: string;        // 🎬 caminho do vídeo (.mp4 / .webm), a partir de /public
  poster?: string;      // 🖼️ (opcional) imagem exibida antes do vídeo carregar
};

export const filmWork = {
  // ✏️ Texto de apresentação no topo da seção
  overviewLabel: 'OVERVIEW',
  overview:
    'Sou filmmaker e crio captações e produções audiovisuais para empresas e marcas. [Escreva aqui uma breve descrição do seu trabalho: estilo de imagem, tipos de projeto, como você conduz a produção.]',

  // ✏️ Rótulos dos campos (mude se quiser outro idioma)
  labels: { role: 'Role', tools: 'Tools', credits: 'Client Credits' },

  // 🎬 O carrossel usa os mesmos 5 vídeos dos projetos abaixo, na mesma ordem.
  // ⚡ Velocidade do carrossel (segundos para completar uma volta). Maior = mais lento.
  carouselSeconds: 60,

  // ✏️ A ordem aqui é a ordem na página. Projetos 01, 03, 05: texto à esquerda · 02, 04: vídeo à esquerda.
  projects: [
    { brand: 'Nome da Marca 01', description: 'Breve descrição do projeto 01: o que foi produzido, para quem e com qual objetivo.', role: 'Direção, captação e edição', tools: 'Black Magic Camera, DaVinci Resolve, CapCut', credits: 'Cliente: Nome do cliente / Produção: Pedro Vileira', video: '/videos/film-work/01.mp4', poster: '/videos/film-work/01.jpg' },
    { brand: 'Nome da Marca 02', description: 'Breve descrição do projeto 02: o que foi produzido, para quem e com qual objetivo.', role: 'Captação e edição', tools: 'Black Magic Camera, DaVinci Resolve', credits: 'Cliente: Nome do cliente / Produção: Pedro Vileira', video: '/videos/film-work/02.mp4', poster: '/videos/film-work/02.jpg' },
    { brand: 'Nome da Marca 03', description: 'Breve descrição do projeto 03: o que foi produzido, para quem e com qual objetivo.', role: 'Direção e edição', tools: 'Black Magic Camera, CapCut', credits: 'Cliente: Nome do cliente / Produção: Pedro Vileira', video: '/videos/film-work/03.mp4', poster: '/videos/film-work/03.jpg' },
    { brand: 'Nome da Marca 04', description: 'Breve descrição do projeto 04: o que foi produzido, para quem e com qual objetivo.', role: 'Captação, edição e color', tools: 'Black Magic Camera, DaVinci Resolve', credits: 'Cliente: Nome do cliente / Produção: Pedro Vileira', video: '/videos/film-work/04.mp4', poster: '/videos/film-work/04.jpg' },
    { brand: 'Nome da Marca 05', description: 'Breve descrição do projeto 05: o que foi produzido, para quem e com qual objetivo.', role: 'Direção, captação e edição', tools: 'Black Magic Camera, DaVinci Resolve, After Effects', credits: 'Cliente: Nome do cliente / Produção: Pedro Vileira', video: '/videos/film-work/05.mp4', poster: '/videos/film-work/05.jpg' },
  ] as FilmProject[],
};
