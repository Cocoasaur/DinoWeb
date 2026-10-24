import { useCallback, useEffect, useRef, useState } from 'react';
import BootScreen from '../components/ui/BootScreen';
import Overlay from '../components/ui/Overlay';
import { useTheme } from '../context/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import SplineScene from './SplineScene';
import { resolveSplineScene, SPLINE_DESTINATIONS } from './splineConfig';
import './spline-prototype.css';

const config = resolveSplineScene(import.meta.env.VITE_SPLINE_SCENE_URL, import.meta.env.BASE_URL, window.location.origin);

function Arrow() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>;
}

export default function SplinePrototype() {
    const { theme, isDark, toggle } = useTheme();
    const reducedMotion = useReducedMotion();
    const [page, setPage] = useState(null);
    const [phase, setPhase] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [paused, setPaused] = useState(false);
    const [visible, setVisible] = useState(() => !document.hidden);
    const [attempt, setAttempt] = useState(0);
    const navigationRef = useRef(null);
    const openPage = useCallback(destination => {
        setPage(destination);
        setPhase('fading-in');
    }, []);
    const closePage = useCallback(() => setPhase('fading-out'), []);
    const finishClose = useCallback(() => {
        setPhase(null);
        setSelectedProject(null);
        // The scene stays mounted and paused until the overlay has faded out.
        // Closing cannot reset its camera by constructing a fresh runtime.
    }, []);
    const finishOpen = useCallback(() => setPhase('open'), []);

    useEffect(() => {
        const update = () => setVisible(!document.hidden);
        document.addEventListener('visibilitychange', update);
        return () => document.removeEventListener('visibilitychange', update);
    }, []);

    useEffect(() => {
        const previous = document.title;
        document.title = 'DinoWeb — Spline experiment';
        return () => { document.title = previous; };
    }, []);

    useEffect(() => {
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#002451' : '#f2f2f2');
    }, [isDark]);

    useEffect(() => {
        // Restore focus after React removes inert from the background, not in
        // the transition callback where the DOM may still be inert.
        if (!phase && page) navigationRef.current?.querySelector(`[data-destination="${page}"]`)?.focus();
    }, [phase, page]);

    useEffect(() => {
        if (!phase) return;
        const dialog = document.querySelector('[role="dialog"]');
        if (phase === 'open') dialog?.querySelector('button')?.focus();
        const onKeyDown = event => {
            if (event.key === 'Escape') { event.preventDefault(); closePage(); }
            if (event.key !== 'Tab') return;
            const controls = [...(dialog?.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]') || [])]
                .filter(element => element.getClientRects().length && !element.closest('[inert]'));
            const first = controls[0];
            const last = controls.at(-1);
            if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
                event.preventDefault(); last?.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
                event.preventDefault(); first?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [phase, closePage]);

    const sceneEnabled = config.status === 'configured' && !reducedMotion;
    return (
        <>
            <BootScreen ready />
            <main className="spline-prototype" inert={!!phase} aria-hidden={phase ? true : undefined}>
                <header className="spline-lab-header">
                    <a href={import.meta.env.BASE_URL} aria-label="Return to the current portfolio">DinoWeb <span>/ Lab 01</span></a>
                    <div><button type="button" onClick={() => toggle()}>{isDark ? 'Clair obscur' : 'Demain soir bleu'}</button><a href={import.meta.env.BASE_URL}>Back to portfolio <Arrow /></a></div>
                </header>
                <section className="spline-lab-intro" aria-labelledby="spline-title">
                    <div><p className="spline-eyebrow">An experiment in space</p><h1 id="spline-title">A new <br /><em>dimension.</em></h1><p>The same work. A different way to explore it.</p></div>
                    <div className="spline-stage-frame">
                        <div className="spline-stage-caption"><span>Spline / Interactive study</span>{sceneEnabled && <button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume scene' : 'Pause scene'}</button>}</div>
                        {sceneEnabled ? <SplineScene key={attempt} scene={config.url} theme={theme} paused={paused || !!phase || !visible} onSelect={openPage} onRetry={() => setAttempt(value => value + 1)} /> :
                            <div className="spline-scene-message spline-stage-empty" role="status">
                                <span className="spline-eyebrow">{reducedMotion ? 'Reduced motion' : config.status === 'invalid' ? 'Check the scene export' : 'Scene connection pending'}</span>
                                <h2>{reducedMotion ? 'Explore at your own pace.' : config.status === 'invalid' ? 'This scene address needs updating.' : 'Your scene goes here.'}</h2>
                                <p>{reducedMotion ? 'The animated scene is disabled for your motion preference. All portfolio pages remain available below.' : config.status === 'invalid' ? 'Use the .splinecode address from Spline’s Code export. You can keep exploring the portfolio below.' : 'The local integration is ready for your Spline export. Explore the portfolio below while we build the scene.'}</p>
                            </div>}
                        <div className="spline-stage-caption spline-stage-footer"><span>{sceneEnabled ? 'Drag to explore · Tap a panel to open' : 'Four pages. One portfolio.'}</span>{sceneEnabled && <a href="https://spline.design" target="_blank" rel="noopener noreferrer">Made with Spline</a>}</div>
                    </div>
                </section>
                <nav ref={navigationRef} className="spline-page-links" aria-label="Portfolio pages">
                    {SPLINE_DESTINATIONS.map((item, index) => <button type="button" key={item.page} data-destination={item.page} onClick={() => openPage(item.page)}><span className="spline-eyebrow">0{index + 1}</span><span className="spline-page-name">{item.label}<Arrow /></span><span>{item.detail}</span></button>)}
                </nav>
                <footer className="spline-lab-footer"><span>John Jessienel M. Arquesola</span><span>Prototype / Work in progress</span></footer>
            </main>
            {phase && <Overlay phase={phase} faceName={page} onClose={closePage} onCloseComplete={finishClose} onOpenComplete={finishOpen} reduceEffects reducedMotion={reducedMotion} selectedProject={selectedProject} onSelectProject={setSelectedProject} />}
        </>
    );
}
