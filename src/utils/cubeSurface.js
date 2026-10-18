import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping } from 'three';

const textures = new Map();
const smooth = value => value * value * (3 - 2 * value);
const hash = (x, y) => {
    let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
};
function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const u = smooth(x - ix), v = smooth(y - iy);
    const a = hash(ix, iy), b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

// Bake once, not per frame. Both renderers use the same small albedo map,
// without downloads or extra draw calls. A neutral map lets the blue theme
// retain its existing material while the palette wipe switches both maps.
export function getCubeSurfaceTexture(theme) {
    const graphite = theme === 'clair-obscur';
    const key = graphite ? 'graphite' : 'plain';
    if (textures.has(key)) return textures.get(key);
    const size = graphite ? 512 : 1;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        let value = 255;
        if (graphite) {
            // A restrained graphite finish: no bright veins or albedo boost.
            value = Math.round(247 + noise(x / 9, y / 9) * 5 + noise(x / 2, y / 2) * 3);
        }
        const offset = (y * size + x) * 4;
        data[offset] = data[offset + 1] = data[offset + 2] = Math.min(255, value);
        data[offset + 3] = 255;
    }
    const texture = new DataTexture(data, size, size);
    texture.name = graphite ? 'clair-obscur-graphite' : 'neutral-cube-surface';
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.magFilter = LinearFilter;
    texture.minFilter = graphite ? LinearMipmapLinearFilter : LinearFilter;
    texture.generateMipmaps = graphite;
    texture.needsUpdate = true;
    textures.set(key, texture);
    return texture;
}
