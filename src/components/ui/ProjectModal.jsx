import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';
import ImageCarousel from './ImageCarousel';
import OverlayNavIcon from './OverlayNavIcon';
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
                loading="lazy"
                decoding="async"
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
            decoding="async"
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

    const [lightboxIndex, setLightboxIndex] = useState(null);

    const totalImages = images?.length || imageCount || 0;

    useEffect(() => {
        if (lightboxIndex === null) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowRight' && lightboxIndex < totalImages - 1) setLightboxIndex(lightboxIndex + 1);
            if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxIndex, totalImages]);

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
                <ImageCarousel
                    images={images}
                    imageCount={imageCount}
                    className="project-modal-carousel"
                    onImageClick={setLightboxIndex}
                    keyboardDisabled={lightboxIndex !== null}
                />
            </div>

            {/* ── Screenshot lightbox — portaled to <body> so the
                overlay panel's transform can't contain it ── */}
            {lightboxIndex !== null && createPortal(
                <div
                    className="cert-lightbox fixed inset-0 z-[150] flex items-center justify-center"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(6px)',
                    }}
                    onClick={() => setLightboxIndex(null)}
                >
                    <div
                        className="cert-lightbox-in relative flex items-center justify-center max-w-[92vw] max-h-[88vh] border"
                        style={{ borderColor: 'var(--void-border)', boxShadow: '0 16px 64px rgba(0,0,0,0.5)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Image wrapper — anchors the arrows to the picture's
                            own edges so they stay put regardless of image size */}
                        <div
                            className="lightbox-figure relative inline-flex"
                        >
                            {/* Prev arrow — glued outside the image */}
                            {totalImages > 1 && (
                                <button
                                    type="button"
                                    aria-label="Previous screenshot"
                                    disabled={lightboxIndex === 0}
                                    onClick={() => setLightboxIndex(lightboxIndex - 1)}
                                    className="lightbox-arrow lightbox-arrow--prev absolute top-1/2 -translate-y-1/2 w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center border transition-all duration-200 z-10 left-2 lg:-left-[52px]"
                                    style={{
                                        backgroundColor: 'var(--void-surface-80)',
                                        borderColor: 'var(--void-border)',
                                        color: 'var(--void-text-full)',
                                        opacity: lightboxIndex === 0 ? 0.4 : 1,
                                        cursor: lightboxIndex === 0 ? 'default' : 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        if (lightboxIndex !== 0) e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--void-border)';
                                    }}
                                >
                                    ←
                                </button>
                            )}

                            <img
                                src={images[lightboxIndex]}
                                alt={`${name} screenshot ${lightboxIndex + 1}`}
                                className="max-w-[92vw] max-h-[88vh] object-contain"
                                draggable={false}
                            />

                            {/* Next arrow — glued outside the image */}
                            {totalImages > 1 && (
                                <button
                                    type="button"
                                    aria-label="Next screenshot"
                                    disabled={lightboxIndex === totalImages - 1}
                                    onClick={() => setLightboxIndex(lightboxIndex + 1)}
                                    className="lightbox-arrow lightbox-arrow--next absolute top-1/2 -translate-y-1/2 w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center border transition-all duration-200 z-10 right-2 lg:-right-[52px]"
                                    style={{
                                        backgroundColor: 'var(--void-surface-80)',
                                        borderColor: 'var(--void-border)',
                                        color: 'var(--void-text-full)',
                                        opacity: lightboxIndex === totalImages - 1 ? 0.4 : 1,
                                        cursor: lightboxIndex === totalImages - 1 ? 'default' : 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        if (lightboxIndex !== totalImages - 1) e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--void-border)';
                                    }}
                                >
                                    →
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Close button — floats at the viewport corner, outside the image box */}
                    <button
                        type="button"
                        aria-label="Close screenshot viewer"
                        className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center border cursor-pointer"
                        style={{
                            backgroundColor: 'var(--void-surface-80)',
                            borderColor: 'var(--void-border)',
                            color: 'var(--void-text-full)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--void-surface)';
                            e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'var(--void-surface-80)';
                            e.currentTarget.style.borderColor = 'var(--void-border)';
                        }}
                        onClick={() => setLightboxIndex(null)}
                    >
                        <OverlayNavIcon variant="close" />
                    </button>
                </div>,
                document.body
            )}

            {/* ══ SECTION DIVIDER ══ */}
            <div className="w-full h-px mb-10" style={{ backgroundColor: 'var(--void-border)' }} />

            {/* ══ BOTTOM SECTION — Tools_Used (left) + Parameters (right) ══ */}
            <div className="grid grid-cols-1 min-[1024px]:grid-cols-2 gap-10 min-[1024px]:gap-14">

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