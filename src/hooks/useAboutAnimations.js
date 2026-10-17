import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { useRenderProfile } from '../context/RenderProfileContext';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MEDIA = {
    desktop: '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
    compact: '(max-width: 1023px), (hover: none), (pointer: coarse)',
    reducedMotion: '(prefers-reduced-motion: reduce)',
};

// Layout offsets exclude the transforms on animated sections and their children.
// That keeps trigger positions stable after fonts, PDFs, filters, or resizing.
function layoutTop(element, scroller) {
    let top = 0;
    for (let node = element; node && node !== scroller; node = node.offsetParent) {
        top += node.offsetTop;
    }
    return top;
}

function revealStart(element, scroller) {
    return Math.min(
        scroller.scrollHeight - scroller.clientHeight - 1,
        layoutTop(element, scroller) - scroller.clientHeight * 0.96,
    );
}

// Scrub the reveal through a visible band at each viewport edge. Scrolling up
// unwinds the entrance before the element disappears below the panel.
function repeatAnimation(element, animation, scroller, {
    anchor = element, readyRef, phased = false, opening, scrollStagger = 0,
} = {}) {
    let previousProgress = -1;
    let enterStart;
    let enterEnd;
    let exitStart;
    let exitEnd;
    const measure = () => {
        const top = layoutTop(anchor, scroller);
        const height = scroller.clientHeight;
        const maxScroll = scroller.scrollHeight - height;
        enterStart = Math.min(maxScroll - 1, revealStart(anchor, scroller) + scrollStagger);
        enterEnd = Math.max(enterStart + 1, Math.min(maxScroll, top - height * 0.7 + scrollStagger));
        exitStart = Math.max(0, enterEnd, top + anchor.offsetHeight - height * 0.24 + scrollStagger * 0.5);
        exitEnd = Math.max(exitStart + 1, top + anchor.offsetHeight - height * 0.04 + scrollStagger * 0.5);
    };
    const sync = (force = false) => {
        if (readyRef && !readyRef.current) return;
        const scroll = scroller.scrollTop;
        const entry = gsap.utils.clamp(0, 1, (scroll - enterStart) / (enterEnd - enterStart));
        const exit = gsap.utils.clamp(0, 1, (exitEnd - scroll) / (exitEnd - exitStart));
        const focused = element.contains(document.activeElement)
            && document.activeElement.matches(':focus-visible');
        // Entry, readable rest, and exit occupy separate timeline segments.
        // The upper exit can therefore lift/turn away instead of replaying entry.
        const rest = phased ? 1 / 3 : 1;
        let progress = Math.min(entry, exit);
        if (phased) progress = entry < 1 ? entry / 3 : exit < 1 ? (3 - exit) / 3 : rest;
        if (focused) progress = rest;
        if (progress === previousProgress && !force) return;
        // Preserve the opening choreography for content already fully in view.
        // Subsequent movement follows scroll position exactly in both directions.
        if (previousProgress < 0 && progress === rest && !force) {
            if (opening) opening.play();
            else animation.play();
        } else {
            opening?.pause();
            animation.pause().progress(progress);
            if (phased && progress === rest) {
                element.style.removeProperty('transform');
                element.style.removeProperty('opacity');
            }
        }
        previousProgress = progress;
    };
    measure();
    ScrollTrigger.create({
        trigger: anchor,
        scroller,
        start: () => { measure(); return enterStart; },
        end: () => exitEnd,
        onUpdate: () => sync(),
        onRefresh: () => { measure(); sync(); },
    });
    sync();
    return {
        element, sync,
        reveal: () => {
            opening?.pause();
            animation.pause().progress(phased ? 1 / 3 : 1);
            if (phased) {
                element.style.removeProperty('transform');
                element.style.removeProperty('opacity');
            }
        },
    };
}

