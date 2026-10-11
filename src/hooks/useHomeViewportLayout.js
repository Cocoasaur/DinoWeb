import { useEffect, useState } from 'react';
import { DEFAULT_CAMERA_DISTANCE } from '../constants/cubeConfig';

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;
const FOV_FACTOR = 1 / (2 * Math.tan(Math.PI / 8));
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Include marker clearance and breathing around the resting -20°/-45° pose.
// This is camera projection math only; layout never imports the Three runtime.
const cubeCorners = [];
const rx = -20 * Math.PI / 180, ry = -45 * Math.PI / 180;
for (const x of [-1.06, 1.06]) for (const y of [-1.06, 1.06]) for (const z of [-1.06, 1.06]) {
    const px = x * Math.cos(ry) + z * Math.sin(ry);
    const pz = -x * Math.sin(ry) + z * Math.cos(ry);
    cubeCorners.push([px, y * Math.cos(rx) - pz * Math.sin(rx), y * Math.sin(rx) + pz * Math.cos(rx)]);
}

export function getHomeComposition(width, height) {
    const stacked = height >= width;
    const inset = width < 400 ? 28 : width < TABLET_MIN ? 32 : width < DESKTOP_MIN ? 48 : 60;
    const gap = clamp(width * .024, 18, 36);
    const nominalBrand = width <= TABLET_MIN
        ? .93 + (width - 430) * .42 / 338
        : width / TABLET_MIN * 1.35;
    // Match the full staggered composition in home-layout.css. Its SVGs use
    // cropped glyph bounds so the group, rather than each word, is centered.
    const brandScale = Math.max(.1, Math.min(nominalBrand, (width - 2 * inset) / 374, height * .25 / 174, 2.4));
    const brandVisibleTop = Math.min(height * .145, inset + 76);
    const brandTop = brandVisibleTop;
    const sidebarWidth = Math.max(80, Math.min(
        width * (.34 + .10 * clamp((width - TABLET_MIN) / 672, 0, 1)),
        720, (height - 2 * inset - 40) * 3,
    ));
    return {
        stacked, inset, brandScale, brandTop, sidebarWidth,
        sidebarFontSize: clamp(sidebarWidth / 36, 9, 18),
        markerInset: width < TABLET_MIN ? 14 : width < DESKTOP_MIN ? 32 : 40,
        metaFontSize: width < 360 ? 8.5 : width < 400 ? 9 : width < TABLET_MIN ? 10 : 11,
        band: stacked
            ? { left: inset, right: width - inset, top: brandVisibleTop + 174 * brandScale + gap,
                bottom: height - inset - 84 }
            : { left: inset + sidebarWidth + gap, right: width - inset,
                top: inset + 20, bottom: height - inset - 20 },
    };
}

function sameLayout(a, b) {
    return a.breakpoint === b.breakpoint && a.restingX === b.restingX &&
        a.restingY === b.restingY && a.cubeScale === b.cubeScale;
}

export function getHomeViewportLayout(width, height) {
    const { stacked, band } = getHomeComposition(width, height);
    const focal = height * FOV_FACTOR;
    const restingX = ((band.left + band.right) / 2 - width / 2) * DEFAULT_CAMERA_DISTANCE / focal;
    // Vertical FOV is independent of the viewport's aspect ratio.
    const restingY = (height / 2 - (band.top + band.bottom) / 2) * DEFAULT_CAMERA_DISTANCE / focal;
    const nominalScale = stacked
        ? width < TABLET_MIN ? .62 * clamp(Math.min(width / 430, height / 932), .84, 1)
            : width < DESKTOP_MIN ? .62 : .72
        : 1;
    const fits = scale => cubeCorners.every(([x, y, z]) => {
        const depth = DEFAULT_CAMERA_DISTANCE - z * scale;
        const px = width / 2 + focal * (restingX + x * scale) / depth;
        const py = height / 2 - focal * (restingY + y * scale) / depth;
        return px >= band.left && px <= band.right && py >= band.top && py <= band.bottom;
    });
    let low = 0, high = nominalScale;
    // Fit once per viewport change, never in the animation/render loop.
    for (let i = 0; i < 16; i++) {
        const mid = (low + high) / 2;
        if (fits(mid)) low = mid; else high = mid;
    }
    return { breakpoint: width < TABLET_MIN ? 'phone' : width < DESKTOP_MIN ? 'tablet' : 'desktop',
        restingX, restingY, cubeScale: low };
}

export function useHomeViewportLayout() {
    const [layout, setLayout] = useState(() => (
        typeof window === 'undefined'
            ? getHomeViewportLayout(DESKTOP_MIN, 768)
            : getHomeViewportLayout(window.innerWidth, window.innerHeight)
    ));

    useEffect(() => {
        let frameId;
        const viewport = document.querySelector('.portfolio-viewport');

        const updateLayout = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                const next = getHomeViewportLayout(
                    viewport?.clientWidth || window.innerWidth,
                    viewport?.clientHeight || window.innerHeight,
                );
                setLayout(prev => sameLayout(prev, next) ? prev : next);
            });
        };

        updateLayout();
        const observer = new ResizeObserver(updateLayout);
        if (viewport) observer.observe(viewport);
        window.addEventListener('resize', updateLayout, { passive: true });
        window.addEventListener('orientationchange', updateLayout, { passive: true });

        return () => {
            cancelAnimationFrame(frameId);
            observer.disconnect();
            window.removeEventListener('resize', updateLayout);
            window.removeEventListener('orientationchange', updateLayout);
        };
    }, []);

    return layout;
}
