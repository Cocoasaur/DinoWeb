import { useTheme } from '../../context/ThemeContext';
import desktopClair from '../../assets/brand/dinoweb-desktop-clair.svg?raw';
import desktopDemain from '../../assets/brand/dinoweb-desktop-demain.svg?raw';
import dinoClair from '../../assets/brand/dinoweb-mobile-dino-clair.svg?raw';
import dinoDemain from '../../assets/brand/dinoweb-mobile-dino-demain.svg?raw';
import webClair from '../../assets/brand/dinoweb-mobile-web-clair.svg?raw';
import webDemain from '../../assets/brand/dinoweb-mobile-web-demain.svg?raw';

function prepare(svg, variant) {
    // These are local, generated SVG assets. Scope their pattern IDs because
    // the desktop and mobile lockups share the document even when hidden.
    return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
        .replaceAll('id="hatch"', `id="brand-${variant}-hatch"`)
        .replaceAll('url(#hatch)', `url(#brand-${variant}-hatch)`);
}

const marks = {
    desktop: { width: 720, height: 160, light: desktopClair, dark: desktopDemain },
    dino: { width: 240, height: 104, light: dinoClair, dark: dinoDemain },
    web: { width: 248, height: 92, light: webClair, dark: webDemain },
};
for (const [variant, mark] of Object.entries(marks)) {
    mark.light = prepare(mark.light, variant);
    mark.dark = prepare(mark.dark, variant);
}

export default function BrandWordmark({ variant, className, ...accessibility }) {
    const { isDark } = useTheme();
    const mark = marks[variant];
    return (
        <svg className={className} width={mark.width} height={mark.height}
            viewBox={`0 0 ${mark.width} ${mark.height}`} focusable="false" {...accessibility}
            dangerouslySetInnerHTML={{ __html: isDark ? mark.dark : mark.light }} />
    );
}
