import { useState, useEffect } from 'react';
import { PRELOAD_IMAGES, PRELOAD_FILES } from '../constants/preloadAssets';
import { prefetchLazyChunks } from '../utils/prefetchPages';

// Safety net: never let a wedged request block portfolio entry forever.
const SAFETY_TIMEOUT_MS = 20000;

let preloadPromise = null;
let safetyTimerId = 0;

function preloadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
    });
}

function runPreload(onProgress) {
    const tasks = [
        ...PRELOAD_IMAGES.map(preloadImage),
        ...PRELOAD_FILES.map((url) => fetch(url).then(() => {}).catch(() => {})),
        Promise.resolve(typeof document.fonts !== 'undefined' ? document.fonts.ready : true),
        ...prefetchLazyChunks(),
    ];

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

export function useAssetPreloader() {
    const [state, setState] = useState({ progress: 0, done: false });

    useEffect(() => {
        if (!preloadPromise) {
            preloadPromise = Promise.race([
                runPreload((progress) => {
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
        });

        return () => {
            window.clearTimeout(safetyTimerId);
        };
    }, []);

    return state;
}