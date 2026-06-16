import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import ImageCarousel from './ImageCarousel';
import { STATUS_COLORS } from '../../data/projectsData';

// ── GitHub button icon assets ──────────────────────────────────────────────
// Light-dark_Github.png         → dark octocat, for light/white button backgrounds
// Tomorrow_Night_Blue_Github.png → light octocat, for dark/black button backgrounds
import githubIconLight from '../../assets/repoButton/Light-dark_Github.png';
import githubIconDark from '../../assets/repoButton/Tomorrow_Night_Blue_Github.png';

function StatusBadge({ status }) {
    const color = STATUS_COLORS[status] || '#888';
    return (
        <span
            className="project-status-badge inline-flex items-center gap-2 px-3 py-1.5 border text-[11px] tracking-[0.15em] uppercase"
            style={{
                fontFamily: "'Space Grotesk', monospace",
                color: 'var(--void-text-full)',
                borderColor: 'var(--void-border)',
                backgroundColor: 'transparent',
            }}
        >
            <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                }}
            />
            {status}
        </span>
    );
}

function ToolCell({ name, icon }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="flex items-center gap-2 px-3 py-2 border cursor-default select-none"
            style={{
                borderColor: 'var(--void-border)',
                backgroundColor: isHovered ? 'var(--skill-card-bg-hover)' : 'var(--skill-card-bg)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img
                src={icon}
                alt={name}
                className="w-6 h-6 object-contain flex-shrink-0"
                draggable={false}
                style={{
                    filter: isHovered ? 'brightness(1.1)' : 'none',
                    transition: 'filter 0.25s ease',
                }}
            />
            <span
                className="text-[14px]"
                style={{
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--void-text-full)',
                    whiteSpace: 'nowrap',
                }}
            >
                {name}
            </span>
        </div>
    );
}

function GitHubButton({ isPublic, url }) {
    const { isDark } = useTheme();

    const publicBg = isDark ? '#ffffff' : '#0a0a0a';
    const publicFg = isDark ? '#0a0a0a' : '#ffffff';
    const privateBg = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(10,10,10,0.78)';
    const privateFg = isDark ? '#0a0a0a' : '#ffffff';
    const iconSrc = isDark ? githubIconDark : githubIconLight;

    const label = isPublic ? 'VIEW REPOSITORY ON GITHUB' : 'REPOSITORY SET TO PRIVATE';

    const baseStyle = {
        fontFamily: "'Space Grotesk', monospace",
        fontSize: '12px',
        letterSpacing: '0.12em',
        fontWeight: 700,
    };

    const iconEl = (
        <img
            src={iconSrc}
            alt="GitHub"
            width={22}
            height={22}
            draggable={false}
            style={{ objectFit: 'contain', flexShrink: 0 }}
        />
    );

    if (isPublic) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                style={{ ...baseStyle, backgroundColor: publicBg, color: publicFg }}
            >
                {iconEl}
                {label}
            </a>
        );
    }

    return (
        <div
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-lg"
            style={{
                ...baseStyle,
                backgroundColor: privateBg,
                color: privateFg,
                cursor: 'not-allowed',
                opacity: 0.85,
            }}
        >
            {iconEl}
            {label}
        </div>
    );
}

