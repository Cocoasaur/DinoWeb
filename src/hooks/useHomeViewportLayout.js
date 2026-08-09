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
    // LANDSCAPE MOBILE → Only match small landscape phones (568-767px)
    // NOT laptops/desktops. Must stay BELOW tablet threshold.
    // ═══════════════════════════════════════════════════════
    if (isLandscape && width >= 568 && width < TABLET_MIN) {
        const progress = clamp((width - 568) / (TABLET_MIN - 568), 0, 1);
        const heightScale = clamp(height / 760, 0.80, 1);
        return {
            breakpoint: 'phone',
            restingX: 0.5 + progress * 0.5,
            restingY: 0,
            cubeScale: clamp(0.55 + progress * 0.15, 0.55, 0.70) * heightScale,
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
        const heightScale = clamp(height / 760, 0.86, 1);

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

    // ── Portrait desktop / laptop (fine-pointer, width ≥ 768, height > width) ──
    // Rotated monitors (incl. display-scaled CSS widths < 1024) get a phone-style
    // layout: branding lockup on top, cube centered in the band below it.
    // Touch devices (hover: none — iPads etc.) skip this and keep the tablet branch.
    // BRAND_SCALE must match --mobile-branding-scale in home-layout.css
    // (see the `(orientation: portrait) and (hover: hover) and (pointer: fine)` blocks).
    const isFinePointer = typeof window === 'undefined' || !window.matchMedia
        ? true
        : window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (width >= TABLET_MIN && height > width && isFinePointer) {
        const brandScale = width >= 1280 ? 2.4 : width >= 1080 ? 2.2 : width >= 900 ? 1.9 : 1.6;
        const bandTop = 330 * brandScale + 60;   // lockup height + gap below it
        const bandBottom = height - 150;         // clear of the rotate prompt
        const bandHeight = Math.max(bandBottom - bandTop, 0);

        // Camera math (fov 45°, camera z 5): 1 world unit = 0.48284/aspect NDC.
        const ndcPerUnit = 0.48284 / (width / height);
        const halfViewWidth = 1 / ndcPerUnit;
        const widthFit = halfViewWidth * 0.62;                 // phone-like width share
        const bandFit = bandHeight / (ndcPerUnit * height);    // fits the band vertically
        const cubeScale = clamp(Math.min(widthFit, bandFit), 0.40, 0.72);

        const centerY = (bandTop + bandBottom) / 2;
        const restingY = (1 - (2 * centerY) / height) / ndcPerUnit;

        return {
            breakpoint: 'desktop',
            restingX: 0,
            restingY,
            cubeScale,
        };
    }

    // ── Desktop: heightScale is needed for both branches ──
    const heightScale = clamp(height / 760, 0.86, 1);

    if (width < DESKTOP_FULL) {
        const progress = clamp((width - DESKTOP_MIN) / (DESKTOP_FULL - DESKTOP_MIN), 0, 1);
        return {
            breakpoint: 'desktop',
            restingX: 1.42 + progress * (CUBE_OFFSET_X - 1.42),
            restingY: 0,
            cubeScale: (0.60 + progress * 0.40) * heightScale,
        };
    }

    return {
        breakpoint: 'desktop',
        restingX: CUBE_OFFSET_X,
        restingY: 0,
        cubeScale: 1.0 * heightScale,
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