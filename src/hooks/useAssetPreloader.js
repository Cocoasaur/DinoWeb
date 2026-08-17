import { useState, useEffect } from 'react';
import { PRELOAD_CRITICAL, PRELOAD_DEFERRED, PRELOAD_FILES } from '../constants/preloadAssets';
import { prefetchLazyChunks } from '../utils/prefetchPages';
import CubeFaceText from '../components/three/CubeFaceText';

// Safety net: never let a wedged request block portfolio entry forever.
const SAFETY_TIMEOUT_MS = 20000;

let preloadPromise = null;
let safetyTimerId = 0;
let deferredWarmStarted = false;

function preloadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
    });
}

function runPreload(tasks, onProgress) {
    const total = tasks.length;
    let loaded = 0;

    const all = tasks.map((task) => (
        task.then(() => {
            loaded += 1;
            onProgress(loaded / total);
        }).catch(() => {
            loaded += 1;
            onProgress(loaded / total);
        })
    ));

    return Promise.all(all);
}

// Remaining assets (certifications, project screenshots, skill icons) are
// warmed off the critical path once the boot screen has released.
function warmDeferredAssets() {
    if (deferredWarmStarted) return;
    deferredWarmStarted = true;

    const warm = () => {
        PRELOAD_DEFERRED.forEach(preloadImage);
        CubeFaceText.prewarmFaceTextures();
    };

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(warm, { timeout: 5000 });
    } else {
        window.setTimeout(warm, 500);
    }
}

export function useAssetPreloader() {
    const [state, setState] = useState({ progress: 0, done: false });

    useEffect(() => {
        if (!preloadPromise) {
            const criticalTasks = [
                ...PRELOAD_CRITICAL.map(preloadImage),
                ...PRELOAD_FILES.map((url) => fetch(url).then(() => {}).catch(() => {})),
                Promise.resolve(typeof document.fonts !== 'undefined' ? document.fonts.ready : true),
                ...prefetchLazyChunks(),
            ];

            preloadPromise = Promise.race([
                runPreload(criticalTasks, (progress) => {
                    setState({ progress, done: false });
                }),
                new Promise((resolve) => {
                    window.clearTimeout(safetyTimerId);
                    safetyTimerId = window.setTimeout(resolve, SAFETY_TIMEOUT_MS);
                }),
            ]);
        }

        preloadPromise.then(() => {
            setState({ progress: 1, done: true });
            warmDeferredAssets();
        });

        return () => {
            window.clearTimeout(safetyTimerId);
        };
    }, []);

    return state;
}