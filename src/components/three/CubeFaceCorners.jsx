import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCubePalette } from '../../hooks/useCubePalette';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { createCornerMarkerGeometry, getCornerMarkerPalette, updateCornerMarker } from '../../utils/cubeCornerMarkers';

export default function CubeFaceCorners({ hovered, forceHighlight }) {
    const meshRef = useRef();
    const progressRef = useRef(0);
    const { invalidate } = useThree();
    const reducedMotion = useReducedMotion();
    const { colors } = useCubePalette();
    const palette = useMemo(() => getCornerMarkerPalette(colors), [colors]);
    const geometry = useMemo(() => createCornerMarkerGeometry(), []);

    useEffect(() => {
        meshRef.current.userData.cubeHoverProgress = progressRef.current;
        updateCornerMarker(meshRef.current, progressRef.current, palette, reducedMotion);
        invalidate();
    }, [hovered, forceHighlight, palette, reducedMotion, invalidate]);

    useFrame((_, delta) => {
        const target = hovered || forceHighlight ? 1 : 0;
        if (progressRef.current === target) return;
        const next = reducedMotion ? target : progressRef.current + (target - progressRef.current) * (1 - Math.exp(-8 * Math.min(delta, .1)));
        progressRef.current = Math.abs(target - next) < .001 ? target : next;
        meshRef.current.userData.cubeHoverProgress = progressRef.current;
        updateCornerMarker(meshRef.current, progressRef.current, palette, reducedMotion);
        if (progressRef.current !== target) invalidate();
    });

    return (
        <mesh ref={meshRef} name="cube-face-corners" userData={{ cubeCorner: true }} geometry={geometry} position={[0, 0, .006]}>
            <meshBasicMaterial color={palette.idle} transparent opacity={.85} depthWrite={false} toneMapped={false} />
        </mesh>
    );
}
