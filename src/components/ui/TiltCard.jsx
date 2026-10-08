import { useRef, useEffect, useCallback } from 'react';
import { useRenderProfile } from '../../context/RenderProfileContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/** Tilt a card as one unit; pointer updates stay outside React rendering. */
export default function TiltCard({
    children,
    className = '',
    style = {},
    tiltAmount = 12,
    scale = 1.02,
    glare = true,
    perspective = 1000,
    depth = 0,
}) {
    const { reduceEffects, tier } = useRenderProfile();
    const reducedMotion = useReducedMotion();
    const cardRef = useRef(null);
    const glareRef = useRef(null);
    const interaction = useRef({ pointerId: null, rect: null, frame: 0, timer: 0, active: false });
    const amount = tiltAmount * (tier === 'low' ? 0.65 : 1);
    const neutral = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`;
    const settle = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';

    const reset = useCallback((instant = false) => {
        const current = interaction.current;
        cancelAnimationFrame(current.frame);
        clearTimeout(current.timer);
        Object.assign(current, { pointerId: null, rect: null, frame: 0, timer: 0, active: false });
        if (cardRef.current) {
            cardRef.current.style.transition = reducedMotion || instant ? 'none' : settle;
            cardRef.current.style.transform = reducedMotion ? 'none' : neutral;
            cardRef.current.style.willChange = '';
        }
        if (glareRef.current) {
            glareRef.current.style.opacity = '0';
            glareRef.current.style.transform = 'translate3d(0, 0, 0)';
        }
    }, [neutral, reducedMotion]);

    const update = useCallback((event, tap = false) => {
        if (reducedMotion || !cardRef.current) return;
        const current = interaction.current;
        clearTimeout(current.timer);
        // Measure once before tilting, avoiding transformed bounds and repeated
        // layout reads. A scroll/resize ends the interaction and clears this rect.
        current.rect ||= cardRef.current.getBoundingClientRect();
        const rect = current.rect;
        if (!rect.width || !rect.height) return;
        let x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
        let y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
        // A centered tap should give visible feedback as well as scale.
        if (tap && Math.abs(x) < 0.1 && Math.abs(y) < 0.1) { x = 0.2; y = -0.2; }
        current.point = { x, y };
        current.active = true;
        if (current.frame) return;
        current.frame = requestAnimationFrame(() => {
            current.frame = 0;
            const card = cardRef.current;
            if (!card || !current.active) return;
            const point = current.point;
            card.style.transition = 'transform 0.1s ease-out';
            card.style.willChange = 'transform';
            card.style.transform = `perspective(${perspective}px) rotateX(${-point.y * amount}deg) rotateY(${point.x * amount}deg) scale3d(${scale}, ${scale}, ${scale})`;
            if (glareRef.current) {
                // Move a fixed gradient with the compositor; do not repaint a
                // new radial gradient on every pointer movement.
                glareRef.current.style.transform = `translate3d(${point.x * 15}%, ${point.y * 15}%, 0)`;
                glareRef.current.style.opacity = '0.55';
            }
        });
    }, [amount, perspective, reducedMotion, scale]);

    useEffect(() => {
        reset(true);
        const end = () => reset();
        const onVisibility = () => { if (document.hidden) reset(true); };
        // Capturing scroll also catches scrolling within the About overlay.
        window.addEventListener('scroll', end, { capture: true, passive: true });
        window.addEventListener('resize', end, { passive: true });
        window.addEventListener('blur', end);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('scroll', end, true);
            window.removeEventListener('resize', end);
            window.removeEventListener('blur', end);
            document.removeEventListener('visibilitychange', onVisibility);
            reset(true);
        };
    }, [reset]);

    const onPointerDown = (event) => {
        if (!event.isPrimary) { reset(); return; }
        if (event.button !== 0) return;
        interaction.current.pointerId = event.pointerId;
        update(event, event.pointerType !== 'mouse');
        // Leave native touch scrolling and pinch zoom enabled.
    };
    const onPointerMove = (event) => {
        if (event.pointerType === 'mouse' || interaction.current.pointerId === event.pointerId) update(event);
    };
    const onPointerUp = (event) => {
        if (event.pointerId !== interaction.current.pointerId) return;
        interaction.current.pointerId = null;
        if (event.pointerType === 'mouse') return;
        // Let quick taps remain visible briefly, then settle without a frame loop.
        interaction.current.timer = window.setTimeout(() => reset(), 180);
    };

    return (
        <div
            ref={cardRef}
            className={className}
            style={{
                display: 'inline-block',
                verticalAlign: 'top',
                position: 'relative',
                ...style,
                transform: reducedMotion ? 'none' : neutral,
                transition: reducedMotion ? 'none' : settle,
                transformStyle: reducedMotion ? undefined : 'preserve-3d',
            }}
            onPointerEnter={reducedMotion ? undefined : event => { if (event.pointerType === 'mouse') update(event); }}
            onPointerMove={reducedMotion ? undefined : onPointerMove}
            onPointerDown={reducedMotion ? undefined : onPointerDown}
            onPointerUp={reducedMotion ? undefined : onPointerUp}
            onPointerLeave={reducedMotion ? undefined : event => { if (event.pointerType === 'mouse') reset(); }}
            onPointerCancel={reducedMotion ? undefined : () => reset()}
        >
            <div style={{ position: 'relative', zIndex: 2, transform: !reducedMotion && depth ? `translateZ(${depth}px)` : undefined }}>
                {children}
            </div>
            {glare && !reduceEffects && !reducedMotion && (
                <div
                    ref={glareRef}
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: '-20%',
                        borderRadius: 'inherit',
                        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.28) 0%, transparent 55%)',
                        opacity: 0,
                        transition: 'opacity 0.35s ease, transform 0.1s ease-out',
                        pointerEvents: 'none',
                        mixBlendMode: 'overlay',
                        zIndex: 3,
                    }}
                />
            )}
        </div>
    );
}
