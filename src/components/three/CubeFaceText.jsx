import { useRef, useMemo, useEffect, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useRenderProfile } from '../../context/RenderProfileContext';
import { useCubePalette } from '../../hooks/useCubePalette';
import { getFaceTextures, prewarmCubeLabels } from '../../utils/cubeResources';

const FONT_SIZE = 0.22;

function rgbaToRgb(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return match ? `rgb(${match[1]}, ${match[2]}, ${match[3]})` : rgba;
}

const UnderlineEffect = forwardRef(function UnderlineEffect({ textWidth, fontSize, color }, ref) {
    const lineRef = useRef();
    const dotRef = useRef();
    const lineY = -fontSize * 0.65;
    const lineEndX = textWidth / 2;
    const lineStartX = -lineEndX;

    const geometry = useMemo(() => {
        const pts = [];
        const SEG = 24;
        for (let i = 0; i <= SEG; i++) {
            const t = i / SEG;
            pts.push(new THREE.Vector3(lineStartX + (lineEndX - lineStartX) * t, lineY, 0.02));
        }
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        g.setDrawRange(0, 0);
        return g;
    }, [lineStartX, lineEndX, lineY]);

    useEffect(() => {
        if (ref && typeof ref === 'object') {
            ref.current = {
                update(p) {
                    if (!lineRef.current) return;
                    lineRef.current.visible = p > 0;
                    const total = geometry.attributes.position.count;
                    lineRef.current.geometry.setDrawRange(0, Math.max(2, Math.floor(total * p)));
                    lineRef.current.material.opacity = Math.min(p * 1.2, 0.85);
                    if (dotRef.current) {
                        const show = p > 0.02 && p < 0.98;
                        dotRef.current.visible = show;
                        if (show) dotRef.current.position.x = lineStartX + (lineEndX - lineStartX) * p;
                    }
                }
            };
        }
    }, [ref, geometry, lineStartX, lineEndX]);

    return (
        <group>
            <line ref={lineRef} userData={{ cubeColorKey: '--cube-text-accent' }} geometry={geometry} visible={false}>
                <lineBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
            </line>
            <mesh ref={dotRef} userData={{ cubeColorKey: '--cube-text-accent' }} position={[lineStartX, lineY, 0.025]} visible={false}>
                <circleGeometry args={[0.018, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} />
            </mesh>
        </group>
    );
});

export default function CubeFaceText({
    text,
    hovered,
    forceHighlight = false,
    reduceEffects = false,
    fontSize = FONT_SIZE,
}) {
    const { theme, colors: cssVars } = useCubePalette();
    const { labelScale = reduceEffects ? 1 : 2 } = useRenderProfile();
    const groupRef = useRef();
    const idleMatRef = useRef();
    const hoverMatRef = useRef();
    const underlineRef = useRef();
    const progressRef = useRef(0);
    const scaleRef = useRef(1);
    const reducedMotion = useReducedMotion();
    const { invalidate } = useThree();

    const colors = useMemo(() => ({
        accent: rgbaToRgb(cssVars['--cube-text-accent'] || '#bbdaff'),
        hover: rgbaToRgb(cssVars['--cube-text-hover'] || '#ffffff'),
        default: rgbaToRgb(cssVars['--cube-text-default'] || '#1a2332'),
    }), [cssVars]);

    const { idleTex, hoverTex, textWidth, textHeight } = getFaceTextures(text, theme, labelScale, fontSize);

    // These flags update the frame callback rather than a mesh prop. Explicitly
    // wake a settled demand canvas so release/cancel also animates the line out.
    useEffect(() => {
        invalidate();
    }, [hovered, forceHighlight, reducedMotion, reduceEffects, invalidate]);

    useFrame((_, delta) => {
        // Demand rendering can be idle for seconds. Cap its first elapsed step
        // so a new hold begins progressively instead of jumping to full fill.
        const step = Math.min(delta, .1);
        const target = hovered || forceHighlight ? 1 : 0;
        const targetScale = reducedMotion || reduceEffects ? 1 : target ? 1.1 : 1;
        const diff = target - progressRef.current;
        const scaleDiff = targetScale - scaleRef.current;
        if (Math.abs(diff) < 0.001 && Math.abs(scaleDiff) < 0.001 && progressRef.current === target && scaleRef.current === targetScale) return;

        const p = reducedMotion || Math.abs(diff) < 0.001
            ? target : progressRef.current + diff * (1 - Math.exp(-8 * step));
        const scale = Math.abs(scaleDiff) < 0.001
            ? targetScale : scaleRef.current + scaleDiff * (1 - Math.exp(-6 * step));
        progressRef.current = p;
        scaleRef.current = scale;
        if (idleMatRef.current) {
            idleMatRef.current.opacity = 1 - p;
            idleMatRef.current.visible = p < 1;
        }
        if (hoverMatRef.current) {
            hoverMatRef.current.opacity = p;
            hoverMatRef.current.visible = p > 0;
        }
        groupRef.current?.scale.set(scale, scale, 1);
        underlineRef.current?.update(p);
        if (p !== target || scale !== targetScale) invalidate();
    });

    const planeW = textWidth * 1.05;
    const planeH = textHeight * 1.05;

    return (
        <group ref={groupRef}>
            <mesh userData={{ cubeText: text, cubeLabelState: 'idle' }} position={[0, 0, 0.010]}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial ref={idleMatRef} map={idleTex} transparent opacity={1} depthWrite={false} side={THREE.FrontSide} />
            </mesh>
            <mesh userData={{ cubeText: text, cubeLabelState: 'hover' }} position={[0, 0, 0.012]}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial ref={hoverMatRef} map={hoverTex} transparent opacity={0} visible={false} depthWrite={false} side={THREE.FrontSide} />
            </mesh>
            <UnderlineEffect ref={underlineRef} textWidth={textWidth} fontSize={fontSize} color={colors.accent} />
        </group>
    );
}

CubeFaceText.prewarmFaceTextures = () => prewarmCubeLabels().catch(() => {});
