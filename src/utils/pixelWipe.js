// Whole cells of the live wallpaper and perspective floor share one palette
// field. Integer noise is identical in JS and GLSL, including worker rendering.
const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

export function pixelOrder(column, row, seed = 0) {
    let n = mod(mod(column, 128)*127 + mod(row, 128)*311 + seed*17, 4093);
    n = mod(n*(mod(n, 19)+3)+97, 4093);
    n = mod(n*(mod(n, 23)+5)+193, 4093);
    return (n+.5)/4093;
}

export function createPixelWipe(width, height, origin, reverse = false, seed = 0) {
    const cell = Math.min(320, Math.max(96, height * .2)), cellHeight = cell;
    const phase = width < 768 ? { x: 0, y: 0 } : { x: (width-cell)/2, y: (height-cellHeight)/2 };
    return { kind: 'grid-cells', width, height, cell, cellHeight, phase, reverse, seed, floor: null,
        extent: width+height, origin: { x: origin.x, y: origin.y } };
}

export function projectGridPoint(matrix, x, y) {
    const z = matrix[6]*x+matrix[7]*y+matrix[8];
    return { x: (matrix[0]*x+matrix[1]*y+matrix[2])/z, y: (matrix[3]*x+matrix[4]*y+matrix[5])/z };
}

export function pixelCellAt(frame, x, y) {
    const floor = frame.floor;
    if (floor) {
        const p = projectGridPoint(floor.inverse, x, y);
        if (p.x >= 0 && p.x <= floor.width && p.y >= 0 && p.y <= floor.height) return {
            column: Math.floor((p.x-floor.phase.x)/floor.cell),
            row: Math.floor((p.y-floor.phase.y)/floor.cellHeight), ground: true,
        };
    }
    return { column: Math.floor((x-frame.phase.x)/frame.cell),
        row: Math.floor((y-frame.phase.y)/frame.cellHeight), ground: false };
}

// A cell briefly changes, drops back, then locks into the destination palette.
// The three bounded events are spatially seeded, never randomized per frame.
export function pixelCellEvents(frame, column, row, ground = false) {
    const c = column+(ground?37:0), r = row+(ground?71:0);
    const start = .12+.56*pixelOrder(c,r,frame.seed);
    const drop = start+.035+.02*pixelOrder(c+19,r-7,frame.seed);
    const settle = drop+.045+.03*pixelOrder(c-13,r+29,frame.seed);
    return frame.reverse ? [1-settle,1-drop,1-start] : [start,drop,settle];
}

export function pixelThreshold(frame, column, row, ground = false) {
    const events = pixelCellEvents(frame,column,row,ground);
    return frame.reverse ? events[0] : events[2];
}

export function pixelCellUsesNewPalette(frame, column, row, ground = false) {
    if (frame.progress <= 0) return false;
    if (frame.progress >= 1) return true;
    const [start,drop,settle] = pixelCellEvents(frame,column,row,ground);
    return (frame.progress >= start && frame.progress < drop) || frame.progress >= settle;
}

export function pixelUsesNewPalette(frame, x, y) {
    const { column, row, ground } = pixelCellAt(frame, x, y);
    return pixelCellUsesNewPalette(frame, column, row, ground);
}

