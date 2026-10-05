import { useState, useEffect } from 'react';

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

function getRenderProfile() {
    const tier = getDeviceTier();
    const pixelRatio = window.devicePixelRatio || 1;
    const isMobile = window.matchMedia(
        '(max-width: 767px), (hover: none) and (pointer: coarse)'
    ).matches;
    const maxDpr = tier === 'low' ? 1 : tier === 'medium' || isMobile ? 1.25 : 1.75;

    return {
        tier,
        isMobile,
        dpr: [1, Math.min(pixelRatio, maxDpr)],
    };
}

export function useAdaptiveDPR() {
    const [profile, setProfile] = useState(getRenderProfile);

    useEffect(() => {
        const connection = navigator.connection;
        const mobileQuery = window.matchMedia(
            '(max-width: 767px), (hover: none) and (pointer: coarse)'
        );
        const updateProfile = () => {
            const next = getRenderProfile();
            setProfile((current) => (
                current.tier === next.tier &&
                current.isMobile === next.isMobile &&
                current.dpr[1] === next.dpr[1]
                    ? current
                    : next
            ));
        };

        connection?.addEventListener?.('change', updateProfile);
        mobileQuery.addEventListener('change', updateProfile);

        return () => {
            connection?.removeEventListener?.('change', updateProfile);
            mobileQuery.removeEventListener('change', updateProfile);
        };
    }, []);

    return profile;
}
