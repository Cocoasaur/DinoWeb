import { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import CubeFaceText from './CubeFaceText';
import { DRAG_THRESHOLD } from '../../constants/cubeConfig';
import { getHomeTexture } from '../../utils/cubeResources';


function HomeIcon() {
    const iconTexture = getHomeTexture();
    return (
        <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.6, 1.6]} />
            <meshBasicMaterial map={iconTexture} transparent opacity={0.9} side={THREE.FrontSide} />
        </mesh>
    );
}

export default function CubeFace({
    name, position, rotation, text,
    onFaceClick, isZoomed, isZoomingOut, activeFace,   // ← ADDED isZoomingOut & activeFace
    lastPointerDownFaceNameRef, suppressFaceClickRef,
    faceDownPosRef, reduceEffects
}) {
    const [hovered, setHovered] = useState(false);
    const pointerDownPos = useRef({ x: 0, y: 0 });
    const touchHold = useRef(null);
    const isHome = name === 'home';

    // Lock highlight while this face is the active one during zoom in / zoom out
    const forceHighlight = (name === activeFace) && (isZoomed || isZoomingOut);  // ← ADDED

    const handlePointerDown = useCallback((e) => {
        e.stopPropagation();
        if (isHome) return;
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
        touchHold.current = e.pointerType === 'touch' ? { cancelled: false } : null;
        setHovered(true);
        if (faceDownPosRef && faceDownPosRef.current) {
            faceDownPosRef.current.x = e.clientX;
            faceDownPosRef.current.y = e.clientY;
            faceDownPosRef.current.valid = true;
        }
        if (lastPointerDownFaceNameRef) lastPointerDownFaceNameRef.current = name;
    }, [name, lastPointerDownFaceNameRef, isHome, faceDownPosRef]);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isHome) return;
        if (isZoomed) return;
        if (touchHold.current?.cancelled) return;
        if (suppressFaceClickRef?.current) {
            suppressFaceClickRef.current = false;
            return;
        }
        if (lastPointerDownFaceNameRef && lastPointerDownFaceNameRef.current !== name) return;
        const dx = e.clientX - pointerDownPos.current.x;
        const dy = e.clientY - pointerDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return;
        onFaceClick(name);
    }, [name, onFaceClick, isZoomed, lastPointerDownFaceNameRef, isHome, suppressFaceClickRef]);

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

    useEffect(() => {
        if (!hovered) return;
        const endHold = (event) => {
            if (!touchHold.current) return;
            const moved = event.type === 'pointermove' && Math.hypot(
                event.clientX - pointerDownPos.current.x,
                event.clientY - pointerDownPos.current.y
            ) > DRAG_THRESHOLD;
            const cancelled = event.type === 'pointercancel' || (event.type === 'touchstart' && event.touches.length > 1);
            if (moved || cancelled) touchHold.current.cancelled = true;
            if (moved || cancelled || event.type === 'pointerup') setHovered(false);
        };
        const preventHoldMenu = (event) => {
            if (touchHold.current && !touchHold.current.cancelled) event.preventDefault();
        };
        for (const type of ['pointermove', 'pointerup', 'pointercancel', 'touchstart']) document.addEventListener(type, endHold, { passive: true });
        const canvas = document.querySelector('.cube-entrance canvas');
        canvas?.addEventListener('contextmenu', preventHoldMenu);
        return () => {
            for (const type of ['pointermove', 'pointerup', 'pointercancel', 'touchstart']) document.removeEventListener(type, endHold);
            canvas?.removeEventListener('contextmenu', preventHoldMenu);
        };
    }, [hovered]);

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
                    visible={false}
                    side={THREE.FrontSide}
                    depthWrite={false}
                />
            </mesh>

            {hovered && !isHome && (
                <mesh position={[0, 0, 0.001]}>
                    <planeGeometry args={[2, 2]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.FrontSide} depthWrite={false} />
                </mesh>
            )}

            {isHome ? (
                <HomeIcon />
            ) : (
                <CubeFaceText
                    text={text}
                    reduceEffects={reduceEffects}
                    hovered={hovered}
                    forceHighlight={forceHighlight}   // ← ADDED
                />
            )}
        </group>
    );
}
