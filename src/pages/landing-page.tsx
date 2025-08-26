import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    type FC,
    type ReactNode,
    useRef,
} from "react";

/*
 * ONDE TROCAR O FAVICON:
 * - Coloque o arquivo em /public/favicon.ico (Next.js) ou use <link rel="icon" href="/meu-icone.svg" />
 * - Se estiver usando App Router, pode definir em layout.tsx via export const metadata = { icons: { icon: '/favicon.ico' } }
 * - Ou adicionar no <Head>:
 *   <Head>
 *     <link rel="icon" href="/favicon.ico" />
 *   </Head>
 */

/* =============================================================================
 * 1. TIPOS E INTERFACES
 * ========================================================================== */

type Identity =
    | "feminino"
    | "masculino"
    | "nao-binario"
    | "plural"
    | "prefiro-nao-dizer"
    | "outro";

interface Passageiro {
    id: string;
    nome: string;
    identidade: Identity;
    rendaMensal: number;
    bairro: string;
    destino: string;
    horarioJanela: [string, string];
    prioridadeAcessibilidade?: boolean;
}

interface CaronaRecurso {
    id: string;
    motorista: string;
    identidade: Identity;
    rota: string[];
    horarioPartida: string;
    capacidade: number;
    custoBase: number;
    rating: number;
    acessibilidade: {
        cadeiraRodas: boolean;
        apoioVisual: boolean;
        apoioAuditivo: boolean;
    };
    energiaLimpa?: boolean;
    verificado: boolean;
    tags?: string[];
}

interface Match {
    recurso: CaronaRecurso;
    passageiro: Passageiro;
    score: number;
    fatores: string[];
    custoEstimado: number;
    subsidio: number;
    economiaPercent: number;
}

interface PopularRoute {
    id: string;
    origem: string;
    destino: string;
    viagensSemana: number;
    economiaMediaPct: number;
    emissaoEvitadaKg: number;
}

interface InclusionMetric {
    id: string;
    grupo: string;
    descricao: string;
    participacao: number;
    subsidioPct: number;
    retencao: number;
    cor: string;
}

type DemoState =
    | "preparing"
    | "calculandoRota"
    | "gerandoOpcoes"
    | "exibindoOpcoes"
    | "confirmando"
    | "emViagem"
    | "finalizada";



interface HeroVariant {
    id: string;
    eyebrow?: string;
    title: string;
    highlight?: string;
    description: string;
    bullets?: string[];
    stats?: { label: string; value: string; sub?: string }[];
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; action?: "demo" | "none" };
    phoneStateTarget?: DemoState;
}

/* =============================================================================
 * 2. FUNÇÕES UTILITÁRIAS
 * ========================================================================== */

const addHourISO = (offset: number): string => {
    const d = new Date();
    d.setHours(Math.floor(offset), (offset % 1) * 60, 0, 0);
    return d.toISOString();
};

const within = (start: string, end: string, target: string): boolean => {
    const t = new Date(target).getTime();
    return t >= new Date(start).getTime() && t <= new Date(end).getTime();
};

const money = (v: number): string =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* =============================================================================
 * 3. DADOS MOCK
 * ========================================================================== */

const PASSAGEIROS: Passageiro[] = [
    {
        id: "p1",
        nome: "Alex",
        identidade: "nao-binario",
        rendaMensal: 0,
        bairro: "Jardim Horizonte",
        destino: "Centro Comunitário",
        horarioJanela: [addHourISO(7), addHourISO(8)],
    },
    {
        id: "p2",
        nome: "Marisa",
        identidade: "feminino",
        rendaMensal: 1100,
        bairro: "Vila Azul",
        destino: "Campus Leste",
        horarioJanela: [addHourISO(8), addHourISO(9)],
        prioridadeAcessibilidade: true,
    },
    {
        id: "p3",
        nome: "João",
        identidade: "masculino",
        rendaMensal: 900,
        bairro: "Parque Norte",
        destino: "Ponto Integrado",
        horarioJanela: [addHourISO(6.5), addHourISO(7.5)],
    },
];

// Obs: A ordem original para viagensSemana, economiaMediaPct, emissaoEvitadaKg
// acabava coincidindo (r3 > r1 > r2), por isso parecia que "não ordenava".
// Mantive os dados, mas a lógica está correta.
const ROTAS_POPULARES: PopularRoute[] = [
    {
        id: "r1",
        origem: "Jardim Horizonte",
        destino: "Centro Comunitário",
        viagensSemana: 180,
        economiaMediaPct: 63,
        emissaoEvitadaKg: 140,
    },
    {
        id: "r2",
        origem: "Parque Norte",
        destino: "Ponto Integrado",
        viagensSemana: 132,
        economiaMediaPct: 55,
        emissaoEvitadaKg: 118,
    },
    {
        id: "r3",
        origem: "Vila Azul",
        destino: "Campus Leste",
        viagensSemana: 201,
        economiaMediaPct: 69,
        emissaoEvitadaKg: 152,
    },
];

