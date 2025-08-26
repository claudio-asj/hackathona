import type { GroupMember } from "./group-types";
//faz um link entre grupos e o instagram
export const diversityGroupsAsMembers: GroupMember[] = [
    {
        id: "grp-pcd",
        name: "PCD",
        role: "Inclusão & Acessibilidade",
        avatar: "src/components/comunidade/file.jpg",
        description: "Foco em acessibilidade digital, tecnologia assistiva e inclusão no mercado.",
        socials: [
            { type: "instagram", url: "https://example.org/acessibilidade" }
        ]
    },
    {
        id: "grp-lgbtqia",
        name: "LGBTQIA+",
        role: "Segurança Psicológica",
        avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=60",
        description: "Rede de apoio, promoção de políticas inclusivas e combate à discriminação.",
        socials: [
            { type: "instagram", url: "https://instagram.com/pride" }
        ]
    },
    {
        id: "grp-afro",
        name: "Afrodescendentes",
        role: "Equidade Racial",
        avatar: "https://thumbs.dreamstime.com/b/animando-uma-estudante-universit%C3%A1ria-africana-americana-com-um-grupo-de-estudantes-africanos-americanos-155695388.jpg",
        description: "Mentoria, representatividade e combate ao viés em processos seletivos.",
        socials: [
            { type: "instagram", url: "https://linkedin.com/company/afrotech" }
        ]
    },
    {
        id: "grp-mulheres",
        name: "Mulheres",
        role: "Mobilização Feminina",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=60",
        description: "Mentoria, liderança, equidade e apoio contra assédio.",
        socials: [
            { type: "linkedin", url: "https://linkedin.com/company/woman-network" },
            { type: "instagram", url: "https://instagram.com/womenintech" }
        ]
    }
];