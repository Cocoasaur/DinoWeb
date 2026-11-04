import { useEffect, useRef } from 'react';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector2 } from 'three';
import { useHomeViewportLayout } from '../../../src/hooks/useHomeViewportLayout.js';
import { getCubeOcclusion } from '../../../src/utils/cubeOcclusion.js';
import { getCubeShadow } from '../../../src/utils/cubeShadow.js';
import { getCubeTransition, easeInOut } from '../../../src/utils/cubeTransition.js';
import { useTheme } from '../../../src/context/ThemeContext.jsx';
import metrics from '../../../src/assets/cube-labels/metrics.json';

const SOURCE='https://raw.githubusercontent.com/Cocoasaur/DinoWeb/7e22b12babe648dbb442c95fc2dce78d4356651d/src/assets/';
const FACE_NORMALS=[[0,0,1,'home'],[1,0,0,'projects'],[0,0,-1,'contacts'],[-1,0,0,'skills'],[0,1,0,'about'],[0,-1,0,'theme']];
const toDegrees=v=>v*180/Math.PI;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const radians=v=>v*Math.PI/180;
const artPaths=['brand/dino-icon.webp',...FACE_NORMALS.slice(1).flatMap(([, , ,name])=>[`cube-labels/${name}-clair-2.webp`,`cube-labels/${name}-demain-2.webp`])];

async function originalSurface(body, api) {
  const images=await Promise.all(artPaths.map(async file=>{const image=new Image();image.crossOrigin='anonymous';image.src=SOURCE+file;await image.decode();return image;}));
  let controls;
  try {
    await api.setMaterial(body.id, three=>{
      const t=three.tsl;
      const textures=images.map(image=>{
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);
        const texture=new three.CanvasTexture(canvas);texture.minFilter=three.LinearFilter;texture.magFilter=three.LinearFilter;texture.generateMipmaps=false;return texture;
      });
      const dark=t.uniform(0),hover=t.uniform(-1),alpha=t.uniform(1),base=t.uniform(new three.Color('#484848'));
      controls={dark,hover,alpha,base};
      const normal=t.normalize(t.normalWorld),local=t.positionLocal;
      const direction=(x,y,z)=>{const len=Math.hypot(x,y,z);return t.vec3(x/len,y/len,z/len);};
      const key=direction(3,4,5),fill=direction(-3,-2,-4),rim=direction(0,-4,2);
      const kd=t.max(t.dot(normal,key),0),fd=t.max(t.dot(normal,fill),0),rd=t.max(t.dot(normal,rim),0);
      const diffuse=kd.mul(1.2).add(fd.mul(.5*.760525)).add(rd.mul(.4)).add(.2).div(Math.PI);
      const a=3/Math.sqrt(50),b=4/Math.sqrt(50),c=5/Math.sqrt(50)+1,l=Math.hypot(a,b,c),half=t.vec3(a/l,b/l,c/l);
      const sc=((36/255+.055)/1.055)**2.4;
      const fresnel=sc+(1-sc)*2**((-5.55473*(c/l)-6.98316)*(c/l));
      const spec=kd.mul(1.2*fresnel*.25*15/Math.PI).mul(t.pow(t.max(t.dot(normal,half),0),28));
      let color=base.mul(diffuse).add(t.vec3(spec));
      for(let i=0;i<FACE_NORMALS.length;i++){
        const [nx,ny,nz,name]=FACE_NORMALS[i];
        const title=name[0].toUpperCase()+name.slice(1);
        const w=i===0?160:metrics[title].widthRatio*22*1.05,h=i===0?160:metrics[title].heightRatio*22*1.05;
        const x=i===1?local.z.negate():i===2?local.x.negate():i===3?local.z:local.x;
        const y=i===4?local.z.negate():i===5?local.z:local.y;
        const uv=t.vec2(x.div(w).add(.5),y.div(h).add(.5));
        const inside=t.step(0,uv.x).mul(t.step(uv.x,1)).mul(t.step(0,uv.y)).mul(t.step(uv.y,1));
        const face=t.step(.98,t.dot(t.normalLocal,t.vec3(nx,ny,nz))).mul(inside);
        let art;
        if(i===0) art=t.texture(textures[0],uv);
        else {
          const selected=t.step(t.abs(hover.sub(i)),.1);
          const atlasUv=t.vec2(uv.x,uv.y.mul(.5).add(t.mix(.5,0,selected)));
          art=t.mix(t.texture(textures[1+(i-1)*2],atlasUv),t.texture(textures[2+(i-1)*2],atlasUv),dark);
        }
        color=t.mix(color,art.rgb,art.a.mul(face).mul(i===0?.9:1));
      }
      const material=new three.MeshBasicNodeMaterial();material.colorNode=color;material.opacityNode=alpha;material.transparent=true;return material;
    });
  } catch(error) {
    console.error('DinoWeb original cube surface could not initialize',error);
    throw error;
  }
  return controls;
}