function repeatingReveal(element, scroller, vars = {}, options) {
    const { exitVars, nestedTargets, ...controllerOptions } = options || {};
    const { duration = 0.6, delay = 0, ...entryVars } = vars;
    const animation = gsap.timeline({ paused: true });
    animation.from(element, {
        y: 28,
        opacity: 0,
        duration: 1,
        ease: 'power2.inOut',
        // Clear these at rest so hover styles and native controls retain control.
        clearProps: 'transform,opacity',
        ...entryVars,
    }, 0);
    if (nestedTargets?.length) {
        animation.from(nestedTargets, {
            yPercent: 65,
            opacity: 0,
            rotationX: -35,
            transformPerspective: 700,
            transformOrigin: 'center bottom',
            duration: 0.5,
            stagger: { amount: 0.32 },
            ease: 'power2.out',
            clearProps: 'transform,opacity,transformOrigin',
        }, 0.12);
    }
    animation
        .addLabel('readable', 1)
        .to({}, { duration: 1 }, 'readable')
        .fromTo(element, {
            x: 0, y: 0, scale: 1, rotation: 0, rotationX: 0, rotationY: 0,
            skewX: 0, skewY: 0, opacity: 1,
        }, {
            y: -28,
            scale: 0.97,
            opacity: 0,
            duration: 1,
            ease: 'power2.inOut',
            immediateRender: false,
            ...exitVars,
        }, 2);
    // Created inside the same GSAP context, including when the modal opens later.
    const opening = gsap.to(animation, {
        time: 1, duration, delay, ease: 'none', paused: true,
    });
    return repeatAnimation(element, animation, scroller, {
        ...controllerOptions, opening, phased: true,
    });
}

function preserveFocus(scope, controllers) {
    let frame = 0;
    const onFocus = event => {
        // A pointer click must finish at the same coordinates where it began.
        // Only keyboard focus should snap a partially revealed control to rest.
        if (!event.target.matches(':focus-visible')) return;
        controllers.forEach(({ element, reveal }) => {
            if (element.contains(event.target)) reveal();
        });
    };
    const onBlur = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => controllers.forEach(controller => controller.sync(true)));
    };
    scope.addEventListener('focusin', onFocus);
    scope.addEventListener('focusout', onBlur);
    return () => {
        cancelAnimationFrame(frame);
        scope.removeEventListener('focusin', onFocus);
        scope.removeEventListener('focusout', onBlur);
    };
}

