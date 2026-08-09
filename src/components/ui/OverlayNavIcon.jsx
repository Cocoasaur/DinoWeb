import React from 'react';

export default function OverlayNavIcon({ variant = 'close', size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0"
            aria-hidden="true"
        >
            {variant === 'back' ? (
                <>
                    <path d="M19 12H5" />
                    <path d="M11 18l-6-6 6-6" />
                </>
            ) : (
                <>
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                </>
            )}
        </svg>
    );
}
