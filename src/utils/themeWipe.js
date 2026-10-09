// Read the browser's actual circular clip, including its native easing/clock.
// Only this short-lived transition samples styles; no React frame updates.
export function revealCubeWithWipe(transition, origin) {
    let cancelled = false, frame;
    const wipeOrigin = { x: origin.x, y: origin.y };
    transition.ready.then(() => {
        if (cancelled) return;
        const root = document.documentElement;
        const expand = root.dataset.themeDirection === 'to-dark';
        const pseudo = expand ? '::view-transition-new(root)' : '::view-transition-old(root)';
        const canvas = document.querySelector('.cube-entrance canvas');
        if (!canvas) return;
        let previous = '';
        const sample = () => {
            if (cancelled) return;
            const clip = getComputedStyle(root, pseudo).clipPath;
            const circle = clip.match(/^circle\(([\d.e+-]+)(%|px)/);
            if (circle) {
                const rect = canvas.getBoundingClientRect();
                const radius = circle[2] === 'px' ? Number(circle[1])
                    : Number(circle[1]) / 100 * Math.hypot(root.clientWidth, root.clientHeight) / Math.SQRT2;
                const key = `${radius}:${rect.x}:${rect.y}:${rect.width}:${rect.height}`;
                if (key !== previous) {
                    previous = key;
                    window.dispatchEvent(new CustomEvent('cube-wipe-frame', { detail: {
                        origin: wipeOrigin, radius, expand,
                        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                    } }));
                }
            }
            frame = requestAnimationFrame(sample);
        };
        sample();
    }).catch(() => {});
    return () => { cancelled = true; cancelAnimationFrame(frame); };
}
