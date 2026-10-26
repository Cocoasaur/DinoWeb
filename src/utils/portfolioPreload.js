import { PAGE_LOADERS } from './prefetchPages';
import { loadDeferredStyles } from './deferredLoad';

const listeners = new Set();
const complete = new Set();
const failures = new Map();
const images = new Map();
let snapshot = { ready: false, phase: 'idle', completed: 0, total: 0, failed: 0 };
let tasks;
let running;

export const subscribePortfolioPreload = callback => { listeners.add(callback); return () => listeners.delete(callback); };
export const getPortfolioPreloadSnapshot = () => snapshot;
export const getPortfolioPreloadReady = () => snapshot.ready;
const publish = (phase, ready = false) => {
    snapshot = { ready, phase, completed: complete.size, total: tasks?.length || 0, failed: failures.size };
    listeners.forEach(listener => listener());
};

function deadline(work, label, cancel = () => {}) {
    let timer;
    return Promise.race([work, new Promise((_, reject) => {
        timer = setTimeout(() => { cancel(); reject(new Error(`Timed out: ${label}`)); }, 30000);
    })]).finally(() => clearTimeout(timer));
}

function loadAsset(url) {
    if (/\.(?:svg|webp|png|jpe?g|gif)(?:\?|$)/i.test(url)) {
        const image = new Image();
        const loaded = new Promise((resolve, reject) => {
            image.onload = () => image.decode().then(() => { images.set(url, image); resolve(); }, reject);
            image.onerror = () => reject(new Error(`Image unavailable: ${url}`));
            image.src = url;
        });
        return deadline(loaded, url, () => { image.src = ''; });
    }
    const controller = new AbortController();
    return deadline(fetch(url, { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error(`Asset unavailable: ${response.status} ${url}`);
        return response.arrayBuffer();
    }), url, () => controller.abort());
}

function makeTasks() {
    const manifest = document.getElementById('portfolio-preload-manifest');
    // Production HTML embeds its exact build's assets, avoiding a stale-manifest
    // race after deployment. Vite source URLs support the same preloader in dev.
    const urls = manifest ? JSON.parse(manifest.textContent) : Object.values(import.meta.glob('../assets/**/*.{svg,webp,png,jpg,jpeg,gif,pdf}', { eager: true, query: '?url', import: 'default' }));
    const modules = [
        { id: 'styles', load: loadDeferredStyles },
        ...Object.entries(PAGE_LOADERS).map(([id, load]) => ({ id, load })),
        { id: 'documents', load: () => import('../components/ui/CvViewer') },
        { id: 'cursor', load: () => import('../components/ui/CustomCursor') },
        { id: 'scrollbars', load: () => import('../components/ui/CustomScrollbars') },
    ];
    return [
        ...modules.map(task => ({ ...task, module: true })),
        ...[...new Set(urls)].filter(url => !url.startsWith('data:')).map(url => ({ id: url, load: () => loadAsset(url) })),
        { id: 'fonts', load: async () => {
            await Promise.all(['400 16px "Space Grotesk"', '700 16px "Space Grotesk"', '400 16px Inter', '500 16px Inter', '700 16px Inter'].map(font => document.fonts.load(font)));
            await document.fonts.ready;
        } },
    ];
}

async function loadTask(task) {
    if (complete.has(task.id)) return;
    try {
        await deadline(Promise.resolve().then(task.load), task.id);
        complete.add(task.id);
        failures.delete(task.id);
    } catch (error) {
        failures.set(task.id, error);
    }
    publish('loading');
}

export function startPortfolioPreload() {
    if (running || snapshot.ready) return running || Promise.resolve();
    tasks ??= makeTasks();
    publish('loading');
    running = (async () => {
        const queue = tasks.filter(task => task.id !== 'fonts' && !complete.has(task.id));
        let next = 0;
        await Promise.all(Array.from({ length: Math.min(6, queue.length) }, async () => {
            while (next < queue.length) await loadTask(queue[next++]);
        }));
        if (tasks.filter(task => task.module).every(task => complete.has(task.id))) {
            await loadTask(tasks.at(-1));
        } else failures.set('fonts', new Error('Font styles are still unavailable'));
        publish(failures.size ? 'error' : 'ready', failures.size === 0);
    })().finally(() => { running = undefined; });
    return running;
}

export function continueWithAvailableAssets() {
    if (!running && snapshot.phase === 'error') publish('partial', true);
}
