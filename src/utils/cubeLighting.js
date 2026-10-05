// Keep soft reflections without the cost of a physical material/environment map.
export const CUBE_SHININESS = 36;
export const CUBE_SPECULAR = '#484848';

const direction = (x, y, z) => {
    const length = Math.hypot(x, y, z);
    return { x: x / length, y: y / length, z: z / length };
};
const key = direction(3, 4, 5);
const fill = direction(-3, -2, -4);
const rim = direction(0, -4, 2);
const half = direction(key.x, key.y, key.z + 1);
const dot = (a, b) => Math.max(0, a.x * b.x + a.y * b.y + a.z * b.z);
const specularChannel = Number.parseInt(CUBE_SPECULAR.slice(1, 3), 16) / 255;
const specularLinear = ((specularChannel + .055) / 1.055) ** 2.4;
const fresnel = specularLinear + (1 - specularLinear) * 2 ** ((-5.55473 * half.z - 6.98316) * half.z);

// Low/mobile profiles bake the same key, fill, rim and a small highlight into
// the existing vertices. Recompute only when orientation/theme changes.
export function shadeCubeVertex(normal, base, colors, index) {
    // Match Phong's normalized Lambert BRDF. Omitting 1/π makes the
    // reduced renderer over three times brighter in linear color space.
    const diffuse = (0.2 + 1.2 * dot(normal, key) + 0.5 * 0.760525 * dot(normal, fill) + 0.4 * dot(normal, rim)) / Math.PI;
    const reflection = 1.2 * dot(normal, key) * fresnel * .25
        * (CUBE_SHININESS * .5 + 1) / Math.PI * Math.pow(dot(normal, half), CUBE_SHININESS);
    colors.setXYZ(index, base.r * diffuse + reflection, base.g * diffuse + reflection, base.b * diffuse + reflection);
}
