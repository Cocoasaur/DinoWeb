import React, { useRef, useMemo, useEffect, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useCSSVars } from '../../hooks/useCSSVars';
import { FACE_CONFIG } from '../../constants/cubeConfig';
import { THEME_DEMAIN, THEME_CLAIR } from '../../context/ThemeContext';

const CORNERS = [
    { pos: [-1.0, 1.0], hDir: 1, vDir: -1 },
    { pos: [1.0, 1.0], hDir: -1, vDir: -1 },
    { pos: [-1.0, -1.0], hDir: 1, vDir: 1 },
    { pos: [1.0, -1.0], hDir: -1, vDir: 1 },
];

const T_SIZE = 0.10;
const T_THICK = 0.008;
const BASE_FONT_SIZE = 120;
const SCALE = 2;
const FONT_SIZE = 0.22;
const LETTER_SPACING = 0.15;

function rgbaToRgb(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return match ? `rgb(${match[1]}, ${match[2]}, ${match[3]})` : rgba;
}

const textureCache = new Map();

function getCacheKey(text, fontSize, letterSpacing, mode, colors) {
    return `${text}_${fontSize}_${letterSpacing}_${mode}_${colors.hatch}_${colors.hatchOpacity}_${colors.fill}_${colors.stroke}_${colors.strokeOpacity}`;
}

function fillChars(ctx, text, startX, spacing) {
    let x = startX;
    for (let i = 0; i < text.length; i++) {
        const w = ctx.measureText(text[i]).width;
        ctx.fillText(text[i], x + w / 2, 0);
        x += w + spacing;
    }
}

function strokeChars(ctx, text, startX, spacing) {
    let x = startX;
    for (let i = 0; i < text.length; i++) {
        const w = ctx.measureText(text[i]).width;
        ctx.strokeText(text[i], x + w / 2, 0);
        x += w + spacing;
    }
}

