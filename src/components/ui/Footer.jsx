import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Footer() {
    const { theme } = useTheme();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).replace(/\//g, '.');
    };

    return (
        <footer className="fixed bottom-0 left-0 w-full z-40 bg-transparent hidden md:flex pointer-events-none footer-entrance">
            {/* Left — Build signature */}
            <div
                className="fixed bottom-12 left-12 text-[10px] tracking-[0.2em] uppercase"
                style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
            >
                ©2026_DINOBIT  /  V.0.1.8
            </div>

            {/* Right — System telemetry */}
            <div
                className="fixed bottom-12 right-12 flex items-center gap-6 text-[10px] tracking-[0.2em] uppercase"
                style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
            >
                <span>
                    {formatDate(time)}  {formatTime(time)}
                </span>
            </div>
        </footer>
    );
}