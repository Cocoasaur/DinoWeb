import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import CubeFace from './CubeFace';
import { FACE_CONFIG, DEFAULT_ROTATION, CUBE_OFFSET_X, CUBE_CENTER_X } from '../../constants/cubeConfig';
import { useCSSVars } from '../../hooks/useCSSVars';
import { useReducedMotion } from '../../hooks/useReducedMotion';

function shortestPath(current, target) {
    let diff = (current - target) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return target + diff;
}

export default function InteractiveCube({
    onFaceClick, onFacePressStart, targetRotation, isZoomed, isZoomingOut,
    zoomZ, onRotationChange, isDraggingRef,
    onZoomComplete, onZoomOutComplete
}) {
    const groupRef = useRef();
    const rotationRef = useRef({
        x: THREE.MathUtils.degToRad(DEFAULT_ROTATION.x),
        y: THREE.MathUtils.degToRad(DEFAULT_ROTATION.y)
    });
    const lastMouse = useRef({ x: 0, y: 0 });
    const lastPointerDownFaceName = useRef(null);
    const animTimerRef = useRef(0);
    const hasNotifiedRef = useRef(false);
    const zoomOutTimerRef = useRef(0);
    const hasNotifiedOutRef = useRef(false);
    const { camera, gl, invalidate } = useThree();
    const reducedMotion = useReducedMotion();

    const cssVars = useCSSVars([
        '--cube-color',
        '--cube-edge-color',
        '--cube-edge-opacity'
    ]);

    const cubeColor = cssVars['--cube-color'] || '#4a6b9a';
    const edgeColor = cssVars['--cube-edge-color'] || '#ffffff';
    const edgeOpacity = parseFloat(cssVars['--cube-edge-opacity']) || 0.35;

    const pressRef = useRef({
        active: false,
        t: 0,
        targetFaceName: null,
        scaleMin: 0.88,
        durationPress: reducedMotion ? 0.05 : 0.08,   // faster dip
        durationHold: 0,                              // remove the pause
        durationRelease: reducedMotion ? 0.05 : 0.25,  // snappy spring-back
    });

    // ─── FIX: memoize targetRad so its reference is stable between renders ────
    // Previously this was computed inline as a plain object literal, which
    // created a new reference on every render. Because the useEffect below
    // lists targetRad as a dependency, any re-render caused by overlayPhase
    // state changes would re-fire the effect, resetting animTimerRef to 0 and
    // hasNotifiedRef to false — causing onZoomComplete to fire in a loop.
    const targetRad = useMemo(() => targetRotation ? {
        x: THREE.MathUtils.degToRad(targetRotation.x),
        y: THREE.MathUtils.degToRad(targetRotation.y)
    } : null, [targetRotation]);

    useEffect(() => {
        pressRef.current.durationPress = reducedMotion ? 0.05 : 0.08;
        pressRef.current.durationHold = 0;
        pressRef.current.durationRelease = reducedMotion ? 0.05 : 0.25;
    }, [reducedMotion]);

    useEffect(() => {
        if (!isZoomed || !targetRad || !groupRef.current) return;
        animTimerRef.current = 0;
        hasNotifiedRef.current = false;
        const nx = shortestPath(groupRef.current.rotation.x, targetRad.x);
        const ny = shortestPath(groupRef.current.rotation.y, targetRad.y);
        groupRef.current.rotation.x = nx;
        groupRef.current.rotation.y = ny;
        rotationRef.current = { x: nx, y: ny };
    }, [isZoomed, targetRad]);

    useEffect(() => {
        if (!isZoomingOut) return;
        zoomOutTimerRef.current = 0;
        hasNotifiedOutRef.current = false;
    }, [isZoomingOut]);

    useEffect(() => {
        const canvas = gl.domElement;
        const handleMouseDown = (e) => {
            if (isZoomed) return;
            isDraggingRef.current = true;
            lastMouse.current = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';
        };
        const handleMouseMove = (e) => {
            if (!isDraggingRef.current || isZoomed) return;
            rotationRef.current = {
                x: rotationRef.current.x + (e.clientY - lastMouse.current.y) * 0.008,
                y: rotationRef.current.y + (e.clientX - lastMouse.current.x) * 0.008
            };
            lastMouse.current = { x: e.clientX, y: e.clientY };
            invalidate();
        };
        const handleMouseUp = () => {
            isDraggingRef.current = false;
            canvas.style.cursor = 'grab';
        };

        canvas.addEventListener('mousedown', handleMouseDown, { passive: true });
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp, { passive: true });
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isZoomed, isDraggingRef, gl, invalidate]);

    const handleFaceClickWithPress = (faceName) => {
        if (pressRef.current.active) return;

        onFacePressStart?.();
        pressRef.current.active = true;
        pressRef.current.t = 0;
        pressRef.current.targetFaceName = faceName;
    };

    const boxMaterial = useMemo(() => (
        <meshStandardMaterial color={cubeColor} roughness={0.55} metalness={0.2} />
    ), [cubeColor]);

    const edgeMaterial = useMemo(() => (
        <meshBasicMaterial
            color={edgeColor}
            transparent
            opacity={edgeOpacity}
            side={THREE.BackSide}
        />
    ), [edgeColor, edgeOpacity]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const rotX = groupRef.current.rotation.x;
        const rotY = groupRef.current.rotation.y;
        const posX = groupRef.current.position.x;

        const dt = Math.min(delta, 0.1);

        let pressScale = 1;
        if (pressRef.current.active) {
            pressRef.current.t += dt;
            const { t, scaleMin, durationPress, durationHold, durationRelease } = pressRef.current;
            const total = durationPress + durationHold + durationRelease;

            if (t >= total) {
                pressRef.current.active = false;
                pressScale = 1;
                if (pressRef.current.targetFaceName) {
                    onFaceClick(pressRef.current.targetFaceName);
                    pressRef.current.targetFaceName = null;
                }
            } else if (t < durationPress) {
                const p = t / durationPress;
                pressScale = 1 - (1 - scaleMin) * (p * p);
            } else if (t < durationPress + durationHold) {
                pressScale = scaleMin;
            } else {
                const p = (t - durationPress - durationHold) / durationRelease;
                pressScale = scaleMin + (1 - scaleMin) * (1 - Math.pow(1 - p, 3));
            }
        }

        const lerpFactor = reducedMotion ? 1 : 0.025;

        if (isZoomingOut) {
            const targetDist = 5 * (1 + zoomZ / 1000);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetDist, lerpFactor);
            groupRef.current.position.x = THREE.MathUtils.lerp(posX, CUBE_OFFSET_X, lerpFactor);

            if (!reducedMotion) {
                groupRef.current.rotation.x = THREE.MathUtils.lerp(rotX, rotationRef.current.x, 0.03);
                groupRef.current.rotation.y = THREE.MathUtils.lerp(rotY, rotationRef.current.y, 0.03);
            } else {
                groupRef.current.rotation.x = rotationRef.current.x;
                groupRef.current.rotation.y = rotationRef.current.y;
            }

            if (Math.abs(camera.position.z - targetDist) < 0.05 && Math.abs(posX - CUBE_OFFSET_X) < 0.05 && !hasNotifiedOutRef.current) {
                hasNotifiedOutRef.current = true;
                onZoomOutComplete?.();
            }
        } else if (isZoomed && targetRad) {
            animTimerRef.current += dt;

            if (!reducedMotion) {
                groupRef.current.rotation.x = THREE.MathUtils.lerp(rotX, targetRad.x, 0.04);
                groupRef.current.rotation.y = THREE.MathUtils.lerp(rotY, targetRad.y, 0.04);
            } else {
                groupRef.current.rotation.x = targetRad.x;
                groupRef.current.rotation.y = targetRad.y;
            }

            groupRef.current.position.x = THREE.MathUtils.lerp(posX, CUBE_CENTER_X, 0.05);
            const rawT = (animTimerRef.current - 0.4) / 1.0;
            const t = Math.min(Math.max(rawT, 0), 1);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, THREE.MathUtils.lerp(5, 2.2, eased), 0.07);

            if (animTimerRef.current > 1.6 && !hasNotifiedRef.current) {
                hasNotifiedRef.current = true;
                onZoomComplete?.();
            }
        } else {
            if (!reducedMotion) {
                groupRef.current.rotation.x = THREE.MathUtils.lerp(rotX, rotationRef.current.x, 0.1);
                groupRef.current.rotation.y = THREE.MathUtils.lerp(rotY, rotationRef.current.y, 0.1);
            } else {
                groupRef.current.rotation.x = rotationRef.current.x;
                groupRef.current.rotation.y = rotationRef.current.y;
            }
            groupRef.current.position.x = THREE.MathUtils.lerp(posX, CUBE_OFFSET_X, 0.05);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5 * (1 + zoomZ / 1000), 0.08);
        }

        groupRef.current.scale.setScalar(pressScale);

        onRotationChange(
            THREE.MathUtils.radToDeg(groupRef.current.rotation.x),
            THREE.MathUtils.radToDeg(groupRef.current.rotation.y)
        );
    });

    return (
        <group
            ref={groupRef}
            position={[CUBE_OFFSET_X, 0, 0]}
            rotation={[
                THREE.MathUtils.degToRad(DEFAULT_ROTATION.x),
                THREE.MathUtils.degToRad(DEFAULT_ROTATION.y),
                0,
            ]}
        >
            <RoundedBox args={[2, 2, 2]} radius={0.06} smoothness={4}>
                {boxMaterial}
            </RoundedBox>
            <RoundedBox args={[2.002, 2.002, 2.002]} radius={0.06} smoothness={4}>
                {edgeMaterial}
            </RoundedBox>
            {FACE_CONFIG.map((face) => (
                <CubeFace key={face.name} {...face}
                    onFaceClick={handleFaceClickWithPress}
                    isZoomed={isZoomed} lastPointerDownFaceName={lastPointerDownFaceName} />
            ))}
        </group>
    );
}