import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { PROJECTS } from '../../data/projectsData';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import TiltCard from './TiltCard';

gsap.registerPlugin(useGSAP);

function GalleryArrow({ previous = false }) {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={previous ? { transform: 'rotate(180deg)' } : undefined}><path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

export default function ProjectShowcase({ onOpen }) {
    const [index, setIndex] = useState(0);
    const surface = useRef(null);
    const direction = useRef(1);
    const gesture = useRef(null);
    const reducedMotion = useReducedMotion();
    const project = PROJECTS[index];
    const select = next => {
        direction.current = next < index ? -1 : 1;
        setIndex((next + PROJECTS.length) % PROJECTS.length);
    };
    useGSAP(() => {
        if (reducedMotion) return;
        gsap.fromTo(surface.current, { opacity: 0, x: direction.current * 18, rotationY: direction.current * 5, z: -20 }, {
            opacity: 1, x: 0, rotationY: 0, z: 0, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity',
        });
    }, { scope: surface, dependencies: [index, reducedMotion], revertOnUpdate: true });

    const startSwipe = event => {
        if (event.isPrimary && event.pointerType !== 'mouse') gesture.current = { x: event.clientX, y: event.clientY };
    };
    const finishSwipe = event => {
        const start = gesture.current;
        gesture.current = null;
        if (!start) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) select(index + (dx < 0 ? 1 : -1));
    };
    return <section className="projects-specimen" data-projects-anchor aria-label="Project showcase" aria-roledescription="carousel" onKeyDown={event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            select(index + (event.key === 'ArrowLeft' ? -1 : 1));
        }
    }}>
        <div className="projects-specimen-label" data-projects-anchor><span data-projects-reveal>Selected projects</span><span className="projects-showcase-position" aria-live="polite" aria-atomic="true" data-projects-reveal>{project.title} / {String(index + 1).padStart(2, '0')} of {String(PROJECTS.length).padStart(2, '0')}</span></div>
        <div className="projects-hero-art" data-projects-reveal data-projects-3d>
            <div className="projects-hero-grid" aria-hidden="true" />
            <TiltCard className="projects-hero-tilt" style={{ display: 'block' }} tiltAmount={5} perspective={1400} scale={1} glare={false} highlightOnTouch>
                <div className="projects-hero-perspective" onPointerDown={startSwipe} onPointerUp={finishSwipe} onPointerCancel={() => { gesture.current = null; }}>
                    <div className="projects-hero-window" ref={surface}>
                        <div className="projects-window-bar"><span><i /><i /><i /></span><span>{project.title}</span><span>{project.id}</span></div>
                        <img src={project.images[0]} alt={`${project.title} application preview`} width="800" height="500" decoding="async" draggable="false" />
                        <span className="projects-hero-window-caption">{project.categoryLabel}</span>
                    </div>
                </div>
            </TiltCard>
        </div>
        <div className="projects-showcase-controls" data-projects-anchor><div data-projects-reveal>
            <button type="button" aria-label="Previous project" onClick={() => select(index - 1)}><GalleryArrow previous /></button>
            <div className="projects-showcase-selectors" role="group" aria-label="Choose showcase project">{PROJECTS.map((item, itemIndex) => <button key={item.id} type="button" aria-label={`Show ${item.title}`} aria-pressed={itemIndex === index} onClick={() => select(itemIndex)}><span aria-hidden="true">{item.id}</span></button>)}</div>
            <button type="button" aria-label="Next project" onClick={() => select(index + 1)}><GalleryArrow /></button>
        </div></div>
        <div className="projects-specimen-footer" data-projects-anchor><button className="projects-showcase-open" type="button" onClick={() => onOpen(project)} data-projects-reveal>View {project.title}</button><span data-projects-reveal>Swipe to browse / drag to tilt</span></div>
    </section>;
}
