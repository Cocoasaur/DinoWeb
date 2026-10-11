import { boundedCirclePath } from './boundedCircle';
import { createGridWipeSurface } from './gridWipeSurface';

const PALETTE = ['--void-bg', '--void-grid', '--void-grid-drift', '--floor-pool', '--floor-shadow',
    '--void-text-full', '--void-text-dim', '--void-text-muted', '--void-marker', '--void-border',
    '--void-scrubber', '--home-hatch-color'];

function setStyle(element, name, value) {
    if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}

function scopePaintIds(copy) {
    // SVG paint servers resolve document-wide. A copy must use its own
    // hatching palette rather than the old layer's identically named pattern.
    const ids = new Map([...copy.querySelectorAll('[id]')].map(element => [element.id, `${element.id}-theme-wipe`]));
    for (const element of copy.querySelectorAll('svg, svg *')) {
        for (const attribute of [...element.attributes]) {
            let value = attribute.value;
            if (attribute.name === 'id') value = ids.get(value) || value;
            for (const [oldId, newId] of ids) {
                value = value.replaceAll(`url(#${oldId})`, `url(#${newId})`);
                if (value === `#${oldId}`) value = `#${newId}`;
            }
            if (value !== attribute.value) element.setAttribute(attribute.name, value);
        }
    }
}

// Preserve the live source animations. Only the temporary palette copy needs
// its CSS animation clock aligned; both copies then run on the same timeline.
function alignMotion(source, copy) {
    const original = source.getAnimations({ subtree: true }).filter(a => a instanceof CSSAnimation);
    const duplicates = copy.getAnimations({ subtree: true }).filter(a => a instanceof CSSAnimation);
    original.forEach((animation, index) => {
        const duplicate = duplicates[index];
        if (!duplicate || duplicate.animationName !== animation.animationName) return;
        duplicate.playbackRate = animation.playbackRate;
        if (animation.playState === 'paused') {
            duplicate.pause();
            duplicate.currentTime = animation.currentTime;
        } else duplicate.startTime = animation.startTime;
    });
}