export default function ProjectModal({ project }) {
    const { id, name, status, fullDesc, tools, role, github, projectURL, images, imageCount } = project;

    return (
        <div className="project-modal h-full flex flex-col">

            {/* ── Header ── */}
            <div className="project-modal-header flex flex-wrap items-start gap-4 mb-2">
                <div className="flex-1 min-w-0">
                    <p
                        className="project-modal-label uppercase mb-1 text-[10px] tracking-[0.3em]"
                        style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)' }}
                    >
                        PROJECT_{id}
                    </p>
                    <h2
                        className="project-modal-title text-3xl md:text-4xl font-bold uppercase tracking-[0.15em]"
                        style={{
                            fontFamily: "'Space Grotesk', monospace",
                            color: 'var(--void-text-full)',
                            overflowWrap: 'break-word',
                            wordBreak: 'keep-all',
                            whiteSpace: 'normal',
                        }}
                    >
                        {name.replace(/_/g, '_\u200B')}
                    </h2>
                </div>
                <div className="project-modal-status flex-shrink-0">
                    <StatusBadge status={status} />
                </div>
            </div>

            {/* Header divider */}
            <div className="w-full h-px mb-8" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ══ DESCRIPTION — full width ══ */}
            <div className="mb-10">
                <h3
                    className="uppercase mb-5 text-[10px] tracking-[0.3em]"
                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)' }}
                >
                    DESCRIPTION
                </h3>
                <div className="space-y-5">
                    {fullDesc.map((para, idx) => (
                        <p
                            key={idx}
                            className="text-[14px] leading-[1.75]"
                            style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text)' }}
                        >
                            {para}
                        </p>
                    ))}
                </div>
            </div>

            {/* ── Divider under description ── */}
            <div className="w-full h-px mb-10" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ══ IMAGE CAROUSEL — full width ══ */}
            <div className="mb-10">
                <h3
                    className="uppercase mb-5 text-[10px] tracking-[0.3em]"
                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)' }}
                >
                    PROJECT_SCREENSHOTS
                </h3>
                <ImageCarousel images={images} imageCount={imageCount} className="project-modal-carousel" />
            </div>

            {/* ══ SECTION DIVIDER ══ */}
            <div className="w-full h-px mb-10" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ══ BOTTOM SECTION — Tools_Used (left) + Parameters (right) ══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">

                {/* Left — Tools */}
                <div>
                    <h3
                        className="uppercase mb-5 text-[10px] tracking-[0.3em]"
                        style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)' }}
                    >
                        TOOLS_USED
                    </h3>
                    <div className="border p-3" style={{ borderColor: 'var(--void-border)' }}>
                        <div className="flex flex-wrap gap-2">
                            {tools.map((tool, idx) => (
                                <ToolCell key={idx} name={tool.name} icon={tool.icon} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — Parameters */}
                <div>
                    <h3
                        className="uppercase mb-5 text-[10px] tracking-[0.3em]"
                        style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)' }}
                    >
                        PARAMETERS
                    </h3>
                    <div className="space-y-0">

                        {/* Role row */}
                        <div
                            className="flex justify-between items-center py-3 border-b"
                            style={{ borderColor: 'var(--void-border-dim)' }}
                        >
                            <span
                                className="uppercase text-[10px] tracking-[0.2em]"
                                style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
                            >
                                ROLE
                            </span>
                            <span
                                className="text-[13px]"
                                style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-full)' }}
                            >
                                {role}
                            </span>
                        </div>

                        {/* Project URL row */}
                        <div
                            className="flex justify-between items-center py-3 border-b"
                            style={{ borderColor: 'var(--void-border-dim)' }}
                        >
                            <span
                                className="uppercase text-[10px] tracking-[0.2em]"
                                style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
                            >
                                PROJECT URL
                            </span>
                            {projectURL ? (
                                <a
                                    href={projectURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[13px] transition-colors duration-300 hover:underline"
                                    style={{
                                        fontFamily: "'Inter', sans-serif",
                                        color: 'var(--void-text-full)',
                                        textUnderlineOffset: '3px',
                                    }}
                                >
                                    {projectURL}
                                </a>
                            ) : (
                                <span
                                    className="text-[13px]"
                                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-muted)' }}
                                >
                                    Not Available
                                </span>
                            )}
                        </div>

                        {/* Repo visibility row */}
                        <div
                            className="flex justify-between items-center py-3 border-b mb-6"
                            style={{ borderColor: 'var(--void-border-dim)' }}
                        >
                            <span
                                className="uppercase text-[10px] tracking-[0.2em]"
                                style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
                            >
                                GITHUB REPOSITORY
                            </span>
                            <span
                                className="text-[13px]"
                                style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-full)' }}
                            >
                                {github.isPublic ? 'Public' : 'Private'}
                            </span>
                        </div>

                        {/* GitHub CTA */}
                        <GitHubButton isPublic={github.isPublic} url={github.url} />
                    </div>
                </div>
            </div>
        </div>
    );
}