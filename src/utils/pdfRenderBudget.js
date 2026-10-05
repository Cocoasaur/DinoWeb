// Render text at display density, with a hard per-page canvas allocation cap.
// Small phone previews can use native density; large/zoomed pages stay bounded.
export function getPdfRasterRatio(width, aspect, pixelRatio, tier) {
    const maxPixels = tier === 'low' ? 2_000_000 : 4_000_000;
    return Math.min(pixelRatio || 1, 3, Math.sqrt(maxPixels / (width * width * aspect)));
}
