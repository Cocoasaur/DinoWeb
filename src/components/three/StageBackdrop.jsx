import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useHomeViewportLayout } from '../../hooks/useHomeViewportLayout';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function StageBackdrop({ hidden, paused = false, reduceEffects = false, zoomZ = 0 }) {
    const backdropRef = useRef(null);
    const reducedMotion = useReducedMotion();
    const { isDark } = useTheme();
    const { restingX, restingY, cubeScale } = useHomeViewportLayout();
    const zoomScale = 1 / (1 + zoomZ / 1000);
    const projection = zoomScale / (10 * Math.tan(Math.PI / 8));
    const offset = restingX * projection;
    const left = `calc(50% + var(--portfolio-viewport-height, 100dvh) * ${offset})`;
    const shadowTop = `clamp(0px, calc(50% - var(--portfolio-viewport-height, 100dvh) * ${(restingY - cubeScale * 1.6) * projection}), calc(100% - 48px))`;

    useEffect(() => {
        const backdrop = backdropRef.current;
        const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        let frame = 0;
        let idleTimer = 0;
        let x = 0;
        let y = 0;
        let dragging = false;
        const paint = () => {
            frame = 0;
            // Only compositor transforms change; no React renders or GL planes.
            backdrop.style.setProperty('--floor-tilt-x', `${y * 3}deg`);
            backdrop.style.setProperty('--floor-tilt-z', `${-x * 1.4}deg`);
            backdrop.style.setProperty('--floor-shift-x', `${-x * 18}px`);
            backdrop.style.setProperty('--floor-shift-y', `${y * 8}px`);
            backdrop.style.setProperty('--floor-shadow-x', `${-x * 14}px`);
            backdrop.style.setProperty('--floor-shadow-y', `${y * 5}px`);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(paint);
        };
        const reset = () => {
            clearTimeout(idleTimer);
            x = 0;
            y = 0;
            schedule();
        };
        const move = (event) => {
            if (event.pointerType === 'touch' || !pointerQuery.matches) return;
            if (dragging) return;
            const rect = backdrop.getBoundingClientRect();
            x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
            y = Math.max(-1, Math.min(1, 1 - (event.clientY - rect.top) / rect.height * 2));
            schedule();
            clearTimeout(idleTimer);
            idleTimer = setTimeout(reset, 3000);
        };
        const down = (event) => {
            if (event.pointerType === 'touch') return;
            dragging = true;
            reset();
        };
        const up = (event) => {
            dragging = false;
            move(event);
        };
        const cancel = () => {
            dragging = false;
            reset();
        };
        const leave = (event) => {
            if (!event.relatedTarget) {
                dragging = false;
                reset();
            }
        };
        paint();
        if (reduceEffects || hidden || paused || reducedMotion) return;
        window.addEventListener('pointermove', move, { passive: true });
        window.addEventListener('pointerdown', down, { passive: true });
        window.addEventListener('pointerup', up, { passive: true });
        window.addEventListener('pointercancel', cancel, { passive: true });
        window.addEventListener('pointerout', leave, { passive: true });
        window.addEventListener('blur', cancel);
        pointerQuery.addEventListener('change', cancel);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(idleTimer);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerdown', down);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', cancel);
            window.removeEventListener('pointerout', leave);
            window.removeEventListener('blur', cancel);
            pointerQuery.removeEventListener('change', cancel);
            x = 0;
            y = 0;
            paint();
        };
    }, [hidden, paused, reduceEffects, reducedMotion]);

    return (
        <div ref={backdropRef} className="home-stage-backdrop" aria-hidden="true" style={{ opacity: hidden ? 0 : 1 }}>
            {!reduceEffects && <>
                <div className="home-stage-backdrop__floor" />
                <div className="home-stage-backdrop__pool" style={{ left, background: isDark
                    ? 'radial-gradient(ellipse, rgba(255,255,255,.12), transparent 68%)'
                    : 'radial-gradient(ellipse, rgba(0,0,0,.16), transparent 68%)' }} />
            </>}
            <div className="home-stage-backdrop__shadow" style={{
                left, top: shadowTop,
                width: `calc(var(--portfolio-viewport-height, 100dvh) * ${cubeScale * zoomScale * .78})`,
                height: `calc(var(--portfolio-viewport-height, 100dvh) * ${cubeScale * zoomScale * .12})`,
                background: isDark
                    ? 'radial-gradient(ellipse, rgba(0,0,0,.48), rgba(0,0,0,.24) 22%, rgba(0,0,0,.08) 48%, transparent 72%)'
                    : 'radial-gradient(ellipse, rgba(0,0,0,.32), rgba(0,0,0,.17) 22%, rgba(0,0,0,.055) 48%, transparent 72%)',
            }} />
        </div>
    );
}
