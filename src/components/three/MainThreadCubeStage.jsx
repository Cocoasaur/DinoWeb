import { Suspense, useEffect, useRef, useSyncExternalStore, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCubePalette } from '../../hooks/useCubePalette';
import Scene from './Scene';
import { createCubeWipeUniforms, bindCubeWipeMaterial, updateCubeWipeUniforms, cubeWipeRegion, updateCubeNextLighting } from '../../utils/cubeWipeMaterial';
import { getCornerMarkerPalette } from '../../utils/cubeCornerMarkers';
import { useRenderProfile } from '../../context/RenderProfileContext';
import { prepareCubeResources, prewarmCubeLabels, getFaceTextures } from '../../utils/cubeResources';
import { FACE_CONFIG } from '../../constants/cubeConfig';

import { Vector4 } from 'three';
import { getCubeTransition, getCubeStageStyle } from '../../utils/cubeTransition';
import { useIdleBreathing } from '../../hooks/useIdleBreathing';
import { useHomeViewportLayout } from '../../hooks/useHomeViewportLayout';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import StageBackdrop from './StageBackdrop';

const subscribeVisibility = (notify) => {
    document.addEventListener('visibilitychange', notify);
    return () => document.removeEventListener('visibilitychange', notify);
};
const isPageVisible = () => document.visibilityState !== 'hidden';

function updateFallbackTargets(objects, next, labelScale) {
    const corners = getCornerMarkerPalette(next.colors);
    for (const object of objects) {
        const material = object.material, target = material.userData.cubeWipe;
        const { cubeColorKey, cubeText, cubeLabelState, cubeCorner, cubeHoverProgress } = object.userData;
        target.opacity.value = material.opacity;
        if (cubeColorKey) {
            const value = next.colors[cubeColorKey];
            if (material.vertexColors) updateCubeNextLighting(object, value);
            else target.color.value.set(value.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,[^)]+)?\)/, 'rgb($1, $2, $3)'));
            if (cubeColorKey === '--cube-edge-color') target.opacity.value = parseFloat(next.colors['--cube-edge-opacity']);
        }
        if (cubeCorner) target.color.value.copy(corners.idle).lerp(corners.hover, cubeHoverProgress || 0);
        if (cubeText) {
            const maps = getFaceTextures(cubeText, next.theme, labelScale, .22);
            target.map.value = cubeLabelState === 'idle' ? maps.idleTex : maps.hoverTex;
            target.hasMap.value = 1;
        }
    }
}

