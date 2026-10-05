import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Uses the project's existing Playwright dependency. No HTTP server is needed.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
let executablePath = process.env.CHROME_PATH;
if (!executablePath) {
    for (const candidate of ['/opt/google/chrome/chrome', '/usr/bin/chromium', '/usr/bin/google-chrome']) {
        try { await access(candidate); executablePath = candidate; break; } catch { /* Try next browser. */ }
    }
}
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
try {
    const page = await browser.newPage();
    const font = await readFile(new URL('../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2', import.meta.url));
    await page.evaluate(async (data) => {
        const face = new FontFace('Space Grotesk', `url(data:font/woff2;base64,${data})`, { weight: '700' });
        await face.load(); document.fonts.add(face);
    }, font.toString('base64'));
    const rasterizer = (await readFile(new URL('../src/utils/rasterizeCubeLabel.js', import.meta.url), 'utf8')).replace('export function', 'function');
    const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
    const sections = css.split("[data-theme='demain-soir-bleu'] {");
    const palettes = ['clair', 'demain'].map((name, index) => {
        const read = (token) => sections[index].match(new RegExp(`${token}:\\s*([^;]+);`))[1].trim();
        return { name, hatch: read('--cube-text-accent'), fill: read('--cube-text-hover'), stroke: read('--cube-text-default'), accent: read('--cube-text-accent') };
    });
    const out = new URL('../src/assets/cube-labels/', import.meta.url);
    await mkdir(out, { recursive: true });
    const metadata = {};
    const scales = process.env.CUBE_LABEL_SCALES ? process.env.CUBE_LABEL_SCALES.split(',').map(Number) : [.5, 1, 2];
    for (const palette of palettes) for (const scale of scales) for (const text of ['Projects', 'Contacts', 'Skills', 'About', 'Theme']) {
        const result = await page.evaluate(({ rasterizer, palette, scale, text }) => {
            const render = new Function(`${rasterizer}; return rasterizeCubeLabel;`)();
            const idle = render(text, 'idle', { hatch: palette.hatch, hatchOpacity: .75, stroke: palette.stroke, strokeWidth: 3.5, strokeOpacity: 1 }, scale);
            const hover = render(text, 'hover', { fill: palette.fill, stroke: palette.accent, strokeWidth: 1.8, strokeOpacity: .45 }, scale);
            const atlas = document.createElement('canvas');
            atlas.width = idle.canvas.width; atlas.height = idle.canvas.height * 2;
            const ctx = atlas.getContext('2d'); ctx.drawImage(idle.canvas, 0, 0); ctx.drawImage(hover.canvas, 0, idle.canvas.height);
            return { data: atlas.toDataURL('image/webp', .98).split(',')[1], widthRatio: idle.widthRatio, heightRatio: idle.heightRatio };
        }, { rasterizer, palette, scale, text });
        const name = `${text.toLowerCase()}-${palette.name}-${scale}`;
        await writeFile(new URL(`${name}.webp`, out), Buffer.from(result.data, 'base64'));
        metadata[text] = { widthRatio: result.widthRatio, heightRatio: result.heightRatio };
    }
    await writeFile(new URL('metrics.json', out), JSON.stringify(metadata, null, 2) + '\n');
    console.log(`Generated ${palettes.length * scales.length * 5} WebP label atlases in ${fileURLToPath(out)}`);
} finally { await browser.close(); }
