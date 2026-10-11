import { useHomeViewportLayout } from '../../hooks/useHomeViewportLayout';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function StageBackdrop({ hidden, paused = false, reduceEffects = false, zoomZ = 0 }) {
    const reducedMotion = useReducedMotion();
    const { restingX, restingY, cubeScale } = useHomeViewportLayout();
    const zoomScale = 1 / (1 + zoomZ / 1000);
    const projection = zoomScale / (10 * Math.tan(Math.PI / 8));
    const offset = restingX * projection;
    const left = `calc(50% + var(--portfolio-viewport-height, 100dvh) * ${offset})`;
    const shadowTop = `clamp(0px, calc(50% - var(--portfolio-viewport-height, 100dvh) * ${(restingY - cubeScale * 1.6) * projection}), calc(100% - 48px))`;


    return (
        <div className="home-stage-backdrop" data-motion-paused={hidden || paused || reducedMotion} aria-hidden="true" style={{ opacity: hidden ? 0 : 1, '--floor-zoom-scale': zoomScale, '--floor-camera-z': `calc(var(--portfolio-viewport-height, 100dvh) * ${-zoomZ / 1000 * 1.20710678})` }}>
            <div className="home-stage-backdrop__floor" />
            {!reduceEffects && <>
                <div className="home-stage-backdrop__pool" style={{ left }} />
            </>}
            <div className="home-stage-backdrop__shadow" style={{
                left, top: shadowTop,
                width: `calc(var(--portfolio-viewport-height, 100dvh) * ${cubeScale * zoomScale * 1.02})`,
                height: `calc(var(--portfolio-viewport-height, 100dvh) * ${cubeScale * zoomScale * .20})`,
            }} />
        </div>
    );
}
