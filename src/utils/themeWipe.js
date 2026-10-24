import { createPixelWipe, pixelWipeRectangles } from './pixelWipe';
import { readGridWipeGeometry } from './gridWipeGeometry';

let sequenceSeed = Math.floor(Math.random()*4093);

// A targetless animation is the only clock. The square cells select between
// live palettes without screenshots, DOM tile grids or a second 3D renderer.
export function revealCubeWithWipe(origin, backdrop, finish) {
    const root = document.documentElement;
    const reverse = root.dataset.themeDirection === 'to-light';
    if (!reverse) sequenceSeed = (sequenceSeed+1+Math.floor(Math.random()*4092))%4093;
    const mask = createPixelWipe(root.clientWidth, root.clientHeight, origin, reverse, sequenceSeed);
    const style = getComputedStyle(root);
    const duration = parseFloat(style.getPropertyValue('--theme-transition-duration')) * 1000 || 1200;
    const easing = style.getPropertyValue('--theme-transition-easing').trim() || 'linear';
    const animation = new Animation(new KeyframeEffect(null, [], { duration, easing, fill: 'both' }), document.timeline);
    let cancelled = false, frame;
    const paint = progress => {
        const state = { ...mask, ...readGridWipeGeometry(), progress };
        backdrop.update({ ...state, tiles: pixelWipeRectangles(state) });
        const canvas = document.querySelector('.cube-entrance canvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        window.dispatchEvent(new CustomEvent('cube-wipe-frame', { detail: {
            ...state, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        } }));
    };
    const sample = () => {
        if (cancelled) return;
        paint(animation.effect.getComputedTiming().progress || 0);
        frame = requestAnimationFrame(sample);
    };
    const onHidden = () => { if (document.visibilityState === 'hidden') animation.finish(); };
    const onResize = () => {
        if (root.clientWidth !== mask.width || root.clientHeight !== mask.height) animation.finish();
    };
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => { if (motion.matches) animation.finish(); };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('resize', onResize);
    motion.addEventListener('change', onMotion);
    paint(0);
    animation.play();
    window.dispatchEvent(new CustomEvent('theme-wipe-start', { detail: { animation, mask } }));
    sample();
    animation.finished.then(() => {
        if (cancelled) return;
        paint(1);
        finish();
    }).catch(() => {});
    return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
        animation.cancel();
        document.removeEventListener('visibilitychange', onHidden);
        window.removeEventListener('resize', onResize);
        motion.removeEventListener('change', onMotion);
        backdrop.cleanup();
    };
}
