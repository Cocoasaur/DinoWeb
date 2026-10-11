// Intersect the circle with the paint rectangle before making its inverse.
// An even-odd rectangle + *unbounded* circle is an XOR: it also fills the
// circle outside the rectangle and can allocate enormous compositor masks.
export function boundedCirclePath(x, y, r, left, top, right, bottom) {
    const inside = (px, py) => px >= left - 1e-7 && px <= right + 1e-7 && py >= top - 1e-7 && py <= bottom + 1e-7;
    if (inside(x - r, y - r) && inside(x + r, y + r)) {
        return `M${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}Z`;
    }
    const points = [];
    const add = (px, py, circle) => {
        if (inside(px, py) && !points.some(p => Math.hypot(p.x - px, p.y - py) < 1e-7)) points.push({ x: px, y: py, circle });
    };
    for (const px of [left, right]) {
        const square = r * r - (px - x) ** 2;
        if (square >= 0) for (const sign of [-1, 1]) add(px, y + sign * Math.sqrt(square), true);
    }
    for (const py of [top, bottom]) {
        const square = r * r - (py - y) ** 2;
        if (square >= 0) for (const sign of [-1, 1]) add(x + sign * Math.sqrt(square), py, true);
    }
    for (const px of [left, right]) for (const py of [top, bottom]) {
        if (Math.hypot(px - x, py - y) <= r) add(px, py, false);
    }
    if (points.length < 2) return '';
    const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    points.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    let path = `M${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        const angle = Math.atan2(a.y - y, a.x - x);
        const delta = (Math.atan2(b.y - y, b.x - x) - angle + Math.PI * 2) % (Math.PI * 2);
        const middle = angle + delta / 2;
        // Between intersections, the boundary follows either the circle's
        // exact arc or the rectangle edge. No offscreen arc enters the path.
        const arc = a.circle && b.circle && inside(x + r * Math.cos(middle), y + r * Math.sin(middle));
        path += arc ? `A${r} ${r} 0 ${delta > Math.PI ? 1 : 0} 1 ${b.x} ${b.y}` : `L${b.x} ${b.y}`;
    }
    return `${path}Z`;
}
