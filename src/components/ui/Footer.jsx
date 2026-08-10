import { useState, useEffect } from 'react';

export default function Footer() {
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
        <footer className="home-footer footer-entrance">
            <div className="home-footer__item">
                ©2026_DINOBIT / V.1.2.6
            </div>
            <div className="home-footer__item">
                {formatDate(time)}  {formatTime(time)}
            </div>
        </footer>
    );
}