function SceneRenderer({ onReady, complete }) {
    const { gl, scene, camera, invalidate } = useThree();
    const preparedRef = useRef(false);
    const notifiedRef = useRef(false);
    const frameRef = useRef(0);
    const palette = useCubePalette();
    const { labelScale } = useRenderProfile();
    const wipeUniformsRef = useRef(null);
    if (wipeUniformsRef.current === null) { wipeUniformsRef.current = createCubeWipeUniforms(); }
    const wipeRef = useRef(null);
    const regionRef = useRef(null);
    const targetsRef = useRef([]);
    const readyPaletteRef = useRef(null);

    useEffect(() => {
        wipeRef.current = null;
        readyPaletteRef.current = null;
        wipeUniformsRef.current.cubeWipeActive.value = 0;
        if (!palette.next) { invalidate(); return; }
        let cancelled = false;
        prewarmCubeLabels().then(() => {
            if (cancelled) return;
            readyPaletteRef.current = palette.next;
            invalidate();
        });
        return () => { cancelled = true; };
    }, [palette, invalidate]);

    useEffect(() => {
        const update = ({ detail }) => {
            wipeRef.current = detail;
            const body = scene.getObjectByName('cube-body');
            if (!body || !readyPaletteRef.current) return;
            const region = cubeWipeRegion(body, camera, detail);
            if (region === 'split' || region !== regionRef.current) invalidate();
        };
        window.addEventListener('cube-wipe-frame', update);
        return () => window.removeEventListener('cube-wipe-frame', update);
    }, [scene, camera, invalidate]);

    useEffect(() => {
        if (!complete) return;
        let cancelled = false;
        const yieldToBrowser = () => globalThis.scheduler?.yield
            ? globalThis.scheduler.yield()
            : new Promise((resolve) => setTimeout(resolve, 0));
        const prepare = async () => {
            const objects = [];
            targetsRef.current = [];
            const textures = new Set();
            scene.traverse((object) => {
                if (!object.material) return;
                objects.push(object);
                if (object.userData.cubeColorKey || object.userData.cubeText || object.userData.cubeCorner) {
                    bindCubeWipeMaterial(object.material, wipeUniformsRef.current, object.geometry);
                    targetsRef.current.push(object);
                }
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const material of materials) {
                    for (const value of Object.values(material)) {
                        if (value?.isTexture) textures.add(value);
                    }
                }
            });
            // Upload one raster per task so decoded canvases do not all flush
            // together during the first visible draw.
            for (const texture of textures) {
                if (cancelled) return;
                gl.initTexture(texture);
                await yieldToBrowser();
            }
            // Prepare each object's shaders against the scene's actual lights.
            // Yield between objects while the parallel compiler finishes.
            for (const object of objects) {
                if (cancelled) return;
                await gl.compileAsync(object, camera, scene);
                await yieldToBrowser();
            }
            // A shader can finish linking before the driver builds its draw
            // pipeline. Exercise each visible program in a one-pixel scissor
            // while the loader covers the canvas, yielding a paint between them.
            const warmObjects = [];
            const warmed = new Set();
            for (const object of objects) {
                if (!object.visible || Array.isArray(object.material) || object.material.visible === false) continue;
                const material = object.material;
                const key = [material.type, !!material.map, material.side, material.transparent, material.vertexColors].join(':');
                if (warmed.has(key)) continue;
                warmed.add(key);
                warmObjects.push(object);
            }
            const visibility = objects.map((object) => object.visible);
            const scissor = gl.getScissor(new Vector4());
            const scissorTest = gl.getScissorTest();
            try {
                objects.forEach((object) => { object.visible = false; });
                gl.setScissor(0, 0, 1, 1);
                gl.setScissorTest(true);
                for (const object of warmObjects) {
                    if (cancelled) return;
                    object.visible = true;
                    gl.render(scene, camera);
                    object.visible = false;
                    await new Promise(requestAnimationFrame);
                    await yieldToBrowser();
                }
            } finally {
                objects.forEach((object, index) => { object.visible = visibility[index]; });
                gl.setScissor(scissor);
                gl.setScissorTest(scissorTest);
            }
        };
        prepare().catch(() => {}).then(() => {
            if (cancelled) return;
            preparedRef.current = true;
            invalidate();
        });
        return () => {
            cancelled = true;
            cancelAnimationFrame(frameRef.current);
        };
    }, [gl, scene, camera, invalidate, complete]);

    // Taking over rendering prevents the default loop from drawing before
    // shaders finish. Subsequent frames still follow Canvas's demand/never mode.
    useFrame(() => {
        if (!preparedRef.current) return;
        const next = readyPaletteRef.current;
        const wipe = wipeRef.current;
        if (next && wipe) {
            updateCubeWipeUniforms(wipeUniformsRef.current, wipe, gl);
            wipeUniformsRef.current.cubeWipeActive.value = 1;
            const body = scene.getObjectByName('cube-body');
            regionRef.current = cubeWipeRegion(body, camera, wipe);
            updateFallbackTargets(targetsRef.current, next, labelScale);
        }
        gl.render(scene, camera);
        if (notifiedRef.current) return;
        notifiedRef.current = true;
        frameRef.current = requestAnimationFrame(onReady);
    }, 1);
    return null;
}