const RECURSOS_CARONA: CaronaRecurso[] = [
    {
        id: "c1",
        motorista: "Ana P.",
        identidade: "feminino",
        rota: ["Jardim Horizonte", "Centro Comunitário"],
        horarioPartida: addHourISO(7.5),
        capacidade: 3,
        custoBase: 35,
        rating: 4.8,
        acessibilidade: {
            cadeiraRodas: false,
            apoioVisual: false,
            apoioAuditivo: false,
        },
        energiaLimpa: true,
        verificado: true,
    },
    {
        id: "c2",
        motorista: "Beto C.",
        identidade: "masculino",
        rota: ["Vila Azul", "Campus Leste"],
        horarioPartida: addHourISO(8.25),
        capacidade: 2,
        custoBase: 30,
        rating: 4.5,
        acessibilidade: {
            cadeiraRodas: true,
            apoioVisual: false,
            apoioAuditivo: false,
        },
        verificado: true,
    },
    {
        id: "c3",
        motorista: "Coletivo Sol",
        identidade: "plural",
        rota: ["Parque Norte", "Ponto Integrado", "Centro"],
        horarioPartida: addHourISO(7),
        capacidade: 5,
        custoBase: 50,
        rating: 4.9,
        acessibilidade: {
            cadeiraRodas: false,
            apoioVisual: true,
            apoioAuditivo: true,
        },
        energiaLimpa: true,
        verificado: true,
    },
    {
        id: "c4",
        motorista: "Carla S.",
        identidade: "feminino",
        rota: ["Jardim Horizonte", "Centro"],
        horarioPartida: addHourISO(7.75),
        capacidade: 4,
        custoBase: 40,
        rating: 4.7,
        acessibilidade: {
            cadeiraRodas: false,
            apoioVisual: false,
            apoioAuditivo: false,
        },
        verificado: false,
    },
    {
        id: "c5",
        motorista: "Léo M.",
        identidade: "nao-binario",
        rota: ["Parque Norte", "Ponto Integrado"],
        horarioPartida: addHourISO(7.25),
        capacidade: 3,
        custoBase: 38,
        rating: 4.6,
        acessibilidade: {
            cadeiraRodas: false,
            apoioVisual: false,
            apoioAuditivo: false,
        },
        verificado: true,
    },
];

const INCLUSION_METRICS: InclusionMetric[] = [
    {
        id: "mulheres",
        grupo: "Mulheres",
        descricao:
            "Motoristas e passageiras com preferências de segurança ampliadas.",
        participacao: 48,
        subsidioPct: 32,
        retencao: 74,
        cor: "from-rose-500 to-orange-400",
    },
    {
        id: "lgbtqia",
        grupo: "LGBTQIA+",
        descricao: "Sinalização opcional, feedback anônimo, moderação fortalecida.",
        participacao: 19,
        subsidioPct: 21,
        retencao: 69,
        cor: "from-fuchsia-500 to-violet-400",
    },
    {
        id: "afro",
        grupo: "Afrodescendentes",
        descricao: "Acompanhamos paridade e impacto de subsídio por região.",
        participacao: 27,
        subsidioPct: 29,
        retencao: 71,
        cor: "from-amber-500 to-emerald-400",
    },
    {
        id: "pcd",
        grupo: "PCDs",
        descricao:
            "Preferência de acessibilidade, priorização de recursos adaptados.",
        participacao: 11,
        subsidioPct: 18,
        retencao: 66,
        cor: "from-cyan-500 to-teal-400",
    },
];

const FAQ_DATA = [
    {
        q: "Como explicam a escolha da rota?",
        a: "Exibimos fatores: proximidade de origem/destino, janela de tempo, capacidade, subsídio, impacto de emissões e acessibilidade.",
    },
    {
        q: "Como funciona o subsídio?",
        a: "Heurística progressiva baseada em renda e necessidades de acessibilidade; regras e pesos são públicos.",
    },
    {
        q: "Posso auditar o algoritmo?",
        a: "Sim. Código, fórmulas de score e métricas agregadas são disponibilizados para revisão comunitária.",
    },
    {
        q: "Outras modalidades?",
        a: "Entrarão gradualmente após validação de métricas de fairness específicas.",
    },
];

const OPEN_SOURCE_ITEMS = [
    {
        titulo: "Repositórios",
        desc: "Core de matching, API pública, interface acessível.",
        link: "#",
    },
    {
        titulo: "Dados Abertos",
        desc: "Rotas anonimizadas e indicadores de equidade.",
        link: "#",
    },
    {
        titulo: "Guia Ético",
        desc: "Critérios de impacto e mitigação de viés.",
        link: "#",
    },
    {
        titulo: "Governança",
        desc: "Propostas (PIPs), votação e histórico.",
        link: "#",
    },
];

const HERO_VARIANTS: HeroVariant[] = [
    {
        id: "matching",
        eyebrow: "Mobilidade Aberta",
        title: "Matching Justo em Segundos",
        highlight: "subsídio progressivo + explicabilidade",
        description:
            "Algoritmo prioriza origem/destino compatíveis, acessibilidade e custo por assento ajustado à renda.",
        stats: [
            { label: "Economia média", value: "-58%", sub: "custo estimado" },
            { label: "Sem renda", value: "34%", sub: "cobertura" },
            { label: "Emissão evitada", value: "22t", sub: "CO₂ / trim." },
        ],
        primaryCta: { label: "Criar Conta", href: "/login" },
        phoneStateTarget: "exibindoOpcoes",
    },
    {
        id: "viagem",
        eyebrow: "Operação",
        title: "Acompanhamento de Viagem",
        highlight: "progresso + impacto ambiental",
        description:
            "Mostre avanço de rota, emissões evitadas e economia relativa em tempo real para aumentar confiança.",
        primaryCta: { label: "Entrar", href: "/login" },
        phoneStateTarget: "emViagem",
    },
    {
        id: "auditoria",
        eyebrow: "Governança",
        title: "Auditoria Comunitária",
        highlight: "código & métricas abertas",
        description:
            "Pesos, fórmulas de score e agregações disponíveis para inspeção e propostas de aprimoramento.",
        primaryCta: { label: "Ver Repositórios", href: "#" },
        phoneStateTarget: "gerandoOpcoes",
    },
    {
        id: "inclusao",
        eyebrow: "Equidade & Inclusão",
        title: "Camadas de Inclusão Ativadas",
        highlight: "gênero, identidade & acessibilidade",
        description:
            "Priorizamos segurança e representação de mulheres, pessoas LGBTQIA+, afrodescendentes e PCDs com pesos auditáveis, subsídios direcionados e métricas abertas.",
        stats: [
            { label: "Motoristas verificados", value: "91%", sub: "selo comunitário" },
            { label: "Feedback seguro", value: "+72%", sub: "confiança relatada" },
            { label: "Subsídio eq.", value: "R$ 38k", sub: "último trim." },
        ],
        primaryCta: { label: "Ver Inclusão", href: "#inclusao" },
        phoneStateTarget: "gerandoOpcoes",
    },
];

