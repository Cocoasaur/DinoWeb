import { useState, useEffect } from 'react';

import { getRenderProfile } from '../utils/renderProfile';

export function useAdaptiveDPR() {
    const [profile, setProfile] = useState(getRenderProfile);

    useEffect(() => {
        const connection = navigator.connection;
        const mobileQuery = window.matchMedia(
            '(max-width: 767px), (hover: none) and (pointer: coarse)'
        );
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateProfile = () => {
            const next = getRenderProfile();
            setProfile((current) => (
                current.tier === next.tier &&
                current.isMobile === next.isMobile &&
                current.dpr[1] === next.dpr[1] &&
                current.labelScale === next.labelScale
                    ? current
                    : next
            ));
        };

        connection?.addEventListener?.('change', updateProfile);
        mobileQuery.addEventListener('change', updateProfile);
        motionQuery.addEventListener('change', updateProfile);

        return () => {
            connection?.removeEventListener?.('change', updateProfile);
            mobileQuery.removeEventListener('change', updateProfile);
            motionQuery.removeEventListener('change', updateProfile);
        };
    }, []);

    return profile;
}
