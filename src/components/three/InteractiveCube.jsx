import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import CubeFace from './CubeFace';
import { FACE_CONFIG, DEFAULT_ROTATION, CUBE_CENTER_X } from '../../constants/cubeConfig';
import { useCSSVars } from '../../hooks/useCSSVars';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useHomeViewportLayout } from '../../hooks/useHomeViewportLayout';

function shortestPath(current, target) {
    let diff = (current - target) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return target + diff;
}

// ── Idle drift: slow random rotation while the cube is untouched ──
const IDLE_DRIFT_SETTLE_MS = 2000;
const IDLE_DRIFT_FACTOR = 0.005;
const IDLE_DRIFT_MIN = 6;
const IDLE_DRIFT_MAX = 14;
const IDLE_DRIFT_X_STEP = THREE.MathUtils.degToRad(30);
const IDLE_DRIFT_X_LIMIT = THREE.MathUtils.degToRad(40);
const IDLE_DRIFT_Y_STEP = THREE.MathUtils.degToRad(140);

// ── Idle breath: barely-perceptible scale oscillation ──
const BREATH_PERIOD_S = 5;
const BREATH_AMPLITUDE = 0.012;

const rand = (min, max) => min + Math.random() * (max - min);

const screenPosVector = new THREE.Vector3();

function getZoomedCameraZ(camera, cubeScale, breakpoint) {
    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2;
    const aspect = camera.aspect || window.innerWidth / window.innerHeight;
    const faceHalfSize = cubeScale;
    const faceDepth = cubeScale * 1.01;
    const overscan = breakpoint === 'phone'
        ? 1.55
        : breakpoint === 'tablet'
            ? 1.45
            : 1.65;
    const fitDistance = faceHalfSize / (Math.tan(halfFov) * Math.max(1, aspect) * overscan);

    return Math.max(faceDepth + fitDistance, faceDepth + camera.near + 0.16);
}

