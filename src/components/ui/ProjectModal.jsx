import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';
import ImageCarousel from './ImageCarousel';
import OverlayNavIcon from './OverlayNavIcon';
import TiltCard from './TiltCard';
import { STATUS_COLORS } from '../../data/projectsData';
import threejsBlackIcon from '../../assets/icons/skills/frontend/Three.js_black.svg';
import threejsWhiteIcon from '../../assets/icons/skills/frontend/Three.js_white.svg';

function Section({ number, title, children, className = '' }) {
    return <section className={`project-section ${className}`}>
        <div className="project-section-heading" data-projects-anchor><h3 data-projects-reveal><span>{number}</span>{title}</h3></div>
        {children}
    </section>;
}

function ToolCell({ name, icon }) {
    return <div className="project-tool-anchor" data-projects-anchor>
        <div data-projects-reveal data-projects-3d>
            <TiltCard className="project-tool-tilt" style={{ display: 'block' }} glare={false} tiltAmount={6} scale={1} highlightOnTouch>
                <div className="project-tool"><img src={icon} alt="" width="28" height="28" loading="lazy" decoding="async" draggable="false" /><span>{name}</span></div>
            </TiltCard>
        </div>
    </div>;
}

export default function ProjectModal({ project }) {
    const { id, title, name, status, fullDesc, tools, role, github, projectURL, images, categoryLabel } = project;
    const { isDark } = useTheme();
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const totalImages = images?.length || 0;
    useEffect(() => {
        if (lightboxIndex === null) return;
        const onKeyDown = event => {
            if (event.key === 'Escape') setLightboxIndex(null);
            if (event.key === 'ArrowRight' && lightboxIndex < totalImages - 1) { event.preventDefault(); setLightboxIndex(lightboxIndex + 1); }
            if (event.key === 'ArrowLeft' && lightboxIndex > 0) { event.preventDefault(); setLightboxIndex(lightboxIndex - 1); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxIndex, totalImages]);

    return <article className="project-modal">
        <header className="project-detail-hero" data-projects-anchor>
            <div className="project-modal-header" data-projects-reveal>
                <p className="projects-eyebrow">Project {id} / {categoryLabel}</p>
                <h2 className="project-modal-title">{title}</h2>
                <div className="project-detail-summary"><p>{role}</p><span className="projects-status" style={{ '--project-status': STATUS_COLORS[status] }}>{status.replace(/_/g, ' ')}</span></div>
            </div>
            <span className="project-detail-number" aria-hidden="true">{id}</span>
        </header>
        <Section number="01" title="The project" className="project-overview">
            <div className="project-overview-copy">{fullDesc.map((paragraph, index) => <div key={index} data-projects-anchor><p data-projects-reveal>{paragraph}</p></div>)}</div>
        </Section>
        <Section number="02" title="A closer look" className="project-gallery">
            <div className="project-gallery-anchor" data-projects-anchor><div className="project-gallery-surface" data-projects-reveal data-projects-3d>
                <ImageCarousel images={images} imageCount={totalImages} className="project-modal-carousel" onImageClick={setLightboxIndex} keyboardDisabled={lightboxIndex !== null} />
            </div></div>
            <p className="project-gallery-note" data-projects-anchor data-projects-reveal>{String(totalImages).padStart(2, '0')} screenshots <span>Swipe to explore / tap to expand</span></p>
        </Section>
        <Section number="03" title="Built with" className="project-toolkit">
            <div className="project-tools">{tools.map(tool => <ToolCell key={tool.name} name={tool.name} icon={tool.name === 'Three.js' ? isDark ? threejsWhiteIcon : threejsBlackIcon : tool.icon} />)}</div>
        </Section>
        <Section number="04" title="Project details" className="project-parameters">
            <div className="project-parameters-body">
                <div data-projects-anchor><dl className="project-facts" data-projects-reveal><div><dt>My role</dt><dd>{role}</dd></div><div><dt>Status</dt><dd>{status.replace(/_/g, ' ')}</dd></div><div><dt>Repository</dt><dd>{github.isPublic ? 'Public' : 'Private'}</dd></div></dl></div>
                <div className="project-links" data-projects-anchor><div data-projects-reveal>
                    {projectURL && <a href={projectURL} target="_blank" rel="noopener noreferrer">Visit live project</a>}
                    {github.isPublic && github.url ? <a href={github.url} target="_blank" rel="noopener noreferrer">View repository on GitHub</a> : <p className="project-private-note">Repository is private</p>}
                    {!projectURL && <p className="project-link-note">This project doesn’t have a hosted web version.</p>}
                </div></div>
            </div>
        </Section>
        {lightboxIndex !== null && createPortal(
            <div className="cert-lightbox project-lightbox fixed inset-0 z-[150] flex items-center justify-center" data-cursor-label="CLOSE" style={{ backgroundColor: 'rgba(0,0,0,.78)', backdropFilter: 'blur(6px)' }} onClick={() => setLightboxIndex(null)}>
                <div className="cert-lightbox-in relative flex items-center justify-center max-w-[92vw] max-h-[88vh] border" data-cursor-label="" style={{ borderColor: 'var(--void-border)' }} onClick={event => event.stopPropagation()}>
                    <div className="lightbox-figure relative inline-flex">
                        <img src={images[lightboxIndex]} alt={`${name} screenshot ${lightboxIndex + 1}`} className="min-w-0 max-w-[92vw] max-h-[88vh] object-contain" draggable={false} />
                        {totalImages > 1 && <><button type="button" aria-label="Previous screenshot" className="lightbox-arrow project-lightbox-prev" disabled={lightboxIndex === 0} onClick={() => setLightboxIndex(lightboxIndex - 1)}>←</button><button type="button" aria-label="Next screenshot" className="lightbox-arrow project-lightbox-next" disabled={lightboxIndex === totalImages - 1} onClick={() => setLightboxIndex(lightboxIndex + 1)}>→</button></>}
                    </div>
                </div>
                <button type="button" aria-label="Close screenshot viewer" className="project-lightbox-close" onClick={() => setLightboxIndex(null)}><OverlayNavIcon variant="close" /></button>
            </div>, document.body
        )}
    </article>;
}
