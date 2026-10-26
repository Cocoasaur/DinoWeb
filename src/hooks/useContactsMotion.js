import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from './useReducedMotion';
import { useRenderProfile } from '../context/RenderProfileContext';
import { scrollRevealBounds } from '../utils/scrollRevealBounds';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useContactsMotion(rootRef, ready, copyStatus) {
    const { reduceEffects } = useRenderProfile();
    const reduced = useReducedMotion();
    const hasOpened = useRef(false);
    useGSAP(() => {
        const root = rootRef.current;
        const scroller = root?.closest('.portfolio-overlay-panel');
        if (!root || !scroller) return;
        const surfaces = [...root.querySelectorAll('[data-contact-reveal]')];
        if (!ready) {
            if (!hasOpened.current && !reduced) gsap.set(surfaces, { opacity: 0 });
            return;
        }
        const firstOpen = !hasOpened.current;
        hasOpened.current = true;
        const setProgress = gsap.quickSetter(root.querySelector('.contact-scroll-progress-fill'), 'scaleX');
        ScrollTrigger.create({
            id: 'contacts-progress', scroller, start: 0,
            end: () => Math.max(1, scroller.scrollHeight - scroller.clientHeight),
            onUpdate: self => setProgress(self.progress), onRefresh: self => setProgress(self.progress),
        });
        const syncs = reduced ? [] : surfaces.map((surface, index) => {
            const anchor = surface.closest('[data-contact-anchor]');
            const paper = surface.hasAttribute('data-contact-paper');
            const flat = () => {
                for (const name of ['transform', 'opacity', 'will-change']) surface.style.removeProperty(name);
            };
            const timeline = gsap.timeline({ paused: true }).fromTo(surface,
                { y: reduceEffects ? 18 : 28, rotationX: paper ? (reduceEffects ? -4 : -8) : 0, opacity: 0 },
                { y: 0, rotationX: 0, opacity: 1, duration: 1, ease: 'power2.out', onComplete: flat })
                .to({}, { duration: 1 })
                .to(surface, { y: -28, rotationX: paper ? (reduceEffects ? 3 : 6) : 0, opacity: 0, duration: 1, ease: 'power1.inOut', immediateRender: false });
            let openingPending = false, openingScroll = 0;
            const opening = gsap.to(timeline, {
                time: 1, duration: reduceEffects ? .55 : .75,
                delay: firstOpen ? Math.min(index, 3) * .045 : 0, ease: 'none', paused: true,
                onComplete: () => { openingPending = false; flat(); },
            });
            let bounds, previous;
            const measure = () => { bounds = scrollRevealBounds(anchor, scroller); };
            const sync = (force = false) => {
                const entry = gsap.utils.clamp(0, 1, (scroller.scrollTop - bounds.enterStart) / (bounds.enterEnd - bounds.enterStart));
                const exit = gsap.utils.clamp(0, 1, (scroller.scrollTop - bounds.exitStart) / (bounds.exitEnd - bounds.exitStart));
                // Keep the contact surface readable while its links or controls have focus.
                const focused = surface.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
                const time = focused ? 1 : entry < 1 ? entry : exit > 0 ? 2 + exit : 1;
                // A delayed tween is not isActive() yet. Keep its hidden start
                // intact, and let refresh/focus callbacks leave it uninterrupted.
                if (openingPending) {
                    if (!focused && time === 1 && scroller.scrollTop === openingScroll) return;
                    openingPending = false;
                    opening.pause();
                    timeline.time(time);
                    if (time === 1) flat();
                    previous = time;
                    return;
                }
                if (!force && time === previous) return;
                if (firstOpen && previous === undefined && time === 1 && scroller.scrollTop === 0 && !force && !focused) {
                    openingPending = true;
                    openingScroll = scroller.scrollTop;
                    gsap.set(surface, { willChange: 'transform,opacity' });
                    opening.play();
                } else {
                    opening.pause();
                    timeline.time(time);
                    if (time === 1) flat();
                }
                previous = time;
            };
            measure();
            ScrollTrigger.create({ id: `contacts-reveal-${index}`, trigger: anchor, scroller,
                start: () => { measure(); return bounds.enterStart; }, end: () => bounds.exitEnd,
                onUpdate: () => sync(), onRefresh: () => { measure(); sync(); } });
            sync();
            return sync;
        });
        let frame = 0, focusFrame = 0, disposed = false;
        const refresh = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
        };
        const focus = () => {
            cancelAnimationFrame(focusFrame);
            focusFrame = requestAnimationFrame(() => syncs.forEach(sync => sync(true)));
        };
        root.addEventListener('focusin', focus);
        root.addEventListener('focusout', focus);
        const observer = new ResizeObserver(refresh);
        observer.observe(root);
        observer.observe(scroller);
        document.fonts.ready.then(() => { if (!disposed) refresh(); });
        refresh();
        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            cancelAnimationFrame(focusFrame);
            observer.disconnect();
            root.removeEventListener('focusin', focus);
            root.removeEventListener('focusout', focus);
        };
    }, { scope: rootRef, dependencies: [ready, reduced, reduceEffects], revertOnUpdate: true });

    // Clipboard feedback is transient and stays readable wherever it appears.
    useGSAP(() => {
        if (!copyStatus || reduced) return;
        gsap.fromTo(rootRef.current.querySelector('.contact-copy-status'),
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: .25, ease: 'power2.out', clearProps: 'transform,opacity' });
    }, { scope: rootRef, dependencies: [copyStatus, reduced], revertOnUpdate: true });
}
