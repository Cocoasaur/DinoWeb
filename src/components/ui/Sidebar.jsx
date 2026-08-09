import { useTheme } from '../../context/ThemeContext';

export default function Sidebar() {
    const { isDark } = useTheme();

    return (
        <div
            className="sidebar-home -translate-y-1/2 sidebar-entrance"
            style={{ zIndex: 5 }}
        >
            <svg className="sidebar-home__logo" width="720" height="160" viewBox="0 0 720 160" style={{ overflow: 'visible' }}>
                <defs>
                    {/* Blueprint diagonal hatch — tighter, consistent 45° lines */}
                    <pattern
                        id="sidebar-web-hatch"
                        x="0" y="0" width="8" height="8"
                        patternUnits="userSpaceOnUse"
                    >
                        <line
                            x1="-4" y1="12"
                            x2="12" y2="-4"
                            stroke="var(--home-hatch-color)"
                            strokeWidth="0.85"
                            strokeLinecap="square"
                        />
                    </pattern>
                </defs>

                <text
                    x="0" y="120"
                    fontFamily="'Space Grotesk', monospace"
                    fontSize="120" fontWeight="900"
                    letterSpacing="18"
                    className="dino-entrance"
                >
                    <tspan fill={isDark ? '#ffffff' : '#0a0a0a'}>DINO</tspan>
                    <tspan
                        fill="url(#sidebar-web-hatch)"
                        stroke="var(--void-text-full)"
                        strokeWidth="2.0"
                        className="web-trace"
                    >
                        WEB
                    </tspan>
                </text>
            </svg>

            <div
                className="sidebar-home__subtitle subtitle-entrance"
                style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-dim)' }}
            >
                VERSION: NOT_A_FOSSIL_YET<br />
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
