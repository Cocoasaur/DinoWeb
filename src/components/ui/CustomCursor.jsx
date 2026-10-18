import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { CUSTOM_CURSOR_MEDIA } from '../../utils/customCursorSupport';
import '../../styles/custom-cursor.css';

gsap.registerPlugin(useGSAP);

const NATIVE = 'iframe, video[controls], audio[controls], .boot-screen, [inert], [data-cursor="native"]';
const ACTION = 'a[href], button, summary, [role="button"], [role="tab"], [role="option"]';

function isNativeScrollbar(target, point) {
    const html = document.documentElement;
    if (point.x >= html.clientWidth || point.y >= html.clientHeight) return true;
    if (!(target instanceof HTMLElement)) return false;
    if (target.dataset.scrollbars === 'custom') return false;
    const vertical = target.scrollHeight > target.clientHeight && target.offsetWidth > target.clientWidth;
    const horizontal = target.scrollWidth > target.clientWidth && target.offsetHeight > target.clientHeight;
    if (!vertical && !horizontal) return false;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    // Convert to layout coordinates: About viewers may still be transforming.
    const x = (point.x - rect.left) * target.offsetWidth / rect.width;
    const y = (point.y - rect.top) * target.offsetHeight / rect.height;
    return (vertical && x >= target.clientLeft + target.clientWidth)
        || (horizontal && y >= target.clientTop + target.clientHeight)
        || (vertical && x < target.clientLeft); // Left-side/RTL scrollbars.
}

