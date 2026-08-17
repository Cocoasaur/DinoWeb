import { useEffect, useRef, useState } from 'react';

const TRIGGER_LINE = 0.4;
const BOTTOM_EPSILON = 4;
const STEP_DELAY_MS = 350;

export function useTimelineSpy(itemCount) {
    const itemRefs = useRef([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const rafRef = useRef(0);
    const stepTimerRef = useRef(0);
    const activeIndexRef = useRef(-1);

    useEffect(() => {
        const clearStepTimer = () => {
            clearTimeout(stepTimerRef.current);
            stepTimerRef.current = 0;
        };

        const apply = (index) => {
            activeIndexRef.current = index;
            setActiveIndex(index);
        };

        const compute = () => {
            clearStepTimer();
            const container = itemRefs.current[0]?.closest('.portfolio-overlay-panel')
                ?? document.scrollingElement;
            const line = window.innerHeight * TRIGGER_LINE;

            let lineIdx = -1;
            for (let i = 0; i < itemRefs.current.length; i++) {
                const el = itemRefs.current[i];
                if (!el) continue;
                if (el.getBoundingClientRect().top <= line) lineIdx = i;
            }

            const last = itemRefs.current[itemRefs.current.length - 1];
            const bottomReached = last && container
                ? last.getBoundingClientRect().bottom <= container.getBoundingClientRect().bottom + BOTTOM_EPSILON
                : false;

            if (bottomReached) {
                let target = activeIndexRef.current + 1;
                if (target < lineIdx) target = lineIdx;
                if (target > last) target = last;
                apply(target);
                if (target < last) {
                    stepTimerRef.current = setTimeout(compute, STEP_DELAY_MS);
                }
                return;
            }

            apply(lineIdx);
        };

        compute();

        const onScroll = () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(compute);
        };

        window.addEventListener('scroll', onScroll, { capture: true, passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll, { capture: true });
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(rafRef.current);
            clearStepTimer();
        };
    }, [itemCount]);

    return { itemRefs, activeIndex };
}