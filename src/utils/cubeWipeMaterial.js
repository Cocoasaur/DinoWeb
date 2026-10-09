import * as THREE from 'three';
import { shadeCubeVertex } from './cubeLighting';

export function createCubeWipeUniforms() {
    return {
        cubeWipeActive: { value: 0 }, cubeWipeOrigin: { value: new THREE.Vector2() },
        cubeWipeRadius2: { value: 0 }, cubeWipeExpand: { value: 1 },
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
            uniform float cubeWipeActive, cubeWipeRadius2, cubeWipeExpand;
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
                    vec2 delta = cubeWipeRect.xy + pixel * cubeWipeRect.zw - cubeWipeOrigin;
                    float inside = 1.0 - step(cubeWipeRadius2, dot(delta, delta));
                    cubeNew = mix(1.0 - inside, inside, cubeWipeExpand);
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
    material.customProgramCacheKey = () => 'cube-circular-palette-v1';
    material.needsUpdate = true;
    return target;
}

export function updateCubeWipeUniforms(uniforms, frame, renderer) {
    uniforms.cubeWipeOrigin.value.set(frame.origin.x, frame.origin.y);
    uniforms.cubeWipeRadius2.value = frame.radius ** 2;
    uniforms.cubeWipeExpand.value = frame.expand ? 1 : 0;
    uniforms.cubeWipeRect.value.set(frame.rect.x, frame.rect.y, frame.rect.width, frame.rect.height);
    renderer.getDrawingBufferSize(uniforms.cubeWipeBuffer.value);
}

const point = new THREE.Vector3();
// Conservative projected cube bounds avoid waking a settled low-end canvas
// while the circle is still far away or has already passed the entire cube.
export function cubeWipeRegion(body, camera, frame) {
    body.updateWorldMatrix(true, false);
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const x of [-1.08, 1.08]) for (const y of [-1.08, 1.08]) for (const z of [-1.08, 1.08]) {
        point.set(x, y, z).applyMatrix4(body.matrixWorld).project(camera);
        const px = frame.rect.x + (point.x + 1) / 2 * frame.rect.width;
        const py = frame.rect.y + (1 - point.y) / 2 * frame.rect.height;
        left = Math.min(left, px); right = Math.max(right, px);
        top = Math.min(top, py); bottom = Math.max(bottom, py);
    }
    const { x, y } = frame.origin;
    const near = Math.hypot(Math.max(left - x, 0, x - right), Math.max(top - y, 0, y - bottom));
    const far = Math.hypot(Math.max(Math.abs(left - x), Math.abs(right - x)), Math.max(Math.abs(top - y), Math.abs(bottom - y)));
    if (frame.radius > near && frame.radius < far) return 'split';
    const inside = frame.radius >= far;
    return inside === frame.expand ? 'new' : 'old';
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
