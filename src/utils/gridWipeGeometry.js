// Read the live CSS grid instead of inventing another overlay tile size.
const numbers = value => value.trim().split(/\s+/).map(parseFloat);
const offset = (value, room) => value.endsWith('%') ? parseFloat(value) * room / 100 : parseFloat(value) || 0;

function inverse3(m) {
    const [a,b,c,d,e,f,g,h,i] = m;
    const A=e*i-f*h, B=f*g-d*i, C=d*h-e*g;
    const determinant=a*A+b*B+c*C;
    if (Math.abs(determinant) < 1e-10) return null;
    return [A,c*h-b*i,b*f-c*e,B,a*i-c*g,c*d-a*f,C,b*g-a*h,a*e-b*d].map(n => n / determinant);
}

export function readGridWipeGeometry() {
    const wall = document.querySelector('.home-grid-parallax .void-grid');
    let geometry = {};
    if (wall) {
        const rect = wall.getBoundingClientRect(), style = getComputedStyle(wall);
        const [cell, cellHeight = cell] = numbers(style.backgroundSize.split(',')[0]);
        const [x, y = x] = style.backgroundPosition.split(',')[0].trim().split(/\s+/);
        if (cell > 0 && cellHeight > 0) geometry = { cell, cellHeight, phase: {
            x: rect.left + offset(x, rect.width-cell), y: rect.top + offset(y, rect.height-cellHeight),
        } };
    }
    const floor = document.querySelector('.home-stage-backdrop:not([data-wipe-palette]) > .home-stage-backdrop__floor');
    if (!floor) return { ...geometry, floor: null };
    const parent = floor.parentElement, bounds = parent.getBoundingClientRect();
    const style = getComputedStyle(floor), parentStyle = getComputedStyle(parent);
    const perspective = parseFloat(parentStyle.perspective);
    if (!(perspective > 0) || Number(parentStyle.opacity) === 0) return { ...geometry, floor: null };
    const m = new DOMMatrix(style.transform), [ox, oy] = numbers(style.transformOrigin);
    const [cx, cy] = numbers(parentStyle.perspectiveOrigin);
    const sx = bounds.width/parent.clientWidth, sy = bounds.height/parent.clientHeight;
    const X = [m.m11, m.m21, m.m41+ox+floor.offsetLeft-m.m11*ox-m.m21*oy];
    const Y = [m.m12, m.m22, m.m42+oy+floor.offsetTop-m.m12*ox-m.m22*oy];
    const Z = [m.m13, m.m23, m.m43-m.m13*ox-m.m23*oy];
    const denominator = [-Z[0]/perspective, -Z[1]/perspective, 1-Z[2]/perspective];
    const matrix = [
        ...X.map((n,k) => sx*(n-cx*Z[k]/perspective)+bounds.left*denominator[k]),
        ...Y.map((n,k) => sy*(n-cy*Z[k]/perspective)+bounds.top*denominator[k]),
        ...denominator,
    ];
    const inverse = inverse3(matrix);
    const pseudo = getComputedStyle(floor, '::before'), drift = new DOMMatrix(pseudo.transform);
    const [cell, cellHeight = cell] = numbers(pseudo.backgroundSize.split(',')[0]);
    if (!inverse || !(cell > 0 && cellHeight > 0)) return { ...geometry, floor: null };
    return { ...geometry, floor: { matrix, inverse, width: floor.clientWidth, height: floor.clientHeight,
        cell, cellHeight, phase: { x: parseFloat(pseudo.left)+drift.m41, y: parseFloat(pseudo.top)+drift.m42 } } };
}
