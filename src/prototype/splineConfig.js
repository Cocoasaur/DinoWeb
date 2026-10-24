// Export URLs are opaque: accept an editor export or a self-hosted file,
// never infer one from a Spline share link or file ID.
export function resolveSplineScene(value, base, origin) {
    const input = value?.trim();
    if (!input) return { status: 'missing' };
    try {
        const localBase = new URL(base, origin);
        const url = new URL(input, localBase);
        const local = url.origin === localBase.origin && url.pathname.startsWith(localBase.pathname);
        if (url.username || url.password || !url.pathname.endsWith('.splinecode') ||
            (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
            (!local && !input.startsWith('https://'))) return { status: 'invalid' };
        return { status: 'configured', url: url.href };
    } catch {
        return { status: 'invalid' };
    }
}

export const SPLINE_DESTINATIONS = [
    { page: 'about', label: 'About', object: 'DinoWeb_Panel_About', detail: 'The person behind the work.' },
    { page: 'skills', label: 'Skills', object: 'DinoWeb_Panel_Skills', detail: 'The tools, layer by layer.' },
    { page: 'projects', label: 'Projects', object: 'DinoWeb_Panel_Projects', detail: 'Ideas put into practice.' },
    { page: 'contacts', label: 'Contact', object: 'DinoWeb_Panel_Contact', detail: 'Keep the conversation going.' },
];