// About scrolls inside the overlay's native panel. Every animation belongs to
// its media context, so unmounts and reduced-motion changes revert all styles.
export function useAboutAnimations(pageRef, ready) {
    const { tier } = useRenderProfile();
    const controllersRef = useRef([]);
    const readyRef = useRef(false);

    useGSAP(() => {
        const root = pageRef.current;
        const scroller = root.closest('.portfolio-overlay-panel');
        if (!scroller) return;
        const select = gsap.utils.selector(root);
        const media = gsap.matchMedia();

        media.add(MEDIA, ({ conditions }) => {
            controllersRef.current = [];
            if (conditions.reducedMotion) return;
            const fullMotion = conditions.desktop && tier !== 'low';
            const distance = fullMotion ? 58 : 30;
            const duration = fullMotion ? 0.7 : 0.45;
            const controllers = controllersRef.current;
            const reveal = (element, vars = {}, options = {}) => {
                controllers.push(repeatingReveal(element, scroller, {
                    y: distance, duration, ...vars,
                }, { readyRef, ...options }));
            };

            const entrance = gsap.timeline({
                defaults: { ease: 'power3.out', duration },
                paused: true,
            });
            entrance
                .from(select('.about-label'), { y: 12, opacity: 0, clearProps: 'transform,opacity' })
                .from(select('.about-title-char'), {
                    yPercent: 110,
                    rotationX: fullMotion ? -75 : -35,
                    rotation: index => (index % 2 ? 1 : -1) * (fullMotion ? 10 : 4),
                    scale: 0.75,
                    transformPerspective: 700,
                    transformOrigin: 'center bottom',
                    stagger: 0.075,
                    duration: fullMotion ? 0.85 : 0.5,
                    clearProps: 'transform,transformOrigin',
                }, '<0.1');
            controllers.push(repeatAnimation(root.querySelector('.about-header'), entrance, scroller, { readyRef }));

            gsap.fromTo(select('.about-scroll-progress-fill'), { scaleX: 0 }, {
                scaleX: 1,
                ease: 'none',
                scrollTrigger: {
                    scroller, start: 0,
                    end: () => Math.max(1, scroller.scrollHeight - scroller.clientHeight),
                    scrub: true,
                },
            });

            // A separate parent layer provides movement throughout each scroll,
            // while children can replay their own entrances without transform conflicts.
            select('.about-header, .about-section').forEach(section => {
                const drift = fullMotion ? 22 : 9;
                gsap.fromTo(section, { y: drift }, {
                    y: -drift,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section, scroller,
                        start: () => layoutTop(section, scroller) - scroller.clientHeight,
                        end: () => layoutTop(section, scroller) + section.offsetHeight,
                        scrub: fullMotion ? 0.45 : true,
                    },
                });
            });

            select('.about-section-title').forEach(element => reveal(element, {
                x: -32, y: 10, rotationX: fullMotion ? -55 : -20,
                transformPerspective: 700,
            }, { exitVars: { x: 20, y: -18, rotationX: 25 } }));
            select('.about-copy').forEach((element, index) => reveal(element, {
                x: (index % 2 ? 1 : -1) * (fullMotion ? 10 : 4),
                skewY: fullMotion ? 1 : 0,
                delay: index * 0.08,
            }, {
                nestedTargets: element.querySelectorAll('.about-copy-word'),
                exitVars: { x: -10, y: fullMotion ? -40 : -24, skewY: fullMotion ? -1 : 0 },
            }));
            select('.about-profile-wrap').forEach(element => reveal(element, {
                y: fullMotion ? 80 : 38,
                scale: fullMotion ? 0.82 : 0.91,
                rotation: fullMotion ? -5 : -2,
                rotationY: fullMotion ? -16 : 0,
                transformPerspective: 900,
            }, { exitVars: { y: -45, x: 12, scale: 0.9, rotation: 4, rotationY: fullMotion ? 12 : 0 } }));
            select('.about-cert-filter').forEach((element, index) => reveal(element, {
                y: fullMotion ? 32 : 20,
                rotationX: fullMotion ? -45 : 0,
                scale: 0.9,
                transformPerspective: 700,
                delay: index * 0.04,
            }, { scrollStagger: index * (fullMotion ? 12 : 6) }));
            select('.about-cert-results').forEach(element => reveal(element, { y: 12 }));

            select('.about-divider').forEach(element => {
                gsap.from(element, {
                    scaleX: 0,
                    transformOrigin: 'left center',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: element, scroller,
                        start: () => revealStart(element, scroller),
                        end: () => Math.min(scroller.scrollHeight - scroller.clientHeight,
                            layoutTop(element, scroller) - scroller.clientHeight * 0.65),
                        scrub: true,
                    },
                });
            });

            select('.about-timeline-item').forEach(element => {
                const content = element.querySelector('.about-timeline-content');
                reveal(content, { x: fullMotion ? 44 : 24, y: 0 }, {
                    anchor: element,
                    nestedTargets: content.children,
                    exitVars: { x: -20, y: -16, scale: 0.98 },
                });
                reveal(element.querySelector('.about-timeline-dot-fill'), {
                    y: 0, scale: 0, duration: 0.4, ease: 'back.out(1.5)',
                }, { anchor: element, exitVars: { y: 0, scale: 0, opacity: 0 } });
                gsap.from(element.querySelector('.about-timeline-line-fill'), {
                    scaleY: 0,
                    transformOrigin: 'center top',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: element, scroller,
                        start: () => Math.min(scroller.scrollHeight - scroller.clientHeight - 1,
                            layoutTop(element, scroller) - scroller.clientHeight * 0.85),
                        end: () => Math.min(scroller.scrollHeight - scroller.clientHeight,
                            layoutTop(element, scroller) + element.offsetHeight - scroller.clientHeight * 0.55),
                        scrub: true,
                    },
                });
            });
            select('.about-parameter-row').forEach((element, index) => reveal(element, {
                x: index % 2 ? -32 : 32, y: 8, scale: 0.96, delay: index * 0.06,
            }, { scrollStagger: index * 8, exitVars: { x: index % 2 ? 20 : -20, y: -12 } }));
            return preserveFocus(root, controllers);
        }, root);

        // Lazy content changes the positions below it. Refresh only after layout changes.
        let disposed = false;
        let refreshTimer;
        const refresh = () => {
            if (disposed) return;
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
        };
        const observer = new ResizeObserver(refresh);
        observer.observe(root);
        observer.observe(scroller);
        root.addEventListener('load', refresh, true);
        document.fonts.ready.then(refresh);
        return () => {
            controllersRef.current = [];
            disposed = true;
            clearTimeout(refreshTimer);
            observer.disconnect();
            root.removeEventListener('load', refresh, true);
            media.revert();
        };
    }, { scope: pageRef, dependencies: [tier], revertOnUpdate: true });

    // The page mounts during the camera approach; first-view motion waits for it to open.
    useGSAP(() => {
        readyRef.current = ready;
        if (ready) controllersRef.current.forEach(controller => controller.sync());
    }, { scope: pageRef, dependencies: [ready] });
}