function interactionFor(target, pressed) {
    if (!(target instanceof Element) || target.closest(NATIVE)) return null;
    const control = target.closest(ACTION);
    if (target.closest('[role="scrollbar"]')) return { mode: pressed ? 'drag' : 'action', label: 'SCROLL' };
    if (target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return { mode: 'text', label: 'TYPE' };
    const canvas = target.closest('canvas');
    if (canvas?.closest('.cube-entrance')) {
        // The worker updates the canvas cursor asynchronously after raycasting.
        // Read its semantic inline value; the visible cursor is replaced by CSS.
        const worker = canvas.closest('[data-renderer="worker"]');
        const cursor = worker ? canvas.style.cursor : document.body.style.cursor || canvas.style.cursor;
        if (pressed || cursor === 'grabbing') return { mode: 'drag', label: 'DRAG', canvas };
        if (cursor === 'pointer') return { mode: 'action', label: 'OPEN', canvas };
        if (cursor === 'nwse-resize') return { mode: 'action', label: 'ZOOM', canvas };
        return { mode: 'rotate', label: 'ROTATE', canvas };
    }
    if (!control) return { mode: 'default', label: '' };
    const name = control.getAttribute('aria-label') || '';
    let label = control.tagName === 'A' ? 'OPEN' : 'SELECT';
    if (/close/i.test(name)) label = 'CLOSE';
    else if (/back/i.test(name)) label = 'BACK';
    else if (/^view /i.test(name)) label = 'VIEW';
    else if (/^next /i.test(name)) label = 'NEXT';
    else if (/^previous /i.test(name)) label = 'PREV';
    else if (control.hasAttribute('download') || /^download/i.test(name)) label = 'SAVE';
    return { mode: 'action', label };
}

export default function CustomCursor() {
    const rootRef = useRef(null);

    useGSAP(() => {
        const root = rootRef.current;
        const media = gsap.matchMedia();
        media.add(CUSTOM_CURSOR_MEDIA, () => {
            const dot = root.querySelector('.portfolio-cursor__point');
            const follower = root.querySelector('.portfolio-cursor__follower');
            const frame = root.querySelector('.portfolio-cursor__frame');
            const label = root.querySelector('.portfolio-cursor__label');
            const html = document.documentElement;
            gsap.set([dot, follower], { xPercent: -50, yPercent: -50 });
            const dotX = gsap.quickSetter(dot, 'x', 'px');
            const dotY = gsap.quickSetter(dot, 'y', 'px');
            const xTo = gsap.quickTo(follower, 'x', { duration: 0.16, ease: 'power3.out' });
            const yTo = gsap.quickTo(follower, 'y', { duration: 0.16, ease: 'power3.out' });
            const scaleTo = gsap.quickTo(frame, 'scale', { duration: 0.18, ease: 'power3.out' });
            const rotationTo = gsap.quickTo(frame, 'rotation', { duration: 0.2, ease: 'power3.out' });
            const alphaTo = gsap.quickTo(root, 'opacity', { duration: 0.12, ease: 'power2.out' });
            let visible = false;
            let pressed = false;
            let lastTarget = null;
            let activeCanvas = null;
            let mode = '';
            let scrollFrame = 0;
            let point = null;

            const hide = () => {
                visible = false;
                canvasObserver.disconnect();
                activeCanvas = null;
                root.dataset.visible = 'false';
                html.removeAttribute('data-custom-cursor');
                alphaTo(0);
                xTo.tween.pause();
                yTo.tween.pause();
            };
            const update = (target) => {
                const next = interactionFor(target, pressed);
                if (!next) { hide(); return false; }
                if (activeCanvas !== next.canvas) {
                    canvasObserver.disconnect();
                    activeCanvas = next.canvas;
                    if (activeCanvas) {
                        canvasObserver.observe(activeCanvas, { attributes: true, attributeFilter: ['style'] });
                        if (!activeCanvas.closest('[data-renderer="worker"]')) {
                            canvasObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
                        }
                    }
                }
                const key = `${next.mode}:${next.label}:${pressed}`;
                if (mode !== key) {
                    mode = key;
                    root.dataset.mode = next.mode;
                    root.dataset.pressed = String(pressed);
                    label.textContent = next.label;
                    scaleTo(pressed ? 0.65 : next.mode === 'action' ? 1.45 : 1);
                    rotationTo(next.mode === 'drag' ? 45 : 0);
                }
                return true;
            };
            const canvasObserver = new MutationObserver(() => {
                if (visible) update(lastTarget);
            });
            const showAt = (x, y, target) => {
                lastTarget = target;
                if (!update(target)) return;
                dotX(x);
                dotY(y);
                // Keep the press/drag hotspot exact. Only idle movement trails.
                const snap = !visible || pressed;
                xTo(x, snap ? x : undefined);
                yTo(y, snap ? y : undefined);
                if (!visible) {
                    visible = true;
                    root.dataset.visible = 'true';
                    html.setAttribute('data-custom-cursor', 'active');
                    alphaTo(1);
                }
            };
            const move = (event) => {
                if (event.pointerType !== 'mouse') { hide(); return; }
                point = { x: event.clientX, y: event.clientY };
                pressed = (event.buttons & 1) !== 0;
                const target = event.target;
                // Unmanaged native surfaces still need the browser's pointer.
                if (isNativeScrollbar(target, point)) {
                    hide();
                    return;
                }
                showAt(point.x, point.y, target);
            };
            const down = (event) => {
                if (event.pointerType !== 'mouse') { pressed = false; hide(); return; }
                if (event.button !== 0) return;
                move(event);
            };
            const up = (event) => {
                pressed = false;
                if (event.pointerType !== 'mouse') return;
                point = { x: event.clientX, y: event.clientY };
                const target = document.elementFromPoint(point.x, point.y);
                if (isNativeScrollbar(target, point)) hide();
                else showAt(point.x, point.y, target);
            };
            const lostCapture = () => {
                pressed = false;
                if (visible && point) {
                    lastTarget = document.elementFromPoint(point.x, point.y);
                    update(lastTarget);
                }
            };
            const leave = (event) => {
                if (!event.relatedTarget) { pressed = false; hide(); }
            };
            const blur = () => { pressed = false; hide(); };
            const visibility = () => { if (document.hidden) blur(); };
            const keyboard = () => hide();
            const scroll = () => {
                if (!visible || !point || scrollFrame) return;
                scrollFrame = requestAnimationFrame(() => {
                    scrollFrame = 0;
                    if (!visible) return;
                    const target = document.elementFromPoint(point.x, point.y);
                    if (isNativeScrollbar(target, point)) { hide(); return; }
                    lastTarget = target;
                    // Scrolling changes the hovered content, not the pointer's
                    // viewport position. Do not restart its movement tweens.
                    update(target);
                });
            };
            // Capture phase survives controls that stop bubbling while dragging.
            document.addEventListener('pointermove', move, { capture: true, passive: true });
            document.addEventListener('pointerdown', down, { capture: true, passive: true });
            document.addEventListener('pointerup', up, { capture: true, passive: true });
            document.addEventListener('pointercancel', blur, true);
            document.addEventListener('lostpointercapture', lostCapture, true);
            document.addEventListener('pointerout', leave);
            document.addEventListener('keydown', keyboard);
            document.addEventListener('visibilitychange', visibility);
            document.addEventListener('scroll', scroll, { capture: true, passive: true });
            window.addEventListener('blur', blur);
            return () => {
                canvasObserver.disconnect();
                cancelAnimationFrame(scrollFrame);
                html.removeAttribute('data-custom-cursor');
                root.dataset.visible = 'false';
                document.removeEventListener('pointermove', move, true);
                document.removeEventListener('pointerdown', down, true);
                document.removeEventListener('pointerup', up, true);
                document.removeEventListener('pointercancel', blur, true);
                document.removeEventListener('lostpointercapture', lostCapture, true);
                document.removeEventListener('pointerout', leave);
                document.removeEventListener('keydown', keyboard);
                document.removeEventListener('visibilitychange', visibility);
                document.removeEventListener('scroll', scroll, true);
                window.removeEventListener('blur', blur);
            };
        }, root);
        return () => media.revert();
    }, { scope: rootRef });

    return createPortal(
        <div ref={rootRef} className="portfolio-cursor" aria-hidden="true" data-visible="false">
            <span className="portfolio-cursor__point" />
            <span className="portfolio-cursor__follower">
                <span className="portfolio-cursor__frame"><i /><i /><i /><i /></span>
                <span className="portfolio-cursor__label" />
            </span>
        </div>,
        document.body,
    );
}
