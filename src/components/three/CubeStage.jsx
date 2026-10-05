import { Suspense, lazy, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useCSSVars } from '../../hooks/useCSSVars';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useHomeViewportLayout } from '../../hooks/useHomeViewportLayout';
import { getCubeTransition, getCubeStageStyle } from '../../utils/cubeTransition';
import { useIdleBreathing } from '../../hooks/useIdleBreathing';
import { cubeAssets } from '../../utils/cubeAssetUrls';
import StageBackdrop from './StageBackdrop';

const FallbackStage = lazy(async () => {
    const module = await import('./MainThreadCubeStage');
    await module.default.prepareResources();
    return module;
});
const subscribeVisibility = (notify) => {
    document.addEventListener('visibilitychange', notify);
    return () => document.removeEventListener('visibilitychange', notify);
};
const isPageVisible = () => document.visibilityState !== 'hidden';
const canRenderInWorker = () => typeof Worker !== 'undefined' && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';

export default function CubeStage(props) {
    const [fallback, setFallback] = useState(() => !canRenderInWorker());
    const hostRef = useRef(null);
    const workerRef = useRef(null);
    const propsRef = useRef(props);
    const stateRef = useRef(null);
    const visible = useSyncExternalStore(subscribeVisibility, isPageVisible, () => true);
    const reducedMotion = useReducedMotion();
    const { theme } = useTheme();
    const layout = useHomeViewportLayout();
    const colors = useCSSVars(['--cube-color', '--cube-edge-color', '--cube-edge-opacity', '--cube-text-accent', '--cube-ticks-idle', '--cube-ticks-hover', '--cube-ticks-hover-scale']);
    const { reduceEffects, isZoomed, isZoomingOut, overlayPhase, canvasZIndex } = props;
    const transition = getCubeTransition(reduceEffects, reducedMotion);
    const paused = !visible || ['fading-in', 'open', 'fading-out'].includes(overlayPhase);
    useIdleBreathing(hostRef, visible && !fallback && !isZoomed && !isZoomingOut, reducedMotion);

    useEffect(() => { propsRef.current = props; });
    useEffect(() => {
        const state = { theme, colors, layout, reduceEffects, labelScale: props.labelScale, reducedMotion, paused,
            isZoomed, isZoomingOut, overlayPhase, activeFace: props.activeFace, targetRotation: props.targetRotation,
            zoomZ: props.zoomZ, dpr: Math.min(window.devicePixelRatio || 1, props.dpr[1]),
            transition: getCubeTransition(reduceEffects, reducedMotion) };
        stateRef.current = state;
        workerRef.current?.postMessage({ type: 'state', state });
    }, [theme, colors, layout, reduceEffects, reducedMotion, paused, isZoomed, isZoomingOut, overlayPhase,
        props.activeFace, props.targetRotation, props.zoomZ, props.dpr, props.labelScale]);

    useEffect(() => {
        if (fallback) return;
        const host = hostRef.current;
        let worker;
        let observer;
        let readyFrame = 0;
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab';
        canvas.setAttribute('aria-label', 'Interactive portfolio cube');
        const pointers = new Map();
        let pinchDistance = 0;
        const sendPointer = (kind, event) => {
            const rect = canvas.getBoundingClientRect();
            worker?.postMessage({ type: 'pointer', kind, x: (event.clientX - rect.left) * host.clientWidth / rect.width,
                y: (event.clientY - rect.top) * host.clientHeight / rect.height, pointerType: event.pointerType });
        };
        const down = (event) => {
            if (propsRef.current.isZoomed || propsRef.current.isZoomingOut) return;
            canvas.setPointerCapture(event.pointerId);
            pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            propsRef.current.isDraggingRef.current = pointers.size === 1;
            const origin = propsRef.current.faceDownPosRef?.current;
            if (origin) Object.assign(origin, { x: event.clientX, y: event.clientY, valid: true });
            if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
                sendPointer('cancel', event);
            } else sendPointer('down', event);
        };
        const move = (event) => {
            if (pointers.has(event.pointerId)) pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pointers.size >= 2) {
                const [a, b] = [...pointers.values()];
                const distance = Math.hypot(a.x - b.x, a.y - b.y);
                propsRef.current.handlePinchZoom?.(pinchDistance - distance);
                pinchDistance = distance;
            } else sendPointer('move', event);
        };
        const up = (event) => {
            const pinching = pointers.size >= 2 || pinchDistance > 0;
            pointers.delete(event.pointerId);
            propsRef.current.isDraggingRef.current = false;
            if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
            sendPointer(pinching || event.type === 'pointercancel' ? 'cancel' : 'up', event);
            if (!pointers.size) pinchDistance = 0;
        };
        try {
            host.appendChild(canvas);
            worker = new Worker(new URL('../../workers/cubeRenderer.js', import.meta.url), { type: 'module' });
            workerRef.current = worker;
            worker.onmessage = ({ data }) => {
                const current = propsRef.current;
                if (data.type === 'ready') readyFrame = requestAnimationFrame(() => current.onReady());
                if (data.type === 'frame') {
                    current.handleRotationChange(data.x, data.y);
                    if (current.screenPosRef?.current) Object.assign(current.screenPosRef.current, data.origin, { valid: true });
                    host.dataset.sceneDraws = data.draws;
                    host.style.transformOrigin = `${data.origin.x}px ${data.origin.y}px`;
                }
                if (data.type === 'press') current.handleFacePressStart?.(data.face);
                if (data.type === 'click') current.handleFaceClick(data.face);
                if (data.type === 'zoom-in-complete') current.handleZoomComplete();
                if (data.type === 'zoom-out-complete') current.handleZoomOutComplete();
                if (data.type === 'cursor') canvas.style.cursor = data.cursor;
                if (data.type === 'error') setFallback(true);
            };
            worker.onerror = (event) => { event.preventDefault(); setFallback(true); };
            const offscreen = canvas.transferControlToOffscreen();
            worker.postMessage({ type: 'init', canvas: offscreen, width: host.clientWidth, height: host.clientHeight,
                state: stateRef.current, assets: cubeAssets }, [offscreen]);
            observer = new ResizeObserver(() => worker.postMessage({ type: 'resize', width: host.clientWidth, height: host.clientHeight }));
            observer.observe(host);
            canvas.addEventListener('pointerdown', down);
            canvas.addEventListener('pointermove', move);
            canvas.addEventListener('pointerup', up);
            canvas.addEventListener('pointercancel', up);
            canvas.addEventListener('contextmenu', (event) => {
                if (pointers.size) event.preventDefault();
            });
            canvas.addEventListener('pointerleave', () => worker.postMessage({ type: 'pointer', kind: 'leave' }));
        } catch { queueMicrotask(() => setFallback(true)); }
        return () => {
            cancelAnimationFrame(readyFrame);
            observer?.disconnect();
            worker?.terminate();
            workerRef.current = null;
            propsRef.current.isDraggingRef.current = false;
            canvas.remove();
        };
    }, [fallback]);

    if (fallback) return <Suspense fallback={null}><FallbackStage {...props} /></Suspense>;
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden cube-entrance" data-renderer="worker" data-render-paused={paused} style={{ zIndex: canvasZIndex }}>
            <div className="w-full h-full" style={getCubeStageStyle(isZoomed, isZoomingOut, transition, overlayPhase)}>
                <StageBackdrop hidden={isZoomed || isZoomingOut} paused={paused} reduceEffects={reduceEffects} zoomZ={props.zoomZ} />
                <div ref={hostRef} className="w-full h-full cube-breath" />
            </div>
        </div>
    );
}

// Worker startup loads resources itself, without evaluating Three.js on the UI thread.
CubeStage.prepareResources = () => Promise.resolve();
