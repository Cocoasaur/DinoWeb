import React, { useState } from 'react';
import OverlayNavIcon from './OverlayNavIcon';

export default function UpdatePrompt() {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-5 py-3 border"
            style={{
                fontFamily: "'Space Grotesk', monospace",
                backgroundColor: 'var(--void-surface)',
                borderColor: 'var(--void-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                color: 'var(--void-text-full)',
            }}
        >
            <span className="text-[11px] tracking-[0.15em] uppercase" style={{ color: 'var(--void-text-dim)' }}>
                New version available
            </span>
            <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 border text-[11px] tracking-[0.15em] uppercase transition-all duration-300 cursor-pointer"
                style={{
                    color: 'var(--void-text-full)',
                    backgroundColor: 'var(--void-btn-bg)',
                    borderColor: 'var(--void-btn-border)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--void-surface-80)';
                    e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'var(--void-btn-bg)';
                    e.currentTarget.style.borderColor = 'var(--void-btn-border)';
                }}
            >
                Reload
            </button>
            <button
                onClick={() => setVisible(false)}
                aria-label="Dismiss update prompt"
                className="w-7 h-7 flex items-center justify-center text-[12px] transition-all duration-200 cursor-pointer"
                style={{ color: 'var(--void-text-muted)', backgroundColor: 'transparent', border: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--void-text-full)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--void-text-muted)'; }}
            >
                <OverlayNavIcon variant="close" size={12} />
            </button>
        </div>
    );
}
