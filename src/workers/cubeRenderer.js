import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FACE_CONFIG, DEFAULT_ROTATION, DEFAULT_CAMERA_DISTANCE, DRAG_THRESHOLD } from '../constants/cubeConfig';
import { transitionProgress, easeInOut } from '../utils/cubeTransition';
import { createCornerMarkerGeometry, getCornerMarkerPalette, updateCornerMarker } from '../utils/cubeCornerMarkers';
import { CUBE_SHININESS, CUBE_SPECULAR, shadeCubeVertex } from '../utils/cubeLighting';

let renderer, scene, camera, cube, body, geometry, assets, homeIcon;
let builtReduceEffects = false, cornerPalette;
let state, width = 1, height = 1, frameId = 0, previousTime = 0, draws = 0;
let initialized = false, announced = false, hoverFace = null, motion = null, press = null;
let rotation = { x: THREE.MathUtils.degToRad(DEFAULT_ROTATION.x), y: THREE.MathUtils.degToRad(DEFAULT_ROTATION.y) };
let dragging = false, down = null, lastPointer = null, lastMove = 0;
let pointer = { x: 0, y: 0 }, touchAnchor = null, isTouch = false;
let pointerIdleTimer = 0;
let themeVersion = 0;
const labelCache = new Map();
const faces = new Map(), hitMeshes = [], textures = new Map();
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), origin = new THREE.Vector3();
const normal = new THREE.Vector3(), quaternion = new THREE.Quaternion();
const lightingPose = { x: NaN, y: NaN, color: '' };
const send = (type, data = {}) => self.postMessage({ type, ...data });
const rgbaToRgb = (value) => value?.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,[^)]+)?\)/, 'rgb($1, $2, $3)');
const shortestPath = (current, target) => {
    let diff = (current - target) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return target + diff;
};