/* =============================================================================
 * 4. TEMA
 * ========================================================================== */

const heroTheme = {
    bg: "bg-[radial-gradient(circle_at_30%_40%,#1b3145_0%,#0d1824_60%,#081019_100%)]",
    navBg: "bg-[#1e1f23]/85 backdrop-blur-md",
    navRing: "ring-1 ring-white/10",
    gradientText: "bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-200",
    pillInactive: "bg-white/5 hover:bg-white/10 text-slate-300",
    pillActive: "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow",
};

/* =============================================================================
 * 5. ÁTOMOS
 * ========================================================================== */

const Eyebrow: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[10px] uppercase tracking-wider text-orange-300">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
        {children}
    </div>
);

const Pill: FC<{ children: ReactNode; tone?: "accent" | "neutral" }> = ({
                                                                            children,
                                                                            tone = "neutral",
                                                                        }) => {
    const styles = {
        neutral: "bg-white/10 text-slate-200",
        accent: "bg-orange-500/20 text-orange-200",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[tone]}`}
        >
      {children}
    </span>
    );
};

const Stat: FC<{ label: string; value: string; sub?: string }> = ({
                                                                      label,
                                                                      value,
                                                                      sub,
                                                                  }) => (
    <div className="flex flex-col">
    <span className="text-xs tracking-wide uppercase text-slate-400">
      {label}
    </span>
        <span className="text-2xl font-semibold text-white">{value}</span>
        {sub && <span className="text-[11px] text-slate-500">{sub}</span>}
    </div>
);

/* =============================================================================
 * 6. COMPOSTOS
 * ========================================================================== */

const SectionHeader: FC<{
    eyebrow?: string;
    title: string;
    subtitle?: string;
}> = ({ eyebrow, title, subtitle }) => (
    <div className="max-w-3xl mx-auto text-center mb-14">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-orange-300 via-amber-200 to-cyan-200 text-transparent bg-clip-text">
            {title}
        </h2>
        {subtitle && (
            <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-300">
                {subtitle}
            </p>
        )}
    </div>
);


/* ========================================================================== */
/*  TIPOS                                                                     */
/* ========================================================================== */


export interface RecursoCarona {
    id: string;
    motorista: string;
    horarioPartida: string | number | Date;
    precoBase: number;
    subsidio?: number;
    emissaoEstimativa?: number;
    rota?: string;
}

export interface MatchLite {
    id: string | number;
    motorista: string;
    preco: number;
    subsidio: number;
    economia: number; // percent (0-100)
    tempo: string;
    destaque: boolean;
}

export interface Durations extends Record<DemoState, number> {}

export interface BadgeConfig {
    text: string;
    gradientClass: string;
    shadowClass?: string;
    animationDelaySec?: number;
    side?: "left" | "right";
    topPercent?: number; // 0-100
}

export interface PhoneDemoProps {
    className?: string;
    width?: number;
    height?: number;

    // Dados
    passengers?: Passageiro[];
    resources?: RecursoCarona[];

    // Estado forçado / controle externo
    forceState?: DemoState | null;
    autoPlay?: boolean;
    paused?: boolean;

    // Configurações de duração
    durations?: Partial<Durations>;

    // Funções injetáveis
    gerarMatches?: (p: Passageiro, recursos: RecursoCarona[]) => any[];
    formatMoney?: (n: number) => string;

    // Callbacks
    onStateChange?: (state: DemoState) => void;
    onCyclePassenger?: (newPassenger: Passageiro) => void;
    onProgress?: (state: DemoState, progress: number) => void;

    // Customização de labels
    labels?: Partial<Record<DemoState, string>>;

    // Badges
    showBadges?: boolean;
    badges?: BadgeConfig[];
    badgeClassName?: string;

    // Conteúdo custom para estados (opcional)
    renderStateContent?: (args: {
        state: DemoState;
        matches: MatchLite[];
        progress: number;
        passenger: Passageiro;
    }) => ReactNode;
}

/* ========================================================================== */
/*  CONSTANTES DEFAULT                                                        */
/* ========================================================================== */
const DEFAULT_PASSENGERS: Passageiro[] = [
    { id: "p1", nome: "Ana", origem: "Origem A", destino: "Centro" },
    { id: "p2", nome: "Bruno", origem: "Origem B", destino: "Universidade" },
    { id: "p3", nome: "Clara", origem: "Origem C", destino: "Aeroporto" },
];

const DEFAULT_RESOURCES: RecursoCarona[] = [
    {
        id: "r1",
        motorista: "João",
        horarioPartida: new Date(Date.now() + 15 * 60000),
        precoBase: 18.4,
        subsidio: 3.5,
    },
    {
        id: "r2",
        motorista: "Lúcia",
        horarioPartida: new Date(Date.now() + 22 * 60000),
        precoBase: 21.9,
        subsidio: 0,
    },
    {
        id: "r3",
        motorista: "Pedro",
        horarioPartida: new Date(Date.now() + 9 * 60000),
        precoBase: 16.7,
        subsidio: 1.2,
    },
];

const DEFAULT_DURATIONS: Durations = {
    preparing: 1800,
    calculandoRota: 2200,
    gerandoOpcoes: 2000,
    exibindoOpcoes: 3400,
    confirmando: 1600,
    emViagem: 5000,
    finalizada: 2000,
};

const STATE_SEQUENCE: DemoState[] = [
    "preparing",
    "calculandoRota",
    "gerandoOpcoes",
    "exibindoOpcoes",
    "confirmando",
    "emViagem",
    "finalizada",
];

const DEFAULT_LABELS: Record<DemoState, string> = {
    preparing: "Inicializando...",
    calculandoRota: "Calculando rota ideal",
    gerandoOpcoes: "Gerando opções...",
    exibindoOpcoes: "Opções de carona",
    confirmando: "Confirmando carona...",
    emViagem: "Em viagem",
    finalizada: "Viagem concluída",
};

const DEFAULT_BADGES: BadgeConfig[] = [
    {
        text: "Mobilidade",
        gradientClass: "from-orange-500 to-amber-400",
        shadowClass: "shadow-orange-500/40",
        animationDelaySec: 0,
        side: "left",
        topPercent: 30,
    },
    {
        text: "Facilidade",
        gradientClass: "from-cyan-500 to-teal-400",
        shadowClass: "shadow-cyan-500/40",
        animationDelaySec: 1.6,
        side: "right",
        topPercent: 62,
    },
];

/* ========================================================================== */
/*  HELPERS                                                                   */
/* ========================================================================== */
const nextState = (current: DemoState): DemoState => {
    const idx = STATE_SEQUENCE.indexOf(current);
    return STATE_SEQUENCE[(idx + 1) % STATE_SEQUENCE.length];
};

const defaultFormatMoney = (n: number) =>
    n.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    });

const defaultGerarMatches = (
    p: Passageiro,
    recursos: RecursoCarona[]
): any[] => {
    // Mock simplificado
    return recursos.map((r) => ({
        recurso: {
            id: r.id,
            motorista: r.motorista,
            horarioPartida: r.horarioPartida,
        },
        custoEstimado: r.precoBase,
        subsidio: r.subsidio ?? 0,
        economiaPercent: Math.max(
            5,
            Math.min(60, 100 - (r.precoBase / 30) * 100 + Math.random() * 10)
        ),
    }));
};

/* ========================================================================== */
/*  HOOKS LOCAIS (animação / progresso)                                       */
/* ========================================================================== */
const useAnimatedDots = (active: boolean, interval = 450, max = 3) => {
    const [dots, setDots] = useState(0);
    useEffect(() => {
        if (!active) {
            setDots(0);
            return;
        }
        const id = setInterval(
            () => setDots((d) => (d >= max ? 0 : d + 1)),
            interval
        );
        return () => clearInterval(id);
    }, [active, interval, max]);
    return ".".repeat(dots);
};

const useSyntheticPercent = (active: boolean, speed = 900) => {
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => setN((v) => v + 1), speed);
        return () => clearInterval(id);
    }, [active, speed]);
    // só para exibir "andamento" ilusório
    return ((n % 90) + 10).toString().slice(0, 2);
};

/* ========================================================================== */
/*  SUB-COMPONENTES (Loading / MatchList etc.)                                */
/* ========================================================================== */
interface LoadingSectionProps {
    titulo: string;
    linhas: string[];
    variant?: "prep" | "calc" | "match" | "confirm";
}

const LoadingSection: FC<LoadingSectionProps> = ({
                                                     titulo,
                                                     linhas,
                                                     variant = "prep",
                                                 }) => {
    const dots = useAnimatedDots(true);
    const pseudo = useSyntheticPercent(true);
    const accentColorMap: Record<string, string> = {
        prep: "from-orange-400/30 to-amber-300/20",
        calc: "from-cyan-400/30 to-teal-300/20",
        match: "from-fuchsia-400/30 to-pink-300/20",
        confirm: "from-emerald-400/30 to-lime-300/20",
    };
    return (
        <div className="text-[10px] text-slate-400 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
                <p className="text-slate-300 font-medium flex items-center gap-1">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-orange-500/40 animate-ping-slow" />
            <span className="relative h-2 w-2 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-[0_0_6px_-1px_rgba(251,146,60,0.8)]" />
          </span>
                    {titulo}
                </p>
                <span
                    aria-hidden="true"
                    className="ml-auto inline-flex h-4 items-center rounded-full border border-white/10 bg-white/5 px-1.5 font-mono text-[9px] tracking-tight text-slate-400"
                >
          {pseudo}%
        </span>
            </div>
            <IndeterminateBar />
            <ul className="space-y-1.5">
                {linhas.map((l, i) => (
                    <li
                        key={i}
                        className="group relative overflow-hidden rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5"
                    >
                        <div className="pointer-events-none absolute inset-0 opacity-0 group-animate-line-shimmer" />
                        <span className="relative z-10 flex items-center gap-1">
              <span
                  className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${accentColorMap[variant]} animate-pulse-dot`}
              />
                            {l}
                            {i === 0 && (
                                <span className="text-slate-500" aria-hidden="true">
                  {dots || "\u00A0"}
                </span>
                            )}
            </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const IndeterminateBar: FC<{ className?: string }> = ({ className = "" }) => (
    <div
        className={
            "relative h-1.5 overflow-hidden rounded-full bg-white/10 " + className
        }
    >
        <div className="absolute inset-0 -translate-x-full animate-bar-slide bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
    </div>
);

