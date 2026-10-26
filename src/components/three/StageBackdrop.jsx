import { useHomeViewportLayout } from '../../hooks/useHomeViewportLayout';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function StageBackdrop({ obscured = false, paused = false, reduceEffects = false, zoomZ = 0 }) {
    const reducedMotion = useReducedMotion();
    const { restingX, restingY, cubeScale } = useHomeViewportLayout();
    const zoomScale = 1 / (1 + zoomZ / 1000);
    const projection = zoomScale / (10 * Math.tan(Math.PI / 8));
    const offset = restingX * projection;
    const left = `calc(50% + var(--portfolio-viewport-height, 100dvh) * ${offset})`;
    const shadowFallback = `translate3d(calc(var(--portfolio-viewport-height, 100dvh) * ${offset}), calc(var(--portfolio-viewport-height, 100dvh) * ${-(restingY - cubeScale * 1.6) * projection}), 0) scale(${zoomScale}) translate(-50%, -50%)`;


    return (
        <div className="home-stage-backdrop" data-motion-paused={paused || reducedMotion} data-obscured={obscured} aria-hidden="true" style={{ '--floor-zoom-scale': zoomScale, '--floor-camera-z': `calc(var(--portfolio-viewport-height, 100dvh) * ${-zoomZ / 1000 * 1.20710678})` }}>
            <div className="home-stage-backdrop__floor" />
            {!reduceEffects && <>
                <div className="home-stage-backdrop__pool" style={{ left }} />
            </>}
            <div className="home-stage-backdrop__shadow" style={{
                transform: `var(--cube-shadow-transform, ${shadowFallback})`,
                width: `calc(var(--portfolio-viewport-height, 100dvh) * ${cubeScale * 1.02})`,
                height: `calc(var(--portfolio-viewport-height, 100dvh) * ${cubeScale * .20})`,
            }} />
        </div>
    );
}
