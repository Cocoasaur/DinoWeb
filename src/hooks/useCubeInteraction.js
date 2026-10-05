import { useState, useCallback, useRef, useEffect } from 'react';
import { prefetchPage } from '../utils/prefetchPages';
import { FACE_ROTATIONS, ZOOM_MIN, ZOOM_MAX, DEFAULT_ROTATION } from '../constants/cubeConfig';

export function useCubeInteraction() {
    const [isZoomed, setIsZoomed] = useState(false);
    const [isZoomingOut, setIsZoomingOut] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [activeFace, setActiveFace] = useState(null);
    const [targetRotation, setTargetRotation] = useState(null);
    const [zoomZ, setZoomZ] = useState(0);
    const [themeTransitionActive, setThemeTransitionActive] = useState(false);
    const [overlayPhase, setOverlayPhase] = useState('hidden');
    const isDraggingRef = useRef(false);
    const phaseRef = useRef('hidden');
    const wheelAccumRef = useRef(0);
    const wheelFrameRef = useRef(0);

    const coordsRef = useRef({
        x: DEFAULT_ROTATION.x,
        y: DEFAULT_ROTATION.y,
        z: 0,
    });

    const handleFaceClick = useCallback((faceName) => {
        if (faceName === 'theme') {
            setThemeTransitionActive(true);
            return;
        }

        setThemeTransitionActive(false);

        const target = FACE_ROTATIONS[faceName];
        if (!target) return;

        setTargetRotation(target);
        setActiveFace(faceName);
        setIsZoomed(true);
        setIsZoomingOut(false);
        setShowOverlay(false);
        phaseRef.current = 'hidden';
        setOverlayPhase('hidden');
        coordsRef.current = { x: target.x, y: target.y, z: coordsRef.current.z };
    }, []);

    const handleFacePressStart = useCallback((faceName) => {
        if (faceName !== 'theme') prefetchPage(faceName).catch(() => {});
        if (faceName === 'theme' && !document.querySelector('.cube-entrance[data-renderer="worker"]')) {
            // Defer the 3D text prewarm off the interaction path; three is already
            // a lazy-loaded chunk by the time a face is pressed.
            import('../components/three/CubeFaceText').then(({ default: CubeFaceText }) => {
                CubeFaceText.prewarmFaceTextures();
            }).catch(() => {});
        }
    }, []);

    const handleZoomComplete = useCallback(() => {
        phaseRef.current = 'fading-in';
        setShowOverlay(true);
        setOverlayPhase('fading-in');
    }, []);

    const handleOverlayOpenComplete = useCallback(() => {
        if (phaseRef.current !== 'fading-in') return;
        phaseRef.current = 'open';
        setOverlayPhase('open');
    }, []);

    const handleCloseOverlay = useCallback(() => {
        if (!['open', 'fading-in'].includes(phaseRef.current)) return;
        phaseRef.current = 'fading-out';
        setOverlayPhase('fading-out');
        // Hold the fully blurred face still until the page dissolve completes.
    }, []);

    const handleOverlayCloseComplete = useCallback(() => {
        if (phaseRef.current !== 'fading-out') return;
        phaseRef.current = 'ready-to-zoom-out';
        setOverlayPhase(phaseRef.current);
        setShowOverlay(false);
        setIsZoomingOut(true);
    }, []);

    const handleZoomOutComplete = useCallback(() => {
        setIsZoomingOut(false);
        setIsZoomed(false);
        setTargetRotation(null);
        setActiveFace(null);
        phaseRef.current = 'hidden';
        setOverlayPhase('hidden');
        coordsRef.current = {
            x: DEFAULT_ROTATION.x,
            y: DEFAULT_ROTATION.y,
            z: coordsRef.current.z,
        };
    }, []);

    const handleThemeTransitionComplete = useCallback(() => {
        setThemeTransitionActive(false);
    }, []);

    const flushWheelZoom = useCallback(() => {
        wheelFrameRef.current = 0;
        if (wheelAccumRef.current === 0) return;
        const delta = wheelAccumRef.current;
        wheelAccumRef.current = 0;
        setZoomZ(prev => {
            const next = prev + delta;
            return Math.min(Math.max(next, ZOOM_MIN), ZOOM_MAX);
        });
    }, []);

    const handleWheel = useCallback((e) => {
        wheelAccumRef.current -= e.deltaY * 0.5;
        if (!wheelFrameRef.current) {
            wheelFrameRef.current = requestAnimationFrame(flushWheelZoom);
        }
    }, [flushWheelZoom]);

    const handlePinchZoom = useCallback((distanceDelta) => {
        setZoomZ(prev => {
            const next = prev - distanceDelta * 0.75;
            return Math.min(Math.max(next, ZOOM_MIN), ZOOM_MAX);
        });
    }, []);

    const handleRotationChange = useCallback((x, y) => {
        coordsRef.current.x = x;
        coordsRef.current.y = y;
    }, []);

    const updateZoomCoord = useCallback((z) => {
        coordsRef.current.z = z;
    }, []);

    useEffect(() => {
        return () => {
            if (wheelFrameRef.current) cancelAnimationFrame(wheelFrameRef.current);
        };
    }, []);

    return {
        isZoomed, isZoomingOut, showOverlay, activeFace, targetRotation,
        zoomZ, coordsRef, isDraggingRef, themeTransitionActive,
        overlayPhase,
        handleFaceClick, handleFacePressStart, handleCloseOverlay,
        handleZoomOutComplete, handleWheel, handlePinchZoom,
        handleRotationChange, updateZoomCoord, handleZoomComplete,
        handleThemeTransitionComplete,
        handleOverlayCloseComplete, handleOverlayOpenComplete,
    };
}