async function imageTexture(url) {
    if (!textures.has(url)) textures.set(url, (async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Cube asset failed: ${response.status}`);
        const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
        const texture = new THREE.Texture(bitmap);
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        return texture;
    })());
    return textures.get(url);
}

function labelMaps(theme, scale = state.labelScale) {
    const key = `${theme}:${scale}`;
    if (labelCache.has(key)) return labelCache.get(key);
    const palette = theme === 'demain-soir-bleu' ? 'demain' : 'clair';
    const pending = Promise.all(FACE_CONFIG.filter((face) => face.text).map(async (face) => {
        const atlas = await imageTexture(assets.labels[`../assets/cube-labels/${face.text.toLowerCase()}-${palette}-${scale}.webp`]);
        const idle = atlas.clone(), hover = atlas.clone();
        idle.repeat.y = .5; idle.offset.y = .5; idle.needsUpdate = true;
        hover.repeat.y = .5; hover.needsUpdate = true;
        return { name: face.name, idle, hover };
    }));
    labelCache.set(key, pending);
    pending.catch(() => labelCache.delete(key));
    return pending;
}

function buildScene(icon, maps) {
    faces.clear(); hitMeshes.length = 0;
    builtReduceEffects = state.reduceEffects;
    lightingPose.x = NaN;
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff,.2));
    const light = new THREE.DirectionalLight(0xffffff,1.2); light.position.set(3,4,5); scene.add(light);
    if (!state.reduceEffects) {
        const fill = new THREE.DirectionalLight(0xe2e2e2,.5); fill.position.set(-3,-2,-4); scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff,.4); rim.position.set(0,-4,2); scene.add(rim);
    }
    cube = new THREE.Group();
    cube.position.set(state.layout.restingX, state.layout.restingY, 0);
    cube.rotation.set(rotation.x, rotation.y, 0); cube.scale.setScalar(state.layout.cubeScale);
    scene.add(cube);
    geometry = new RoundedBoxGeometry(2,2,2,state.reduceEffects ? 2 : 3,.06);
    if (state.reduceEffects) geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*3),3));
    body = new THREE.Mesh(geometry, state.reduceEffects ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshPhongMaterial({ color: state.colors['--cube-color'], shininess:CUBE_SHININESS, specular:CUBE_SPECULAR }));
    cube.add(body);
    if (!state.reduceEffects) {
        const edge = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({ color: state.colors['--cube-edge-color'], transparent:true, opacity:parseFloat(state.colors['--cube-edge-opacity'])||.35, side:THREE.BackSide }));
        edge.name = 'edge'; edge.scale.setScalar(1.001); cube.add(edge);
    }
    cornerPalette = getCornerMarkerPalette(state.colors);
    const corners = createCornerMarkerGeometry();
    for (const config of FACE_CONFIG) {
        const group = new THREE.Group(); group.position.fromArray(config.position); group.rotation.fromArray(config.rotation); cube.add(group);
        const hit = new THREE.Mesh(new THREE.PlaneGeometry(2,2), new THREE.MeshBasicMaterial({ visible:false }));
        hit.userData.face = config.name; group.add(hit); hitMeshes.push(hit);
        const face = { group, p:0, scale:1 };
        face.ticks = new THREE.Mesh(corners, new THREE.MeshBasicMaterial({ color:cornerPalette.idle, transparent:true, opacity:.85, depthWrite:false, toneMapped:false }));
        face.ticks.name = 'cube-face-corners'; face.ticks.position.z = .006; group.add(face.ticks);
        if (!config.text) {
            const home = new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),new THREE.MeshBasicMaterial({ map:icon,transparent:true,opacity:.9,depthWrite:false }));
            home.position.z = .01; group.add(home);
        } else {
            const map = maps.find((value)=>value.name===config.name), metric = assets.metrics[config.text];
            const textWidth = metric.widthRatio*.22, textHeight=metric.heightRatio*.22;
            const textGeometry = new THREE.PlaneGeometry(textWidth*1.05,textHeight*1.05);
            face.text = new THREE.Group(); group.add(face.text);
            face.idle = new THREE.Mesh(textGeometry,new THREE.MeshBasicMaterial({ map:map.idle,transparent:true,depthWrite:false })); face.idle.position.z=.01; face.text.add(face.idle);
            face.hover = new THREE.Mesh(textGeometry,new THREE.MeshBasicMaterial({ map:map.hover,transparent:true,opacity:0,depthWrite:false })); face.hover.position.z=.012; face.hover.visible=false; face.text.add(face.hover);
            const points=Array.from({length:25},(_,i)=>new THREE.Vector3(-textWidth/2+textWidth*i/24,-.22*.65,.02));
            const lineGeometry=new THREE.BufferGeometry().setFromPoints(points);lineGeometry.setDrawRange(0,0);
            face.line = new THREE.Line(lineGeometry,new THREE.LineBasicMaterial({color:rgbaToRgb(state.colors['--cube-text-accent']),transparent:true,opacity:0,depthWrite:false}));face.line.visible=false;face.text.add(face.line);
            face.dot=new THREE.Mesh(new THREE.CircleGeometry(.018,8),new THREE.MeshBasicMaterial({color:rgbaToRgb(state.colors['--cube-text-accent']),transparent:true,opacity:.9,depthWrite:false}));face.dot.visible=false;face.text.add(face.dot);face.textWidth=textWidth;
        }
        faces.set(config.name,face);
    }
    updateLighting();
}

function updateLighting() {
    const color = state.colors['--cube-color'] || '#4a6b9a';
    if (!builtReduceEffects) { body.material.color.set(color); return; }
    if (lightingPose.x===cube.rotation.x && lightingPose.y===cube.rotation.y && lightingPose.color===color) return;
    const base=new THREE.Color(color); cube.getWorldQuaternion(quaternion);
    const normals=geometry.attributes.normal, colors=geometry.attributes.color;
    for(let i=0;i<normals.count;i++) {
        normal.fromBufferAttribute(normals,i).applyQuaternion(quaternion);
        shadeCubeVertex(normal,base,colors,i);
    }
    colors.needsUpdate=true;lightingPose.x=cube.rotation.x;lightingPose.y=cube.rotation.y;lightingPose.color=color;
}

function requestFrame() {
    if (!initialized || state.paused || frameId) return;
    frameId=self.requestAnimationFrame(renderFrame);
}
function pose() { return { x:cube.position.x,y:cube.position.y,z:camera.position.z,rx:cube.rotation.x,ry:cube.rotation.y }; }
function zoomedZ() {
    const size=state.layout.cubeScale, breakpoint=state.layout.breakpoint;
    const overscan=breakpoint==='phone'?1.55:breakpoint==='tablet'?1.45:1.65;
    return Math.max(size*1.01+size/(Math.tan(camera.fov*Math.PI/360)*Math.max(1,camera.aspect)*overscan),size*1.01+camera.near+.16);
}
function receiveState(next) {
    const previous=state;state=next;
    cornerPalette = getCornerMarkerPalette(state.colors);
    if (!initialized) return;
    // Ordinary React updates must not resize or clear the drawing buffer.
    // Actual viewport dimensions arrive through the resize message below.
    if (previous.dpr !== state.dpr) renderer.setPixelRatio(state.dpr);
    if (state.isZoomingOut && !previous.isZoomingOut) motion={kind:'out',started:performance.now(),pose:pose(),notified:false};
    else if (state.isZoomed && (!previous.isZoomed || state.activeFace!==previous.activeFace)) {
        const start=pose();start.rx=shortestPath(start.rx,THREE.MathUtils.degToRad(state.targetRotation.x));start.ry=shortestPath(start.ry,THREE.MathUtils.degToRad(state.targetRotation.y));
        motion={kind:'in',started:performance.now(),pose:start,notified:false,dissolveNotified:false};
    }
    // Early close can now overlap the approach. Hold its current camera pose
    // throughout the outgoing page dissolve, then return from that exact pose.
    if (state.overlayPhase === 'fading-out' && motion?.kind === 'in') motion = null;
    if (previous.theme!==state.theme || previous.reduceEffects!==state.reduceEffects || previous.labelScale!==state.labelScale) {
        const version=++themeVersion;
        labelMaps(state.theme).then((maps)=>{
            if(version!==themeVersion)return;
            if (builtReduceEffects !== state.reduceEffects) {
                const oldScene = scene, oldPose = pose();
                buildScene(homeIcon, maps);
                cube.position.set(oldPose.x, oldPose.y, 0);
                cube.rotation.set(oldPose.rx, oldPose.ry, 0);
                const geometries = new Set(), materials = new Set();
                oldScene.traverse((object) => {
                    if (object.geometry) geometries.add(object.geometry);
                    if (object.material) materials.add(object.material);
                });
                for (const material of materials) {
                    material.dispose();
                }
                geometries.forEach((value) => value.dispose());
            } else {
                for(const map of maps){
                    const face=faces.get(map.name);
                    face.idle.material.map=map.idle;face.hover.material.map=map.hover;
                }
            }
            requestFrame();
        }).catch((error)=>send('error',{message:error.message}));
    }
    const edge=cube.getObjectByName('edge');
    if(edge){edge.material.color.set(state.colors['--cube-edge-color']);edge.material.opacity=parseFloat(state.colors['--cube-edge-opacity'])||.35;}
    for(const face of faces.values()){
        if(face.line){face.line.material.color.set(rgbaToRgb(state.colors['--cube-text-accent']));face.dot.material.color.set(rgbaToRgb(state.colors['--cube-text-accent']));}
    }
    if(state.paused){if(frameId)self.cancelAnimationFrame(frameId);frameId=0;previousTime=0;}
    else requestFrame();
}

function renderFrame(now) {
    frameId=0;if(state.paused)return;
    const delta=previousTime?Math.min((now-previousTime)/1000,.1):1/60;previousTime=now;
    const smooth=(rate)=>state.reducedMotion?1:1-Math.exp(-rate*delta);
    let animate=false,pressScale=1,startDissolve=false,completedIn=false,completedOut=false;
    if(press){
        const inMs=state.reducedMotion?50:80,outMs=state.reducedMotion?50:state.reduceEffects?160:250;
        const elapsed=now-press.started;
        if(elapsed>=inMs+outMs){send('click',{face:press.face});press=null;}
        else {animate=true;pressScale=elapsed<inMs?1-.12*(elapsed/inMs)**2:.88+.12*(1-(1-(elapsed-inMs)/outMs)**3);}
    }
    if(motion){
        const duration=motion.kind==='in'?state.transition.zoomInMs:state.transition.zoomOutMs;
        const t=transitionProgress(motion.started,now,duration),p=easeInOut(t),start=motion.pose;
        const target=motion.kind==='in'?{x:0,y:0,z:zoomedZ(),rx:THREE.MathUtils.degToRad(state.targetRotation.x),ry:THREE.MathUtils.degToRad(state.targetRotation.y)}:{x:state.layout.restingX,y:state.layout.restingY,z:DEFAULT_CAMERA_DISTANCE*(1+state.zoomZ/1000),rx:rotation.x,ry:rotation.y};
        camera.position.z=THREE.MathUtils.lerp(start.z,target.z,p);cube.position.x=THREE.MathUtils.lerp(start.x,target.x,p);cube.position.y=THREE.MathUtils.lerp(start.y,target.y,p);cube.rotation.x=THREE.MathUtils.lerp(start.rx,target.rx,p);cube.rotation.y=THREE.MathUtils.lerp(start.ry,target.ry,p);
        if(motion.kind==='in'&&now-motion.started>=state.transition.fadeStartMs&&!motion.dissolveNotified){motion.dissolveNotified=true;startDissolve=true;}
        if(motion.kind==='in'&&t>=1&&!motion.notified){motion.notified=true;completedIn=true;}
        if(t<1)animate=true;else {if(motion.kind==='out')completedOut=true;motion=null;}
    }else if(!state.isZoomed&&!state.isZoomingOut){
        for(const [object,key,target]of[[cube.rotation,'x',rotation.x],[cube.rotation,'y',rotation.y],[cube.position,'x',state.layout.restingX],[cube.position,'y',state.layout.restingY],[camera.position,'z',DEFAULT_CAMERA_DISTANCE*(1+state.zoomZ/1000)]]){
            const diff=target-object[key];if(Math.abs(diff)>.0004){object[key]+=diff*smooth(key==='z'?5:6);animate=true;}else object[key]=target;
        }
    }
    if(!state.reduceEffects&&!state.reducedMotion){
        const settled=state.isZoomed||state.isZoomingOut||dragging||now-lastMove>3000;
        const px=settled?0:(isTouch?(pointer.x-(touchAnchor?.x||pointer.x)):-pointer.x)*(isTouch?-.42:-.3);
        // Worker pointer Y points upward; the fallback's pointer Y points down.
        const py=settled?0:(isTouch?(pointer.y-(touchAnchor?.y||pointer.y)):pointer.y)*(isTouch?-.28:-.2);
        for(const[key,target]of[['x',px],['y',py]]){const diff=target-camera.position[key];if(Math.abs(diff)>.0004){camera.position[key]+=diff*smooth(3.5);animate=true;}else camera.position[key]=target;}
    }
    cube.scale.setScalar(state.layout.cubeScale*pressScale);
    for(const[name,face]of faces){
        const target=name===hoverFace||name===state.activeFace&&(state.isZoomed||state.isZoomingOut)?1:0;
        const next=state.reducedMotion?target:face.p+(target-face.p)*smooth(8);
        face.p=Math.abs(target-next)<.001?target:next;
        const scaleTarget=state.reduceEffects||state.reducedMotion?1:1+target*.1;
        const scaleNext=face.scale+(scaleTarget-face.scale)*smooth(6);face.scale=Math.abs(scaleTarget-scaleNext)<.001?scaleTarget:scaleNext;
        updateCornerMarker(face.ticks, face.p, cornerPalette, state.reducedMotion);
        if(face.text){
            face.text.scale.set(face.scale,face.scale,1);face.idle.material.opacity=1-face.p;face.hover.material.opacity=face.p;face.idle.visible=face.p<1;face.hover.visible=face.p>0;
            face.line.visible=face.p>0;face.line.geometry.setDrawRange(0,Math.max(2,Math.floor(25*face.p)));face.line.material.opacity=Math.min(face.p*1.2,.85);
            face.dot.visible=face.p>.02&&face.p<.98;face.dot.position.set(-face.textWidth/2+face.textWidth*face.p,-.22*.65,.025);
        }
        if(face.p!==target||face.scale!==scaleTarget)animate=true;
    }
    updateLighting();renderer.render(scene,camera);draws+=renderer.info.render.calls;
    cube.updateWorldMatrix(true,false);origin.setFromMatrixPosition(cube.matrixWorld).project(camera);
    send('frame',{x:THREE.MathUtils.radToDeg(cube.rotation.x),y:THREE.MathUtils.radToDeg(cube.rotation.y),draws,origin:{x:(origin.x+1)*width/2,y:(1-origin.y)*height/2}});
    // Publish the current pose before either transition signal changes React state.
    if(startDissolve)send('dissolve-start');
    if(completedIn)send('zoom-in-complete');
    if(completedOut)send('zoom-out-complete');
    if(!announced){announced=true;send('ready');}
    if(animate)requestFrame();
}

function pick(x,y){
    ndc.set(x/width*2-1,1-y/height*2);raycaster.setFromCamera(ndc,camera);
    return raycaster.intersectObjects(hitMeshes,false)[0]?.object.userData.face||null;
}
function receivePointer(message){
    if(!initialized||state.paused||state.isZoomed||state.isZoomingOut)return;
    const {kind,x,y,pointerType}=message;
    if(kind==='leave'){hoverFace=null;lastMove=0;clearTimeout(pointerIdleTimer);requestFrame();return;}
    if(kind==='cancel'){hoverFace=null;dragging=false;down=null;touchAnchor=null;lastMove=0;clearTimeout(pointerIdleTimer);requestFrame();return;}
    pointer={x:x/width*2-1,y:1-y/height*2};lastMove=performance.now();isTouch=pointerType==='touch';
    clearTimeout(pointerIdleTimer);
    // Wake once to return the camera with the baseplate after cursor inactivity.
    if(!state.reduceEffects&&!state.reducedMotion)pointerIdleTimer=setTimeout(()=>{lastMove=0;requestFrame();},3000);
    if(kind==='down'){
        hoverFace=pick(x,y);
        rotation={x:cube.rotation.x,y:cube.rotation.y};dragging=true;down={x,y,face:pick(x,y)};lastPointer={x,y};touchAnchor=isTouch?{...pointer}:null;send('cursor',{cursor:'grabbing'});
    }
    if(kind==='move'){
        if(dragging&&lastPointer){if(down&&Math.hypot(x-down.x,y-down.y)>DRAG_THRESHOLD){hoverFace=null;down.cancelled=true;}rotation.x+=(y-lastPointer.y)*.008;rotation.y+=(x-lastPointer.x)*.008;lastPointer={x,y};}
        else {hoverFace=pick(x,y);send('cursor',{cursor:hoverFace==='home'?'nwse-resize':hoverFace?'pointer':'grab'});}
    }
    if(kind==='up'){
        dragging=false;touchAnchor=null;
        const face=pick(x,y);
        if(down&&!down.cancelled&&Math.hypot(x-down.x,y-down.y)<=DRAG_THRESHOLD&&face===down.face&&face&&face!=='home'&&!press){send('press',{face});press={face,started:performance.now()};if(face==='theme')labelMaps(state.theme==='clair-obscur'?'demain-soir-bleu':'clair-obscur').catch(()=>{});}
        if(isTouch)hoverFace=null;
        down=null;send('cursor',{cursor:'grab'});
    }
    requestFrame();
}

async function init(message){
    state=message.state;width=Math.max(1,message.width);height=Math.max(1,message.height);assets=message.assets;
    renderer=new THREE.WebGLRenderer({canvas:message.canvas,alpha:true,antialias:true,powerPreference:state.reduceEffects?'low-power':'high-performance',stencil:false});
    renderer.debug.checkShaderErrors=import.meta.env.DEV;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.setPixelRatio(state.dpr);renderer.setSize(width,height,false);
    camera=new THREE.PerspectiveCamera(45,width/height,.1,100);camera.position.set(0,0,5);
    const iconPromise = imageTexture(assets.icon);
    let maps, preparedTheme, preparedProfile;
    do {
        preparedTheme = state.theme; preparedProfile = state.labelScale;
        [homeIcon, maps] = await Promise.all([iconPromise, labelMaps(preparedTheme)]);
    } while (preparedTheme !== state.theme || preparedProfile !== state.labelScale);
    buildScene(homeIcon,maps);await renderer.compileAsync(scene,camera);
    initialized=true;requestFrame();
}
self.onmessage=({data})=>{
    if(data.type==='init')init(data).catch((error)=>send('error',{message:error.message}));
    else if(data.type==='state')receiveState(data.state);
    else if(data.type==='pointer')receivePointer(data);
    else if(data.type==='resize'){
        width=Math.max(1,data.width);height=Math.max(1,data.height);
        if(renderer)renderer.setSize(width,height,false);
        if(camera){camera.aspect=width/height;camera.updateProjectionMatrix();requestFrame();}
    }
};
