import { Vector3 } from 'three';

const corner = new Vector3();
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

// Keep the stationary homepage behind the solid cube during the dissolve,
// even as the canvas becomes transparent. The grids are separate layers.
export function getCubeOcclusion(cube, camera, width, height) {
    cube.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    const points = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        corner.set(x, y, z).applyMatrix4(cube.matrixWorld).project(camera);
        points.push({ x: width / 2 + corner.x * width / 2 * 1.04,
            y: height / 2 - corner.y * height / 2 * 1.04 });
    }
    points.sort((a, b) => a.x - b.x || a.y - b.y);
    const hull = [];
    for (const point of points) {
        while (hull.length >= 2 && cross(hull.at(-2), hull.at(-1), point) <= 0) hull.pop();
        hull.push(point);
    }
    const lower = hull.length;
    for (let i = points.length - 2; i >= 0; i--) {
        const point = points[i];
        while (hull.length > lower && cross(hull.at(-2), hull.at(-1), point) <= 0) hull.pop();
        hull.push(point);
    }
    const hole = hull.map(point => `${point.x.toFixed(2)}px ${point.y.toFixed(2)}px`).join(', ');
    // An even-odd polygon subtracts the cube silhouette from the viewport.
    return `polygon(evenodd, 0px 0px, ${width}px 0px, ${width}px ${height}px, 0px ${height}px, 0px 0px, ${hole}, 0px 0px)`;
}