const cross = (a,b,p) => (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
function halfPlane(polygon, a, b, inside = true) {
    const result = [];
    for (let i=0; i<polygon.length; i++) {
        const p = polygon[i], q = polygon[(i+1)%polygon.length];
        const d = cross(a,b,p)*(inside?1:-1), e = cross(a,b,q)*(inside?1:-1);
        if (d >= 0) result.push(p);
        if ((d >= 0) !== (e >= 0)) {
            const t = d/(d-e);
            result.push({ x: p.x+t*(q.x-p.x), y: p.y+t*(q.y-p.y) });
        }
    }
    return result;
}
function clip(polygon, boundary) {
    for (let i=0; i<boundary.length && polygon.length; i++) polygon = halfPlane(polygon, boundary[i], boundary[(i+1)%boundary.length]);
    return polygon;
}
function subtract(polygon, boundary) {
    const outside = [];
    for (let i=0; i<boundary.length && polygon.length; i++) {
        const a = boundary[i], b = boundary[(i+1)%boundary.length];
        const piece = halfPlane(polygon,a,b,false);
        if (piece.length >= 3) outside.push(piece);
        polygon = halfPlane(polygon,a,b);
    }
    return outside;
}
const rectangle = (x,y,width,height) => [{x,y},{x:x+width,y},{x:x+width,y:y+height},{x,y:y+height}];
function positiveWinding(polygon) {
    const area = polygon.reduce((a,p,i) => { const q=polygon[(i+1)%polygon.length]; return a+p.x*q.y-q.x*p.y; },0);
    return area < 0 ? polygon.reverse() : polygon;
}

// The historical name is retained for callers; tiles may now be projected
// quadrilaterals. Wallpaper cells are cut away underneath the ground plane.
export function pixelWipeRectangles(frame) {
    const { width, height, cell, cellHeight, phase, progress, floor } = frame;
    if (progress <= 0) return [];
    if (progress >= 1) return [{ x:0, y:0, width, height }];
    const viewport = rectangle(0,0,width,height);
    const footprint = floor ? clip(positiveWinding(rectangle(0,0,floor.width,floor.height)
        .map(p => projectGridPoint(floor.matrix,p.x,p.y))), viewport) : [];
    const tiles = [];
    for (let row=Math.floor(-phase.y/cellHeight); row<Math.ceil((height-phase.y)/cellHeight); row++) {
        let start = null;
        const last = Math.ceil((width-phase.x)/cell);
        for (let col=Math.floor(-phase.x/cell); col<=last; col++) {
            const filled = col<last && pixelCellUsesNewPalette(frame,col,row);
            if (filled && start === null) start = col;
            if (!filled && start !== null) {
                const x=Math.max(0,phase.x+start*cell), y=Math.max(0,phase.y+row*cellHeight);
                const w=Math.min(width,phase.x+col*cell)-x, h=Math.min(height,phase.y+(row+1)*cellHeight)-y;
                if (footprint.length) tiles.push(...subtract(rectangle(x,y,w,h),footprint).map(points=>({points})));
                else tiles.push({ x,y,width:w,height:h });
                start = null;
            }
        }
    }
    if (footprint.length) {
        for (let row=Math.floor(-floor.phase.y/floor.cellHeight); row<Math.ceil((floor.height-floor.phase.y)/floor.cellHeight); row++) {
            for (let col=Math.floor(-floor.phase.x/floor.cell); col<Math.ceil((floor.width-floor.phase.x)/floor.cell); col++) {
                if (!pixelCellUsesNewPalette(frame,col,row,true)) continue;
                const x=Math.max(0,floor.phase.x+col*floor.cell), y=Math.max(0,floor.phase.y+row*floor.cellHeight);
                const w=Math.min(floor.width,floor.phase.x+(col+1)*floor.cell)-x;
                const h=Math.min(floor.height,floor.phase.y+(row+1)*floor.cellHeight)-y;
                const points = clip(positiveWinding(rectangle(x,y,w,h).map(p=>projectGridPoint(floor.matrix,p.x,p.y))),viewport);
                if (points.length >= 3) tiles.push({ points });
            }
        }
    }
    return tiles;
}

export function localPixelRectangles(tiles, rect, width, height) {
    const sx=width/rect.width, sy=height/rect.height;
    const viewport=rectangle(0,0,width,height);
    return tiles.flatMap(tile => {
        const points = clip((tile.points || rectangle(tile.x,tile.y,tile.width,tile.height))
            .map(p=>({x:(p.x-rect.left)*sx,y:(p.y-rect.top)*sy})),viewport);
        return points.length >= 3 ? [{points}] : [];
    });
}

export function pixelRectanglesPath(tiles) {
    const n = value => Math.round(value*10000)/10000;
    return tiles.map(tile => {
        const points=tile.points || rectangle(tile.x,tile.y,tile.width,tile.height);
        return points.map((p,i)=>`${i?'L':'M'}${n(p.x)} ${n(p.y)}`).join('')+'Z';
    }).join(' ');
}