// Capture before the theme mutation. Copies exist only for the live wipe;
// at rest there is still one background grid and one compositor floor.
export function prepareBackdropWipe() {
    const palette = getComputedStyle(document.documentElement);
    const layers = [...document.querySelectorAll('.home-grid-wipe, .home-stage-backdrop, .home-sidebar-wipe, .home-chrome')].map(source => {
        const saved = new Map([...PALETTE, 'clip-path', 'opacity'].map(name => [name, {
            value: source.style.getPropertyValue(name), priority: source.style.getPropertyPriority(name),
        }]));
        for (const name of PALETTE) source.style.setProperty(name, palette.getPropertyValue(name));
        const label = source.querySelector('.home-theme-label__value');
        const labelNodes = label ? [...label.childNodes] : [];
        return { source, saved, isBackground: source.classList.contains('home-grid-wipe'),
            copy: null, grid: null, motion: [], text: [], dot: null, labelNodes,
            oldLabel: labelNodes.map(node => node.textContent), newLabel: null };
    });
    return {
        captureNew() {
            for (const layer of layers) {
                const { source } = layer;
                if (layer.isBackground) {
                    // Paint both wallpaper palettes in one opaque surface.
                    // A CSS clip over separately accelerated, masked children
                    // drops rectangular tiles on the hardware renderer.
                    const copy = document.createElement('canvas');
                    copy.className = 'home-grid-wipe home-grid-wipe__surface';
                    copy.dataset.wipePalette = 'new';
                    copy.setAttribute('aria-hidden', 'true');
                    copy.inert = true;
                    layer.copy = copy;
                    source.after(copy);
                    const oldPalette = Object.fromEntries(PALETTE.map(name => [name, source.style.getPropertyValue(name)]));
                    const nextStyle = getComputedStyle(document.documentElement);
                    const newPalette = Object.fromEntries(PALETTE.map(name => [name, nextStyle.getPropertyValue(name)]));
                    layer.grid = createGridWipeSurface(source, copy, oldPalette, newPalette);
                    source.style.opacity = '0';
                    // Opacity hides paint only; the original CSS drift and
                    // camera transforms continue on their existing clocks.
                    continue;
                }
                const copy = source.cloneNode(true);
                copy.dataset.wipePalette = 'new';
                copy.setAttribute('aria-hidden', 'true');
                copy.inert = true;
                scopePaintIds(copy);
                for (const name of PALETTE) copy.style.removeProperty(name);
                copy.style.clipPath = 'inset(50%)';
                source.after(copy);
                layer.copy = copy;
                // Preserve React's original text-node identities. Replacing
                // span.textContent would detach the node React updates on the
                // next switch, leaving subsequent labels stuck on this theme.
                layer.newLabel = layer.labelNodes.map(node => node.textContent);
                layer.labelNodes.forEach((node, index) => { node.textContent = layer.oldLabel[index]; });
                alignMotion(source, copy);
                // Camera parallax may already be between two transforms when
                // captured. Follow the live floor's actual matrix, not a new
                // transition starting at its endpoint. Tile drift stays CSS.
                layer.motion = [...source.querySelectorAll('.home-grid-parallax, .home-stage-backdrop__floor, .home-stage-backdrop__pool, .home-stage-backdrop__shadow')]
                    .map(element => {
                        const target = copy.querySelector(`.${element.className}`);
                        target.style.transition = 'none';
                        return { element, target };
                    });
                const originalText = source.querySelectorAll('.home-coordinate__value, .home-footer__item');
                const duplicateText = copy.querySelectorAll('.home-coordinate__value, .home-footer__item');
                layer.text = [...originalText].map((element, index) => ({ element, target: duplicateText[index] }));
                const dot = source.querySelector('.scrubber-entrance > :last-child');
                if (dot) layer.dot = { element: dot, target: copy.querySelector('.scrubber-entrance > :last-child') };
            }
        },
        update({ origin, radius, expand }) {
            // Read every live matrix/bound before changing a clip. Interleaved
            // reads and writes would force repeated style/layout work per frame.
            const measurements = layers.filter(layer => layer.copy).map(layer => {
                const rect = layer.source.getBoundingClientRect();
                const width = layer.source.clientWidth, height = layer.source.clientHeight;
                return { ...layer, rect, width, height,
                    transforms: layer.motion.map(({ element }) => getComputedStyle(element).transform),
                    gridGeometry: layer.grid?.read(rect, width, height),
                };
            });
            for (const { source, copy, grid, gridGeometry, motion, text, dot, rect, width, height, transforms } of measurements) {
                if (grid) {
                    if (rect.width && rect.height) {
                        const scale = width / rect.width;
                        grid.paint({ geometry: gridGeometry, x: (origin.x - rect.left) * scale,
                            y: (origin.y - rect.top) * scale, radius: radius * scale, expand });
                    }
                    continue;
                }
                motion.forEach(({ element, target }, index) => {
                    setStyle(target, 'transform', transforms[index]);
                    for (const name of ['left', 'top', 'width', 'height']) setStyle(target, name, element.style.getPropertyValue(name));
                });
                for (const name of ['opacity', '--floor-zoom-scale', '--floor-camera-z']) setStyle(copy, name, source.style.getPropertyValue(name));
                const paused = source.dataset.motionPaused || 'false';
                if (copy.dataset.motionPaused !== paused) copy.dataset.motionPaused = paused;
                // Keep the desktop cursor marker and coordinates live in the
                // temporary chrome too. Theme-label text retains both versions.
                for (const { element, target } of text) {
                    if (target.textContent !== element.textContent) target.textContent = element.textContent;
                }
                if (dot) setStyle(dot.target, 'top', dot.element.style.top);
                if (!rect.width || !rect.height) continue;
                const scale = width / rect.width;
                const x = (origin.x - rect.left) * scale, y = (origin.y - rect.top) * scale, r = radius * scale;
                // All masks are bounded to their viewport wrapper, including
                // the forward circle. Overscanned tiles remain inside it.
                const left = 0, top = 0, right = width, bottom = height;
                const farthest = Math.max(...[left, right].flatMap(px => [top, bottom].map(py => Math.hypot(px - x, py - y))));
                let inside, outside;
                if (r >= farthest) { inside = 'none'; outside = 'inset(50%)'; }
                else if (r <= 0) { inside = 'inset(50%)'; outside = 'none'; }
                else {
                    const circle = boundedCirclePath(x, y, r, left, top, right, bottom);
                    inside = circle ? `path("${circle}")` : 'inset(50%)';
                    // Bound the complementary path to the same rectangle;
                    // neither mask allocates several screen widths.
                    outside = `path(evenodd, "M${left} ${top}H${right}V${bottom}H${left}Z ${circle}")`;
                }
                setStyle(source, 'clip-path', expand ? outside : inside);
                setStyle(copy, 'clip-path', expand ? inside : outside);
            }
        },
        cleanup() {
            for (const { source, saved, labelNodes, newLabel } of layers) {
                if (newLabel) labelNodes.forEach((node, index) => { node.textContent = newLabel[index]; });
                for (const [name, { value, priority }] of saved) {
                    if (value) source.style.setProperty(name, value, priority);
                    else source.style.removeProperty(name);
                }
            }
            // Resolve the committed colors while color transitions are still
            // disabled. Removing the copies/class in the same style batch can
            // otherwise start a fresh crossfade back from the old text color.
            for (const { source } of layers) getComputedStyle(source).color;
            for (const layer of layers) {
                layer.copy?.remove();
                // Release the temporary backing store even if a completed
                // animation closure retains this cleanup object.
                if (layer.grid && layer.copy) layer.copy.width = layer.copy.height = 0;
                layer.copy = layer.grid = null;
            }
        },
    };
}
