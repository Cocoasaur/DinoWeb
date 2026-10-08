import { useRenderProfile } from '../../context/RenderProfileContext';
import '../../styles/brand-wordmark.css';
import desktopClair from '../../assets/brand/dinoweb-desktop-clair.svg?raw';
import dinoClair from '../../assets/brand/dinoweb-mobile-dino-clair.svg?raw';
import webClair from '../../assets/brand/dinoweb-mobile-web-clair.svg?raw';

function prepare(svg, variant) {
    // These are local, generated SVG assets. Scope their pattern IDs because
    // the desktop and mobile lockups share the document even when hidden.
    const scoped = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
        .replaceAll('id="hatch"', `id="brand-${variant}-hatch"`)
        .replaceAll('url(#hatch)', `url(#brand-${variant}-hatch)`)
        .replaceAll('#0a0a0a', 'var(--void-text-full)')
        .replaceAll('rgba(10, 10, 10, 0.36)', 'var(--home-hatch-color)');
    const traces = [];
    const fill = scoped.replace(/<path\b[^>]*fill="url\(#[^"]+-hatch\)"[^>]*\/>/g, path => {
        // Normalize each existing glyph's dash length without measuring paths
        // or animating text layout. The filled DINO and WEB hatching stay visible.
        traces.push(path.replace(/fill="[^"]+"/, 'fill="none"')
            .replace('<path ', `<path class="web-trace" pathLength="1" style="--letter-index:${traces.length}" `));
        return path.replace(/stroke="[^"]+"/, 'stroke="none"');
    });
    return `${fill}<g class="brand-trace-layer" aria-hidden="true">${traces.join('')}</g>`;
}

const marks = {
    desktop: { width: 720, height: 160, svg: desktopClair },
    dino: { width: 240, height: 104, svg: dinoClair },
    web: { width: 248, height: 92, svg: webClair },
};
for (const [variant, mark] of Object.entries(marks)) {
    // Keep both this prop object and its SVG nodes stable across React updates.
    // Replacing innerHTML on a cube click would restart the outline animation.
    // Theme colors follow CSS variables, so changing themes needs no new paths.
    mark.markup = { __html: prepare(mark.svg, variant) };
}

function finishIntro(event) {
    if (event.animationName !== 'brand-outline-draw' ||
        event.target.style.getPropertyValue('--letter-index') !== '2') return;
    // Both responsive lockups share one intro. A hidden lockup becoming visible
    // after a viewport switch must not start a second drawing sequence.
    const viewport = event.currentTarget.closest('.portfolio-viewport');
    if (viewport) viewport.dataset.brandIntroComplete = 'true';
}

export default function BrandWordmark({ variant, className, ...accessibility }) {
    const { tier } = useRenderProfile();
    const mark = marks[variant];
    return (
        <svg className={`brand-wordmark ${className || ''}`} data-brand-tier={tier} onAnimationEnd={finishIntro} width={mark.width} height={mark.height}
            viewBox={`0 0 ${mark.width} ${mark.height}`} focusable="false" {...accessibility}
            dangerouslySetInnerHTML={mark.markup} />
    );
}
