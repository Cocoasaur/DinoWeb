import { TextureLoader, LinearFilter } from 'three';
import dinoIcon from '../assets/brand/dino-icon.webp';
import metrics from '../assets/cube-labels/metrics.json';
import { THEME_CLAIR, THEME_DEMAIN } from '../context/ThemeContext';

const urls = import.meta.glob('../assets/cube-labels/*.webp', { eager: true, query: '?url', import: 'default' });
const labels = Object.keys(metrics);
const loader = new TextureLoader();
const atlasCache = new Map();
const loads = new Map();
let iconTexture;
let iconPromise;

function rasterScale() {
    const mobile = window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = navigator.connection;
    return mobile || reduced || (navigator.deviceMemory || 4) <= 4 || (navigator.hardwareConcurrency || 4) <= 4 ||
        connection?.saveData || ['2g', '3g'].includes(connection?.effectiveType) ? .5 : 2;
}

function prepareLabels(theme, scale) {
    const key = `${theme}:${scale}`;
    if (!loads.has(key)) {
        const palette = theme === THEME_DEMAIN ? 'demain' : 'clair';
        loads.set(key, Promise.all(labels.map(async (text) => {
            const texture = await loader.loadAsync(urls[`../assets/cube-labels/${text.toLowerCase()}-${palette}-${scale}.webp`]);
            texture.minFilter = LinearFilter;
            texture.magFilter = LinearFilter;
            texture.generateMipmaps = false;
            // Both states share one decoded image and one GPU image allocation.
            const idle = texture.clone();
            idle.repeat.y = .5; idle.offset.y = .5; idle.needsUpdate = true;
            const hover = texture.clone();
            hover.repeat.y = .5; hover.needsUpdate = true;
            atlasCache.set(`${key}:${text}`, { idleTex: idle, hoverTex: hover });
        })));
    }
    return loads.get(key);
}

export async function prepareCubeResources() {
    iconPromise ??= loader.loadAsync(dinoIcon).then((texture) => {
        texture.minFilter = LinearFilter;
        texture.generateMipmaps = false;
        iconTexture = texture;
    });
    await Promise.all([iconPromise, prepareLabels(document.documentElement.getAttribute('data-theme') || THEME_CLAIR, rasterScale())]);
}

export function getHomeTexture() { return iconTexture; }

export function getFaceTextures(text, theme, scale, fontSize) {
    const atlas = atlasCache.get(`${theme}:${scale}:${text}`);
    if (!atlas) throw prepareLabels(theme, scale);
    return { ...atlas, textWidth: metrics[text].widthRatio * fontSize, textHeight: metrics[text].heightRatio * fontSize };
}

export function prewarmCubeLabels() {
    return Promise.all([THEME_CLAIR, THEME_DEMAIN].map((theme) => prepareLabels(theme, rasterScale())));
}
