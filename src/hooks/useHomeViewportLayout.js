import { useEffect, useState } from 'react';
import { CUBE_OFFSET_X } from '../constants/cubeConfig';

const PHONE_BASE_WIDTH = 430;
const PHONE_BASE_HEIGHT = 932;
const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;
const DESKTOP_FULL = 1440;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function sameLayout(a, b) {
    return (
        a.breakpoint === b.breakpoint &&
        a.restingX === b.restingX &&
        a.restingY === b.restingY &&
        a.cubeScale === b.cubeScale
    );
}

export function getHomeViewportLayout(width, height) {
    const isLandscape = width > height;

    // ═══════════════════════════════════════════════════════
    // LANDSCAPE MOBILE → Desktop-like treatment
    // Wide but short viewports should feel like desktop:
    // sidebar visible, cube centered vertically, larger scale
    // ═══════════════════════════════════════════════════════
    if (isLandscape && width >= 568) {
        const progress = clamp((width - DESKTOP_MIN) / (DESKTOP_FULL - DESKTOP_MIN), 0, 1);
        const heightScale = clamp(height / 760, 0.80, 1);
        return {
            breakpoint: 'desktop',
            restingX: 1.42 + progress * (CUBE_OFFSET_X - 1.42),
            restingY: 0,
            cubeScale: (0.95 + progress * 0.30) * heightScale,
        };
    }

    if (width < TABLET_MIN) {
        const widthScale = clamp(width / PHONE_BASE_WIDTH, 0.84, 1);
        const heightScale = clamp(height / PHONE_BASE_HEIGHT, 0.84, 1.03);
        const fitScale = Math.min(widthScale, heightScale);

        return {
            breakpoint: 'phone',
            restingX: width < 390 ? 0 : 0.02,
            restingY: -0.55 * heightScale,
            cubeScale: clamp(0.62 * fitScale, 0.52, 0.62),
        };
    }

    if (width < DESKTOP_MIN) {
        const progress = clamp((width - TABLET_MIN) / (DESKTOP_MIN - TABLET_MIN), 0, 1);
        const isPortraitTablet = height > width * 1.08;
        const heightScale = clamp(height / 770, 0.96, 1.04);

        return {
            breakpoint: 'tablet',
            restingX: isPortraitTablet
                ? 0.72 + progress * 0.18
                : 1.22 + progress * 0.24,
            restingY: 0,
            cubeScale: (isPortraitTablet
                ? 0.5 + progress * 0.1
                : 0.54 + progress * 0.14) * heightScale,
        };
    }

    if (width < DESKTOP_FULL) {
        const progress = clamp((width - DESKTOP_MIN) / (DESKTOP_FULL - DESKTOP_MIN), 0, 1);
        const heightScale = clamp(height / 760, 0.86, 1);

        return {
            breakpoint: 'desktop',
            restingX: 1.42 + progress * (CUBE_OFFSET_X - 1.42),
            restingY: 0,
            cubeScale: (0.95 + progress * 0.30) * heightScale,
        };
    }

    return {
        breakpoint: 'desktop',
        restingX: CUBE_OFFSET_X,
        restingY: 0,
        cubeScale: 1.25,
    };
}

export function useHomeViewportLayout() {
    const [layout, setLayout] = useState(() => (
        typeof window === 'undefined'
            ? getHomeViewportLayout(DESKTOP_MIN, 768)
            : getHomeViewportLayout(window.innerWidth, window.innerHeight)
    ));

    useEffect(() => {
        let frameId;

        const updateLayout = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                const next = getHomeViewportLayout(window.innerWidth, window.innerHeight);
                setLayout(prev => sameLayout(prev, next) ? prev : next);
            });
        };

        updateLayout();
        window.addEventListener('resize', updateLayout, { passive: true });
        window.addEventListener('orientationchange', updateLayout, { passive: true });

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', updateLayout);
            window.removeEventListener('orientationchange', updateLayout);
        };
    }, []);

    return layout;
}