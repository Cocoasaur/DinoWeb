import { useEffect, useRef, useState } from 'react';

// Cache downloads still happen in the background. Decode/render costly content
// only near the scroll viewport, keeping it out of the navigation dissolve.
export default function DeferredSection({ children, minHeight = 240 }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            setVisible(true);
            observer.disconnect();
        }, { root: ref.current.closest('.portfolio-overlay-panel'), rootMargin: '150px' });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>{visible && children}</div>;
}
