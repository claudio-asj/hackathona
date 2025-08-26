// cria os tipos de grupos nessa tag

export interface SocialLink {
  type:
    | "instagram"
  url: string;
  label?: string;
}

export interface GroupMember {
  id: string;
  name: string;
  role?: string;
  avatar: string;
  description: string;
  socials?: SocialLink[];
}

export interface GroupTeamSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  members: GroupMember[];
  className?: string;
}

export type SupportLink = {
  title: string;
  url: string;
  category:
    | "direitos"
    | "saude"
    | "educacao"
    | "emprego"
    | "comunidade"
    | "documentacao"
    | "outros";
  description?: string;
};

export type ExternalChannel = {
  type:
    | "instagram"
    | "whatsapp"
    | "telegram"
    | "twitter"
    | "tiktok"
    | "discord";
  url: string;
  label?: string;
};

export type SupportGroup = {
  id: string;
  name: string;
  labelPublico?: string;
  mission: string;
  focusAreas: string[];
  challenges: string[];
  resources: SupportLink[];
  channels?: ExternalChannel[];
  supportActions: string[];
  tags: string[];
  image?: string;
  icon?: string;
  stats?: {
    membersEstimated?: number;
    resourcesCount?: number;
    engagementsThisMonth?: number;
  };
  disclaimer?: string;
  priority?: "alta" | "media" | "baixa";
};

// Definição do objeto TAGS que estava faltando
export const TAGS = {
  MULHERES: "mulheres",
  GENERO: "genero",
  MENTORIA: "mentoria",
  LIDERANCA: "lideranca",
  ACESSIBILIDADE: "acessibilidade",
  INCLUSAO: "inclusao",
  PCD: "pcd",
  DIVERSIDADE: "diversidade",
  LGBTQIA: "lgbtqia",
  SEGURANCA: "seguranca",
  EQUIDADE: "equidade",
  REPRESENTATIVIDADE: "representatividade",
  ANTIRRACISMO: "antirracismo",
} as const;

export const supportGroups: SupportGroup[] = [
  {
    id: "pcd",
    name: "PCD",
    labelPublico: "Pessoas com Deficiência (PCD)",
    mission: "Promover acessibilidade e autonomia em deslocamentos urbanos.",
    focusAreas: [
      "acessibilidade digital",
      "tecnologia assistiva",
      "empregabilidade",
    ],
    challenges: [
      "falta de veículos adaptados",
      "rotas inseguras",
      "barreiras de comunicação",
    ],
    resources: [
      {
        title: "Guia WCAG",
        url: "https://www.w3.org/WAI/standards-guidelines/wcag/",
        category: "educacao",
      },
    ],
    supportActions: [
      "Listar caronas com veículo adaptado",
      "Mentoria sobre inclusão",
      "Checklist de acessibilidade",
    ],
    tags: [TAGS.ACESSIBILIDADE, TAGS.INCLUSAO, TAGS.PCD],
    icon: "🦾",
    stats: {
      membersEstimated: 1200,
      resourcesCount: 12,
      engagementsThisMonth: 210,
    },
    disclaimer: "Cada deficiência demanda abordagem diferente.",
    priority: "alta",
  },
  {
    id: "lgbtqia",
    name: "LGBTQIA+",
    mission: "Garantir segurança e respeito durante deslocamentos.",
    focusAreas: ["seguranca psicológica", "rede de apoio"],
    challenges: ["microagressões", "exposição sem consentimento"],
    resources: [
      {
        title: "Organização ANTRA",
        url: "https://antrabrasil.org/",
        category: "direitos",
      },
    ],
    supportActions: [
      "Filtro de caronas seguras",
      "Orientações anti-discriminação",
      "Sessões de escuta",
    ],
    tags: [TAGS.DIVERSIDADE, TAGS.LGBTQIA, TAGS.SEGURANCA],
    icon: "🏳️‍🌈",
    stats: {
      membersEstimated: 950,
      resourcesCount: 6,
      engagementsThisMonth: 180,
    },
    disclaimer: "Nunca revele identidade de outra pessoa sem consentimento.",
    priority: "alta",
  },
  {
    id: "afro",
    name: "Afrodescendentes",
    mission:
      "Impulsionar equidade e representatividade em mobilidade e tecnologia.",
    focusAreas: ["equidade racial", "mentoria", "liderança"],
    challenges: ["sub-representação", "viés em avaliações"],
    resources: [
      {
        title: "AfroPython",
        url: "https://afropython.org/",
        category: "educacao",
      },
    ],
    supportActions: [
      "Mentorias de carreira",
      "Banco de talentos",
      "Workshops antirracismo",
    ],
    tags: [TAGS.EQUIDADE, TAGS.REPRESENTATIVIDADE, TAGS.ANTIRRACISMO],
    icon: "✊🏾",
    stats: {
      membersEstimated: 1800,
      resourcesCount: 10,
      engagementsThisMonth: 320,
    },
    disclaimer: "Evite tokenismo ao divulgar iniciativas.",
    priority: "alta",
  },
  {
    id: "mulheres",
    name: "Mulheres",
    labelPublico: "Mulheres na Mobilidade & Tecnologia",
    mission:
      "Reduzir a lacuna de gênero garantindo segurança, oportunidades e progressão de carreira.",
    focusAreas: [
      "liderança",
      "mentoria",
      "equidade salarial",
      "retencao de talentos",
    ],
    challenges: [
      "sub-representação em cargos técnicos e liderança",
      "síndrome da impostora",
      "gap salarial",
      "assédio e microagressões",
    ],
    resources: [
      {
        title: "Programaria",
        url: "https://www.programaria.org/",
        category: "educacao",
        description: "Formação e empoderamento de mulheres em tecnologia.",
      },
      {
        title: "Recomendação de Boas Práticas de Equidade",
        url: "https://example.org/equidade-genero",
        category: "documentacao",
      },
    ],
    supportActions: [
      "Mentorias de carreira e transição",
      "Programa de liderança emergente",
      "Banco de vagas com transparência salarial",
      "Workshops de negociação e visibilidade",
      "Rede de apoio para denúncias de assédio",
    ],
    tags: [TAGS.MULHERES, TAGS.GENERO, TAGS.MENTORIA, TAGS.LIDERANCA],
    icon: "👩‍💻",
    stats: {
      membersEstimated: 1400,
      resourcesCount: 15,
      engagementsThisMonth: 260,
    },
    disclaimer:
      "Trate experiências de gênero de forma interseccional (raça, classe, PCD etc.).",
    priority: "alta",
  },
];
