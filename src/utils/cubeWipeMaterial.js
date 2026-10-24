import * as THREE from 'three';
import { shadeCubeVertex } from './cubeLighting';

export function createCubeWipeUniforms() {
    return {
        cubeWipeActive: { value: 0 }, cubeWipeOrigin: { value: new THREE.Vector2() },
        cubeWipeReverse: { value: 0 }, cubeWipeSeed: { value: 0 }, cubeWipeHeight: { value: 1 }, cubeWipeProgress: { value: 0 }, cubeWipeCell: { value: new THREE.Vector2(50,50) },
        cubeFloorInverse: { value: new THREE.Matrix3() }, cubeFloorMatrix: { value: new THREE.Matrix3() }, cubeFloorGrid: { value: new THREE.Vector4() },
        cubeFloorBounds: { value: new THREE.Vector3() },
        cubeWipePhase: { value: new THREE.Vector2() }, cubeWipeExtent: { value: 1 },
        cubeWipeRect: { value: new THREE.Vector4() }, cubeWipeBuffer: { value: new THREE.Vector2(1, 1) },
    };
}

// All primitives keep their existing draw call and material. The uniform branch
// is off at rest; during a wipe each fragment selects its palette/label atlas.
export function bindCubeWipeMaterial(material, uniforms, geometry) {
    if (material.userData.cubeWipe) return material.userData.cubeWipe;
    const target = { color: { value: material.color.clone() }, opacity: { value: material.opacity },
        map: { value: material.map || null }, hasMap: { value: 0 } };
    material.userData.cubeWipe = target;
    if (material.vertexColors && geometry && !geometry.getAttribute('cubeNextColor')) {
        geometry.setAttribute('cubeNextColor', geometry.getAttribute('color').clone());
    }
    material.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, uniforms, { cubeNextDiffuse: target.color,
            cubeNextOpacity: target.opacity, cubeNextMap: target.map, cubeHasNextMap: target.hasMap });
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
            uniform float cubeWipeActive, cubeWipeReverse, cubeWipeSeed, cubeWipeHeight, cubeWipeProgress;
            uniform vec2 cubeWipePhase, cubeWipeCell;
            uniform mat3 cubeFloorInverse, cubeFloorMatrix;
            uniform vec4 cubeFloorGrid;
            uniform vec3 cubeFloorBounds;
            float pixelOrder(vec2 cell) {
                vec2 p = mod(cell,128.0);
                float n = mod(p.x*127.0+p.y*311.0+cubeWipeSeed*17.0,4093.0);
                n = mod(n*(mod(n,19.0)+3.0)+97.0,4093.0);
                n = mod(n*(mod(n,23.0)+5.0)+193.0,4093.0);
                return (n+0.5)/4093.0;
            }
            uniform vec2 cubeWipeOrigin, cubeWipeBuffer;
            uniform vec4 cubeWipeRect;
            uniform vec3 cubeNextDiffuse;
            uniform float cubeNextOpacity, cubeHasNextMap;
            uniform sampler2D cubeNextMap;
            ${material.vertexColors ? 'varying vec3 vCubeNextColor;' : ''}`)
            .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
                float cubeNew = 0.0;
                if (cubeWipeActive > 0.5) {
                    vec2 pixel = vec2(gl_FragCoord.x / cubeWipeBuffer.x, 1.0 - gl_FragCoord.y / cubeWipeBuffer.y);
                    vec2 screen = cubeWipeRect.xy + pixel * cubeWipeRect.zw;
                    vec2 cell = floor((screen-cubeWipePhase)/cubeWipeCell);
                    float onGround = 0.0;
                    if (cubeFloorBounds.z > 0.5) {
                        vec3 ground = cubeFloorInverse*vec3(screen,1.0);
                        vec2 local = ground.xy/ground.z;
                        if (local.x >= 0.0 && local.y >= 0.0 && local.x <= cubeFloorBounds.x && local.y <= cubeFloorBounds.y) {
                            cell = floor((local-cubeFloorGrid.zw)/cubeFloorGrid.xy);
                            onGround = 1.0;
                        }
                    }
                    vec2 glitchCell = cell+vec2(37.0,71.0)*onGround;
                    float start = 0.12+0.56*pixelOrder(glitchCell);
                    float drop = start+0.035+0.02*pixelOrder(glitchCell+vec2(19.0,-7.0));
                    float settle = drop+0.045+0.03*pixelOrder(glitchCell+vec2(-13.0,29.0));
                    float first = mix(start,1.0-settle,cubeWipeReverse);
                    float second = mix(drop,1.0-drop,cubeWipeReverse);
                    float third = mix(settle,1.0-start,cubeWipeReverse);
                    cubeNew = max(step(first,cubeWipeProgress)*(1.0-step(second,cubeWipeProgress)),step(third,cubeWipeProgress));
                    if (cubeWipeProgress <= 0.0) cubeNew = 0.0;
                    if (cubeWipeProgress >= 1.0) cubeNew = 1.0;
                }
                diffuseColor.rgb = mix(diffuseColor.rgb, cubeNextDiffuse, cubeNew);
                diffuseColor.a = mix(diffuseColor.a, cubeNextOpacity, cubeNew);`)
            .replace('#include <map_fragment>', `
                #ifdef USE_MAP
                    if (cubeNew > 0.5 && cubeHasNextMap > 0.5) {
                        diffuseColor *= texture2D(cubeNextMap, vMapUv);
                    } else {
                        #include <map_fragment>
                    }
                #endif`);
        if (material.vertexColors) {
            shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
                attribute vec3 cubeNextColor;
                varying vec3 vCubeNextColor;`)
                .replace('#include <color_vertex>', '#include <color_vertex>\nvCubeNextColor = cubeNextColor;');
            shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
                'diffuseColor.rgb *= mix(vColor.rgb, vCubeNextColor, cubeNew);');
        }
    };
    material.customProgramCacheKey = () => 'cube-grid-glitch-v1';
    material.needsUpdate = true;
    return target;
}

export function updateCubeWipeUniforms(uniforms, frame, renderer) {
    uniforms.cubeWipeOrigin.value.set(frame.origin.x, frame.origin.y);
    uniforms.cubeWipeProgress.value = frame.progress;
    uniforms.cubeWipeReverse.value = frame.reverse ? 1 : 0;
    uniforms.cubeWipeCell.value.set(frame.cell,frame.cellHeight);
    uniforms.cubeWipeSeed.value = frame.seed;
    uniforms.cubeWipeHeight.value = frame.height;
    const floor = frame.floor;
    uniforms.cubeFloorBounds.value.set(floor?.width || 0,floor?.height || 0,floor?1:0);
    if (floor) {
        uniforms.cubeFloorInverse.value.set(...floor.inverse);
        uniforms.cubeFloorMatrix.value.set(...floor.matrix);
        uniforms.cubeFloorGrid.value.set(floor.cell,floor.cellHeight,floor.phase.x,floor.phase.y);
    }
    uniforms.cubeWipePhase.value.set(frame.phase.x, frame.phase.y);
    uniforms.cubeWipeExtent.value = frame.extent;
    uniforms.cubeWipeRect.value.set(frame.rect.x, frame.rect.y, frame.rect.width, frame.rect.height);
    renderer.getDrawingBufferSize(uniforms.cubeWipeBuffer.value);
}

// Keep settled low-end rendering asleep outside the bounded glitch window.
export function cubeWipeRegion(body, camera, frame) {
    const first = frame.reverse ? .18 : .12;
    const last = frame.reverse ? .88 : .82;
    if (frame.progress < first) return 'old';
    if (frame.progress >= last) return 'new';
    return 'split';
}

const normal = new THREE.Vector3(), rotation = new THREE.Quaternion(), color = new THREE.Color();
export function updateCubeNextLighting(body, value) {
    const colors = body.geometry.getAttribute('cubeNextColor');
    if (!colors) return;
    body.getWorldQuaternion(rotation);
    const key = `${value}:${rotation.x}:${rotation.y}:${rotation.z}:${rotation.w}`;
    if (body.userData.cubeNextLighting === key) return;
    body.userData.cubeNextLighting = key;
    color.set(value);
    const normals = body.geometry.getAttribute('normal');
    for (let i = 0; i < normals.count; i++) {
        normal.fromBufferAttribute(normals, i).applyQuaternion(rotation);
        shadeCubeVertex(normal, color, colors, i);
    }
    colors.needsUpdate = true;
}