function renderTextTexture(text, fontSize, letterSpacing, mode, colors) {
    const key = getCacheKey(text, fontSize, letterSpacing, mode, colors);
    if (textureCache.has(key)) {
        return textureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    const spacing = letterSpacing * BASE_FONT_SIZE;

    ctx.font = `bold ${BASE_FONT_SIZE}px "Space Grotesk", "Inter", sans-serif`;
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) totalWidth += ctx.measureText(text[i]).width;
    totalWidth += (text.length - 1) * spacing;

    const pad = 40;
    canvas.width = (totalWidth + pad * 2) * SCALE;
    canvas.height = (BASE_FONT_SIZE * 1.4 + pad * 2) * SCALE;

    ctx.save();
    ctx.scale(SCALE, SCALE);
    ctx.translate(pad + totalWidth / 2, pad + BASE_FONT_SIZE * 0.9);
    ctx.font = `bold ${BASE_FONT_SIZE}px "Space Grotesk", "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    const startX = -totalWidth / 2;

    if (mode === 'idle') {
        const patSize = 15;
        const patCanvas = document.createElement('canvas');
        patCanvas.width = patSize;
        patCanvas.height = patSize;
        const pctx = patCanvas.getContext('2d');
        pctx.clearRect(0, 0, patSize, patSize);
        pctx.strokeStyle = colors.hatch;
        pctx.lineWidth = 1.4;
        pctx.lineCap = 'square';
        pctx.beginPath();
        pctx.moveTo(0, patSize);
        pctx.lineTo(patSize, 0);
        pctx.stroke();

        const hatchPattern = ctx.createPattern(patCanvas, 'repeat');
        ctx.save();
        ctx.fillStyle = hatchPattern;
        ctx.globalAlpha = colors.hatchOpacity;
        fillChars(ctx, text, startX, spacing);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = colors.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.globalAlpha = colors.strokeOpacity;
        strokeChars(ctx, text, startX, spacing);
        ctx.restore();
    } else {
        ctx.save();
        ctx.fillStyle = colors.fill;
        ctx.globalAlpha = 1;
        fillChars(ctx, text, startX, spacing);
        ctx.restore();

        if (colors.stroke && colors.strokeOpacity > 0) {
            ctx.save();
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = colors.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.globalAlpha = colors.strokeOpacity;
            strokeChars(ctx, text, startX, spacing);
            ctx.restore();
        }
    }

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 4;
    tex.needsUpdate = true;

    const textWidth = (totalWidth / BASE_FONT_SIZE) * fontSize;
    const textHeight = (BASE_FONT_SIZE * 1.4 / BASE_FONT_SIZE) * fontSize;

    const result = { texture: tex, textWidth, textHeight };
    textureCache.set(key, result);

    if (textureCache.size > 48) {
        const firstKey = textureCache.keys().next().value;
        const old = textureCache.get(firstKey);
        old.texture.dispose();
        textureCache.delete(firstKey);
    }

    return result;
}

// ── Theme texture prewarm ────────────────────────────────────────────────
// Rasterizing the 12 face canvases on a theme change is the heaviest sync
// chunk in the toggle render. Pre-render both themes' textures into the
// shared cache during idle so theme changes become cache hits. One texture
// per idle slice keeps this from creating long tasks.
const PREWARM_VARS = [
    '--cube-text-accent',
    '--cube-text-hover',
    '--cube-text-default',
    '--cube-ticks-idle',
    '--cube-ticks-hover',
];

let prewarmStarted = false;

function readThemeColors(themeAttr) {
    const root = document.documentElement;
    const previous = root.getAttribute('data-theme');
    root.setAttribute('data-theme', themeAttr);
    const cs = getComputedStyle(root);
    const raw = {};
    PREWARM_VARS.forEach((name) => { raw[name] = cs.getPropertyValue(name).trim(); });
    if (previous === null) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', previous);
    return {
        accent: rgbaToRgb(raw['--cube-text-accent'] || '#bbdaff'),
        hover: rgbaToRgb(raw['--cube-text-hover'] || '#ffffff'),
        default: rgbaToRgb(raw['--cube-text-default'] || '#1a2332'),
        ticksIdle: rgbaToRgb(raw['--cube-ticks-idle'] || 'rgba(255,255,255,0.35)'),
        ticksHover: rgbaToRgb(raw['--cube-ticks-hover'] || 'rgba(10,15,26,0.90)'),
    };
}

function startPrewarm() {
    if (prewarmStarted) return;
    prewarmStarted = true;

    const jobs = [];
    for (const theme of [THEME_DEMAIN, THEME_CLAIR]) {
        const colors = readThemeColors(theme);
        for (const face of FACE_CONFIG) {
            if (!face.text) continue;
            jobs.push(() => renderTextTexture(face.text, FONT_SIZE, LETTER_SPACING, 'idle', {
                hatch: colors.accent,
                hatchOpacity: 0.75,
                stroke: colors.default,
                strokeWidth: 3.5,
                strokeOpacity: 1.0,
            }));
            jobs.push(() => renderTextTexture(face.text, FONT_SIZE, LETTER_SPACING, 'hover', {
                fill: colors.hover,
                stroke: colors.accent,
                strokeWidth: 1.8,
                strokeOpacity: 0.45,
            }));
        }
    }

    let index = 0;
    const pump = () => {
        if (index >= jobs.length) return;
        jobs[index]();
        index += 1;
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(pump, { timeout: 3000 });
        } else {
            window.setTimeout(pump, 250);
        }
    };

    if (document.fonts && document.fonts.status !== 'loaded') {
        document.fonts.ready.then(pump);
    } else {
        pump();
    }
}

function prewarmFaceTextures() {
    if (typeof document === 'undefined') return;
    startPrewarm();
}

const FaceCornerTicks = forwardRef(function FaceCornerTicks({ idleColor, hoverColor }, ref) {
    const groupRef = useRef();
    const idleMats = useRef([]);
    const hoverMats = useRef([]);

    useEffect(() => {
        if (ref && typeof ref === 'object') {
            ref.current = {
                update(p, scale) {
                    const iO = (1 - p) * 0.85;
                    const hO = p * 0.95;
                    idleMats.current.forEach(m => { if (m) m.opacity = iO; });
                    hoverMats.current.forEach(m => { if (m) m.opacity = hO; });
                    if (groupRef.current) groupRef.current.scale.set(scale, scale, 1);
                }
            };
        }
    }, [ref]);

    return (
        <group ref={groupRef}>
            {CORNERS.map(({ pos: [cx, cy], hDir, vDir }, ci) => (
                <group key={ci} position={[cx, cy, 0.005]}>
                    <mesh position={[hDir * T_SIZE / 2, 0, 0]}>
                        <planeGeometry args={[T_SIZE, T_THICK]} />
                        <meshBasicMaterial ref={m => { idleMats.current[ci * 2] = m; }} color={idleColor} transparent opacity={0.85} depthWrite={false} />
                    </mesh>
                    <mesh position={[0, vDir * T_SIZE / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <planeGeometry args={[T_SIZE, T_THICK]} />
                        <meshBasicMaterial ref={m => { idleMats.current[ci * 2 + 1] = m; }} color={idleColor} transparent opacity={0.85} depthWrite={false} />
                    </mesh>
                    <mesh position={[hDir * T_SIZE / 2, 0, 0.001]}>
                        <planeGeometry args={[T_SIZE, T_THICK]} />
                        <meshBasicMaterial ref={m => { hoverMats.current[ci * 2] = m; }} color={hoverColor} transparent opacity={0} depthWrite={false} />
                    </mesh>
                    <mesh position={[0, vDir * T_SIZE / 2, 0.001]} rotation={[0, 0, Math.PI / 2]}>
                        <planeGeometry args={[T_SIZE, T_THICK]} />
                        <meshBasicMaterial ref={m => { hoverMats.current[ci * 2 + 1] = m; }} color={hoverColor} transparent opacity={0} depthWrite={false} />
                    </mesh>
                </group>
            ))}
        </group>
    );
});

const UnderlineEffect = forwardRef(function UnderlineEffect({ textWidth, fontSize, color }, ref) {
    const lineRef = useRef();
    const dotRef = useRef();
    const lineY = -fontSize * 0.65;
    const lineEndX = textWidth / 2;
    const lineStartX = -lineEndX;

    const geometry = useMemo(() => {
        const pts = [];
        const SEG = 24;
        for (let i = 0; i <= SEG; i++) {
            const t = i / SEG;
            pts.push(new THREE.Vector3(lineStartX + (lineEndX - lineStartX) * t, lineY, 0.02));
        }
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        g.setDrawRange(0, 0);
        return g;
    }, [lineStartX, lineEndX, lineY]);

    useEffect(() => {
        if (ref && typeof ref === 'object') {
            ref.current = {
                update(p) {
                    if (!lineRef.current) return;
                    const total = geometry.attributes.position.count;
                    lineRef.current.geometry.setDrawRange(0, Math.max(2, Math.floor(total * p)));
                    lineRef.current.material.opacity = Math.min(p * 1.2, 0.85);
                    if (dotRef.current) {
                        const show = p > 0.02 && p < 0.98;
                        dotRef.current.visible = show;
                        if (show) dotRef.current.position.x = lineStartX + (lineEndX - lineStartX) * p;
                    }
                }
            };
        }
    }, [ref, geometry, lineStartX, lineEndX]);

    return (
        <group>
            <line ref={lineRef} geometry={geometry}>
                <lineBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
            </line>
            <mesh ref={dotRef} position={[lineStartX, lineY, 0.025]} visible={false}>
                <circleGeometry args={[0.018, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} />
            </mesh>
        </group>
    );
});

export default function CubeFaceText({
    text,
    hovered,
    forceHighlight = false,
    fontSize = FONT_SIZE,
    letterSpacing = LETTER_SPACING,
}) {
    const groupRef = useRef();
    const idleMatRef = useRef();
    const hoverMatRef = useRef();
    const ticksRef = useRef();
    const underlineRef = useRef();
    const progressRef = useRef(0);
    const lastPRef = useRef(-1);
    const scaleRef = useRef(1);
    const reducedMotion = useReducedMotion();
    const { invalidate } = useThree();

    const cssVars = useCSSVars([
        '--cube-text-accent',
        '--cube-text-hover',
        '--cube-text-default',
        '--cube-ticks-idle',
        '--cube-ticks-hover',
        '--cube-ticks-hover-scale'
    ]);

    const colors = useMemo(() => ({
        accent: rgbaToRgb(cssVars['--cube-text-accent'] || '#bbdaff'),
        hover: rgbaToRgb(cssVars['--cube-text-hover'] || '#ffffff'),
        default: rgbaToRgb(cssVars['--cube-text-default'] || '#1a2332'),
        ticksIdle: rgbaToRgb(cssVars['--cube-ticks-idle'] || 'rgba(255,255,255,0.35)'),
        ticksHover: rgbaToRgb(cssVars['--cube-ticks-hover'] || 'rgba(10,15,26,0.90)'),
        ticksHoverScale: parseFloat(cssVars['--cube-ticks-hover-scale']) || 1.15,
    }), [cssVars]);

    const { idleTex, hoverTex, textWidth, textHeight } = useMemo(() => {
        const idle = renderTextTexture(text, fontSize, letterSpacing, 'idle', {
            hatch: colors.accent,
            hatchOpacity: 0.75,
            stroke: colors.default,
            strokeWidth: 3.5,
            strokeOpacity: 1.0,
        });
        const hov = renderTextTexture(text, fontSize, letterSpacing, 'hover', {
            fill: colors.hover,
            stroke: colors.accent,
            strokeWidth: 1.8,
            strokeOpacity: 0.45,
        });
        return {
            idleTex: idle.texture,
            hoverTex: hov.texture,
            textWidth: idle.textWidth,
            textHeight: idle.textHeight,
        };
    }, [text, fontSize, letterSpacing, colors]);


    useFrame(() => {
        const target = (hovered || forceHighlight) ? 1 : 0;   // ← CHANGED
        const diff = target - progressRef.current;
        const isProgressSettled = Math.abs(diff) < 0.001;
        const targetScale = (hovered || forceHighlight) ? 1.10 : 1.0;   // ← CHANGED
        const isScaleSettled = Math.abs(scaleRef.current - targetScale) < 0.001;

        if (isProgressSettled && (reducedMotion || isScaleSettled)) {
            if (progressRef.current !== target) {
                progressRef.current = target;
                const p = target;
                if (idleMatRef.current) idleMatRef.current.opacity = 1 - p;
                if (hoverMatRef.current) hoverMatRef.current.opacity = p;
                ticksRef.current?.update(p, (hovered || forceHighlight) ? colors.ticksHoverScale : 1);   // ← CHANGED
                underlineRef.current?.update(p);
            }
            return;
        }

        invalidate();

        if (reducedMotion) {
            progressRef.current = target;
        } else {
            if (Math.abs(diff) < 0.002) progressRef.current = target;
            else progressRef.current += diff * 0.12;
        }

        const p = progressRef.current;
        if (Math.abs(p - lastPRef.current) < 0.003) return;
        lastPRef.current = p;

        if (idleMatRef.current) idleMatRef.current.opacity = 1 - p;
        if (hoverMatRef.current) hoverMatRef.current.opacity = p;

        if (!reducedMotion) {
            scaleRef.current += (targetScale - scaleRef.current) * 0.1;
            if (groupRef.current) {
                groupRef.current.scale.set(scaleRef.current, scaleRef.current, 1);
            }
        }

        const tickScale = 1 + p * (colors.ticksHoverScale - 1);
        ticksRef.current?.update(p, tickScale);
        underlineRef.current?.update(p);
    });

    const planeW = textWidth * 1.05;
    const planeH = textHeight * 1.05;

    return (
        <group ref={groupRef}>
            <mesh position={[0, 0, 0.010]}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial ref={idleMatRef} map={idleTex} transparent opacity={1} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0.012]}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial ref={hoverMatRef} map={hoverTex} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <FaceCornerTicks ref={ticksRef} idleColor={colors.ticksIdle} hoverColor={colors.ticksHover} />
            <UnderlineEffect ref={underlineRef} textWidth={textWidth} fontSize={fontSize} color={colors.accent} />
        </group>
    );
}

CubeFaceText.prewarmFaceTextures = prewarmFaceTextures;