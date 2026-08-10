/* ══════════════════════════════════════════════════════
   LAZY PAGE CHUNKS — shared preloaders
   Production only: in dev, Vite serves modules unbundled,
   so prefetching would flood the dev server with requests.
   ══════════════════════════════════════════════════════ */

export function prefetchLazyChunks() {
    if (import.meta.env.DEV) return [];

    return [
        import('../pages/AboutPage'),
        import('../pages/SkillsPage'),
        import('../pages/ContactsPage'),
        import('../pages/ProjectsPage'),
    ];
}