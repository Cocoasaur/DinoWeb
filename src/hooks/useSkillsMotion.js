import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { useRenderProfile } from '../context/RenderProfileContext';
import { scrollRevealBounds } from '../utils/scrollRevealBounds';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Stationary cells supply layout bounds. Only the content inside them moves.
function revealWithScroll(element, scroller, compact, openAtRest) {
    const anchor = element.closest('[data-skills-anchor]') || element;
    const timeline = gsap.timeline({ paused: true });
    timeline.fromTo(element, { y: compact ? 30 : 58, rotationX: compact ? 0 : -18, opacity: 0 }, {
        y: 0, rotationX: 0, opacity: 1, duration: 1, ease: 'power2.out', onComplete: () => {
            element.style.removeProperty('transform');
            element.style.removeProperty('opacity');
        },
    }).to({}, { duration: 1 }).to(element, {
        y: -28, rotationX: compact ? 0 : 8, scale: .98, opacity: 0, duration: 1, ease: 'power1.inOut',
    });
    const opening = gsap.to(timeline, { time: 1, duration: compact ? .45 : .7, ease: 'none', paused: true });
    let enterStart, enterEnd, exitStart, exitEnd, previous;
    const measure = () => {
        ({ enterStart, enterEnd, exitStart, exitEnd } = scrollRevealBounds(anchor, scroller));
    };
    const sync = (force = false) => {
        const scroll = scroller.scrollTop;
        const entry = gsap.utils.clamp(0, 1, (scroll - enterStart) / (enterEnd - enterStart));
        const exit = gsap.utils.clamp(0, 1, (scroll - exitStart) / (exitEnd - exitStart));
        let time = entry < 1 ? entry : exit > 0 ? 2 + exit : 1;
        if (element.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) time = 1;
        if (time === previous && !force) return;
        if (openAtRest && previous === undefined && time === 1 && scroll === 0 && !force) {
            opening.play();
        } else {
            opening.pause();
            timeline.time(time);
        }
        if (time === 1 && !opening.isActive()) {
            element.style.removeProperty('transform');
            element.style.removeProperty('opacity');
        }
        previous = time;
    };
    measure();
    ScrollTrigger.create({
        id: 'skills-reveal', trigger: anchor, scroller,
        start: () => { measure(); return enterStart; }, end: () => exitEnd,
        onUpdate: () => sync(), onRefresh: () => { measure(); sync(); },
    });
    sync();
    return sync;
}

export function useSkillsMotion(pageRef, ready, active, expanded, reducedMotion) {
    const { reduceEffects, tier } = useRenderProfile();
    const openedTargets = useRef(new WeakSet());
    const hasOpened = useRef(false);

    useGSAP(() => {
        const root = pageRef.current;
        const scroller = root.closest('.portfolio-overlay-panel');
        if (reducedMotion || !ready) return;
        const scrollRig = root.querySelector('.skills-stack-scroll');
        gsap.fromTo(scrollRig, { y: 0, rotationZ: 0 }, {
            y: reduceEffects ? -10 : -24, rotationZ: reduceEffects ? 2 : 7, ease: 'none',
            scrollTrigger: { id: 'skills-sculpture', trigger: root.querySelector('.skills-hero'), scroller,
                start: 'top top', end: 'bottom top', scrub: true },
        });

        // Pointer motion reuses two tweens; no idle render loop or extra WebGL.
        const media = gsap.matchMedia();
        media.add('(hover: hover) and (pointer: fine)', () => {
            if (tier === 'low') return;
            const stage = root.querySelector('.skills-stack-stage');
            const rig = root.querySelector('.skills-stack-rig');
            const rx = gsap.quickTo(rig, 'rotationX', { duration: .45, ease: 'power3.out' });
            const rz = gsap.quickTo(rig, 'rotationZ', { duration: .45, ease: 'power3.out' });
            let bounds;
            const move = event => {
                if (event.pointerType !== 'mouse') return;
                bounds ||= stage.getBoundingClientRect();
                const x = gsap.utils.clamp(-1, 1, (event.clientX - bounds.left) / bounds.width * 2 - 1);
                const y = gsap.utils.clamp(-1, 1, (event.clientY - bounds.top) / bounds.height * 2 - 1);
                rx(58 - y * 6);
                rz(-34 + x * 7);
            };
            const reset = () => { bounds = null; rx(58); rz(-34); };
            stage.addEventListener('pointermove', move);
            stage.addEventListener('pointerleave', reset);
            scroller.addEventListener('scroll', reset, { passive: true });
            return () => {
                stage.removeEventListener('pointermove', move);
                stage.removeEventListener('pointerleave', reset);
                scroller.removeEventListener('scroll', reset);
            };
        }, root);
        return () => media.revert();
    }, { scope: pageRef, dependencies: [ready, reducedMotion, reduceEffects, tier], revertOnUpdate: true });

    useGSAP(() => {
        const root = pageRef.current;
        const scroller = root.closest('.portfolio-overlay-panel');
        if (!scroller || reducedMotion) return;
        const targets = [...root.querySelectorAll('[data-skills-reveal]')];
        if (!ready) {
            if (!hasOpened.current) gsap.set(targets, { opacity: 0 });
            return;
        }
        hasOpened.current = true;
        const setProgress = gsap.quickSetter(root.querySelector('.skills-scroll-progress-fill'), 'scaleX');
        ScrollTrigger.create({
            id: 'skills-progress', scroller, start: 0,
            end: () => Math.max(1, scroller.scrollHeight - scroller.clientHeight),
            onUpdate: self => setProgress(self.progress), onRefresh: self => setProgress(self.progress),
        });
        const syncs = targets.map(element => {
            const openAtRest = !openedTargets.current.has(element);
            openedTargets.current.add(element);
            return revealWithScroll(element, scroller, reduceEffects, openAtRest);
        });
        let focusFrame = 0;
        const focus = event => {
            if (event.type === 'focusin') {
                if (event.target.matches(':focus-visible')) syncs.forEach(sync => sync(true));
                return;
            }
            cancelAnimationFrame(focusFrame);
            focusFrame = requestAnimationFrame(() => syncs.forEach(sync => sync(true)));
        };
        root.addEventListener('focusin', focus);
        root.addEventListener('focusout', focus);

        let frame = 0, disposed = false;
        const refresh = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
        };
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
    }, { scope: pageRef, dependencies: [ready, active, reducedMotion, reduceEffects], revertOnUpdate: true });

    // Re-target existing layer positions on selection instead of resetting them.
    // All tweens belong to useGSAP's context and revert when the page unmounts.
    useGSAP(() => {
        const layers = pageRef.current.querySelectorAll('.skills-stack-layer');
        const gap = expanded ? (reduceEffects ? 42 : 56) : 12;
        gsap.to(layers, {
            z: index => (3 - index) * gap,
            x: (_, element) => active !== 'all' && element.dataset.layer === active ? 18 : 0,
            opacity: (_, element) => active === 'all' || element.dataset.layer === active ? 1 : .3,
            duration: reducedMotion || !ready ? 0 : .65,
            ease: 'power3.inOut', overwrite: 'auto',
        });
    }, { scope: pageRef, dependencies: [ready, active, expanded, reducedMotion, reduceEffects] });
}
