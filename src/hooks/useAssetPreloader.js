import { useState, useEffect } from 'react';
import { PRELOAD_CRITICAL } from '../constants/preloadAssets';

const SAFETY_TIMEOUT_MS = 3000;

let preloadPromise = null;

function preloadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.decoding = 'async';
        img.fetchPriority = 'high';
        img.src = url;
    });
}

export function useAssetPreloader() {
    const [state, setState] = useState({ progress: 0, done: false });

    useEffect(() => {
        let cancelled = false;

        if (!preloadPromise) {
            const criticalAssets = Promise.all(PRELOAD_CRITICAL.map(preloadImage));
            preloadPromise = Promise.race([
                criticalAssets,
                new Promise((resolve) => {
                    window.setTimeout(resolve, SAFETY_TIMEOUT_MS);
                }),
            ]);
        }

        preloadPromise.then(() => {
            if (!cancelled) setState({ progress: 1, done: true });
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}