export function useAboutCertificateAnimations(galleryRef, category, page, pageSize) {
    const { tier } = useRenderProfile();
    useGSAP(() => {
        const gallery = galleryRef.current;
        const section = gallery.parentElement;
        const scroller = gallery.closest('.portfolio-overlay-panel');
        if (!scroller) return;
        const media = gsap.matchMedia();
        media.add({ ...MEDIA, tablet: '(min-width: 768px)', wide: '(min-width: 1280px)' }, ({ conditions }) => {
            if (conditions.reducedMotion) return;
            const fullMotion = conditions.desktop && tier !== 'low';
            const columns = conditions.wide ? 4 : conditions.tablet ? 3 : 2;
            const controllers = [];
            gallery.querySelectorAll('.about-cert-cell').forEach((card, index) => {
                const side = index % columns < columns / 2 ? -1 : 1;
                controllers.push(repeatingReveal(card, scroller, {
                    x: side * (fullMotion ? 22 : 6),
                    y: fullMotion ? 76 : 36,
                    scale: fullMotion ? 0.86 : 0.92,
                    rotation: side * (fullMotion ? 5 : 2),
                    rotationY: side * (fullMotion ? 14 : 0),
                    transformPerspective: 900,
                    delay: (index % columns) * 0.065,
                }, {
                    scrollStagger: (index % columns) * (fullMotion ? 22 : 10),
                    exitVars: {
                        x: -side * (fullMotion ? 28 : 8),
                        y: fullMotion ? -48 : -28,
                        rotation: -side * (fullMotion ? 5 : 2),
                        rotationY: -side * (fullMotion ? 10 : 0),
                        scale: 0.92,
                    },
                }));
            });
            section.querySelectorAll('.about-cert-pagination-btn').forEach((button, index) => {
                controllers.push(repeatingReveal(button, scroller, {
                    y: 22, scale: 0.8, delay: index * 0.04,
                }, { scrollStagger: index * 8 }));
            });
            return preserveFocus(section, controllers);
        }, gallery);
        return () => media.revert();
    }, { scope: galleryRef, dependencies: [category, page, pageSize, tier], revertOnUpdate: true });
}

// These viewers mount lazily, so register their persistent UI at their own mount.
// Keep the PDF canvas and contribution cells grouped to avoid hundreds of tweens.
export function useAboutDetailAnimations(viewerRef, kind, version = false) {
    const { tier } = useRenderProfile();
    useGSAP(() => {
        const viewer = viewerRef.current;
        const scroller = viewer.closest('.portfolio-overlay-panel');
        if (!scroller) return;
        const media = gsap.matchMedia();
        media.add(MEDIA, ({ conditions }) => {
            if (conditions.reducedMotion) return;
            const fullMotion = conditions.desktop && tier !== 'low';
            const selectors = kind === 'cv'
                ? '.about-cv-tab, .about-cv-toolbar-label, .about-cv-toolbar-actions, .about-cv-scroll, .about-cv-filename, .about-cv-download'
                : '.about-contributions-header, .about-contributions-body, .about-contributions-fallback, :scope > .about-contributions-status';
            const controllers = Array.from(viewer.querySelectorAll(selectors), (element, index) =>
                repeatingReveal(element, scroller, {
                    y: fullMotion ? 40 : 22,
                    scale: 0.97,
                    rotationX: fullMotion && element.matches('.about-cv-scroll, .about-contributions-body') ? -7 : 0,
                    transformPerspective: 1000,
                    delay: (index % 3) * 0.04,
                }, { scrollStagger: (index % 3) * 8, exitVars: { y: -30, scale: 0.97 } }));
            return preserveFocus(viewer, controllers);
        }, viewer);
        return () => media.revert();
    }, { scope: viewerRef, dependencies: [kind, tier, version], revertOnUpdate: true });
}
