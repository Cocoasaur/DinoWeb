// Cursor availability follows input capabilities, independently of the layout
// breakpoint and WebGL performance tier. Hybrid devices can have both pointers.
export const CUSTOM_CURSOR_MEDIA = '(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)';

export const customCursorSupport = {
    subscribe(notify) {
        const media = window.matchMedia(CUSTOM_CURSOR_MEDIA);
        media.addEventListener('change', notify);
        return () => media.removeEventListener('change', notify);
    },
    getSnapshot: () => window.matchMedia(CUSTOM_CURSOR_MEDIA).matches,
    getServerSnapshot: () => false,
};
