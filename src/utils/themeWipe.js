// A targetless animation supplies timing only. Every visible layer receives
// the same circle in one frame; there are no fullscreen browser snapshots.
export function revealCubeWithWipe(origin, backdrop, finish) {
    const wipeOrigin = { x: origin.x, y: origin.y };
    const root = document.documentElement;
    const expand = root.dataset.themeDirection === 'to-dark';
    const style = getComputedStyle(root);
    const duration = parseFloat(style.getPropertyValue('--theme-transition-duration')) * 1000 || 2000;
    const easing = style.getPropertyValue('--theme-transition-easing').trim() || 'cubic-bezier(.76,0,.24,1)';
    const animation = new Animation(new KeyframeEffect(null, [], { duration, easing, fill: 'both' }), document.timeline);
    let cancelled = false, frame, previous = '';
    const paint = progress => {
        const radius = 1.5 * Math.hypot(root.clientWidth, root.clientHeight) / Math.SQRT2 * (expand ? progress : 1 - progress);
        // Wallpaper must keep painting through a worker/fallback canvas swap.
        backdrop.update({ origin: wipeOrigin, radius, expand });
        const canvas = document.querySelector('.cube-entrance canvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const key = `${radius}:${rect.x}:${rect.y}:${rect.width}:${rect.height}`;
        if (key === previous) return;
        previous = key;
        window.dispatchEvent(new CustomEvent('cube-wipe-frame', { detail: {
            origin: wipeOrigin, radius, expand,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        } }));
    };
    const sample = () => {
        if (cancelled) return;
        paint(animation.effect.getComputedTiming().progress || 0);
        frame = requestAnimationFrame(sample);
    };
    const onHidden = () => { if (document.visibilityState === 'hidden') animation.finish(); };
    const initialWidth = root.clientWidth, initialHeight = root.clientHeight;
    const onResize = () => {
        if (root.clientWidth !== initialWidth || root.clientHeight !== initialHeight) animation.finish();
    };
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => { if (motion.matches) animation.finish(); };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('resize', onResize);
    motion.addEventListener('change', onMotion);
    // Install the initial masks before the changed root palette can paint.
    paint(0);
    animation.play();
    window.dispatchEvent(new CustomEvent('theme-wipe-start', { detail: { animation } }));
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
