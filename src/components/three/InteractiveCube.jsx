import { useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';
import CubeFace from './CubeFace';
import { FACE_CONFIG, DEFAULT_ROTATION, DEFAULT_CAMERA_DISTANCE, CUBE_CENTER_X } from '../../constants/cubeConfig';
import { useCSSVars } from '../../hooks/useCSSVars';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getCubeTransition, transitionProgress, easeInOut } from '../../utils/cubeTransition';
import { CUBE_SHININESS, CUBE_SPECULAR, shadeCubeVertex } from '../../utils/cubeLighting';
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

// ── Idle frame throttle: drift + breath are slow, so ~30fps is plenty ──
const IDLE_DRIFT_FRAME_MS = 33;

const rand = (min, max) => min + Math.random() * (max - min);

const screenPosVector = new THREE.Vector3();
const lightingNormal = new THREE.Vector3();
const lightingRotation = new THREE.Quaternion();

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
    reduceEffects = false,
    holdCamera = false,
    faceCount = FACE_CONFIG.length,
    screenPosRef,
    faceDownPosRef,
}) {
    const groupRef = useRef();
    const bodyRef = useRef();
    const rotationRef = useRef({
        x: THREE.MathUtils.degToRad(DEFAULT_ROTATION.x),
        y: THREE.MathUtils.degToRad(DEFAULT_ROTATION.y)
    });
    const lastMouse = useRef({ x: 0, y: 0 });
    const lastPointerDownFaceNameRef = useRef(null);
    const pinchRef = useRef({
        active: false,
        lastDistance: 0,
    });
    const suppressFaceClickRef = useRef(false);
    const suppressFaceClickTimerRef = useRef(0);
    const zoomPoseRef = useRef(null);
    const hasNotifiedRef = useRef(false);
    const zoomOutPoseRef = useRef(null);
    const hasNotifiedOutRef = useRef(false);
    const idleDriftRef = useRef({ active: false, x: 0, y: 0, reRollIn: 0 });
    const lastInteractTimeRef = useRef(0);
    const idleFrameTimeRef = useRef(0);
    const { camera, invalidate } = useThree();
    const reducedMotion = useReducedMotion();
    const transition = getCubeTransition(reduceEffects, reducedMotion);

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
        durationRelease: reducedMotion ? 0.05 : reduceEffects ? 0.16 : 0.25,
    });

    const targetRad = useMemo(() => targetRotation ? {
        x: THREE.MathUtils.degToRad(targetRotation.x),
        y: THREE.MathUtils.degToRad(targetRotation.y)
    } : null, [targetRotation]);

    useEffect(() => {
        pressRef.current.durationPress = reducedMotion ? 0.05 : 0.08;
        pressRef.current.durationHold = 0;
        pressRef.current.durationRelease = reducedMotion ? 0.05 : reduceEffects ? 0.16 : 0.25;
    }, [reducedMotion, reduceEffects]);

    // Reset phase bookkeeping before the next rendered frame, including repeat visits.
    useLayoutEffect(() => {
        if (!isZoomed || !targetRad || !groupRef.current) return;
        const group = groupRef.current;
        zoomPoseRef.current = {
            startedAt: performance.now(),
            x: group.position.x, y: group.position.y, z: camera.position.z,
            rx: shortestPath(group.rotation.x, targetRad.x),
            ry: shortestPath(group.rotation.y, targetRad.y),
        };
        hasNotifiedRef.current = false;
        invalidate();
    }, [isZoomed, targetRad, camera, invalidate]);

    useLayoutEffect(() => {
        if (!isZoomingOut || !groupRef.current) return;
        const group = groupRef.current;
        zoomOutPoseRef.current = {
            startedAt: performance.now(),
            x: group.position.x, y: group.position.y, z: camera.position.z,
            rx: shortestPath(group.rotation.x, rotationRef.current.x),
            ry: shortestPath(group.rotation.y, rotationRef.current.y),
        };
        hasNotifiedOutRef.current = false;
        invalidate();
    }, [isZoomingOut, camera, invalidate]);

    const clearSuppressFaceClickTimer = useCallback(() => {
        if (!suppressFaceClickTimerRef.current) return;
        window.clearTimeout(suppressFaceClickTimerRef.current);
        suppressFaceClickTimerRef.current = 0;
    }, []);

    const suppressFaceClickBriefly = useCallback(() => {
        suppressFaceClickRef.current = true;
        clearSuppressFaceClickTimer();
        suppressFaceClickTimerRef.current = window.setTimeout(() => {
            suppressFaceClickRef.current = false;
            suppressFaceClickTimerRef.current = 0;
        }, 350);
    }, [clearSuppressFaceClickTimer]);

    useEffect(() => {
        const canvas = document.querySelector('.cube-entrance canvas');
        if (!canvas) return;
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
                lastPointerDownFaceNameRef.current = null;
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
                lastPointerDownFaceNameRef.current = null;
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
    }, [isZoomed, isZoomingOut, isDraggingRef, invalidate, onPinchZoom, suppressFaceClickBriefly, clearSuppressFaceClickTimer]);

    const handleFaceClickWithPress = (faceName) => {
        if (pressRef.current.active) return;

        onFacePressStart?.(faceName);
        pressRef.current.active = true;
        pressRef.current.t = 0;
        pressRef.current.startedAt = performance.now();
        pressRef.current.targetFaceName = faceName;
        invalidate();
    };

    // Analytic normals avoid extruding and rebuilding creased normals at mount.
    const boxGeometry = useMemo(() => {
        const geometry = new RoundedBoxGeometry(2, 2, 2, reduceEffects ? 1 : 3, 0.06);
        if (reduceEffects) geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
        return geometry;
    }, [reduceEffects]);
    const lightingColor = useMemo(() => new THREE.Color(cubeColor), [cubeColor]);
    const lightingPoseRef = useRef({ x: NaN, y: NaN, color: null });
    useEffect(() => () => boxGeometry.dispose(), [boxGeometry]);

    const boxMaterial = useMemo(() => (
        reduceEffects ? <meshBasicMaterial vertexColors /> : <meshPhongMaterial color={cubeColor} shininess={CUBE_SHININESS} specular={CUBE_SPECULAR} />
    ), [cubeColor, reduceEffects]);

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

    useFrame(({ camera, gl }, delta) => {
        if (!groupRef.current) return;
        const rotX = groupRef.current.rotation.x;
        const rotY = groupRef.current.rotation.y;
        const posX = groupRef.current.position.x;
        const posY = groupRef.current.position.y;

        const dt = Math.min(delta, 0.1);
        const smoothing = (rate) => reducedMotion ? 1 : 1 - Math.exp(-rate * delta);
        let completedIn = false;
        let completedOut = false;

        let pressScale = 1;
        if (pressRef.current.active) {
            pressRef.current.t = (performance.now() - pressRef.current.startedAt) / 1000;
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

        if (isZoomingOut && zoomOutPoseRef.current) {
            const pose = zoomOutPoseRef.current;
            const t = transitionProgress(pose.startedAt, performance.now(), transition.zoomOutMs);
            const p = easeInOut(t);
            camera.position.z = THREE.MathUtils.lerp(pose.z, DEFAULT_CAMERA_DISTANCE * (1 + zoomZ / 1000), p);
            groupRef.current.position.x = THREE.MathUtils.lerp(pose.x, restingX, p);
            groupRef.current.position.y = THREE.MathUtils.lerp(pose.y, restingY, p);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(pose.rx, rotationRef.current.x, p);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(pose.ry, rotationRef.current.y, p);
            if (t < 1) invalidate();
            else if (!hasNotifiedOutRef.current) {
                hasNotifiedOutRef.current = true;
                completedOut = true;
            }
        } else if (isZoomed && targetRad && zoomPoseRef.current && !holdCamera) {
            const pose = zoomPoseRef.current;
            const t = transitionProgress(pose.startedAt, performance.now(), transition.zoomInMs);
            const p = easeInOut(t);
            camera.position.z = THREE.MathUtils.lerp(pose.z, getZoomedCameraZ(camera, cubeScale, breakpoint), p);
            groupRef.current.position.x = THREE.MathUtils.lerp(pose.x, CUBE_CENTER_X, p);
            groupRef.current.position.y = THREE.MathUtils.lerp(pose.y, 0, p);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(pose.rx, targetRad.x, p);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(pose.ry, targetRad.y, p);
            if (t < 1) invalidate();
            // Publish the completed face pose before the page dissolve starts
            // and the renderer pauses on this frame.
            if (t >= 1 && !hasNotifiedRef.current) {
                hasNotifiedRef.current = true;
                completedIn = true;
            }
        } else if (!holdCamera) {
            const isLerpingRot = Math.abs(rotX - rotationRef.current.x) > 0.001 || Math.abs(rotY - rotationRef.current.y) > 0.001;
            const isLerpingPos = Math.abs(posX - restingX) > 0.001 || Math.abs(posY - restingY) > 0.001;

            if (!reducedMotion) {
                groupRef.current.rotation.x = THREE.MathUtils.lerp(rotX, rotationRef.current.x, smoothing(6));
                groupRef.current.rotation.y = THREE.MathUtils.lerp(rotY, rotationRef.current.y, smoothing(6));
            } else {
                groupRef.current.rotation.x = rotationRef.current.x;
                groupRef.current.rotation.y = rotationRef.current.y;
            }

            const drift = idleDriftRef.current;
            const canDrift = !reducedMotion &&
                !reduceEffects &&
                !isDraggingRef.current &&
                !pinchRef.current.active &&
                lastInteractTimeRef.current > 0 &&
                (performance.now() - lastInteractTimeRef.current) > IDLE_DRIFT_SETTLE_MS;

            // Movement handlers wake demand rendering. A stationary finger
            // holding a highlighted face does not need an endless draw loop.
            if (pressRef.current.active || isLerpingRot || isLerpingPos ||
                Math.abs(camera.position.z - DEFAULT_CAMERA_DISTANCE * (1 + zoomZ / 1000)) > 0.001) {
                invalidate();
            } else if (canDrift) {
                const now = performance.now();
                if (!document.documentElement.classList.contains('theme-transitioning') &&
                    now - idleFrameTimeRef.current >= IDLE_DRIFT_FRAME_MS) {
                    idleFrameTimeRef.current = now;
                    invalidate();
                }
            }

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
            } else {
                drift.active = false;
            }

            groupRef.current.position.x = THREE.MathUtils.lerp(posX, restingX, smoothing(3));
            groupRef.current.position.y = THREE.MathUtils.lerp(posY, restingY, smoothing(3));
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, DEFAULT_CAMERA_DISTANCE * (1 + zoomZ / 1000), smoothing(5));
        }

        // Idle breathing is composited by the canvas wrapper in both renderers.
        const finalScale = cubeScale * pressScale;
        groupRef.current.scale.setScalar(finalScale);

        if (reduceEffects) {
            const group = groupRef.current;
            const pose = lightingPoseRef.current;
            if (pose.x !== group.rotation.x || pose.y !== group.rotation.y || pose.color !== cubeColor) {
                // Bake subtle lighting on low/mobile profiles, retaining the
                // inexpensive unlit fragment shader and existing draw count.
                group.getWorldQuaternion(lightingRotation);
                const normals = bodyRef.current.geometry.attributes.normal;
                const colors = bodyRef.current.geometry.attributes.color;
                for (let i = 0; i < normals.count; i++) {
                    lightingNormal.fromBufferAttribute(normals, i).applyQuaternion(lightingRotation);
                    shadeCubeVertex(lightingNormal, lightingColor, colors, i);
                }
                colors.needsUpdate = true;
                pose.x = group.rotation.x; pose.y = group.rotation.y; pose.color = cubeColor;
            }
        }

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
        if (completedIn) onZoomComplete?.();
        if (completedOut) handleZoomOutDone();
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
            <mesh ref={bodyRef} geometry={boxGeometry}>
                {boxMaterial}
            </mesh>
            {!reduceEffects && <mesh geometry={boxGeometry} scale={1.001}>
                {edgeMaterial}
            </mesh>}
            {FACE_CONFIG.slice(0, faceCount).map((face) => (
                <CubeFace key={face.name} {...face}
                    onFaceClick={handleFaceClickWithPress}
                    isZoomed={isZoomed}
                    isZoomingOut={isZoomingOut}
                    activeFace={activeFace}
                    reduceEffects={reduceEffects}
                    lastPointerDownFaceNameRef={lastPointerDownFaceNameRef}
                    suppressFaceClickRef={suppressFaceClickRef}
                    faceDownPosRef={faceDownPosRef} />
            ))}
        </group>
    );
}