export default function InteractiveCube({
    onFaceClick, onFacePressStart, targetRotation, isZoomed, isZoomingOut,
    zoomZ, onRotationChange, isDraggingRef, onPinchZoom,
    onZoomComplete, onZoomOutComplete,
    activeFace,
    screenPosRef,
    faceDownPosRef,
}) {
    const groupRef = useRef();
    const rotationRef = useRef({
        x: THREE.MathUtils.degToRad(DEFAULT_ROTATION.x),
        y: THREE.MathUtils.degToRad(DEFAULT_ROTATION.y)
    });
    const lastMouse = useRef({ x: 0, y: 0 });
    const lastPointerDownFaceName = useRef(null);
    const pinchRef = useRef({
        active: false,
        lastDistance: 0,
    });
    const suppressFaceClickRef = useRef(false);
    const suppressFaceClickTimerRef = useRef(0);
    const animTimerRef = useRef(0);
    const hasNotifiedRef = useRef(false);
    const zoomOutTimerRef = useRef(0);
    const hasNotifiedOutRef = useRef(false);
    const idleDriftRef = useRef({ active: false, x: 0, y: 0, reRollIn: 0 });
    const breathTimeRef = useRef(0);
    const lastInteractTimeRef = useRef(0);
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
    const { breakpoint, restingX, restingY, cubeScale } = useHomeViewportLayout();

    const pressRef = useRef({
        active: false,
        t: 0,
        targetFaceName: null,
        scaleMin: 0.88,
        durationPress: reducedMotion ? 0.05 : 0.08,
        durationHold: 0,
        durationRelease: reducedMotion ? 0.05 : 0.25,
    });

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

    const clearSuppressFaceClickTimer = () => {
        if (!suppressFaceClickTimerRef.current) return;
        window.clearTimeout(suppressFaceClickTimerRef.current);
        suppressFaceClickTimerRef.current = 0;
    };

    const suppressFaceClickBriefly = () => {
        suppressFaceClickRef.current = true;
        clearSuppressFaceClickTimer();
        suppressFaceClickTimerRef.current = window.setTimeout(() => {
            suppressFaceClickRef.current = false;
            suppressFaceClickTimerRef.current = 0;
        }, 350);
    };

    useEffect(() => {
        const canvas = gl.domElement;
        const previousTouchAction = canvas.style.touchAction;

        canvas.style.touchAction = 'none';

        const getTouchDistance = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.hypot(dx, dy);
        };

        const handleMouseDown = (e) => {
            if (isZoomed || isZoomingOut) return;
            lastInteractTimeRef.current = performance.now();
            idleDriftRef.current.active = false;
            if (groupRef.current) {
                rotationRef.current = { x: groupRef.current.rotation.x, y: groupRef.current.rotation.y };
            }
            isDraggingRef.current = true;
            lastMouse.current = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';
        };
        const handleMouseMove = (e) => {
            if (!isDraggingRef.current || isZoomed || isZoomingOut) return;
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

        const handleTouchStart = (e) => {
            if (isZoomed || isZoomingOut) return;
            lastInteractTimeRef.current = performance.now();
            idleDriftRef.current.active = false;

            if (e.touches.length >= 2) {
                e.preventDefault();
                pinchRef.current.active = true;
                pinchRef.current.lastDistance = getTouchDistance(e.touches);
                isDraggingRef.current = false;
                lastPointerDownFaceName.current = null;
                suppressFaceClickBriefly();
                invalidate();
                return;
            }

            if (groupRef.current) {
                rotationRef.current = { x: groupRef.current.rotation.x, y: groupRef.current.rotation.y };
            }
            isDraggingRef.current = true;
            lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };
        const handleTouchMove = (e) => {
            if (isZoomed || isZoomingOut) return;

            if (e.touches.length >= 2) {
                e.preventDefault();
                const distance = getTouchDistance(e.touches);
                const previousDistance = pinchRef.current.active
                    ? pinchRef.current.lastDistance
                    : distance;
                const distanceDelta = distance - previousDistance;
                pinchRef.current.active = true;
                pinchRef.current.lastDistance = distance;
                isDraggingRef.current = false;
                lastPointerDownFaceName.current = null;
                suppressFaceClickBriefly();
                onPinchZoom?.(distanceDelta);
                invalidate();
                return;
            }

            if (!isDraggingRef.current || pinchRef.current.active) return;

            e.preventDefault();
            const touch = e.touches[0];
            rotationRef.current = {
                x: rotationRef.current.x + (touch.clientY - lastMouse.current.y) * 0.008,
                y: rotationRef.current.y + (touch.clientX - lastMouse.current.x) * 0.008
            };
            lastMouse.current = { x: touch.clientX, y: touch.clientY };
            invalidate();
        };
        const handleTouchEnd = (e) => {
            if (pinchRef.current.active) {
                suppressFaceClickBriefly();
            }

            if (e.touches.length >= 2) {
                pinchRef.current.lastDistance = getTouchDistance(e.touches);
                isDraggingRef.current = false;
                return;
            }

            pinchRef.current.active = false;

            if (e.touches.length === 1 && !isZoomed && !isZoomingOut) {
                lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                isDraggingRef.current = false;
                return;
            }

            isDraggingRef.current = false;
        };
        const handleTouchCancel = () => {
            pinchRef.current.active = false;
            pinchRef.current.lastDistance = 0;
            isDraggingRef.current = false;
            suppressFaceClickBriefly();
        };

        canvas.addEventListener('mousedown', handleMouseDown, { passive: true });
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp, { passive: true });
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        return () => {
            canvas.style.touchAction = previousTouchAction;
            clearSuppressFaceClickTimer();
            canvas.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [isZoomed, isZoomingOut, isDraggingRef, gl, invalidate, onPinchZoom]);

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

    const handleZoomOutDone = () => {
        lastInteractTimeRef.current = performance.now();
        idleDriftRef.current.active = false;
        onZoomOutComplete?.();
    };

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const rotX = groupRef.current.rotation.x;
        const rotY = groupRef.current.rotation.y;
        const posX = groupRef.current.position.x;
        const posY = groupRef.current.position.y;

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
            groupRef.current.position.x = THREE.MathUtils.lerp(posX, restingX, lerpFactor);
            groupRef.current.position.y = THREE.MathUtils.lerp(posY, restingY, lerpFactor);

            if (!reducedMotion) {
                groupRef.current.rotation.x = THREE.MathUtils.lerp(rotX, rotationRef.current.x, 0.03);
                groupRef.current.rotation.y = THREE.MathUtils.lerp(rotY, rotationRef.current.y, 0.03);
            } else {
                groupRef.current.rotation.x = rotationRef.current.x;
                groupRef.current.rotation.y = rotationRef.current.y;
            }

            if (
                Math.abs(camera.position.z - targetDist) < 0.05 &&
                Math.abs(posX - restingX) < 0.05 &&
                Math.abs(posY - restingY) < 0.05 &&
                !hasNotifiedOutRef.current
            ) {
                hasNotifiedOutRef.current = true;
                handleZoomOutDone();
            }
        } else if (isZoomed && targetRad) {
            animTimerRef.current += dt;
            const idleCameraZ = 5 * (1 + zoomZ / 1000);
            const zoomedCameraZ = getZoomedCameraZ(camera, cubeScale, breakpoint);
            const zoomLerpFactor = reducedMotion ? 1 : (breakpoint === 'phone' ? 0.18 : 0.12);

            if (!reducedMotion) {
                groupRef.current.rotation.x = THREE.MathUtils.lerp(rotX, targetRad.x, 0.04);
                groupRef.current.rotation.y = THREE.MathUtils.lerp(rotY, targetRad.y, 0.04);
            } else {
                groupRef.current.rotation.x = targetRad.x;
                groupRef.current.rotation.y = targetRad.y;
            }

            groupRef.current.position.x = THREE.MathUtils.lerp(posX, CUBE_CENTER_X, 0.05);
            groupRef.current.position.y = THREE.MathUtils.lerp(posY, 0, 0.05);
            const rawT = (animTimerRef.current - 0.4) / 1.0;
            const t = Math.min(Math.max(rawT, 0), 1);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            camera.position.z = THREE.MathUtils.lerp(
                camera.position.z,
                THREE.MathUtils.lerp(idleCameraZ, zoomedCameraZ, eased),
                zoomLerpFactor
            );

            const zoomSettled = Math.abs(camera.position.z - zoomedCameraZ) < 0.04;
            const cubeCentered = Math.abs(groupRef.current.position.x - CUBE_CENTER_X) < 0.05 &&
                Math.abs(groupRef.current.position.y) < 0.05;

            if (
                !hasNotifiedRef.current &&
                ((animTimerRef.current > 1.6 && zoomSettled && cubeCentered) || animTimerRef.current > 2.3)
            ) {
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

            const drift = idleDriftRef.current;
            const canDrift = !reducedMotion &&
                !isDraggingRef.current &&
                !pinchRef.current.active &&
                (performance.now() - lastInteractTimeRef.current) > IDLE_DRIFT_SETTLE_MS;

            if (canDrift) {
                if (!drift.active) {
                    drift.active = true;
                    drift.x = rotationRef.current.x;
                    drift.y = rotationRef.current.y;
                    drift.reRollIn = rand(IDLE_DRIFT_MIN, IDLE_DRIFT_MAX);
                }

                drift.reRollIn -= dt;
                if (drift.reRollIn <= 0) {
                    drift.reRollIn = rand(IDLE_DRIFT_MIN, IDLE_DRIFT_MAX);
                    drift.y = rotationRef.current.y + rand(-IDLE_DRIFT_Y_STEP, IDLE_DRIFT_Y_STEP);
                    drift.x = THREE.MathUtils.clamp(
                        rotationRef.current.x + rand(-IDLE_DRIFT_X_STEP, IDLE_DRIFT_X_STEP),
                        -IDLE_DRIFT_X_LIMIT,
                        IDLE_DRIFT_X_LIMIT
                    );
                }

                rotationRef.current.x += (drift.x - rotationRef.current.x) * IDLE_DRIFT_FACTOR;
                rotationRef.current.y += (drift.y - rotationRef.current.y) * IDLE_DRIFT_FACTOR;
                invalidate();
            } else {
                drift.active = false;
            }

            groupRef.current.position.x = THREE.MathUtils.lerp(posX, restingX, 0.05);
            groupRef.current.position.y = THREE.MathUtils.lerp(posY, restingY, 0.05);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5 * (1 + zoomZ / 1000), 0.08);
        }

        breathTimeRef.current += dt;
        const breathScale = (reducedMotion || isZoomed)
            ? 1
            : 1 + BREATH_AMPLITUDE * Math.sin(breathTimeRef.current * (2 * Math.PI / BREATH_PERIOD_S));

        const finalScale = cubeScale * pressScale * breathScale;
        groupRef.current.scale.setScalar(finalScale);

        if (screenPosRef && screenPosRef.current) {
            groupRef.current.updateWorldMatrix(true, false);
            screenPosVector.setFromMatrixPosition(groupRef.current.matrixWorld);
            screenPosVector.project(camera);
            screenPosRef.current.x = (screenPosVector.x + 1) * 0.5 * gl.domElement.clientWidth;
            screenPosRef.current.y = (1 - screenPosVector.y) * 0.5 * gl.domElement.clientHeight;
            screenPosRef.current.valid = true;
        }

        onRotationChange(
            THREE.MathUtils.radToDeg(groupRef.current.rotation.x),
            THREE.MathUtils.radToDeg(groupRef.current.rotation.y)
        );
    });

    return (
        <group
            ref={groupRef}
            position={[restingX, restingY, 0]}
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
                    isZoomed={isZoomed}
                    isZoomingOut={isZoomingOut}
                    activeFace={activeFace}
                    lastPointerDownFaceName={lastPointerDownFaceName}
                    suppressFaceClickRef={suppressFaceClickRef}
                    faceDownPosRef={faceDownPosRef} />
            ))}
        </group>
    );
}