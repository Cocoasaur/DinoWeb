import React, { useEffect, useState, useRef } from 'react';

const THEME_DEMAIN = 'demain-soir-bleu';
const THEME_CLAIR = 'clair-obscur';

const COLORS = {
    [THEME_DEMAIN]: '#002451', // dark blue
    [THEME_CLAIR]: '#e8e6e1',  // light beige
};

export default function ThemeTransition({ active, onToggle, onComplete }) {
    const [phase, setPhase] = useState('idle'); // idle | animating | done
    const [direction, setDirection] = useState(null); // 'shrink' | 'expand'
    const [targetTheme, setTargetTheme] = useState(null);

    // Keep callbacks in refs so timeouts aren't disrupted by parent re-renders
    const onToggleRef = useRef(onToggle);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => { onToggleRef.current = onToggle; }, [onToggle]);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

    // Get current theme from document
    const getCurrentTheme = () => document.documentElement.getAttribute('data-theme') || THEME_DEMAIN;

    useEffect(() => {
        if (active && phase === 'idle') {
            const current = getCurrentTheme();
            const next = current === THEME_DEMAIN ? THEME_CLAIR : THEME_DEMAIN;
            setTargetTheme(next);

            // Direction is based on what we're switching TO:
            // → To Clair-obscur (light): SHRINK the dark circle away
            // → To Demain-soir-bleu (dark): EXPAND the dark circle over
            setDirection(next === THEME_CLAIR ? 'shrink' : 'expand');
            setPhase('animating');
        }
    }, [active, phase]);

    useEffect(() => {
        if (phase !== 'animating') return;

        // Toggle theme at the START of the animation (0ms)
        // so the underlying page is already the new theme when the wipe reveals it
        onToggleRef.current?.();

        // Total animation duration: 700ms
        const timer = setTimeout(() => {
            setPhase('done');
        }, 700);
        return () => clearTimeout(timer);
    }, [phase]);

    useEffect(() => {
        if (phase !== 'done') return;
        const timer = setTimeout(() => {
            setPhase('idle');
            setDirection(null);
            setTargetTheme(null);
            onCompleteRef.current?.();
        }, 50);
        return () => clearTimeout(timer);
    }, [phase]);

    if (phase === 'idle' || !targetTheme || !direction) return null;

    const transitionColor = COLORS[targetTheme];

    return (
        <div
            className="fixed inset-0 z-[200] pointer-events-none"
            style={{
                backgroundColor: transitionColor,
                animation: direction === 'shrink'
                    ? 'theme-shrink-circle 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                    : 'theme-expand-circle 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
        />
    );
}