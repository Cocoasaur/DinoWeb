import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRenderProfile } from '../context/RenderProfileContext';
import { scrollRevealBounds } from '../utils/scrollRevealBounds';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function reveal(element, scroller, compact, openingAllowed) {
    const anchor = element.closest('[data-projects-anchor]') || element;
    const spatial = element.hasAttribute('data-projects-3d');
    const start = spatial
        ? { y: compact ? 28 : 44, z: compact ? -32 : -60, rotationX: compact ? -22 : -32, rotationY: compact ? -5 : -8, scale: .97, opacity: 0 }
        : { y: 20, opacity: 0 };
    const end = spatial
        ? { y: -24, z: compact ? -24 : -42, rotationX: compact ? 18 : 26, rotationY: compact ? 3 : 6, scale: .98, opacity: 0 }
        : { y: -14, opacity: 0 };
    const flat = () => { element.style.removeProperty('transform'); element.style.removeProperty('opacity'); };
    const timeline = gsap.timeline({ paused: true });
    timeline.fromTo(element, start, {
        y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1, opacity: 1, duration: 1, ease: 'power2.out', onComplete: flat,
    }).to({}, { duration: 1 }).to(element, { ...end, duration: 1, ease: 'power1.inOut', immediateRender: false });
    const opening = gsap.to(timeline, { time: 1, duration: compact ? .5 : .8, paused: true, ease: 'none' });
    let bounds, previous;
    const measure = () => { bounds = scrollRevealBounds(anchor, scroller); };
    const sync = (force = false) => {
        const entry = gsap.utils.clamp(0, 1, (scroller.scrollTop - bounds.enterStart) / (bounds.enterEnd - bounds.enterStart));
        const exit = gsap.utils.clamp(0, 1, (scroller.scrollTop - bounds.exitStart) / (bounds.exitEnd - bounds.exitStart));
        let time = entry < 1 ? entry : exit > 0 ? 2 + exit : 1;
        if (element.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) time = 1;
        if (!force && time === previous) return;
        if (openingAllowed && previous === undefined && time === 1 && scroller.scrollTop === 0 && !force) opening.play();
        else { opening.pause(); timeline.time(time); }
        if (time === 1 && !opening.isActive()) flat();
        previous = time;
    };
    measure();
    ScrollTrigger.create({ id: 'projects-reveal', trigger: anchor, scroller,
        start: () => { measure(); return bounds.enterStart; }, end: () => bounds.exitEnd,
        onUpdate: () => sync(), onRefresh: () => { measure(); sync(); },
    });
    sync();
    return sync;
}

export function useProjectsMotion(pageRef, ready, revision, reducedMotion) {
    const { reduceEffects } = useRenderProfile();
    const opened = useRef(new WeakSet());
    const hasOpened = useRef(false);
    useGSAP(() => {
        const root = pageRef.current;
        const scroller = root?.closest('.portfolio-overlay-panel');
        if (!scroller) return;
        const targets = [...root.querySelectorAll('[data-projects-reveal]')];
        if (!ready) {
            if (!hasOpened.current && !reducedMotion) gsap.set(targets, { opacity: 0 });
            return;
        }
        hasOpened.current = true;
        const progress = gsap.quickSetter(root.querySelector('.projects-scroll-progress-fill'), 'scaleX');
        ScrollTrigger.create({ id: 'projects-progress', scroller, start: 0,
            end: () => Math.max(1, scroller.scrollHeight - scroller.clientHeight),
            onUpdate: self => progress(self.progress), onRefresh: self => progress(self.progress),
        });
        const syncs = reducedMotion ? [] : targets.map(element => {
            const openingAllowed = !opened.current.has(element);
            opened.current.add(element);
            return reveal(element, scroller, reduceEffects, openingAllowed);
        });
        let frame = 0, focusFrame = 0, disposed = false;
        const focus = event => {
            if (event.type === 'focusin' && event.target.matches(':focus-visible')) syncs.forEach(sync => sync(true));
            else {
                cancelAnimationFrame(focusFrame);
                focusFrame = requestAnimationFrame(() => syncs.forEach(sync => sync(true)));
            }
        };
        const refresh = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
        };
        root.addEventListener('focusin', focus);
        root.addEventListener('focusout', focus);
        const resize = new ResizeObserver(refresh);
        resize.observe(root);
        resize.observe(scroller);
        document.fonts.ready.then(() => { if (!disposed) refresh(); });
        refresh();
        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            cancelAnimationFrame(focusFrame);
            resize.disconnect();
            root.removeEventListener('focusin', focus);
            root.removeEventListener('focusout', focus);
        };
    }, { scope: pageRef, dependencies: [ready, revision, reducedMotion, reduceEffects], revertOnUpdate: true });
}
