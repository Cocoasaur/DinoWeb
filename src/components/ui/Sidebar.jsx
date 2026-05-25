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
                        id="bp-hatch"
                        x="0" y="0" width="8" height="8"
                        patternUnits="userSpaceOnUse"
                    >
                        <line
                            x1="0" y1="8"
                            x2="8" y2="0"
                            stroke="var(--void-accent)"
                            strokeWidth="0.9"
                        />
                    </pattern>

                    <clipPath id="web-clip">
                        <text
                            x="0" y="120"
                            fontFamily="'Space Grotesk', monospace"
                            fontSize="90" fontWeight="900"
                            letterSpacing="18"
                        >
                            DINOWEB
                        </text>
                    </clipPath>
                </defs>

                {/* 
                  Wider, taller rect to fully cover all letters including "B".
                  The y-position is negative so the pattern extends above the
                  text baseline, covering the full height of tall letters.
                */}
                <rect
                    x="-20" y="-20" width="760" height="180"
                    fill="url(#bp-hatch)"
                    clipPath="url(#web-clip)"
                    className="web-hatch"
                />

                <text
                    x="0" y="120"
                    fontFamily="'Space Grotesk', monospace"
                    fontSize="90" fontWeight="900"
                    letterSpacing="18"
                    className="dino-entrance"
                >
                    <tspan fill={isDark ? '#ffffff' : '#0a0a0a'}>DINO</tspan>
                    <tspan
                        fill="none"
                        stroke="var(--void-accent)"
                        strokeWidth="2.0"
                        className="web-trace"
                    >
                        WEB
                    </tspan>
                </text>
            </svg>

            <div
                className="sidebar-home__subtitle subtitle-entrance"
                style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)' }}
            >
                VERSION: NOT_A_FOSSIL_YET<br />
                JL's Dev Den
            </div>
        </div>
    );
}
