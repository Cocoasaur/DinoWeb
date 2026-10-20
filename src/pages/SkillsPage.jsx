import { useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSkillsMotion } from '../hooks/useSkillsMotion';
import { SKILL_CATEGORIES, SKILL_COUNT } from '../data/skills';
import { layoutTop } from '../utils/scrollRevealBounds';
import '../styles/skills-layout.css';

function Arrow() {
    return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="skills-arrow">
        <path d="M4 16 16 4M4 4h12v12" stroke="currentColor" strokeWidth="1.3" />
    </svg>;
}

function LayerDrawing({ type }) {
    return <svg className="skills-layer-drawing" viewBox="0 0 120 100" fill="none" aria-hidden="true">
        {type === 'frontend' && <>
            <rect x="16" y="17" width="88" height="66" rx="2" />
            <path d="M16 31h88M29 24h1m7 0h1m7 0h1M28 43h23v28H28zm35 0h28M63 55h28M63 67h18" />
        </>}
        {type === 'backend' && <>
            <path d="m40 28-23 22 23 22m40-44 23 22-23 22M68 19 51 81" />
            <circle cx="60" cy="50" r="44" className="skills-drawing-orbit" />
        </>}
        {type === 'database' && <>
            <ellipse cx="60" cy="24" rx="34" ry="12" />
            <path d="M26 24v48c0 7 15 12 34 12s34-5 34-12V24M26 48c0 7 15 12 34 12s34-5 34-12" />
            <path d="M26 64c0 7 15 12 34 12s34-5 34-12" className="skills-drawing-orbit" />
        </>}
        {type === 'tools' && <>
            <path d="m60 10 43 25v30L60 90 17 65V35L60 10Zm0 0v30m43-5L60 60 17 35m43 25v30M39 23l43 25M39 77V47" />
        </>}
    </svg>;
}

function StackSculpture({ active, expanded, onExpand }) {
    return <div className="skills-specimen">
        <div className="skills-specimen-label"><span data-skills-reveal>Four layers. One toolkit.</span><span aria-hidden="true" data-skills-reveal>FIG. 02</span></div>
        <div className="skills-stack-stage" aria-hidden="true" data-skills-anchor>
            <div className="skills-stack-visual" data-skills-reveal>
                <div className="skills-stack-grid" />
                <span className="skills-axis skills-axis--x">X</span>
                <span className="skills-axis skills-axis--y">Y</span>
                <span className="skills-axis skills-axis--z">Z</span>
                <div className="skills-stack-scroll">
                    <div className="skills-stack-rig">
                        {SKILL_CATEGORIES.map((category, index) => <div
                            key={category.id}
                            className="skills-stack-layer"
                            data-layer={category.id}
                            data-active={active === 'all' || active === category.id}
                            style={{ transform: `translateZ(${(3 - index) * 28}px)` }}
                        >
                            <div className="skills-layer-rule"><span>{category.number}</span><span>{category.short}</span><Arrow /></div>
                            <LayerDrawing type={category.id} />
                            <div className="skills-layer-bottom"><span>{category.title}</span><span>{String(category.skills.length).padStart(2, '0')} tools</span></div>
                        </div>)}
                    </div>
                </div>
                <span className="skills-stack-origin">+</span>
            </div>
        </div>
        <div className="skills-specimen-controls">
            <span className="skills-specimen-caption" data-skills-reveal>A toolkit, in perspective.</span>
            <button type="button" className="skills-spread-button" data-skills-reveal aria-pressed={expanded} onClick={onExpand}>
                <span aria-hidden="true">{expanded ? '−' : '+'}</span> {expanded ? 'Bring together' : 'Spread layers'}
            </button>
        </div>
    </div>;
}

