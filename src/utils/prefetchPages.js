export const PAGE_LOADERS = {
    about: () => import('../pages/AboutPage'),
    skills: () => import('../pages/SkillsPage'),
    contacts: () => import('../pages/ContactsPage'),
    projects: () => import('../pages/ProjectsPage'),
};

export function prefetchPage(face) {
    return PAGE_LOADERS[face]?.() ?? Promise.resolve();
}

export function prefetchLazyChunks() {
    if (import.meta.env.DEV) return [];
    return Object.values(PAGE_LOADERS).map((load) => load());
}
