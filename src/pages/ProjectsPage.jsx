import { useLayoutEffect, useRef, useState } from 'react';
import { PROJECTS, STATUS_COLORS } from '../data/projectsData';
import ProjectModal from '../components/ui/ProjectModal';
import TiltCard from '../components/ui/TiltCard';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useProjectsMotion } from '../hooks/useProjectsMotion';
import { layoutTop } from '../utils/scrollRevealBounds';
import '../styles/projects-layout.css';

const DISCIPLINES = [{ id: 'all', label: 'All work' }, { id: 'web', label: 'Web' }, { id: 'desktop', label: 'Desktop' }, { id: 'game', label: 'Games' }];

export function ProjectArrow() {
    return <svg className="projects-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function Reveal({ children, className = '' }) {
    return <div className={`projects-reveal-anchor ${className}`} data-projects-anchor><div data-projects-reveal>{children}</div></div>;
}

function ProjectCard({ project, onOpen }) {
    const gesture = useRef({ x: 0, y: 0, moved: false });
    const begin = event => { if (event.isPrimary) gesture.current = { x: event.clientX, y: event.clientY, moved: false }; };
    const move = event => {
        if (event.pointerType !== 'mouse' && Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 8) gesture.current.moved = true;
    };
    const activate = event => { if (event.detail === 0 || !gesture.current.moved) onOpen(); };
    return <article className="projects-entry" data-projects-anchor>
        <div className="projects-card-face" data-projects-reveal data-projects-3d>
            <TiltCard className="projects-card-tilt" style={{ display: 'block' }} tiltAmount={4} scale={1} glare={false} highlightOnTouch>
                <button type="button" className="projects-card" aria-label={`Open ${project.title} project`} onPointerDown={begin} onPointerMove={move} onPointerCancel={() => { gesture.current.moved = true; }} onClick={activate}>
                    <div className="projects-card-info">
                        <div className="projects-card-topline"><span>{project.id} / {project.categoryLabel}</span><span className="projects-status" style={{ '--project-status': STATUS_COLORS[project.status] }}>{project.status.replace(/_/g, ' ')}</span></div>
                        <h3 className="projects-card-name">{project.title}</h3>
                        <p className="projects-card-copy">{project.shortDesc}</p>
                        <div className="projects-card-stack">{project.stack.map(tool => <span key={tool}>{tool}</span>)}</div>
                        <span className="projects-card-open">View project <ProjectArrow /></span>
                    </div>
                    <div className="projects-card-visual" aria-hidden="true">
                        <div className="projects-preview-window">
                            <div className="projects-window-bar"><span><i /><i /><i /></span><span>{project.categoryLabel}</span><span>{project.id}</span></div>
                            <img src={project.images[0]} alt="" width="800" height="500" loading="lazy" decoding="async" draggable="false" />
                        </div>
                        <span className="projects-preview-caption">{String(project.images.length).padStart(2, '0')} views / {project.role}</span>
                    </div>
                </button>
            </TiltCard>
        </div>
    </article>;
}

export default function ProjectsPage({ selectedProject, onSelectProject, motionReady = true }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [discipline, setDiscipline] = useState('all');
    const pageRef = useRef(null);
    const listScroll = useRef(0);
    const reducedMotion = useReducedMotion();
    const query = searchQuery.trim().toLowerCase();
    const filteredProjects = PROJECTS.filter(project => (discipline === 'all' || project.category === discipline)
        && (!query || [project.name, project.title, project.role, project.status, project.categoryLabel, ...project.stack].some(value => value.toLowerCase().includes(query))));
    const revision = selectedProject ? `detail:${selectedProject.id}` : `list:${filteredProjects.map(project => project.id).join(',')}`;

    useLayoutEffect(() => {
        const panel = pageRef.current?.closest('.portfolio-overlay-panel');
        if (panel) panel.scrollTop = selectedProject ? 0 : listScroll.current;
    }, [selectedProject]);
    useProjectsMotion(pageRef, motionReady, revision, reducedMotion);

    const openProject = project => {
        listScroll.current = pageRef.current.closest('.portfolio-overlay-panel').scrollTop;
        onSelectProject(project);
    };
    const explore = () => {
        const panel = pageRef.current.closest('.portfolio-overlay-panel');
        panel.scrollTo({ top: layoutTop(pageRef.current.querySelector('.projects-controls-anchor'), panel), behavior: reducedMotion ? 'instant' : 'smooth' });
    };

    return <div className={`projects-page${selectedProject ? ' projects-page--detail' : ''}`} ref={pageRef}>
        <div className="projects-scroll-progress" aria-hidden="true"><span className="projects-scroll-progress-fill" /></div>
        {selectedProject ? <ProjectModal key={selectedProject.id} project={selectedProject} /> : <>
            <header className="projects-hero">
                <div className="projects-hero-copy">
                    <Reveal className="projects-hero-kicker"><p className="projects-eyebrow">A selection of things I’ve made</p></Reveal>
                    <Reveal className="projects-hero-heading"><h2 className="projects-title">Ideas, made<br /><em>real.</em></h2></Reveal>
                    <Reveal className="projects-hero-description"><p className="projects-intro">From the first sketch to the final build. A collection of interfaces, applications, and small experiments in making things work.</p></Reveal>
                    <Reveal className="projects-hero-actions"><div className="projects-hero-bottom"><div className="projects-totals"><strong>{String(PROJECTS.length).padStart(2, '0')}<span>Projects</span></strong><span className="projects-stat-rule" /><strong>03<span>Disciplines</span></strong></div><button type="button" className="projects-explore" onClick={explore}>Explore work <ProjectArrow /></button></div></Reveal>
                </div>
            </header>
            <div className="projects-controls-anchor" data-projects-anchor>
                <section className="projects-controls" aria-label="Browse projects" data-projects-reveal>
                    <div className="projects-index-row"><span className="projects-eyebrow">Explore the collection</span><span role="status" aria-live="polite">{String(filteredProjects.length).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')} projects</span></div>
                    <div className="projects-search"><label className="sr-only" htmlFor="projects-search">Search projects</label><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" /><path d="m13 13 4 4" stroke="currentColor" /></svg><input id="projects-search" type="search" autoComplete="off" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search by name, stack, status, or role…" />{searchQuery && <button type="button" aria-label="Clear project search" onClick={() => setSearchQuery('')}>Clear</button>}</div>
                    <div className="projects-filters" role="group" aria-label="Filter projects by discipline">{DISCIPLINES.map(item => <button type="button" key={item.id} aria-pressed={discipline === item.id} onClick={() => setDiscipline(item.id)}><span>{item.label}</span><span>{String(PROJECTS.filter(project => item.id === 'all' || project.category === item.id).length).padStart(2, '0')}</span></button>)}</div>
                </section>
            </div>
            <div className="projects-list">
                {filteredProjects.length ? filteredProjects.map(project => <ProjectCard key={project.id} project={project} onOpen={() => openProject(project)} />) : <Reveal className="projects-empty"><p className="projects-eyebrow">No matching projects</p><h3>Try a different angle.</h3><p>Search another name, tool, status, or role.</p><button type="button" onClick={() => { setSearchQuery(''); setDiscipline('all'); }}>Reset filters</button></Reveal>}
            </div>
        </>}
    </div>;
}
