import { useEffect, useRef, useState } from 'react';
import { SPLINE_DESTINATIONS } from './splineConfig';

// Only this experimental view imports the runtime. The production cube never
// downloads or initializes a second renderer.
export default function SplineScene({ scene, paused, theme, onSelect, onRetry }) {
    const canvasRef = useRef(null);
    const hostRef = useRef(null);
    const appRef = useRef(null);
    const pausedRef = useRef(paused);
    const themeRef = useRef(theme);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        pausedRef.current = paused;
        const app = appRef.current;
        if (app) {
            if (paused) app.stop();
            else app.play();
        }
    }, [paused]);

    useEffect(() => {
        themeRef.current = theme;
        const app = appRef.current;
        if (app && Object.hasOwn(app.getVariables(), 'DinoWeb_Theme')) {
            app.setVariable('DinoWeb_Theme', theme);
        }
    }, [theme]);

    useEffect(() => {
        let finished = false;
        let app;
        let observer;
        let gesture = { valid: false };
        const controller = new AbortController();
        const canvas = canvasRef.current;
        const host = hostRef.current;
        const dispose = () => {
            observer?.disconnect();
            controller.abort();
            appRef.current = null;
            app?.dispose();
            app = null;
        };
        const fail = () => {
            if (finished) return;
            finished = true;
            window.clearTimeout(timeout);
            dispose();
            setStatus('error');
        };
        const timeout = window.setTimeout(fail, 25000);
        const begin = event => {
            gesture = event.isPrimary
                ? { valid: true, id: event.pointerId, x: event.clientX, y: event.clientY }
                : { valid: false };
        };
        const move = event => {
            if (gesture.id !== event.pointerId || Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) {
                gesture.valid = false;
            }
        };
        const cancel = () => { gesture.valid = false; };
        const select = event => {
            const destination = SPLINE_DESTINATIONS.find(item => item.object === event.target?.name);
            if (destination && gesture.valid && !pausedRef.current) {
                gesture.valid = false;
                onSelect(destination.page);
            }
        };
        // Capture tracks finger/mouse movement before the runtime handles it.
        // Releasing after a drag must not accidentally open a page.
        host.addEventListener('pointerdown', begin, true);
        host.addEventListener('pointermove', move, true);
        host.addEventListener('pointerup', move, true);
        host.addEventListener('pointercancel', cancel, true);
        host.addEventListener('pointerleave', cancel, true);
        canvas.addEventListener('webglcontextlost', fail);

        const load = async () => {
            const { Application } = await import('@splinetool/runtime');
            if (finished) return;
            app = new Application(canvas, { renderMode: 'auto', htmlContentMode: 'sandbox' });
            const resize = () => {
                const { width, height } = host.getBoundingClientRect();
                if (width > 0 && height > 0) app?.setSize(width, height);
            };
            observer = new ResizeObserver(resize);
            observer.observe(host);
            resize();
            await app.load(scene, { DinoWeb_Theme: themeRef.current }, { signal: controller.signal });
            if (finished) return;
            window.clearTimeout(timeout);
            // Events must be authored on these exact panel objects in Spline.
            app.addEventListener('mouseUp', select);
            appRef.current = app;
            if (Object.hasOwn(app.getVariables(), 'DinoWeb_Theme')) {
                app.setVariable('DinoWeb_Theme', themeRef.current);
            }
            if (pausedRef.current || document.hidden) app.stop();
            setStatus('ready');
        };
        void load().catch(fail);
        return () => {
            finished = true;
            window.clearTimeout(timeout);
            host.removeEventListener('pointerdown', begin, true);
            host.removeEventListener('pointermove', move, true);
            host.removeEventListener('pointerup', move, true);
            host.removeEventListener('pointercancel', cancel, true);
            host.removeEventListener('pointerleave', cancel, true);
            canvas.removeEventListener('webglcontextlost', fail);
            app?.removeEventListener('mouseUp', select);
            dispose();
        };
    }, [scene, onSelect]);

    return (
        <div ref={hostRef} className="spline-scene" data-scene-status={status} aria-busy={status === 'loading'}>
            <canvas ref={canvasRef} aria-label="Interactive Spline navigation. Use the page buttons below for keyboard navigation."
                role="img" hidden={status !== 'ready'} />
            {status === 'loading' && <div className="spline-scene-message" role="status"><span>Preparing the scene</span><p>Loading your Spline export…</p></div>}
            {status === 'error' && <div className="spline-scene-message" role="alert"><h2>The scene couldn’t load.</h2><p>You can still explore every page below.</p><button type="button" onClick={onRetry}>Try again</button></div>}
        </div>
    );
}
