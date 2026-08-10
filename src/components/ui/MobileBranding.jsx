const LETTERS = ['D', 'I', 'N', 'O', 'W', 'E', 'B'];
const DINO_TRACE_LENGTH = 700;
const WEB_TRACE_LENGTH = 700;

export default function MobileBranding() {
    return (
        <div className="mobile-branding mobile-branding-entrance">
            <div className="mobile-branding__lockup" role="img" aria-label="DINOWEB">
                <h1 className="sr-only">DINOWEB</h1>

                {/* DINO — layered outline + fill, mirrors the desktop lockup */}
                <svg className="mobile-branding__dino" viewBox="0 0 240 104" overflow="visible" aria-hidden="true">
                    <text
                        x="0" y="80"
                        fontFamily="'Space Grotesk', monospace"
                        fontSize="92" fontWeight="700"
                        className="dino-fill"
                        fill="var(--void-text-full)"
                    >
                        {LETTERS.slice(0, 4).map((letter) => (
                            <tspan key={`${letter}-fill`}>{letter}</tspan>
                        ))}
                    </text>
                    <text
                        x="0" y="80"
                        fontFamily="'Space Grotesk', monospace"
                        fontSize="92" fontWeight="700"
                        aria-hidden="true"
                    >
                        {LETTERS.slice(0, 4).map((letter, i) => (
                            <tspan
                                key={`${letter}-trace`}
                                className="web-trace"
                                fill="none"
                                stroke="var(--void-text-full)"
                                strokeWidth="2"
                                style={{ '--letter-index': i, '--web-trace-length': DINO_TRACE_LENGTH }}
                            >
                                {letter}
                            </tspan>
                        ))}
                    </text>
                </svg>

                <div className="mobile-branding__version">
                    VERSION:<br />NOT_A_FOSSIL<br />_YET
                </div>
                <div className="mobile-branding__den">JL'S DEV DEN</div>

                {/* WEB — layered outline + hatch fill, continues the DINO trace */}
                <svg className="mobile-branding__web" viewBox="0 0 248 92" aria-label="WEB" aria-hidden="true">
                    <defs>
                        <pattern
                            id="mobile-web-hatch"
                            x="0"
                            y="0"
                            width="16"
                            height="16"
                            patternUnits="userSpaceOnUse"
                        >
                            <line
                                x1="-4"
                                y1="20"
                                x2="20"
                                y2="-4"
                                stroke="var(--home-hatch-color)"
                                strokeWidth="1.2"
                                strokeLinecap="square"
                            />
                        </pattern>
                    </defs>
                    <text
                        x="0"
                        y="76"
                        className="mobile-branding__web-text dino-fill"
                    >
                        {LETTERS.slice(4).map((letter) => (
                            <tspan key={`${letter}-fill`} fill="url(#mobile-web-hatch)">
                                {letter}
                            </tspan>
                        ))}
                    </text>
                    <text
                        x="0"
                        y="76"
                        className="mobile-branding__web-text"
                        aria-hidden="true"
                    >
                        {LETTERS.slice(4).map((letter, i) => (
                            <tspan
                                key={`${letter}-trace`}
                                className="web-trace"
                                fill="none"
                                stroke="var(--void-text-full)"
                                strokeWidth="2"
                                style={{ '--letter-index': i + 4, '--web-trace-length': WEB_TRACE_LENGTH }}
                            >
                                {letter}
                            </tspan>
                        ))}
                    </text>
                </svg>
            </div>
        </div>
    );
}