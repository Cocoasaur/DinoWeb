import { useRef, useEffect } from 'react';

export default function Scrubber() {
    const dotRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (dotRef.current) {
                const normY = e.clientY / window.innerHeight;
                dotRef.current.style.top = `${normY * 100}%`;
            }
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            className="fixed right-10 hidden md:block z-40 scrubber-entrance"
            style={{ height: '208px', top: 'calc(50% - 104px)' }}
        >
            <div
                className="absolute left-1/2 -translate-x-1/2 w-px h-full"
                style={{ backgroundColor: 'var(--void-border)', transition: 'background-color 0.7s ease' }}
            />
            <div
                ref={dotRef}
                className="absolute left-1/2 w-2 h-2"
                style={{
                    top: '30%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'var(--void-scrubber)',
                    transition: 'top 0.08s linear, background-color 0.7s ease',
                }}
            />
        </div>
    );
}