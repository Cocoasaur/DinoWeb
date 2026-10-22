import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from './useReducedMotion';
import { scrollRevealBounds } from '../utils/scrollRevealBounds';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useContactsMotion(rootRef, ready) {
    const reduced = useReducedMotion();
    const hasOpened = useRef(false);
    useGSAP(() => {
        const root = rootRef.current;
        const scroller = root?.closest('.portfolio-overlay-panel');
        if (!root || !scroller || reduced) return;
        const surfaces = [...root.querySelectorAll('[data-contact-reveal]')];
        if (!ready) {
            if (!hasOpened.current) gsap.set(surfaces, { opacity: 0 });
            return;
        }
        const firstOpen = !hasOpened.current;
        hasOpened.current = true;
        const syncs = surfaces.map(surface => {
            const anchor = surface.closest('[data-contact-anchor]');
            const paper = surface.hasAttribute('data-contact-paper');
            const flat = () => { surface.style.removeProperty('transform'); surface.style.removeProperty('opacity'); };
            const timeline = gsap.timeline({ paused: true }).fromTo(surface,
                { y: paper ? 28 : 18, rotationX: paper ? -8 : 0, opacity: 0 },
                { y: 0, rotationX: 0, opacity: 1, duration: 1, ease: 'power2.out', onComplete: flat })
                .to({}, { duration: 1 })
                .to(surface, { y: -16, rotationX: paper ? 6 : 0, opacity: 0, duration: 1, ease: 'power1.inOut', immediateRender: false });
            const opening = gsap.to(timeline, { time: 1, duration: .6, ease: 'none', paused: true });
            let bounds, previous;
            const measure = () => { bounds = scrollRevealBounds(anchor, scroller); };
            const sync = (force = false) => {
                const entry = gsap.utils.clamp(0, 1, (scroller.scrollTop - bounds.enterStart) / (bounds.enterEnd - bounds.enterStart));
                const exit = gsap.utils.clamp(0, 1, (scroller.scrollTop - bounds.exitStart) / (bounds.exitEnd - bounds.exitStart));
                // Keep the contact surface readable while its links or controls have focus.
                const time = surface.contains(document.activeElement) ? 1 : entry < 1 ? entry : exit > 0 ? 2 + exit : 1;
                if (!force && time === previous) return;
                if (firstOpen && previous === undefined && time === 1 && scroller.scrollTop === 0 && !force) opening.play();
                else { opening.pause(); timeline.time(time); }
                if (time === 1 && !opening.isActive()) flat();
                previous = time;
            };
            measure();
            ScrollTrigger.create({ id: 'contacts-reveal', trigger: anchor, scroller,
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
    }, { scope: rootRef, dependencies: [ready, reduced], revertOnUpdate: true });
}
