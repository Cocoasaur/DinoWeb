import React, { useState, useCallback } from 'react';

// ── Copy icon (inline SVG) ────────────────────────────────────────────────
function CopyIcon({ copied }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                color: copied ? 'var(--void-accent, #4ade80)' : 'var(--void-text-muted)',
                transition: 'color 0.2s ease',
            }}
        >
            {copied ? (
                <polyline points="20 6 9 17 4 12" />
            ) : (
                <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </>
            )}
        </svg>
    );
}

// ── Single channel row with copy + click ──────────────────────────────────
function ChannelRow({ label, value, href }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    }, [value]);

    const content = (
        <div className="flex items-center justify-between">
            <div className="min-w-0">
                <p
                    className="uppercase mb-1"
                    style={{
                        fontFamily: "'Space Grotesk', monospace",
                        color: 'var(--void-text-muted)',
                        fontSize: '9px',
                        letterSpacing: '0.25em',
                    }}
                >
                    {label}
                </p>
                <p
                    className="text-sm transition-colors duration-300"
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        color: 'var(--void-text)',
                        wordBreak: 'break-all',
                    }}
                >
                    {value}
                </p>
            </div>

            <button
                onClick={handleCopy}
                className="ml-3 flex-shrink-0 w-8 h-8 flex items-center justify-center border rounded transition-all duration-200"
                style={{
                    borderColor: copied ? 'var(--void-accent, #4ade80)' : 'var(--void-border)',
                    backgroundColor: 'var(--void-surface-80)',
                }}
                onMouseEnter={(e) => {
                    if (!copied) e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                }}
                onMouseLeave={(e) => {
                    if (!copied) e.currentTarget.style.borderColor = 'var(--void-border)';
                }}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
                <CopyIcon copied={copied} />
            </button>
        </div>
    );

    return (
        <div className="border-b pb-4" style={{ borderColor: 'var(--void-border-dim)' }}>
            {href ? (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-colors duration-300"
                    onMouseEnter={(e) => {
                        const val = e.currentTarget.querySelector('.channel-value');
                        if (val) val.style.color = 'var(--void-text-full)';
                    }}
                    onMouseLeave={(e) => {
                        const val = e.currentTarget.querySelector('.channel-value');
                        if (val) val.style.color = 'var(--void-text)';
                    }}
                >
                    {content}
                </a>
            ) : (
                content
            )}
        </div>
    );
}

export default function ContactsPage() {
    const channels = [
        {
            label: 'EMAIL',
            value: 'cocoasaurjl@gmail.com',
            href: 'mailto:cocoasaurjl@gmail.com',
        },
        {
            label: 'GITHUB',
            value: 'Cocoasaur',
            href: 'https://github.com/Cocoasaur',
        },
        {
            label: 'LINKEDIN',
            value: 'John Jessienel Arquesola',
            href: 'https://linkedin.com/in/dinoweb',
        },
        {
            label: 'STACK_OVERFLOW',
            value: 'JLKOKO',
            href: 'https://stackoverflow.com/users/24706411/jlkoko',
        },
    ];

    return (
        <div>
            <div className="mb-10 pb-6 border-b" style={{ borderColor: 'var(--void-border)' }}>
                <p className="uppercase mb-2" style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)', fontSize: '10px', letterSpacing: '0.3em' }}>
                    FACE_04 / SIGNAL_RELAY
                </p>
                <h2 className="text-4xl font-bold tracking-[0.15em] uppercase"
                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-full)' }}>
                    Contacts
                </h2>
            </div>

            <div className="grid grid-cols-1 min-[1024px]:grid-cols-2 gap-12">
                {/* ── Left: Channels ── */}
                <div>
                    <h3 className="uppercase mb-6" style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)', fontSize: '10px', letterSpacing: '0.3em' }}>
                        CHANNELS
                    </h3>
                    <div className="space-y-4">
                        {channels.map((ch) => (
                            <ChannelRow
                                key={ch.label}
                                label={ch.label}
                                value={ch.value}
                                href={ch.href}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Right: Availability & Protocol ── */}
                <div>
                    <h3 className="uppercase mb-6" style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-dim)', fontSize: '10px', letterSpacing: '0.3em' }}>
                        AVAILABILITY & PROTOCOL
                    </h3>
                    <div className="space-y-0 border" style={{ borderColor: 'var(--void-border)' }}>
                        {[
                            ['STATUS', 'Busy academics and projects, but open to offers and collaborations!'],
                            ['RESPONSE_TIME', 'Within 24–48 hours'],
                            ['TIMEZONE', 'UTC+8  (Philippines)'],
                            ['LANGUAGES', 'English, Filipino'],
                            ['PREFERRED_CHANNEL', 'Email for inquiries'],
                        ].map(([label, value], i, arr) => (
                            <div
                                key={label}
                                className="flex flex-col px-4 py-3 gap-1"
                                style={{
                                    borderBottom: i < arr.length - 1 ? '1px solid var(--void-border-dim)' : 'none',
                                }}
                            >
                                <span
                                    className="uppercase text-[10px] tracking-[0.2em]"
                                    style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
                                >
                                    {label}
                                </span>
                                <span
                                    className="text-[13px] text-right"
                                    style={{ fontFamily: "'Inter', sans-serif", color: 'var(--void-text-full)' }}
                                >
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}