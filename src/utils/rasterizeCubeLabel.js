function fillChars(ctx, text, startX, spacing) {
    let x = startX;
    for (let i = 0; i < text.length; i++) {
        const w = ctx.measureText(text[i]).width;
        ctx.fillText(text[i], x + w / 2, 0);
        x += w + spacing;
    }
}

function strokeChars(ctx, text, startX, spacing) {
    let x = startX;
    for (let i = 0; i < text.length; i++) {
        const w = ctx.measureText(text[i]).width;
        ctx.strokeText(text[i], x + w / 2, 0);
        x += w + spacing;
    }
}

export function rasterizeCubeLabel(text, mode, colors, rasterScale) {
    const BASE_FONT_SIZE = 120;
    const letterSpacing = 0.15;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    const spacing = letterSpacing * BASE_FONT_SIZE;

    ctx.font = `bold ${BASE_FONT_SIZE}px "Space Grotesk", "Inter", sans-serif`;
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) totalWidth += ctx.measureText(text[i]).width;
    totalWidth += (text.length - 1) * spacing;

    const pad = 40;
    canvas.width = (totalWidth + pad * 2) * rasterScale;
    canvas.height = (BASE_FONT_SIZE * 1.4 + pad * 2) * rasterScale;

    ctx.save();
    ctx.scale(rasterScale, rasterScale);
    ctx.translate(pad + totalWidth / 2, pad + BASE_FONT_SIZE * 0.9);
    ctx.font = `bold ${BASE_FONT_SIZE}px "Space Grotesk", "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    const startX = -totalWidth / 2;

    if (mode === 'idle') {
        const patSize = 15;
        const patCanvas = document.createElement('canvas');
        patCanvas.width = patSize;
        patCanvas.height = patSize;
        const pctx = patCanvas.getContext('2d');
        pctx.clearRect(0, 0, patSize, patSize);
        pctx.strokeStyle = colors.hatch;
        pctx.lineWidth = 1.4;
        pctx.lineCap = 'square';
        pctx.beginPath();
        pctx.moveTo(0, patSize);
        pctx.lineTo(patSize, 0);
        pctx.stroke();

        const hatchPattern = ctx.createPattern(patCanvas, 'repeat');
        ctx.save();
        ctx.fillStyle = hatchPattern;
        ctx.globalAlpha = colors.hatchOpacity;
        fillChars(ctx, text, startX, spacing);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = colors.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.globalAlpha = colors.strokeOpacity;
        strokeChars(ctx, text, startX, spacing);
        ctx.restore();
    } else {
        ctx.save();
        ctx.fillStyle = colors.fill;
        ctx.globalAlpha = 1;
        fillChars(ctx, text, startX, spacing);
        ctx.restore();

        if (colors.stroke && colors.strokeOpacity > 0) {
            ctx.save();
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = colors.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.globalAlpha = colors.strokeOpacity;
            strokeChars(ctx, text, startX, spacing);
            ctx.restore();
        }
    }

    ctx.restore();

    return { canvas, widthRatio: totalWidth / BASE_FONT_SIZE, heightRatio: 1.4 };
}
