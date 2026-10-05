import { useEffect } from 'react';

const clamp = value => Math.max(-1, Math.min(1, value));

// Pointer motion changes compositor transforms only; it never wakes the 3D
// renderer, changes React state, or repaints a gradient on every frame.
export function useHomeGridMotion(viewportRef, { paused, reducedMotion, lowEnd }) {
    useEffect(() => {
        const viewport = viewportRef.current;
        let frame = 0;
        let idleTimer = 0;
        let x = 0;
        let y = 0;
        let rect = viewport.getBoundingClientRect();
        let anchor = null;
        let cancelledTouch = false;
        const touches = new Set();
        const strength = lowEnd ? .7 : 1;
        const paint = () => {
            frame = 0;
            const worldUnit = rect.height / (10 * Math.tan(Math.PI / 8));
            const cameraX = -x * .30 * worldUnit * strength;
            const cameraY = -y * .20 * worldUnit * strength;
            viewport.style.setProperty('--grid-parallax-x', `${(-x * 14 * strength).toFixed(2)}px`);
            viewport.style.setProperty('--grid-parallax-y', `${(-y * 10 * strength).toFixed(2)}px`);
            viewport.style.setProperty('--floor-camera-x', `${cameraX.toFixed(2)}px`);
            viewport.style.setProperty('--floor-camera-y', `${cameraY.toFixed(2)}px`);
            viewport.style.setProperty('--floor-shadow-x', `${cameraX.toFixed(2)}px`);
            viewport.style.setProperty('--floor-shadow-y', `${cameraY.toFixed(2)}px`);
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
        const reset = () => {
            clearTimeout(idleTimer);
            x = 0;
            y = 0;
            schedule();
        };
        paint();
        if (paused || reducedMotion) return;
        const move = event => {
            if (event.pointerType === 'touch') {
                if (cancelledTouch || touches.size !== 1 || anchor?.id !== event.pointerId) return;
                x = clamp((event.clientX - anchor.x) / rect.width * 2);
                y = clamp((anchor.y - event.clientY) / rect.height * 2);
            } else {
                x = clamp((event.clientX - rect.left) / rect.width * 2 - 1);
                y = clamp(1 - (event.clientY - rect.top) / rect.height * 2);
            }
            schedule();
            clearTimeout(idleTimer);
            idleTimer = setTimeout(reset, 3000);
        };
        const down = event => {
            if (event.pointerType !== 'touch') { move(event); return; }
            touches.add(event.pointerId);
            if (touches.size > 1) {
                cancelledTouch = true;
                anchor = null;
                reset();
                return;
            }
            anchor = { id: event.pointerId, x: event.clientX, y: event.clientY };
            reset();
        };
        const up = event => {
            if (event.pointerType !== 'touch') return;
            touches.delete(event.pointerId);
            anchor = null;
            if (!touches.size) cancelledTouch = false;
            reset();
        };
        const cancel = () => {
            touches.clear();
            anchor = null;
            cancelledTouch = false;
            reset();
        };
        const leave = event => { if (!event.relatedTarget && event.pointerType !== 'touch') cancel(); };
        const resize = () => { rect = viewport.getBoundingClientRect(); schedule(); };
        const observer = new ResizeObserver(resize);
        observer.observe(viewport);
        viewport.addEventListener('pointerdown', down, { passive: true });
        window.addEventListener('pointermove', move, { passive: true });
        window.addEventListener('pointerup', up, { passive: true });
        window.addEventListener('pointercancel', up, { passive: true });
        window.addEventListener('pointerout', leave, { passive: true });
        window.addEventListener('blur', cancel);
        window.addEventListener('resize', resize, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(idleTimer);
            observer.disconnect();
            viewport.removeEventListener('pointerdown', down);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            window.removeEventListener('pointerout', leave);
            window.removeEventListener('blur', cancel);
            window.removeEventListener('resize', resize);
            x = 0;
            y = 0;
            paint();
        };
    }, [viewportRef, paused, reducedMotion, lowEnd]);
}
