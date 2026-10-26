import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import dinoIcon from '../../assets/brand/dino-loader.webp';
import { subscribePortfolioPreload, getPortfolioPreloadSnapshot, startPortfolioPreload, continueWithAvailableAssets } from '../../utils/portfolioPreload';

// Preserve the first-painted HTML shell while downloads, decoding and the
// renderer run. Completion follows actual work; there is no minimum duration.
export default function BootScreen({ ready, preload = false }) {
    const assets = useSyncExternalStore(subscribePortfolioPreload, getPortfolioPreloadSnapshot);
    const [visible, setVisible] = useState(true);
    const [shell] = useState(() => document.getElementById('portfolio-boot-shell'));
    const fallback = useRef(null);
    const finished = ready && (!preload || assets.ready);

    useEffect(() => {
        const screen = shell || fallback.current;
        if (!screen) return;
        const percent = assets.total ? Math.floor(assets.completed / assets.total * 100) : 0;
        screen.querySelector('[data-boot-meter]')?.setAttribute('aria-valuenow', String(percent));
        const fill = screen.querySelector('[data-boot-fill]');
        if (fill) fill.style.transform = `scaleX(${percent / 100})`;
        const count = screen.querySelector('[data-boot-count]');
        if (count) count.textContent = preload && assets.total ? `${assets.completed} / ${assets.total} assets · ${percent}%` : '';
        const status = screen.querySelector('[data-boot-status]');
        if (status) status.textContent = !preload ? 'INITIALIZING PORTFOLIO' : assets.phase === 'error'
            ? `${assets.failed} assets couldn’t load. Check your connection and retry.`
            : assets.ready ? 'STARTING PORTFOLIO' : 'LOADING PORTFOLIO ASSETS';
        const actions = screen.querySelector('[data-boot-actions]');
        if (actions) actions.hidden = !preload || assets.phase !== 'error';
    }, [shell, preload, assets]);

    useEffect(() => {
        const screen = shell || fallback.current;
        const retry = () => { void startPortfolioPreload(); };
        const retryButton = screen?.querySelector('[data-boot-retry]');
        const continueButton = screen?.querySelector('[data-boot-continue]');
        retryButton?.addEventListener('click', retry);
        continueButton?.addEventListener('click', continueWithAvailableAssets);
        return () => {
            retryButton?.removeEventListener('click', retry);
            continueButton?.removeEventListener('click', continueWithAvailableAssets);
        };
    }, [shell]);

    useEffect(() => {
        if (!finished) return;
        const screen = shell || fallback.current;
        const finish = () => { shell?.remove(); setVisible(false); };
        const onFade = event => { if (event.target === screen && event.propertyName === 'opacity') finish(); };
        screen?.classList.add('boot-screen--fading');
        screen?.addEventListener('transitionend', onFade);
        const timer = setTimeout(finish, 240);
        return () => { clearTimeout(timer); screen?.removeEventListener('transitionend', onFade); };
    }, [finished, shell]);

    if (shell || !visible) return null;
    return <div ref={fallback} className="boot-screen" role="status" aria-live="polite" aria-label="Loading the interactive portfolio">
        <div className="boot-screen__background" aria-hidden="true"><div className="boot-screen__grid" /><div className="home-stage-backdrop__floor" /></div>
        <div className="boot-screen__stage">
            <img src={dinoIcon} alt="" width="80" height="80" draggable="false" className="boot-screen__icon" />
            <div className="boot-screen__progress" data-boot-meter role="progressbar" aria-label="Portfolio assets" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-boot-fill /></div>
            <p className="boot-screen__label">ARCHIVE_SYSTEM</p><p className="boot-screen__sub-label" data-boot-status>PREPARING ASSETS</p>
            <p className="boot-screen__count" data-boot-count aria-hidden="true" />
            <div className="boot-screen__actions" data-boot-actions hidden><button type="button" data-boot-retry>Retry loading</button><button type="button" data-boot-continue>Continue with available assets</button></div>
        </div>
    </div>;
}
