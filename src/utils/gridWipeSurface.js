function backgroundOffset(value, available) {
    if (value.endsWith('%')) return available * parseFloat(value) / 100;
    return parseFloat(value) || 0;
}

function readGrid(element, rect, width, height, paletteName) {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const scaleX = width / rect.width, scaleY = height / rect.height;
    const layerWidth = bounds.width * scaleX, layerHeight = bounds.height * scaleY;
    const [tileWidth, tileHeight] = style.backgroundSize.split(',')[0].trim().split(/\s+/).map(parseFloat);
    const [positionX, positionY = positionX] = style.backgroundPosition.split(',')[0].trim().split(/\s+/);
    const x = (bounds.left - rect.left) * scaleX, y = (bounds.top - rect.top) * scaleY;
    const mask = style.maskImage || style.webkitMaskImage;
    const stops = mask && mask !== 'none' ? [...mask.matchAll(/([\d.]+)%/g)].map(match => Number(match[1]) / 100) : [];
    return {
        x, y, width: layerWidth, height: layerHeight, tileWidth, tileHeight,
        phaseX: x + backgroundOffset(positionX, layerWidth - tileWidth),
        phaseY: y + backgroundOffset(positionY, layerHeight - tileHeight),
        opacity: Number(style.opacity), paletteName,
        fadeStart: stops.length >= 2 ? y + layerHeight * stops[0] : null,
        fadeEnd: stops.length >= 2 ? y + layerHeight * stops[1] : null,
    };
}

function firstLine(phase, tile) {
    return phase - Math.ceil(phase / tile) * tile;
}

function paintGrid(context, grid, color, width, height) {
    if (!(grid.tileWidth > 0 && grid.tileHeight > 0) || !grid.opacity) return;
    context.save();
    context.beginPath();
    context.rect(grid.x, grid.y, grid.width, grid.height);
    context.clip();
    context.globalAlpha = grid.opacity;
    if (grid.fadeStart !== null && grid.fadeEnd > grid.fadeStart) {
        const fade = context.createLinearGradient(0, grid.fadeStart, 0, grid.fadeEnd);
        fade.addColorStop(0, color);
        fade.addColorStop(1, 'transparent');
        context.fillStyle = fade;
    } else context.fillStyle = color;
    // CSS uses two gradient backgrounds. Separate fills retain their doubled
    // alpha at intersections instead of turning the grid into a solid union.
    context.beginPath();
    for (let x = firstLine(grid.phaseX, grid.tileWidth); x < width; x += grid.tileWidth) {
        context.rect(x, 0, 1, height);
    }
    context.fill();
    context.beginPath();
    for (let y = firstLine(grid.phaseY, grid.tileHeight); y < height; y += grid.tileHeight) {
        context.rect(0, y, width, 1);
    }
    context.fill();
    context.restore();
}

// The transition has one opaque paint surface, rather than an animated CSS
// mask around separately masked/composited grid children. Its backing store is
// bounded to CSS pixels; it exists only while the pixel dissolve is running.
export function createGridWipeSurface(source, canvas, oldPalette, newPalette) {
    const context = canvas.getContext('2d', { alpha: false, desynchronized: false });
    if (!context) throw new Error('The theme grid paint surface is unavailable.');
    const grids = [
        { element: source.querySelector('.void-grid'), paletteName: '--void-grid' },
        { element: source.querySelector('.void-grid-drift'), paletteName: '--void-grid-drift' },
    ];
    if (grids.some(({ element }) => !element)) throw new Error('The theme grid layers are unavailable.');
    const paintPalette = (palette, geometry) => {
        context.fillStyle = palette['--void-bg'];
        context.fillRect(0, 0, geometry.width, geometry.height);
        for (const grid of geometry.grids) {
            paintGrid(context, grid, palette[grid.paletteName], geometry.width, geometry.height);
        }
    };
    return {
        // Keep all layout/style reads ahead of the caller's frame writes. The
        // original CSS animations continue, so their measured phase never resets.
        read(rect, width, height) {
            return { width, height, grids: grids.map(({ element, paletteName }) => readGrid(element, rect, width, height, paletteName)) };
        },
        paint({ geometry, tiles }) {
            if (!(geometry.width > 0 && geometry.height > 0)) return;
            const width = Math.ceil(geometry.width), height = Math.ceil(geometry.height);
            if (canvas.width !== width) canvas.width = width;
            if (canvas.height !== height) canvas.height = height;
            paintPalette(oldPalette, geometry);
            if (!tiles.length) return;
            context.save();
            context.beginPath();
            for (const tile of tiles) {
                if (tile.points) {
                    tile.points.forEach((p,i) => i ? context.lineTo(p.x,p.y) : context.moveTo(p.x,p.y));
                    context.closePath();
                } else context.rect(tile.x,tile.y,tile.width,tile.height);
            }
            context.clip();
            paintPalette(newPalette, geometry);
            context.restore();
        },
    };
}
