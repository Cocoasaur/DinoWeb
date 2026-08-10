import { useState, useEffect, useRef } from 'react';

function getDeviceTier() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const connection = navigator.connection;
    const saveData = connection?.saveData;
    const effectiveType = connection?.effectiveType;

    if (saveData || memory <= 2 || cores <= 2 || effectiveType === '2g') return 'low';
    if (memory <= 4 || cores <= 4 || effectiveType === '3g') return 'medium';
    return 'high';
}

export function useAdaptiveDPR() {
    const [dpr, setDpr] = useState([1, 1]);
    const tierRef = useRef(getDeviceTier());

    useEffect(() => {
        const tier = tierRef.current;
        const pixelRatio = window.devicePixelRatio || 1;

        if (tier === 'low') {
            setDpr([1, Math.min(pixelRatio, 1.25)]);
        } else if (tier === 'medium') {
            setDpr([1, Math.min(pixelRatio, 1.75)]);
        } else {
            setDpr([1, Math.min(pixelRatio, 2.0)]);
        }

        // Listen for connection changes
        const connection = navigator.connection;
        if (connection?.addEventListener) {
            const onChange = () => {
                const newTier = getDeviceTier();
                if (newTier !== tierRef.current) {
                    tierRef.current = newTier;
                    const pr = window.devicePixelRatio || 1;
                    setDpr(newTier === 'low' ? [1, Math.min(pr, 1.25)] :
                        newTier === 'medium' ? [1, Math.min(pr, 1.75)] : [1, Math.min(pr, 2.0)]);
                }
            };
            connection.addEventListener('change', onChange);
            return () => connection.removeEventListener('change', onChange);
        }
    }, []);

    return { dpr, tier: tierRef.current };
}