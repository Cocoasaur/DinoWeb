import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const PARALLAX_X = 0.30;
const PARALLAX_Y = 0.20;
const PARALLAX_X_TOUCH = 0.42;
const PARALLAX_Y_TOUCH = 0.28;
const PARALLAX_IDLE_MS = 3000;

export default function Stage({ isLowEnd, isZoomed, isZoomingOut, isDraggingRef }) {
    const reducedMotion = useReducedMotion();
    const { invalidate } = useThree();
    const pointerNDC = useRef({ x: 0, y: 0 });
    const touchAnchorRef = useRef({ x: 0, y: 0, active: false });
    const idleTimerRef = useRef(null);
    const lastMoveRef = useRef(0);
    const isTouchRef = useRef(false);

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

        const setTouchAnchor = (clientX, clientY) => {
            touchAnchorRef.current = {
                x: (clientX / window.innerWidth) * 2 - 1,
                y: (clientY / window.innerHeight) * 2 - 1,
                active: true,
            };
        };

        const onPointerMove = (e) => {
            if (e.pointerType === 'touch') isTouchRef.current = true;
            updatePointer(e.clientX, e.clientY);
        };
        const onPointerDown = (e) => {
            if (e.pointerType === 'touch') {
                isTouchRef.current = true;
                setTouchAnchor(e.clientX, e.clientY);
            }
            updatePointer(e.clientX, e.clientY);
        };
        const onTouchMove = (e) => {
            isTouchRef.current = true;
            if (e.touches.length > 0) {
                updatePointer(e.touches[0].clientX, e.touches[0].clientY);
            }
        };
        const onTouchStart = (e) => {
            isTouchRef.current = true;
            if (e.touches.length > 0) {
                setTouchAnchor(e.touches[0].clientX, e.touches[0].clientY);
                updatePointer(e.touches[0].clientX, e.touches[0].clientY);
            }
        };
        const onTouchEnd = (e) => {
            if (e.touches.length === 0) touchAnchorRef.current.active = false;
        };
        const onTouchCancel = () => {
            touchAnchorRef.current.active = false;
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('touchcancel', onTouchCancel, { passive: true });

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchCancel);
        };
    }, [isLowEnd, reducedMotion, invalidate]);

    useFrame((state, delta) => {
        if (isLowEnd || reducedMotion) return;
        const cam = state.camera;
        const settled = isZoomed || isZoomingOut || (!isTouchRef.current && isDraggingRef?.current);
        const timeSinceMove = performance.now() - lastMoveRef.current;
        const idle = timeSinceMove > PARALLAX_IDLE_MS;

        const touch = isTouchRef.current;
        const anchor = touchAnchorRef.current;
        const anchored = touch && anchor.active;
        // Mouse: follow the pointer absolutely (hover parallax).
        // Touch: follow only the movement from where the finger first
        // landed, so the first touch never makes the scene jump.
        const ox = !touch ? pointerNDC.current.x : (anchored ? pointerNDC.current.x - anchor.x : 0);
        const oy = !touch ? pointerNDC.current.y : (anchored ? pointerNDC.current.y - anchor.y : 0);
        const dir = touch ? -1 : 1;
        const px = touch ? PARALLAX_X_TOUCH : PARALLAX_X;
        const py = touch ? PARALLAX_Y_TOUCH : PARALLAX_Y;
        const tx = (settled || idle) ? 0 : ox * px * dir;
        const ty = (settled || idle) ? 0 : oy * py * dir;
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

    });

    // The decorative floor/shadow now use CSS behind the transparent canvas.
    // Only camera parallax remains here; no full-screen transparent GL planes.
    return null;
}