export default function SplineCubeStage(props) {
  const element=useRef(null),current=useRef(props),latestLayout=useRef(null),runtime=useRef(null);
  const layout=useHomeViewportLayout();latestLayout.current=layout;current.current=props;
  const {cubePalette}=useTheme();
  useEffect(()=>{if(runtime.current){runtime.current.palette=cubePalette;}},[cubePalette]);
  useEffect(()=>{
    let disposed=false,frame=0;const cleanups=[];
    const api=window.spline;
    if(!api){console.error('Spline bridge is missing');return;}
    const camera=new PerspectiveCamera(45,innerWidth/innerHeight,.1,100);
    const hit=new Mesh(new BoxGeometry(2,2,2),new MeshBasicMaterial());
    const ray=new Raycaster(),point=new Vector2();
    const state={x:-20,y:-45,z:0,hover:-1,down:null,phase:'home',started:performance.now(),pose:null,palette:cubePalette,camX:0,camY:0,pointerX:0,pointerY:0,lastPointer:0};
    runtime.current=state;
    const faceAt=(x,y)=>{
      point.set(x/innerWidth*2-1,-y/innerHeight*2+1);ray.setFromCamera(point,camera);
      const intersection=ray.intersectObject(hit)[0];if(!intersection)return -1;
      const n=intersection.face.normal;let best=-1,dot=0;
      FACE_NORMALS.forEach(([x,y,z],i)=>{const score=n.x*x+n.y*y+n.z*z;if(score>dot){best=i;dot=score;}});return best;
    };
    const on=(target,name,listener,options)=>{target.addEventListener(name,listener,options);cleanups.push(()=>target.removeEventListener(name,listener,options));};
    const root=element.current;
    on(root,'pointerdown',e=>{
      if(current.current.isZoomed||current.current.isZoomingOut)return;
      const face=faceAt(e.clientX,e.clientY);if(face<0)return;
      state.down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,face};
      current.current.isDraggingRef.current=true;root.setPointerCapture(e.pointerId);
    });
    on(root,'pointermove',e=>{
      state.pointerX=e.clientX/innerWidth*2-1;state.pointerY=e.clientY/innerHeight*2-1;state.lastPointer=performance.now();
      if(state.down){const d=state.down;state.y+=toDegrees((e.clientX-d.lastX)*.008);state.x+=toDegrees((e.clientY-d.lastY)*.008);d.lastX=e.clientX;d.lastY=e.clientY;}
      state.hover=faceAt(e.clientX,e.clientY);root.dataset.cursorLabel=state.down?'DRAG':state.hover===0?'ZOOM':state.hover<0?'ROTATE':'OPEN';
    });
    on(root,'pointerup',e=>{
      const d=state.down;state.down=null;current.current.isDraggingRef.current=false;
      if(root.hasPointerCapture(e.pointerId))root.releasePointerCapture(e.pointerId);
      if(!d||Math.hypot(e.clientX-d.x,e.clientY-d.y)>5||d.face===0)return;
      const name=FACE_NORMALS[d.face][3];current.current.handleFacePressStart(name);current.current.handleFaceClick(name);
    });
    on(root,'pointercancel',()=>{state.down=null;current.current.isDraggingRef.current=false;});
    on(root,'pointerleave',()=>{state.hover=-1;});
    (async()=>{
      await api.ready;
      const [cube,body,sceneCamera,backdrop]=await Promise.all(['DinoWeb Cube','DinoWeb Cube Body','DinoWeb Portfolio Camera','DinoWeb Theme Backdrop'].map(name=>api.findObjectByName(name)));
      if(!cube||!body||!sceneCamera||!backdrop)throw Error('The native DinoWeb scene is incomplete');
      const surface=await originalSurface(body,api);if(disposed)return;
      const markerNames=FACE_NORMALS.map(([, , ,name])=>`DinoWeb Cube ${name} Markers`);
      const markers=await Promise.all(markerNames.map(name=>api.findObjectByName(name)));
      current.current.onReady?.();
      let notified=false,lastPhase='',lastPalette='',lastMarkerAlpha=-1,previousTime=performance.now(),alphaAt=performance.now(),alphaFrom=1,lastOverlay='';
      const tick=now=>{
        if(disposed)return;
        frame=requestAnimationFrame(tick);if(document.visibilityState==='hidden')return;
        const p=current.current,layout=latestLayout.current;
        const dt=Math.min(.1,(now-previousTime)/1000);previousTime=now;
        const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
        const timing=getCubeTransition(p.reduceEffects,reduced);
        const phase=p.isZoomingOut?'return':p.isZoomed?'approach':'home';
        if(phase!==lastPhase){state.pose={x:hit.position.x,y:hit.position.y,z:hit.position.z,rx:state.x,ry:state.y};state.started=now;notified=false;lastPhase=phase;}
        if(phase==='home'){
          const idle=now-state.lastPointer>3000||state.down||reduced;
          const tx=idle?0:state.pointerX*.3,ty=idle?0:state.pointerY*.2;
          state.camX+=(tx-state.camX)*Math.min(1,dt*3.5);state.camY+=(ty-state.camY)*Math.min(1,dt*3.5);
        }
        camera.aspect=innerWidth/innerHeight;camera.position.set(state.camX,state.camY,5*(1+p.zoomZ/1000));camera.updateProjectionMatrix();camera.updateMatrixWorld();
        hit.scale.setScalar(layout.cubeScale);
        if(phase==='approach'){
          const u=clamp((now-state.started)/(timing.zoomInMs||1),0,1),v=easeInOut(u),pose=state.pose;
          const overscan=layout.breakpoint==='phone'?1.55:layout.breakpoint==='tablet'?1.45:1.65;
          const distance=layout.cubeScale*1.01+Math.max(layout.cubeScale/(Math.tan(Math.PI/8)*Math.max(1,camera.aspect)*overscan),.26);
          hit.position.set(pose.x+(camera.position.x-pose.x)*v,pose.y+(camera.position.y-pose.y)*v,pose.z+(camera.position.z-distance-pose.z)*v);
          const target=p.targetRotation||{x:state.x,y:state.y};state.x=pose.rx+(target.x-pose.rx)*v;state.y=pose.ry+(target.y-pose.ry)*v;
          if(now-state.started>=timing.fadeStartMs)p.handleDissolveStart();
          if(u===1&&!notified){notified=true;p.handleZoomComplete();}
        }else if(phase==='return'){
          const u=clamp((now-state.started)/(timing.zoomOutMs||1),0,1),v=easeInOut(u),pose=state.pose;
          hit.position.set(pose.x+(layout.restingX-pose.x)*v,pose.y+(layout.restingY-pose.y)*v,pose.z*(1-v));
          if(u===1&&!notified){notified=true;p.handleZoomOutComplete();}
        }else hit.position.set(layout.restingX,layout.restingY,0);
        hit.rotation.set(radians(state.x),radians(state.y),0);hit.updateMatrixWorld();
        const occlusion=getCubeOcclusion(hit,camera,innerWidth,innerHeight);
        document.documentElement.style.setProperty('--spline-cube-hole',occlusion);
        p.onCubeFrame?.({occlusion,shadowTransform:getCubeShadow(hit,camera,innerHeight,layout.restingY,layout.cubeScale),camera:camera.position.toArray().map(v=>v.toFixed(5)).join(','),depth:hit.position.z.toFixed(5)});
        if(p.screenPosRef?.current)Object.assign(p.screenPosRef.current,{x:innerWidth/2+innerHeight/(2*Math.tan(Math.PI/8))*hit.position.x/(camera.position.z-hit.position.z),y:innerHeight/2-innerHeight/(2*Math.tan(Math.PI/8))*hit.position.y/(camera.position.z-hit.position.z),valid:true});
        p.handleRotationChange?.(state.x,state.y);
        void api.updateObject(cube.id,{position:{x:hit.position.x*100,y:hit.position.y*100,z:hit.position.z*100},rotation:{x:state.x,y:state.y,z:0},scale:{x:layout.cubeScale,y:layout.cubeScale,z:layout.cubeScale}});
        void api.updateObject(sceneCamera.id,{position:{x:camera.position.x*100,y:camera.position.y*100,z:camera.position.z*100},rotation:{x:0,y:0,z:0}});
        const palette=state.palette||cubePalette,dark=palette.theme==='demain-soir-bleu';
        if(lastPalette!==palette.theme){lastPalette=palette.theme;surface.dark.value=dark?1:0;surface.base.value.set(dark?'#dddddd':'#484848');void api.updateObject(backdrop.id,{material:{color:dark?'#002451':'#f2f2f2'}});markers.filter(Boolean).forEach(marker=>void api.updateObject(marker.id,{material:{color:dark?'#b4bfd3':'#343434'}}));}
        surface.hover.value=state.hover;
        if(p.overlayPhase!==lastOverlay){alphaAt=now;alphaFrom=surface.alpha.value;lastOverlay=p.overlayPhase;}
        const fade=clamp((now-alphaAt)/(timing.fadeMs||1),0,1),fadeEase=fade*fade*(3-2*fade);
        surface.alpha.value=p.overlayPhase==='open'?0:p.overlayPhase==='fading-in'?alphaFrom*(1-fadeEase):p.overlayPhase==='fading-out'?alphaFrom+(1-alphaFrom)*fadeEase:1;
        const markerAlpha=p.isZoomed?0:85;if(markerAlpha!==lastMarkerAlpha){lastMarkerAlpha=markerAlpha;markers.filter(Boolean).forEach(marker=>void api.updateObject(marker.id,{material:{alpha:markerAlpha}}));}
      };
      tick(performance.now());
    })().catch(error=>console.error('DinoWeb Spline bridge failed',error));
    return()=>{disposed=true;cancelAnimationFrame(frame);cleanups.forEach(fn=>fn());hit.geometry.dispose();hit.material.dispose();runtime.current=null;};
  },[]);
  return <div ref={element} className="cube-entrance absolute inset-0" data-renderer="worker" data-cursor-label="ROTATE" data-cursor-pressed-label="DRAG" style={{zIndex:props.canvasZIndex,touchAction:'none'}} />;
}
SplineCubeStage.prepareResources=()=>window.spline?.ready||Promise.resolve();
