import React, { useRef, useState, useCallback } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import CubeFaceText from './CubeFaceText';  // ← NEW IMPORT
import { DRAG_THRESHOLD } from '../../constants/cubeConfig';
import dinoIcon from '../../assets/brand/dino-icon.png';

function HomeIcon() {
    const iconTexture = useTexture(dinoIcon);
    return (
        <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.6, 1.6]} />
            <meshBasicMaterial map={iconTexture} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
    );
}

export default function CubeFace({
    name, position, rotation, text,
    onFaceClick, isZoomed, lastPointerDownFaceName
}) {
    const [hovered, setHovered] = useState(false);
    const pointerDownPos = useRef({ x: 0, y: 0 });
    const isHome = name === 'home';

    const handlePointerDown = useCallback((e) => {
        e.stopPropagation();
        if (isHome) return;
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
        if (lastPointerDownFaceName) lastPointerDownFaceName.current = name;
    }, [name, lastPointerDownFaceName, isHome]);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isHome) return;
        if (isZoomed) return;
        if (lastPointerDownFaceName && lastPointerDownFaceName.current !== name) return;
        const dx = e.clientX - pointerDownPos.current.x;
        const dy = e.clientY - pointerDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return;
        onFaceClick(name);
    }, [name, onFaceClick, isZoomed, lastPointerDownFaceName, isHome]);

    const handlePointerOver = useCallback((e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = isHome ? 'nwse-resize' : 'pointer';
    }, [isHome]);

    const handlePointerOut = useCallback((e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'grab';
    }, []);

    return (
        <group position={position} rotation={rotation}>
            {/* Hit plane */}
            <mesh
                onPointerDown={handlePointerDown}
                onClick={handleClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                renderOrder={isHome ? 1 : 0}
            >
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {hovered && !isHome && (
                <mesh position={[0, 0, 0.001]}>
                    <planeGeometry args={[2, 2]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
            )}

            {isHome ? (
                <HomeIcon />
            ) : (
                <CubeFaceText
                    text={text}
                    hovered={hovered}
                />
            )}
        </group>
    );
}