interface MatchListProps {
    matches: MatchLite[];
    formatMoney: (n: number) => string;
}

const MatchList: FC<MatchListProps> = ({ matches, formatMoney }) => {
    if (!matches.length) {
        return (
            <p className="text-[10px] text-slate-500 animate-fade-in">
                Nenhuma opção encontrada.
            </p>
        );
    }
    return (
        <div className="space-y-2 animate-fade-in">
            {matches.map((m) => (
                <div
                    key={m.id}
                    className={`rounded-xl border px-3 py-2 text-xs transition ${
                        m.destaque
                            ? "border-orange-400 bg-orange-500/10 shadow-[0_0_0_1px_rgba(251,146,60,0.35)]"
                            : "border-white/10 bg-white/5 hover:border-orange-400/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{m.motorista}</span>
                        <span className="text-orange-300">{formatMoney(m.preco)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">
                        <span>{m.tempo}</span>
                        <span className="text-cyan-300">
              Economia {m.economia.toFixed(0)}%
            </span>
                        {m.subsidio > 0 && (
                            <span className="text-orange-200">
                Subsídio {formatMoney(m.subsidio)}
              </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ========================================================================== */
/*  COMPONENTE PRINCIPAL                                                      */
/* ========================================================================== */
export const PhoneDemo: FC<PhoneDemoProps> = ({
                                                  className = "",
                                                  width = 420,
                                                  height = 900,
                                                  passengers = DEFAULT_PASSENGERS,
                                                  resources = DEFAULT_RESOURCES,
                                                  forceState = null,
                                                  autoPlay = true,
                                                  paused = false,
                                                  durations,
                                                  gerarMatches = defaultGerarMatches,
                                                  formatMoney = defaultFormatMoney,
                                                  onStateChange,
                                                  onCyclePassenger,
                                                  onProgress,
                                                  labels,
                                                  showBadges = true,
                                                  badges,
                                                  badgeClassName = "",
                                                  renderStateContent,
                                              }) => {
    const mergedDurations: Durations = { ...DEFAULT_DURATIONS, ...(durations || {}) };
    const stateLabels: Record<DemoState, string> = {
        ...DEFAULT_LABELS,
        ...(labels || {}),
    };

    const [currentState, setCurrentState] = useState<DemoState>("preparing");
    const [progress, setProgress] = useState(0);
    const [passIdx, setPassIdx] = useState(0);

    const rafRef = useRef<number | null>(null);
    const timerRef = useRef<number | null>(null);
    const passenger = passengers[passIdx];

    // Matches
    const matches: MatchLite[] = useMemo(() => {
        if (!passenger) return [];
        try {
            return gerarMatches(passenger, resources).map((m: any, i: number) => ({
                id: m.recurso.id,
                motorista: m.recurso.motorista,
                preco: m.custoEstimado,
                subsidio: m.subsidio ?? 0,
                economia: m.economiaPercent ?? 0,
                tempo: new Date(m.recurso.horarioPartida).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                destaque: i === 0,
            }));
        } catch {
            return [];
        }
    }, [passenger, resources, gerarMatches]);

    /* ------------------ Funções de navegação --------------------- */
    const cyclePassenger = useCallback(() => {
        setPassIdx((idx) => {
            const next = (idx + 1) % passengers.length;
            onCyclePassenger?.(passengers[next]);
            return next;
        });
    }, [passengers, onCyclePassenger]);

    const goNextState = useCallback(() => {
        setCurrentState((prev) => {
            const nxt = nextState(prev);
            // Se chegou ao final, troca passageiro
            if (prev === "finalizada") {
                cyclePassenger();
                return "preparing";
            }
            return nxt;
        });
    }, [cyclePassenger]);

    const goPrevState = useCallback(() => {
        setCurrentState((prev) => {
            const idx = STATE_SEQUENCE.indexOf(prev);
            if (idx <= 0) return prev;
            return STATE_SEQUENCE[idx - 1];
        });
    }, []);

    /* ------------------ Limpeza timers/raf ----------------------- */
    const clearTimers = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    /* ------------------ Progresso em "emViagem" ------------------ */
    const startTravelProgress = useCallback(
        (ms: number) => {
            setProgress(0);
            const start = performance.now();
            const step = (now: number) => {
                const pct = Math.min(1, (now - start) / ms);
                setProgress(pct);
                onProgress?.(currentState, pct);
                if (pct < 1 && !paused) {
                    rafRef.current = requestAnimationFrame(step);
                } else if (pct >= 1 && autoPlay && !forceState) {
                    goNextState();
                }
            };
            rafRef.current = requestAnimationFrame(step);
        },
        [currentState, autoPlay, forceState, goNextState, paused, onProgress]
    );

    /* ------------------ Efeito para forceState ------------------- */
    useEffect(() => {
        if (forceState) {
            clearTimers();
            setCurrentState(forceState);
            if (forceState === "emViagem") {
                startTravelProgress(mergedDurations.emViagem);
            } else {
                setProgress(0);
            }
        }
    }, [forceState, clearTimers, startTravelProgress, mergedDurations.emViagem]);

    /* ------------------ Efeito transições automáticas ------------- */
    useEffect(() => {
        if (forceState || !autoPlay || paused) return;
        clearTimers();

        if (currentState === "emViagem") {
            startTravelProgress(mergedDurations.emViagem);
            return () => clearTimers();
        } else {
            setProgress(0);
        }
        timerRef.current = window.setTimeout(
            () => goNextState(),
            mergedDurations[currentState]
        );
        return () => clearTimers();
    }, [
        currentState,
        mergedDurations,
        autoPlay,
        paused,
        forceState,
        goNextState,
        clearTimers,
        startTravelProgress,
    ]);

    /* ------------------ Callback de mudança de estado ------------- */
    useEffect(() => {
        onStateChange?.(currentState);
    }, [currentState, onStateChange]);

    /* ------------------ Render de conteúdo por estado ------------- */
    const defaultContent = useMemo<ReactNode>(() => {
        switch (currentState) {
            case "preparing":
                return (
                    <LoadingSection
                        titulo="Preparando"
                        variant="prep"
                        linhas={[
                            "Carregando perfis anônimos",
                            "Sincronizando preferências",
                            "Indexando matriz de similaridade",
                        ]}
                    />
                );
            case "calculandoRota":
                return (
                    <LoadingSection
                        titulo="Rota"
                        variant="calc"
                        linhas={[
                            "Simulando congestionamento",
                            "Estimando emissões",
                            "Balanceando tempo vs custo",
                        ]}
                    />
                );
            case "gerandoOpcoes":
                return (
                    <LoadingSection
                        titulo="Matching"
                        variant="match"
                        linhas={[
                            "Filtrando rotas compatíveis",
                            "Aplicando fairness & subsídio",
                            "Ordenando por utilidade",
                        ]}
                    />
                );
            case "exibindoOpcoes":
                return <MatchList matches={matches} formatMoney={formatMoney} />;
            case "confirmando":
                return (
                    <LoadingSection
                        titulo="Confirmando"
                        variant="confirm"
                        linhas={[
                            "Verificando reputação",
                            "Protegendo assento",
                            "Gerando canal seguro",
                        ]}
                    />
                );
            case "emViagem":
                return (
                    <div className="text-xs space-y-3 animate-fade-in">
                        <div className="flex justify-between">
                            <span className="text-slate-300">Progresso</span>
                            <span className="text-orange-300">
                {(progress * 100).toFixed(0)}%
              </span>
                        </div>
                        <div
                            className="h-2 w-full bg-white/10 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={Math.round(progress * 100)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Progresso da viagem"
                        >
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400 transition-[width] duration-200 ease-linear"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400">
                            Rota otimizada priorizando menor custo & baixa emissão.
                        </p>
                    </div>
                );
            case "finalizada":
                return (
                    <div className="text-xs space-y-2 animate-scale-in">
                        <p className="font-medium text-white flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500/20 text-[9px] text-green-300">
                ✓
              </span>
                            Chegada concluída
                        </p>
                        <p className="text-[10px] text-slate-400">
                            Feedback anônimo alimenta métricas de paridade e segurança.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    }, [currentState, matches, formatMoney, progress]);

    const content =
        renderStateContent?.({
            state: currentState,
            matches,
            progress,
            passenger,
        }) ?? defaultContent;

    /* ------------------ Badges (config final) -------------------- */
    const finalBadges = (badges && badges.length ? badges : DEFAULT_BADGES).filter(
        (_) => showBadges
    );

    return (
        <div
            className={`relative rounded-[54px] border border-white/15 bg-[#102333]/90 backdrop-blur-xl shadow-2xl shadow-black/60 flex flex-col p-6 ${className}`}
            style={{ width, height }}
            aria-label="Demonstração de fluxo de carona"
        >
            {/* Barra de status superior */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span aria-label="Hora simulada">09:42</span>
                <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
        </span>
            </div>

            {/* Mapa / Cabeçalho do estado */}
            <div className="mt-3 flex flex-col flex-1 min-h-0">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1f2d] h-[60%]">
                    <img
                        src="/mapa.jpg"
                        alt="Mapa ilustrativo"
                        className="w-full h-full object-cover opacity-70 select-none pointer-events-none"
                    />
                    <div
                        className="absolute left-2 top-2 bg-[#13283d]/85 border border-white/10 rounded-md px-3 py-1.5 text-[10px] text-slate-200 flex items-center gap-2 backdrop-blur-sm"
                        aria-live="polite"
                    >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500 shadow-[0_0_6px_-1px_rgba(251,146,60,0.8)]" />
            </span>
                        {stateLabels[currentState]}
                    </div>
                    {passenger && (
                        <div className="absolute bottom-2 left-2 text-[10px] bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md text-slate-200 border border-white/10">
                            Passageiro:{" "}
                            <span className="text-white font-medium">{passenger.nome}</span>
                        </div>
                    )}
                </div>

                {/* Conteúdo dinâmico */}
                <div className="mt-4 flex flex-col flex-1 min-h-0">
                    <div className="flex-1 min-h-0">{content}</div>

                    {/* Controles (ativos quando autoPlay = false ou forceState != null) */}
                    <div className="mt-4 flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => goPrevState()}
                            disabled={autoPlay && !forceState}
                            className="flex-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-200 py-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
                        >
                            Voltar
                        </button>
                        <button
                            type="button"
                            onClick={() => goNextState()}
                            disabled={autoPlay && !forceState}
                            className="flex-1 rounded-md bg-gradient-to-r from-orange-600 to-amber-500 text-[11px] text-white font-medium py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
                        >
                            Avançar
                        </button>
                    </div>
                    <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-white/15" />
                </div>
            </div>


                );

        </div>
    );
};

/* ========================================================================== */
/*  EXPORT DEFAULT                                                            */
/* ========================================================================== */

/* =============================================================================
 * 8. NAVBAR FIXA + SLUGIFY + SCROLL SUAVE
 * ========================================================================== */

// Função para gerar id sem acentos / espaços
const slugify = (s: string) =>
    s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "");

const NAV_LINKS = ["Início", "Rotas", "Inclusão", "Open Source", "FAQ"];

const FloatingNav: FC = () => {
    const handleClick = (e: React.MouseEvent, label: string) => {
        e.preventDefault();
        const id = slugify(label === "Open Source" ? "opensource" : label);
        const el = document.getElementById(id);
        if (el) {
            // Scroll suave até a seção
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="pointer-events-auto fixed top-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-6xl px-4">
                <div
                    className={`flex items-center justify-between gap-8 px-6 py-3 mt-4 rounded-2xl ${heroTheme.navBg} ${heroTheme.navRing} shadow-xl`}
                >
                    <div className="flex items-center gap-3">

                        <img
                            src="src/assets/logo.png"
                            alt="Logo"
                            className="h-5 w-5 object-contain"
                        />
                        <span className="text-sm font-semibold text-white">
              Move
            </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium">
                        {NAV_LINKS.map((link) => {
                            const targetId =
                                link === "Open Source" ? "opensource" : slugify(link);
                            return (
                                <a
                                    key={link}
                                    href={`#${targetId}`}
                                    onClick={(e) => handleClick(e, link)}
                                    className="text-slate-300 hover:text-white transition"
                                >
                                    {link}
                                </a>
                            );
                        })}
                    </nav>
                    <div className="flex items-center gap-3">
                        <a
                            href="/login"
                            className="hidden md:inline-flex items-center rounded-md px-4 py-2 text-xs font-medium border border-white/10 text-slate-200 hover:border-orange-400/50 hover:bg-orange-500/10"
                        >
                            Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* =============================================================================
 * 9. HERO
 * ========================================================================== */

const HeroSelection: FC = () => {
    const [variant, setVariant] = useState<HeroVariant>(HERO_VARIANTS[0]);

    return (
        <section
            id="inicio"
            className={`relative overflow-hidden ${heroTheme.bg} pt-[140px] scroll-mt-32`}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[90vmax] h-[90vmax] bg-[radial-gradient(circle_at_center,rgba(255,170,80,0.08),transparent_70%)]" />
            </div>
            <div className="relative z-10 mx-auto max-w-7xl px-6 pt-4 pb-28">
                <div className="flex flex-wrap gap-3 mb-10">
                    {HERO_VARIANTS.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setVariant(v)}
                            className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition ${
                                variant.id === v.id
                                    ? heroTheme.pillActive
                                    : heroTheme.pillInactive
                            }`}
                        >
                            {v.title.split(" ")[0]}
                        </button>
                    ))}
                </div>
                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                    <div className="flex flex-col gap-6">
                        {variant.eyebrow && <Eyebrow>{variant.eyebrow}</Eyebrow>}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-white">
                                {variant.title}
                            </h1>
                            {variant.highlight && (
                                <span
                                    className={`${heroTheme.gradientText} text-transparent bg-clip-text block mt-2 text-2xl md:text-3xl font-semibold`}
                                >
                  {variant.highlight}
                </span>
                            )}
                        </div>
                        <p className="text-base md:text-lg text-slate-300 max-w-xl leading-relaxed">
                            {variant.description}
                        </p>
                        {variant.stats && (
                            <div className="grid grid-cols-3 gap-8 max-w-md pt-4">
                                {variant.stats.map((s) => (
                                    <Stat key={s.label} {...s} />
                                ))}
                            </div>
                        )}
                        {variant.primaryCta && (
                            <div className="flex flex-wrap gap-4 pt-4">
                                <a
                                    href={variant.primaryCta.href}
                                    className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-8 py-3 text-sm font-semibold text-white shadow hover:brightness-110"
                                >
                  <span className="relative z-10">
                    {variant.primaryCta.label}
                  </span>
                                    <span className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-500 group-hover:translate-y-0" />
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center lg:justify-end">
                        <div className="relative">
                            <div className="absolute -inset-10 blur-3xl bg-gradient-to-r from-orange-500/10 via-amber-400/10 to-cyan-400/10 rounded-full pointer-events-none" />
                            <PhoneDemo forceState={variant.phoneStateTarget || null} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* =============================================================================
 * 10. INCLUSÃO
 * ========================================================================== */

const InclusionCard: FC<{ m: InclusionMetric }> = ({ m }) => (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#182c41]/60 p-6 backdrop-blur">
        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${m.cor}`} />
        <div className="relative z-10 space-y-3">
            <h5 className="text-sm font-semibold text-white">{m.grupo}</h5>
            <p className="text-[11px] text-slate-300 leading-relaxed">
                {m.descricao}
            </p>
            <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
                <div>
          <span className="block text-xs uppercase text-slate-500">
            Participação
          </span>
                    <span className="mt-0.5 font-semibold text-orange-200">
            {m.participacao}%
          </span>
                </div>
                <div>
          <span className="block text-xs uppercase text-slate-500">
            Subsídio
          </span>
                    <span className="mt-0.5 font-semibold text-cyan-200">
            {m.subsidioPct}%
          </span>
                </div>
                <div>
          <span className="block text-xs uppercase text-slate-500">
            Retenção
          </span>
                    <span className="mt-0.5 font-semibold text-amber-200">
            {m.retencao}%
          </span>
                </div>
            </div>
            <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-400"
                    style={{ width: `${m.participacao}%` }}
                />
            </div>
        </div>
    </div>
);

const InclusionSection: FC = () => (
    <section
        id="inclusao"
        className="mx-auto max-w-7xl px-6 py-24 scroll-mt-32"
    >
        <SectionHeader
            eyebrow="Diversidade"
            title="Inclusão & Gênero"
            subtitle="Transparência em participação, subsídios e retenção de grupos priorizados. Métricas agregadas e auditáveis."
        />
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {INCLUSION_METRICS.map((m) => (
                <InclusionCard key={m.id} m={m} />
            ))}
        </div>
    </section>
);

/* =============================================================================
 * 11. ROTAS POPULARES (Ordenação corrigida + comentário)
 * ========================================================================== */

const PopularRoutesSection: FC = () => {
    type SortKey = "viagensSemana" | "economiaMediaPct" | "emissaoEvitadaKg";
    const [sortKey, setSortKey] = useState<SortKey>("viagensSemana");

    // Ordenação: se valores iguais, ordena por id para estabilidade
    const sortedRoutes = useMemo(() => {
        return [...ROTAS_POPULARES].sort((a, b) => {
            const diff = b[sortKey] - a[sortKey];
            if (diff !== 0) return diff;
            return a.id.localeCompare(b.id);
        });
    }, [sortKey]);

    const sortOptions: { id: SortKey; label: string }[] = [
        { id: "viagensSemana", label: "Frequência" },
        { id: "economiaMediaPct", label: "Economia" },
        { id: "emissaoEvitadaKg", label: "Emissões" },
    ];

    return (
        <section id="rotas" className="mx-auto max-w-7xl px-6 py-24 scroll-mt-32">
            <SectionHeader
                eyebrow="Tendências"
                title="Rotas Populares"
                subtitle="Demandas agregadas ajudam a calibrar subsídios e planejar pontos de encontro."
            />
            <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Ordenar:
          </span>
                    {sortOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setSortKey(opt.id)}
                            className={`rounded-md px-4 py-1.5 text-xs font-medium border transition ${
                                sortKey === opt.id
                                    ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white border-orange-500 shadow"
                                    : "border-white/15 text-slate-300 hover:border-orange-400"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-slate-500">
                    (Se a ordem parecer igual entre critérios, é porque os valores atuais
                    produzem a mesma hierarquia. Altere dados para visualizar diferenças.)
                </p>
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {sortedRoutes.map((r, idx) => (
                        <div
                            key={r.id}
                            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#182c41]/60 p-6 backdrop-blur hover:border-cyan-400/40 transition"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h5 className="text-sm font-semibold text-white">
                                        {r.origem} → {r.destino}
                                    </h5>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Carona • Rank {idx + 1}
                                    </p>
                                </div>
                                <Pill tone="accent">{r.viagensSemana}/sem</Pill>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-500">
                    Economia
                  </span>
                                    <span className="text-sm font-semibold text-orange-300">
                    {r.economiaMediaPct}%
                  </span>
                                </div>
                                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-500">
                    Emissão ev.
                  </span>
                                    <span className="text-sm font-semibold text-cyan-300">
                    {r.emissaoEvitadaKg}kg
                  </span>
                                </div>
                                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-500">
                    Modal
                  </span>
                                    <span className="text-sm font-semibold text-slate-200">
                    Carro
                  </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* =============================================================================
 * 12. OUTRAS SEÇÕES (IDs ajustados com scroll-mt-32)
 * ========================================================================== */

const OpenSourceSection: FC = () => (
    <section
        id="opensource"
        className="mx-auto max-w-7xl px-6 py-24 scroll-mt-32"
    >
        <SectionHeader
            eyebrow="Colaboração"
            title="Open Source & Governança"
            subtitle="Código e decisões auditáveis para evolução contínua."
        />
        <div className="grid gap-6 md:grid-cols-4">
            {OPEN_SOURCE_ITEMS.map((c) => (
                <a
                    key={c.titulo}
                    href={c.link}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#182c41]/60 p-5 hover:border-orange-400/50 transition"
                >
                    <h5 className="text-sm font-semibold text-white">{c.titulo}</h5>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {c.desc}
                    </p>
                    <span className="mt-3 inline-block text-[11px] font-medium text-orange-300 group-hover:text-orange-200">
            Acessar →
          </span>
                </a>
            ))}
        </div>
    </section>
);

const FAQSection: FC = () => (
    <section id="faq" className="mx-auto max-w-5xl px-6 py-24 scroll-mt-32">
        <SectionHeader
            eyebrow="Informações"
            title="Perguntas Frequentes"
            subtitle="Entenda rapidamente como operamos com transparência."
        />
        <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#16293b]/50">
            {FAQ_DATA.map((f, i) => (
                <details key={i} className="group open:bg-white/[0.04]">
                    <summary className="cursor-pointer list-none px-6 py-5 text-sm font-medium text-white flex items-center justify-between">
                        <span>{f.q}</span>
                        <span className="text-xs text-slate-500 group-open:rotate-45 transition">
              +
            </span>
                    </summary>
                    <div className="px-6 pb-5 -mt-2 text-sm leading-relaxed text-slate-300">
                        {f.a}
                    </div>
                </details>
            ))}
        </div>
    </section>
);

const FinalCTA: FC = () => (
    <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1d3447] via-[#142838] to-[#0d1b27] p-10 backdrop-blur-xl shadow-lg shadow-black/50">
            <div className="absolute -inset-px bg-[radial-gradient(circle_at_20%_20%,rgba(255,122,26,0.25),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(0,153,255,0.25),transparent_60%)] opacity-70" />
            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                    <h3 className="text-2xl font-semibold bg-gradient-to-r from-orange-300 via-amber-200 to-cyan-200 bg-clip-text text-transparent">
                        Pronto para construir mobilidade justa?
                    </h3>
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                        Participe, envie PRs, audite métricas e proponha melhorias que
                        reforçam equidade.
                    </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <a
                        href="/login"
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-8 py-3 text-sm font-semibold text-white shadow hover:brightness-110 focus:outline-none focus-visible:ring-2 ring-orange-400/50"
                    >
                        <span className="relative z-10">Entrar / Criar Conta</span>
                        <span className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-500 group-hover:translate-y-0" />
                    </a>
                    <a
                        href="#opensource"
                        onClick={(e) => {
                            e.preventDefault();
                            document
                                .getElementById("opensource")
                                ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="rounded-xl border border-white/15 bg-white/5 px-8 py-3 text-sm font-medium text-slate-200 hover:border-orange-400/50 hover:bg-orange-500/10 focus:outline-none focus-visible:ring-2 ring-orange-400/40"
                    >
                        Repositórios
                    </a>
                </div>
            </div>
        </div>
    </section>
);

const Footer: FC = () => {
    const footerCols = [
        {
            title: "Plataforma",
            links: ["Início", "Rotas", "Inclusão", "Open Source", "FAQ"],
        },
        { title: "Recursos", links: ["Docs", "API", "Blog", "Relatórios"] },
        {
            title: "Governança",
            links: ["Propostas", "Auditorias", "Comitês", "Calendário"],
        },
        { title: "Legal", links: ["Termos", "Privacidade", "Código de Conduta"] },
    ];
    return (
        <footer className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="mt-10 grid gap-10 md:grid-cols-5">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                            MO
                        </div>
                        <span className="text-sm font-semibold text-white">
              MobilidadeAberta
            </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Carona colaborativa, transparente e orientada à equidade social.
                    </p>
                </div>
                {footerCols.map((col) => (
                    <div key={col.title} className="space-y-3">
                        <h5 className="font-semibold text-sm text-white">{col.title}</h5>
                        <ul className="space-y-2 text-xs text-slate-400">
                            {col.links.map((l) => {
                                const target =
                                    l === "Open Source" ? "opensource" : slugify(l);
                                return (
                                    <li key={l}>
                                        <a
                                            href={`#${target}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                document
                                                    .getElementById(target)
                                                    ?.scrollIntoView({ behavior: "smooth" });
                                            }}
                                            className="hover:text-orange-300"
                                        >
                                            {l}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
            <p className="mt-10 text-center text-[11px] text-slate-500">
                © {new Date().getFullYear()} MobilidadeAberta — Licença MIT.
            </p>
        </footer>
    );
};

/* =============================================================================
 * 13. PÁGINA PRINCIPAL
 * ========================================================================== */

const LandingPage: FC = () => {
    return (
        <div className="min-h-screen w-full font-sans text-slate-100 bg-[#0a141d]">
            <FloatingNav />
            <HeroSelection />
            <main className="relative z-10">
                <PopularRoutesSection />
                <InclusionSection />
                <OpenSourceSection />
                <FAQSection />
                <FinalCTA />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;