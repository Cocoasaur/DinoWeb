import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';

const AboutPage = lazy(() => import('../../pages/AboutPage'));
const ContactsPage = lazy(() => import('../../pages/ContactsPage'));
const ProjectsPage = lazy(() => import('../../pages/ProjectsPage'));
const SkillsPage = lazy(() => import('../../pages/SkillsPage'));

const PAGE_MAP = {
    about: <AboutPage />,
    skills: <SkillsPage />,
    contacts: <ContactsPage />,
};

export default function Overlay({
    active,
    phase,
    faceName,
    onClose,
    onCloseComplete,
    reducedMotion,
    renderCloseButton,
    selectedProject,
    onSelectProject,
}) {
    const [mounted, setMounted] = useState(false);
    const [entering, setEntering] = useState(false);
    const closeCompleteCalledRef = useRef(false);
    const scrollPanelRef = useRef(null); // ← ref for the scrollable panel

    useEffect(() => {
        if (active) {
            setMounted(true);
            setEntering(false);
            closeCompleteCalledRef.current = false;
        }
    }, [active]);

    useEffect(() => {
        if (!mounted || !active) return;
        const raf = requestAnimationFrame(() => setEntering(true));
        return () => cancelAnimationFrame(raf);
    }, [mounted, active]);

    useEffect(() => {
        if (phase !== 'fading-out') return;
        const duration = reducedMotion ? 100 : 650;
        const timer = setTimeout(() => {
            if (!closeCompleteCalledRef.current) {
                closeCompleteCalledRef.current = true;
                onCloseComplete?.();
            }
        }, duration);
        return () => clearTimeout(timer);
    }, [phase, reducedMotion, onCloseComplete]);

    useEffect(() => {
        if (!active && mounted) {
            const timer = setTimeout(() => {
                setMounted(false);
                setEntering(false);
            }, reducedMotion ? 50 : 100);
            return () => clearTimeout(timer);
        }
    }, [active, mounted, reducedMotion]);

    // ── RESET SCROLL TO TOP WHENEVER selectedProject CHANGES ──
    useEffect(() => {
        if (selectedProject && scrollPanelRef.current) {
            scrollPanelRef.current.scrollTop = 0;
        }
    }, [selectedProject]);

    if (!mounted) return null;

    const isVisible = (phase === 'fading-in' && entering) || phase === 'open';
    const dur = reducedMotion ? '0.05s' : '0.55s';
    const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';

    const pageContent = faceName === 'projects'
        ? <ProjectsPage selectedProject={selectedProject} onSelectProject={onSelectProject} />
        : (PAGE_MAP[faceName] ?? <p style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-dim)' }}>No data found.</p>);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
                opacity: isVisible ? 1 : 0,
                transition: `opacity ${dur} ${ease}`,
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: 'var(--void-bg)',
                    opacity: isVisible ? 1 : 0,
                    transition: `opacity ${dur} ${ease}`,
                }}
            />
            <div
                className="absolute inset-0 pointer-events-none overlay-grid-drift"
                style={{
                    backgroundImage: `
                        linear-gradient(var(--void-overlay-grid) 1px, transparent 1px),
                        linear-gradient(90deg, var(--void-overlay-grid) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    opacity: isVisible ? 0.6 : 0,
                    transition: `opacity ${dur} ${ease}`,
                }}
            />
            {/* Panel container — attach ref here */}
            <div
                ref={scrollPanelRef} // ← attach ref
                className="portfolio-overlay-panel relative w-[90vw] max-w-5xl max-h-[85vh] border overlay-scroll"
                style={{
                    backgroundColor: 'var(--void-surface)',
                    borderColor: 'var(--void-border)',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-16px) scale(1.02)',
                    filter: reducedMotion ? 'none' : (isVisible ? 'blur(0px)' : 'blur(8px)'),
                    transition: reducedMotion
                        ? 'none'
                        : `opacity ${dur} ${ease}, transform ${dur} ${ease}, filter ${dur} ease`,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                {renderCloseButton ? renderCloseButton({ onClose }) : (
                    <button
                        onClick={onClose}
                        className="portfolio-overlay-close sticky top-5 right-5 z-20 ml-auto text-xl w-10 h-10 flex items-center justify-center border transition-all duration-300 cursor-pointer"
                        style={{
                            fontFamily: "'Space Grotesk', monospace",
                            color: 'var(--void-text-full)',
                            backgroundColor: 'var(--void-btn-bg)',
                            borderColor: 'var(--void-btn-border)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--void-surface-80)';
                            e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'var(--void-btn-bg)';
                            e.currentTarget.style.borderColor = 'var(--void-btn-border)';
                        }}
                    >
                        ✕
                    </button>
                )}
                <div className="portfolio-overlay-content p-12 pt-8">
                    <Suspense fallback={
                        <div className="animate-pulse h-32 rounded" style={{ backgroundColor: 'var(--void-border)' }} />
                    }>
                        {pageContent}
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
