import * as THREE from 'three';

// All eight bars share one mesh. Place them just outside the rounded silhouette
// so theme-colored markers remain visible against the surrounding background.
export function createCornerMarkerGeometry() {
    const positions = [], indices = [];
    const rectangle = (x, y, width, height) => {
        const first = positions.length / 3;
        positions.push(x-width/2,y-height/2,0, x+width/2,y-height/2,0,
            x+width/2,y+height/2,0, x-width/2,y+height/2,0);
        indices.push(first, first+1, first+2, first, first+2, first+3);
    };
    for (const [x,y,h,v] of [[-1.025,1.025,1,-1],[1.025,1.025,-1,-1],[-1.025,-1.025,1,1],[1.025,-1.025,-1,1]]) {
        rectangle(x+h*.05,y,.1,.012);
        rectangle(x,y+v*.05,.012,.1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    return geometry;
}

export function getCornerMarkerPalette(colors) {
    const rgb = value => value.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,[^)]+)?\)/, 'rgb($1, $2, $3)');
    return {
        idle: new THREE.Color(rgb(colors['--cube-ticks-idle'] || '#303030')),
        hover: new THREE.Color(rgb(colors['--cube-ticks-hover'] || '#000000')),
        scale: parseFloat(colors['--cube-ticks-hover-scale']) || 1.05,
    };
}

export function updateCornerMarker(mesh, progress, palette, reducedMotion) {
    mesh.material.color.copy(palette.idle).lerp(palette.hover, progress);
    mesh.material.opacity = .85 + progress * .1;
    const scale = reducedMotion ? 1 : 1 + progress * (palette.scale - 1);
    mesh.scale.set(scale, scale, 1);
}
