import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import dinoIcon from '../../assets/brand/dino-icon.png';
import { useAssetPreloader } from '../../hooks/useAssetPreloader';

const FLASH_GUARD_MS = 350;
const FADE_MS = 600;
const TICK_COUNT = 4;

export default function BootScreen() {
    const { progress, done } = useAssetPreloader();
    const [phase, setPhase] = useState('booting');
    const mountedAtRef = useRef(0);
    const phaseTimerRef = useRef(0);

    useEffect(() => {
        mountedAtRef.current = performance.now();
    }, []);

    useEffect(() => {
        if (!done || phase !== 'booting') return;

        let cancelled = false;
        const settlePaint = new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });

        settlePaint.then(() => {
            if (cancelled) return;
            const remain = FLASH_GUARD_MS - (performance.now() - mountedAtRef.current);
            phaseTimerRef.current = window.setTimeout(
                () => setPhase('fading'),
                Math.max(0, remain)
            );
        });

        return () => {
            cancelled = true;
            window.clearTimeout(phaseTimerRef.current);
        };
    }, [done, phase]);

    useEffect(() => {
        if (phase !== 'fading') return;
        phaseTimerRef.current = window.setTimeout(() => setPhase('done'), FADE_MS);
        return () => window.clearTimeout(phaseTimerRef.current);
    }, [phase]);

    useLayoutEffect(() => {
        if (phase !== 'done') return;
        document.documentElement.classList.add('home-entered');
    }, [phase]);

    if (phase === 'done') return null;

    const ticksFilled = Math.round(progress * TICK_COUNT);

    return (
        <div className={`boot-screen${phase === 'fading' ? ' boot-screen--fading' : ''}`}>
            <div className="boot-screen__grid" />
            <div className="boot-screen__grid boot-screen__grid--drift" />
            <div className="boot-screen__stage">
                <div className="boot-screen__brackets" aria-hidden="true">
                    <span className="boot-screen__bracket boot-screen__bracket--tl" />
                    <span className="boot-screen__bracket boot-screen__bracket--tr" />
                    <span className="boot-screen__bracket boot-screen__bracket--bl" />
                    <span className="boot-screen__bracket boot-screen__bracket--br" />
                </div>
                <img
                    src={dinoIcon}
                    alt=""
                    draggable={false}
                    className="boot-screen__icon"
                />
                <div className="boot-screen__progress" aria-hidden="true">
                    {Array.from({ length: TICK_COUNT }, (_, i) => (
                        <span key={i} className={i < ticksFilled ? 'boot-screen__tick--on' : ''} />
                    ))}
                </div>
                <p className="boot-screen__label">ARCHIVE_SYSTEM</p>
                <p className="boot-screen__sub-label">INITIALIZE SEQUENCE</p>
            </div>
        </div>
    );
}