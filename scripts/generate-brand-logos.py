"""Generate fixed SVG wordmarks from the existing Space Grotesk font.
Requires fonttools[woff]. No server is used.
"""
from pathlib import Path
import re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

root = Path(__file__).resolve().parent.parent
font = TTFont(root / 'node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2')
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm
css = (root / 'src/index.css').read_text().split("[data-theme='demain-soir-bleu'] {")

for theme, section in zip(('clair', 'demain'), css):
    read = lambda key: re.search(re.escape(key) + r':\s*([^;]+);', section)[1].strip()
    text_color, hatch_color = read('--void-text-full'), read('--home-hatch-color')
    for name, text, size, spacing, baseline, w, h in [
        ('desktop', 'DINOWEB', 120, 18, 120, 720, 160),
        ('mobile-dino', 'DINO', 92, 0, 80, 240, 104),
        ('mobile-web', 'WEB', 92, 0, 76, 248, 92),
    ]:
        pattern_size, pattern_stroke = (8, .85) if name == 'desktop' else (16, 1.2)
        lines = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
                 f'<defs><pattern id="hatch" width="{pattern_size}" height="{pattern_size}" patternUnits="userSpaceOnUse"><path d="M-4 {pattern_size+4}L{pattern_size+4} -4" stroke="{hatch_color}" stroke-width="{pattern_stroke}" stroke-linecap="square"/></pattern></defs>']
        x = 0
        for index, letter in enumerate(text):
            glyph = cmap[ord(letter)]
            pen = SVGPathPen(glyphs, ntos=lambda value: f'{value:.3f}'.rstrip('0').rstrip('.'))
            glyphs[glyph].draw(TransformPen(pen, (size/units, 0, 0, -size/units, x, baseline)))
            fill = 'url(#hatch)' if name == 'mobile-web' or name == 'desktop' and index >= 4 else text_color
            lines.append(f'<path d="{pen.getCommands()}" fill="{fill}" stroke="{text_color}" stroke-width="2" paint-order="fill stroke"/>')
            x += font['hmtx'][glyph][0] * size/units + spacing
        lines.append('</svg>')
        target = root / f'src/assets/brand/dinoweb-{name}-{theme}.svg'
        target.write_text(''.join(lines) + '\n')
        print(target.name)
