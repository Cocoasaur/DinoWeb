import { useEffect, useState } from 'react';
import { CUBE_OFFSET_X } from '../constants/cubeConfig';

const PHONE_BASE_WIDTH = 430;
const PHONE_BASE_HEIGHT = 932;
const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

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
    if (width < TABLET_MIN) {
        const widthScale = clamp(width / PHONE_BASE_WIDTH, 0.84, 1);
        const heightScale = clamp(height / PHONE_BASE_HEIGHT, 0.84, 1.03);
        const fitScale = Math.min(widthScale, heightScale);

        return {
            breakpoint: 'phone',
            restingX: width < 390 ? 0 : 0.02,
            restingY: -0.5 * heightScale,
            cubeScale: clamp(0.6 * fitScale, 0.5, 0.6),
        };
    }

    if (width < DESKTOP_MIN) {
        const progress = clamp((width - TABLET_MIN) / (DESKTOP_MIN - TABLET_MIN), 0, 1);
        const portraitOffset = height > width ? 1 : 0;

        return {
            breakpoint: 'tablet',
            restingX: 0.45 + progress * 0.45 - portraitOffset * 0.1,
            restingY: 0,
            cubeScale: 0.58 + progress * 0.22 - portraitOffset * 0.06,
        };
    }

    return {
        breakpoint: 'desktop',
        restingX: CUBE_OFFSET_X,
        restingY: 0,
        cubeScale: 1,
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
