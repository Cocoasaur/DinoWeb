import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useCSSVars } from '../../hooks/useCSSVars';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useHomeViewportLayout } from '../../hooks/useHomeViewportLayout';
import { useTheme } from '../../context/ThemeContext';

const FLOOR_Y = -2.35;
const PARALLAX_X = 0.30;
const PARALLAX_Y = 0.20;
const PARALLAX_IDLE_MS = 3000;

function makeRadialTexture(stops) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([offset, color]) => grad.addColorStop(offset, color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function useUnderCubeTextures() {
    return useMemo(() => ({
        glow: makeRadialTexture([
            [0, 'rgba(255, 255, 255, 0.45)'],
            [0.4, 'rgba(255, 255, 255, 0.14)'],
            [1, 'rgba(255, 255, 255, 0)'],
        ]),
        shadow: makeRadialTexture([
            [0, 'rgba(0, 0, 0, 1)'],
            [0.18, 'rgba(0, 0, 0, 0.55)'],
            [0.4, 'rgba(0, 0, 0, 0.22)'],
            [1, 'rgba(0, 0, 0, 0)'],
        ]),
    }), []);
}

export default function Stage({ isLowEnd, isZoomed, isZoomingOut, isDraggingRef }) {
    const reducedMotion = useReducedMotion();
    const { isDark } = useTheme();
    const { invalidate } = useThree();
    const pointerNDC = useRef({ x: 0, y: 0 });
    const idleTimerRef = useRef(null);
    const lastMoveRef = useRef(0);
    const poolRef = useRef(null);
    const vars = useCSSVars(['--void-bg', '--void-grid', '--void-grid-drift']);
    const { glow, shadow } = useUnderCubeTextures();
    const layout = useHomeViewportLayout();

    useEffect(() => {
        if (isLowEnd || reducedMotion) return;
        const updatePointer = (clientX, clientY) => {
            pointerNDC.current.x = (clientX / window.innerWidth) * 2 - 1;
            pointerNDC.current.y = (clientY / window.innerHeight) * 2 - 1;
            lastMoveRef.current = performance.now();
            invalidate();

            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                invalidate();
            }, PARALLAX_IDLE_MS + 50);
        };

        const onPointerMove = (e) => {
            updatePointer(e.clientX, e.clientY);
        };
        const onPointerDown = (e) => {
            updatePointer(e.clientX, e.clientY);
        };
        const onTouchMove = (e) => {
            if (e.touches.length > 0) {
                updatePointer(e.touches[0].clientX, e.touches[0].clientY);
            }
        };
        const onTouchStart = (e) => {
            if (e.touches.length > 0) {
                updatePointer(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchstart', onTouchStart);
        };
    }, [isLowEnd, reducedMotion, invalidate]);

    useFrame((state, delta) => {
        if (isLowEnd || reducedMotion) return;
        const cam = state.camera;
        const settled = isZoomed || isZoomingOut || isDraggingRef?.current;
        const timeSinceMove = performance.now() - lastMoveRef.current;
        const idle = timeSinceMove > PARALLAX_IDLE_MS;

        const tx = (settled || idle) ? 0 : pointerNDC.current.x * PARALLAX_X;
        const ty = (settled || idle) ? 0 : pointerNDC.current.y * PARALLAX_Y;
        const k = Math.min(1, delta * 3.5);
        const dx = tx - cam.position.x;
        const dy = ty - cam.position.y;

        if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) {
            cam.position.x += dx * k;
            cam.position.y += dy * k;
            invalidate();
        } else if (cam.position.x !== tx || cam.position.y !== ty) {
            cam.position.x = tx;
            cam.position.y = ty;
            invalidate();
        }

        if (poolRef.current) {
            const poolTargetX = (isZoomed || isZoomingOut) ? 0 : layout.restingX;
            const pdx = poolTargetX - poolRef.current.position.x;
            if (Math.abs(pdx) > 0.0004) {
                poolRef.current.position.x += pdx * Math.min(1, delta * 4);
                invalidate();
            } else if (pdx !== 0) {
                poolRef.current.position.x = poolTargetX;
            }
        }
    });

    if (isLowEnd) return null;

    return (
        <>
            <fog attach="fog" args={[vars['--void-bg'] || '#002451', 8, 18]} />
            <Grid
                position={[0, FLOOR_Y, 0]}
                args={[10, 10]}
                cellSize={1}
                cellThickness={1}
                cellColor={vars['--void-grid']}
                sectionSize={5}
                sectionThickness={1.2}
                sectionColor={vars['--void-grid-drift']}
                fadeDistance={11}
                fadeStrength={2}
                infiniteGrid
                side={THREE.DoubleSide}
            />
            <mesh ref={poolRef} position={[layout.restingX, FLOOR_Y + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[12, 12]} />
                {isDark ? (
                    <meshBasicMaterial
                        map={glow}
                        transparent
                        opacity={0.5}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                ) : (
                    <meshBasicMaterial
                        map={shadow}
                        transparent
                        opacity={0.5}
                        blending={THREE.NormalBlending}
                        depthWrite={false}
                    />
                )}
            </mesh>
        </>
    );
}