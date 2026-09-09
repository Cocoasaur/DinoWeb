import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import Scene from './Scene';

/* Lazy-owned 3D stage. Only this module imports @react-three/fiber / drei /
   three, so those chunks stay off the critical render path until the hero
   (LCP) has painted. `CubeStage` is mounted by App.jsx after first paint. */
export default function CubeStage({
    dpr,
    isLowEnd,
    reduceEffects,
    isZoomed,
    isZoomingOut,
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
    handleZoomOutComplete,
    screenPosRef,
    faceDownPosRef,
}) {
    return (
        <div className="absolute inset-0 w-full h-full cube-entrance" style={{ zIndex: canvasZIndex }}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
                gl={{
                    antialias: !reduceEffects,
                    alpha: true,
                    powerPreference: reduceEffects ? 'low-power' : 'high-performance',
                    stencil: false,
                    depth: true,
                }}
                style={{ width: '100%', height: '100%', display: 'block', cursor: isZoomed ? 'default' : 'grab' }}
                dpr={dpr}
                frameloop="demand"
                performance={{ min: 0.5 }}
                onCreated={({ gl }) => {
                    gl.setPixelRatio(Math.min(window.devicePixelRatio, dpr[1]));
                }}
            >
                <Suspense fallback={null}>
                    <Scene
                        isLowEnd={isLowEnd}
                        reduceEffects={reduceEffects}
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
                        onZoomOutComplete={handleZoomOutComplete}
                        screenPosRef={screenPosRef}
                        faceDownPosRef={faceDownPosRef}
                    />
                    <Preload all />
                </Suspense>
            </Canvas>
        </div>
    );
}
