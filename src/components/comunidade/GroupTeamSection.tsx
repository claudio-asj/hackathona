import type { GroupTeamSectionProps } from "./group-types";
import { GroupMemberCard } from "./GroupMemberCard";

/**
 * Se quiser mais de 3 membros, a grid continua em múltiplas linhas.
 * Se quiser mais de 3 membros, a grid continua em múltiplas linhas.
 */
export function GroupTeamSection({
                                     title,
                                     subtitle,
                                     backgroundImage,
                                     members,
                                     className = "",
                                     fullHeight = true,
                                     forceScreenHeight = false,
                                     overlayDarkness = 70,
                                     fallbackImage = "/images/rio.jpg", // coloque o arquivo em public/images/rio.jpg
                                 }: ExtendedGroupTeamSectionProps) {
    const sectionBase = "relative isolate";
    const heightClass = forceScreenHeight
        ? "h-screen"
        : fullHeight
            ? "min-h-screen"
            : "";
    const wrapper = "mx-auto max-w-6xl px-6 py-24 text-center text-white";
    const bgUrl = backgroundImage || fallbackImage;

    // Normaliza opacidade do overlay (clamp)
    const darkPct = Math.min(100, Math.max(0, overlayDarkness));
    const darkAlpha = (darkPct / 100).toFixed(2); // ex: 0.7

    return (
        <section
            className={`${sectionBase} ${heightClass} ${className}`}
            aria-label={title || "Seção de equipe"}
        >
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div
                    className="h-full w-full bg-center bg-cover bg-no-repeat"
                    style={{
                        backgroundImage: `url(${bgUrl})`,
                    }}
                    aria-hidden="true"
                />
                {/* Overlay escuro ajustável */}
                <div
                    className="absolute inset-0 backdrop-blur-[2px]"
                    style={{
                        backgroundColor: `rgba(17,24,39,${darkAlpha})`, // base gray-900 com alpha
                    }}
                    aria-hidden="true"
                />
                {/* Radial highlight suave */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(circle at center, rgba(255,255,255,0.12), transparent 70%)",
                    }}
                    aria-hidden="true"
                />
                {/* Gradiente extra opcional (de baixo para cima) */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))",
                        mixBlendMode: "normal",
                    }}
                    aria-hidden="true"
                />
            </div>

            <div className={wrapper}>
                {title && (
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                        {title}
                    </h2>
                )}
                {subtitle && (
                    <p className="mt-4 max-w-3xl mx-auto text-gray-300 text-sm md:text-base leading-relaxed">
                        {subtitle}
                    </p>
                )}

                <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {members.map((m, i) => (
                        <GroupMemberCard key={m.id} member={m} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}