/* Release the boot overlay only after the complete scene draws its first frame. */
export default function MainThreadCubeStage({
    dpr,
    isLowEnd,
    reduceEffects,
    isZoomed,
    isZoomingOut,
    zoomInComplete,
    overlayPhase,
    canvasZIndex,
    handleFaceClick,
    handleFacePressStart,
    targetRotation,
    activeFace,
    zoomZ,
    handleRotationChange,
    isDraggingRef,
    handlePinchZoom,
    handleZoomComplete,
    handleDissolveStart,
    handleZoomOutComplete,
    screenPosRef,
    faceDownPosRef,
    onReady,
}) {
    const { theme } = useCubePalette();
    const [faceCount, setFaceCount] = useState(0);
    useEffect(() => {
        if (faceCount === FACE_CONFIG.length) return;
        let cancelled = false;
        const task = globalThis.scheduler?.yield
            ? globalThis.scheduler.yield()
            : new Promise((resolve) => setTimeout(resolve, 0));
        task.then(() => { if (!cancelled) setFaceCount((count) => count + 1); });
        return () => { cancelled = true; };
    }, [faceCount]);
    const visible = useSyncExternalStore(subscribeVisibility, isPageVisible, () => true);
    const reducedMotion = useReducedMotion();
    const transition = getCubeTransition(reduceEffects, reducedMotion);
    const paused = !visible || overlayPhase === 'fading-out' ||
        (zoomInComplete && ['fading-in', 'open'].includes(overlayPhase));
    const breathRef = useRef(null);
    const { restingX, restingY } = useHomeViewportLayout();
    useIdleBreathing(breathRef, visible && !isZoomed && !isZoomingOut, reducedMotion);
    const projection = 1 / (10 * (1 + zoomZ / 1000) * Math.tan(Math.PI / 8));
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden cube-entrance" data-cube-theme={theme} data-render-paused={paused} style={{ zIndex: canvasZIndex }}>
        <div className="w-full h-full" style={getCubeStageStyle(isZoomed, isZoomingOut, transition, overlayPhase, zoomInComplete)}>
            <StageBackdrop hidden={isZoomed || isZoomingOut} paused={paused} reduceEffects={reduceEffects} zoomZ={zoomZ} />
            <div ref={breathRef} className="w-full h-full cube-breath" style={{ transformOrigin: `calc(50% + var(--portfolio-viewport-height, 100dvh) * ${restingX * projection}) calc(50% - var(--portfolio-viewport-height, 100dvh) * ${restingY * projection})` }}>
            <Canvas
                onCreated={({ gl }) => { gl.debug.checkShaderErrors = import.meta.env.DEV; }}
                camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: reduceEffects ? 'low-power' : 'high-performance',
                    stencil: false,
                    depth: true,
                }}
                style={{ width: '100%', height: '100%', display: 'block', cursor: isZoomed ? 'default' : 'grab' }}
                dpr={dpr}
                frameloop={paused ? "never" : "demand"}
                performance={{ min: 0.5 }}
            >
                <Suspense fallback={null}>
                    <Scene
                        faceCount={faceCount}
                        isLowEnd={isLowEnd}
                        reduceEffects={reduceEffects}
                        holdCamera={overlayPhase === 'fading-out'}
                        onFaceClick={handleFaceClick}
                        onFacePressStart={handleFacePressStart}
                        targetRotation={targetRotation}
                        isZoomed={isZoomed}
                        isZoomingOut={isZoomingOut}
                        activeFace={activeFace}
                        zoomZ={zoomZ}
                        onRotationChange={handleRotationChange}
                        isDraggingRef={isDraggingRef}
                        onPinchZoom={handlePinchZoom}
                        onZoomComplete={handleZoomComplete}
                        onDissolveStart={handleDissolveStart}
                        onZoomOutComplete={handleZoomOutComplete}
                        screenPosRef={screenPosRef}
                        faceDownPosRef={faceDownPosRef}
                    />
                    <SceneRenderer onReady={onReady} complete={faceCount === FACE_CONFIG.length} />
                </Suspense>
            </Canvas>
            </div>
        </div>
        </div>
    );
}

MainThreadCubeStage.prepareResources = prepareCubeResources;
