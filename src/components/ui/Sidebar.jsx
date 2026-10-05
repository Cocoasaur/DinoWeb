import BrandWordmark from './BrandWordmark';

export default function Sidebar() {
    return (
        <div
            className="sidebar-home -translate-y-1/2 sidebar-entrance"
            style={{ zIndex: 5 }}
        >
            <BrandWordmark variant="desktop" className="sidebar-home__logo" role="img" aria-label="DINOWEB" />

            <div
                className="sidebar-home__subtitle subtitle-entrance"
                style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-dim)' }}
            >
                VERSION: JUST_MESSING_AROUND<br /> {/*NOT_A_FOSSIL_YET*/}
                JL's Dev Den
            </div>

            <div className="sidebar-home__rotate-hint">
                <span className="sidebar-home__rotate-label">ROTATE THE CUBE</span>
                <span className="sidebar-home__rotate-line" />
                <span className="sidebar-home__rotate-dot" />
            </div>
        </div>
    );
}