function SkillSection({ category, isDark }) {
    return <section className="skills-category" aria-labelledby={`skills-${category.id}-heading`}>
        <div className="skills-category-intro">
            <div className="skills-section-copy">
                <div className="skills-eyebrow" data-skills-reveal><span>{category.number} / {category.title}</span><span>{String(category.skills.length).padStart(2, '0')}</span></div>
                <h3 data-skills-reveal id={`skills-${category.id}-heading`}>{category.heading}</h3>
                <p data-skills-reveal>{category.description}</p>
                <span className="skills-category-arrow" data-skills-reveal aria-hidden="true"><Arrow /></span>
            </div>
        </div>
        <ul className="skills-tool-grid" aria-label={`${category.title} technologies`}>
            {category.skills.map((skill, index) => <li key={skill.name} className="skills-tool-cell" data-skills-anchor>
                <div className="skills-tool-face" data-skills-reveal>
                    <div className="skills-tool-content">
                        <span className="skills-tool-number" aria-hidden="true">{category.number}.{String(index + 1).padStart(2, '0')}</span>
                        <img src={isDark && skill.darkIcon ? skill.darkIcon : skill.icon} alt="" width="36" height="36" loading="lazy" decoding="async" draggable="false" />
                        <span className="skills-tool-name">{skill.name}</span>
                        <span className="skills-tool-kind">{skill.kind}</span>
                    </div>
                </div>
            </li>)}
        </ul>
    </section>;
}

export default function SkillsPage({ motionReady = true }) {
    const pageRef = useRef(null);
    const indexRef = useRef(null);
    const { isDark } = useTheme();
    const reducedMotion = useReducedMotion();
    const [active, setActive] = useState('all');
    const [expanded, setExpanded] = useState(true);
    const visible = SKILL_CATEGORIES.filter(category => active === 'all' || active === category.id);
    const visibleCount = visible.reduce((total, category) => total + category.skills.length, 0);
    useSkillsMotion(pageRef, motionReady, active, expanded, reducedMotion);

    const browse = () => {
        const scroller = pageRef.current?.closest('.portfolio-overlay-panel');
        if (scroller && indexRef.current) {
            scroller.scrollTo({ top: layoutTop(indexRef.current, scroller), behavior: reducedMotion ? 'instant' : 'smooth' });
        }
    };

    return <div className="skills-page" ref={pageRef}>
        <div className="skills-scroll-progress" aria-hidden="true"><span className="skills-scroll-progress-fill" /></div>
        <div className="skills-masthead"><span data-skills-reveal>02 / Capabilities</span><span data-skills-reveal>Built layer by layer</span></div>
        <header className="skills-hero">
            <div className="skills-hero-copy">
                <p className="skills-kicker" data-skills-reveal>The things I build with</p>
                <h2 className="skills-title" data-skills-reveal>Skills in<br /><em>perspective.</em></h2>
                <p className="skills-hero-description" data-skills-reveal>A collection of languages, libraries, and tools. Different pieces, brought together to make something work.</p>
                <div className="skills-hero-bottom">
                    <div className="skills-totals"><strong data-skills-reveal>{SKILL_COUNT}<span>tools</span></strong><span className="skills-total-divider" data-skills-reveal /><strong data-skills-reveal>04<span>disciplines</span></strong></div>
                    <button type="button" className="skills-browse-button" data-skills-reveal onClick={browse}>Explore toolkit <Arrow /></button>
                </div>
            </div>
            <StackSculpture active={active} expanded={expanded} onExpand={() => setExpanded(value => !value)} />
        </header>
        <div className="skills-index-bar" ref={indexRef}>
            <div className="skills-index-heading"><span data-skills-reveal>Explore the toolkit</span><span className="skills-index-count" data-skills-reveal role="status" aria-live="polite">{visibleCount} tools / {active === 'all' ? 'all disciplines' : visible[0].title.toLowerCase()}</span></div>
            <div className="skills-filters" role="group" aria-label="Filter skills by discipline">
                <button type="button" className="skills-filter" data-skills-reveal aria-pressed={active === 'all'} aria-controls="skills-catalogue" onClick={() => setActive('all')}><span>All skills</span><span>{SKILL_COUNT}</span></button>
                {SKILL_CATEGORIES.map(category => <button key={category.id} type="button" className="skills-filter" data-skills-reveal aria-pressed={active === category.id} aria-controls="skills-catalogue" onClick={() => setActive(category.id)}><span>{category.title}</span><span>{String(category.skills.length).padStart(2, '0')}</span></button>)}
            </div>
        </div>
        <div className="skills-catalogue" id="skills-catalogue">
            {visible.map(category => <SkillSection key={category.id} category={category} isDark={isDark} />)}
        </div>
        <footer className="skills-footer">
            <div className="skills-footer-copy"><span className="skills-kicker" data-skills-reveal>The list keeps growing.</span><p data-skills-reveal>Always learning.<br /><em>Always building.</em></p></div>
            <span className="skills-footer-mark" data-skills-reveal aria-hidden="true"><Arrow /></span>
        </footer>
    </div>;
}
