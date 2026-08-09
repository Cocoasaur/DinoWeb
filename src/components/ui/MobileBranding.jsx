export default function MobileBranding() {
    return (
        <div className="mobile-branding mobile-branding-entrance">
            <div className="mobile-branding__lockup">
                <h1 className="mobile-branding__dino">DINO</h1>
                <div className="mobile-branding__version">
                    VERSION:<br />NOT_A_FOSSIL<br />_YET
                </div>
                <div className="mobile-branding__den">JL'S DEV DEN</div>
                <svg className="mobile-branding__web" viewBox="0 0 248 92" aria-label="WEB">
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
                        className="mobile-branding__web-text web-trace"
                        style={{ '--web-trace-length': 1300 }}
                        fill="url(#mobile-web-hatch)"
                        stroke="var(--void-text-full)"
                        strokeWidth="2"
                    >
                        WEB
                    </text>
                </svg>
            </div>
        </div>
    );
}
