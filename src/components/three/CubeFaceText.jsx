import { useRef, useMemo, useEffect, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useCSSVars } from '../../hooks/useCSSVars';
import { useTheme } from '../../context/ThemeContext';
import { getFaceTextures, prewarmCubeLabels } from '../../utils/cubeResources';

const CORNERS = [
    { pos: [-1.0, 1.0], hDir: 1, vDir: -1 },
    { pos: [1.0, 1.0], hDir: -1, vDir: -1 },
    { pos: [-1.0, -1.0], hDir: 1, vDir: 1 },
    { pos: [1.0, -1.0], hDir: -1, vDir: 1 },
];

const T_SIZE = 0.10;
const T_THICK = 0.008;
const FONT_SIZE = 0.22;

function rgbaToRgb(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return match ? `rgb(${match[1]}, ${match[2]}, ${match[3]})` : rgba;
}

function makeCornerGeometry() {
    const positions = [];
    const indices = [];
    const rectangle = (x, y, width, height) => {
        const first = positions.length / 3;
        positions.push(
            x - width / 2, y - height / 2, 0,
            x + width / 2, y - height / 2, 0,
            x + width / 2, y + height / 2, 0,
            x - width / 2, y + height / 2, 0,
        );
        indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
    };
    for (const { pos: [x, y], hDir, vDir } of CORNERS) {
        rectangle(x + hDir * T_SIZE / 2, y, T_SIZE, T_THICK);
        rectangle(x, y + vDir * T_SIZE / 2, T_THICK, T_SIZE);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    return geometry;
}

const FaceCornerTicks = forwardRef(function FaceCornerTicks({ idleColor, hoverColor }, ref) {
    const groupRef = useRef();
    const idleMatRef = useRef();
    const hoverMatRef = useRef();
    // Eight bars share a geometry/material instead of issuing eight draw calls.
    const geometry = useMemo(() => makeCornerGeometry(), []);

    useEffect(() => {
        if (ref && typeof ref === 'object') {
            ref.current = {
                update(p, scale) {
                    if (idleMatRef.current) idleMatRef.current.opacity = (1 - p) * 0.85;
                    if (hoverMatRef.current) hoverMatRef.current.opacity = p * 0.95;
                    groupRef.current?.scale.set(scale, scale, 1);
                }
            };
        }
    }, [ref]);

    return (
        <group ref={groupRef}>
            <mesh geometry={geometry} position={[0, 0, 0.005]}>
                <meshBasicMaterial ref={idleMatRef} color={idleColor} transparent opacity={0.85} depthWrite={false} />
            </mesh>
            <mesh geometry={geometry} position={[0, 0, 0.006]}>
                <meshBasicMaterial ref={hoverMatRef} color={hoverColor} transparent opacity={0} depthWrite={false} />
            </mesh>
        </group>
    );
});

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
            <line ref={lineRef} geometry={geometry}>
                <lineBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
            </line>
            <mesh ref={dotRef} position={[lineStartX, lineY, 0.025]} visible={false}>
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
    const { theme } = useTheme();
    const groupRef = useRef();
    const idleMatRef = useRef();
    const hoverMatRef = useRef();
    const ticksRef = useRef();
    const underlineRef = useRef();
    const progressRef = useRef(0);
    const scaleRef = useRef(1);
    const reducedMotion = useReducedMotion();
    const { invalidate } = useThree();

    const cssVars = useCSSVars([
        '--cube-text-accent',
        '--cube-text-hover',
        '--cube-text-default',
        '--cube-ticks-idle',
        '--cube-ticks-hover',
        '--cube-ticks-hover-scale'
    ]);

    const colors = useMemo(() => ({
        accent: rgbaToRgb(cssVars['--cube-text-accent'] || '#bbdaff'),
        hover: rgbaToRgb(cssVars['--cube-text-hover'] || '#ffffff'),
        default: rgbaToRgb(cssVars['--cube-text-default'] || '#1a2332'),
        ticksIdle: rgbaToRgb(cssVars['--cube-ticks-idle'] || 'rgba(255,255,255,0.35)'),
        ticksHover: rgbaToRgb(cssVars['--cube-ticks-hover'] || 'rgba(10,15,26,0.90)'),
        ticksHoverScale: parseFloat(cssVars['--cube-ticks-hover-scale']) || 1.15,
    }), [cssVars]);

    const { idleTex, hoverTex, textWidth, textHeight } = getFaceTextures(text, theme, reduceEffects ? .5 : 2, fontSize);


    useFrame((_, delta) => {
        if (reduceEffects) return;
        const target = hovered || forceHighlight ? 1 : 0;
        const targetScale = reducedMotion ? 1 : target ? 1.1 : 1;
        const diff = target - progressRef.current;
        const scaleDiff = targetScale - scaleRef.current;
        if (Math.abs(diff) < 0.001 && Math.abs(scaleDiff) < 0.001 && progressRef.current === target && scaleRef.current === targetScale) return;

        const p = reducedMotion || Math.abs(diff) < 0.001
            ? target : progressRef.current + diff * (1 - Math.exp(-8 * delta));
        const scale = Math.abs(scaleDiff) < 0.001
            ? targetScale : scaleRef.current + scaleDiff * (1 - Math.exp(-6 * delta));
        progressRef.current = p;
        scaleRef.current = scale;
        if (idleMatRef.current) idleMatRef.current.opacity = 1 - p;
        if (hoverMatRef.current) hoverMatRef.current.opacity = p;
        groupRef.current?.scale.set(scale, scale, 1);
        ticksRef.current?.update(p, 1 + p * (colors.ticksHoverScale - 1));
        underlineRef.current?.update(p);
        if (p !== target || scale !== targetScale) invalidate();
    });

    const planeW = textWidth * 1.05;
    const planeH = textHeight * 1.05;

    if (reduceEffects) return (
        <mesh position={[0, 0, 0.010]}>
            <planeGeometry args={[planeW, planeH]} />
            <meshBasicMaterial map={hovered || forceHighlight ? hoverTex : idleTex} transparent depthWrite={false} side={THREE.FrontSide} />
        </mesh>
    );

    return (
        <group ref={groupRef}>
            <mesh position={[0, 0, 0.010]}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial ref={idleMatRef} map={idleTex} transparent opacity={1} depthWrite={false} side={THREE.FrontSide} />
            </mesh>
            <mesh position={[0, 0, 0.012]}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial ref={hoverMatRef} map={hoverTex} transparent opacity={0} depthWrite={false} side={THREE.FrontSide} />
            </mesh>
            <FaceCornerTicks ref={ticksRef} idleColor={colors.ticksIdle} hoverColor={colors.ticksHover} />
            <UnderlineEffect ref={underlineRef} textWidth={textWidth} fontSize={fontSize} color={colors.accent} />
        </group>
    );
}

CubeFaceText.prewarmFaceTextures = () => prewarmCubeLabels().catch(() => {});