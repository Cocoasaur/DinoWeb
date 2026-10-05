import { useEffect, useState } from 'react';
import dinoIcon from '../../assets/brand/dino-loader.webp';
// Boot styles load in main.jsx so they also apply to the initial HTML shell.

// The loader follows the first rendered WebGL frame, with no asset-count gate
// or minimum display time. Remaining portfolio assets cache in the background.
export default function BootScreen({ ready }) {
    const [visible, setVisible] = useState(true);
    // Preserve the first-painted HTML image instead of replacing it with an
    // identical React image (which would create a later LCP candidate).
    const [shell] = useState(() => document.getElementById('portfolio-boot-shell'));

    useEffect(() => {
        if (!ready) return;
        const finish = () => {
            shell?.remove();
            setVisible(false);
        };
        const onFade = (event) => {
            if (event.target === shell && event.propertyName === 'opacity') finish();
        };
        shell?.classList.add('boot-screen--fading');
        shell?.addEventListener('transitionend', onFade);
        // Also complete when reduced motion disables the opacity transition.
        const timer = setTimeout(finish, 240);
        return () => {
            clearTimeout(timer);
            shell?.removeEventListener('transitionend', onFade);
        };
    }, [ready, shell]);

    if (shell || !visible) return null;

    return (
        <div
            className={`boot-screen${ready ? ' boot-screen--fading' : ''}`}
            role="status"
            aria-live="polite"
            aria-label="Loading the interactive portfolio"
            onTransitionEnd={(event) => {
                if (ready && event.target === event.currentTarget && event.propertyName === 'opacity') setVisible(false);
            }}
        >
            <div className="boot-screen__background" aria-hidden="true">
                <div className="boot-screen__grid" />
                <div className="home-stage-backdrop__floor" />
            </div>
            <div className="boot-screen__stage">
                <div className="boot-screen__brackets" aria-hidden="true">
                    <span className="boot-screen__bracket boot-screen__bracket--tl" />
                    <span className="boot-screen__bracket boot-screen__bracket--tr" />
                    <span className="boot-screen__bracket boot-screen__bracket--bl" />
                    <span className="boot-screen__bracket boot-screen__bracket--br" />
                </div>
                <img src={dinoIcon} alt="" width="80" height="80" draggable={false} className="boot-screen__icon" />
                <div className="boot-screen__progress" aria-hidden="true"><span /><span /><span /></div>
                <p className="boot-screen__label">ARCHIVE_SYSTEM</p>
                <p className="boot-screen__sub-label">INITIALIZING PORTFOLIO</p>
            </div>
        </div>
    );
}
