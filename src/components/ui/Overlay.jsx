import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import OverlayNavIcon from './OverlayNavIcon';
import { PAGE_LOADERS } from '../../utils/prefetchPages';
import { getCubeTransition } from '../../utils/cubeTransition';

const AboutPage = lazy(PAGE_LOADERS.about);
const ContactsPage = lazy(PAGE_LOADERS.contacts);
const ProjectsPage = lazy(PAGE_LOADERS.projects);
const SkillsPage = lazy(PAGE_LOADERS.skills);

// Commit the actual page before beginning the dissolve; never fade a skeleton.
function ReadyContent({ onReady, children }) {
    useEffect(onReady, [onReady]);
    return children;
}

const PAGE_MAP = {
    about: <AboutPage />,
    skills: <SkillsPage />,
    contacts: <ContactsPage />,
};

export default function Overlay({
    phase,
    faceName,
    onClose,
    onCloseComplete,
    onOpenComplete,
    reduceEffects,
    reducedMotion,
    renderCloseButton,
    selectedProject,
    onSelectProject,
}) {
    const [entering, setEntering] = useState(false);
    const scrollPanelRef = useRef(null);
    const transition = getCubeTransition(reduceEffects, reducedMotion);
    const isVisible = (phase === 'fading-in' && entering) || phase === 'open';
    const fading = phase === 'fading-in' || phase === 'fading-out';
    const complete = useCallback(() => {
        if (phase === 'fading-in' && entering) onOpenComplete?.();
        if (phase === 'fading-out') onCloseComplete?.();
    }, [phase, entering, onOpenComplete, onCloseComplete]);
    const pageReady = useCallback(() => {
        // Two frames establish the starting opacity even with a cached chunk.
        let second = 0;
        const first = requestAnimationFrame(() => {
            second = requestAnimationFrame(() => setEntering(true));
        });
        return () => {
            cancelAnimationFrame(first);
            cancelAnimationFrame(second);
        };
    }, []);

    useEffect(() => {
        if (!fading || (phase === 'fading-in' && !entering)) return;
        // Fallback for reduced motion, an interrupted transition, or a hidden tab.
        const timer = setTimeout(complete, transition.fadeMs + 80);
        return () => clearTimeout(timer);
    }, [fading, phase, entering, transition.fadeMs, complete]);

    // ── RESET SCROLL TO TOP WHENEVER selectedProject CHANGES ──
    useEffect(() => {
        if (selectedProject && scrollPanelRef.current) {
            scrollPanelRef.current.scrollTop = 0;
        }
    }, [selectedProject]);

    const dur = `${transition.fadeMs}ms`;
    const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';

    const pageContent = faceName === 'projects'
        ? <ProjectsPage selectedProject={selectedProject} onSelectProject={onSelectProject} />
        : (PAGE_MAP[faceName] ?? <p style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-dim)' }}>No data found.</p>);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            data-phase={phase}
            role="dialog"
            aria-modal="true"
            aria-label={`${faceName || 'Portfolio'} details`}
            style={{
                opacity: isVisible ? 1 : 0,
                transition: `opacity ${dur} ${ease}`,
                willChange: fading ? 'opacity' : undefined,
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
            onTransitionEnd={(event) => {
                if (event.target === event.currentTarget && event.propertyName === 'opacity') complete();
            }}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: 'var(--void-bg)',
                }}
            />
            <div
                className={`absolute inset-0 pointer-events-none${reduceEffects ? '' : ' overlay-grid-drift'}`}
                style={{
                    backgroundImage: `
                        linear-gradient(var(--void-overlay-grid) 1px, transparent 1px),
                        linear-gradient(90deg, var(--void-overlay-grid) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    inset: reduceEffects ? 0 : '-40px',
                    opacity: 0.6,
                }}
            />
            <div
                ref={scrollPanelRef}
                className="portfolio-overlay-panel relative w-[90vw] max-w-5xl max-h-[85vh] border overlay-scroll"
                style={{
                    backgroundColor: 'var(--void-surface)',
                    borderColor: 'var(--void-border)',
                    maxHeight: '85dvh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                {renderCloseButton ? renderCloseButton({ onClose }) : (
                    <button
                        type="button"
                        aria-label={`Close ${faceName || 'portfolio'} details`}
                        onClick={onClose}
                        className="portfolio-overlay-close sticky top-5 right-5 z-20 ml-auto text-xl leading-none w-10 h-10 flex items-center justify-center border transition-all duration-300 cursor-pointer"
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
                        <OverlayNavIcon variant="close" />
                    </button>
                )}
                <div className="portfolio-overlay-content p-12 pt-8">
                    <Suspense fallback={
                        <div className="animate-pulse h-32 rounded" style={{ backgroundColor: 'var(--void-border)' }} />
                    }>
                        <ReadyContent onReady={pageReady}>{pageContent}</ReadyContent>
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
