import{Dr as e,E as t,Jn as n,Kt as r,L as i,Lr as a,Mr as o,O as s,Ot as c,P as l,Q as u,X as d,Yt as f,er as p,et as m,i as h,ii as g,jn as _,lt as v,qr as y,tn as b,vt as x,wt as S,xi as C}from"./runtime-chunk-KPOUV3HD-CpaXHhAq.js";import{n as w,r as T}from"./runtime-chunk-TZCHGFVF-3CJiZcdT.js";import{g as E,j as D}from"./runtime-chunk-NY4SLVL4-ze-S03el.js";import{a as O,n as k}from"./runtime-chunk-PYMHVL3C-DIqEl9Nu.js";import"./runtime-chunk-52FUITQN-3W8M8qEZ.js";import{g as A,h as j}from"./runtime-chunk-7TRY6CGZ-BxKYWZx5.js";import{a as M,n as N,r as P}from"./runtime-chunk-GFTBNL2W-xOoWAF2a.js";var F=new c,I=new _,L=new h,R=new h,z=new h,B=class{constructor(e){this.geometry=e.geometry,this.randomFunction=Math.random,this.indexAttribute=this.geometry.index,this.positionAttribute=this.geometry.getAttribute(`position`),this.normalAttribute=this.geometry.getAttribute(`normal`),this.colorAttribute=this.geometry.getAttribute(`color`),this.uvAttribute=this.geometry.getAttribute(`uv`),this.weightAttribute=null,this.distribution=null}setWeightAttribute(e){return this.weightAttribute=e?this.geometry.getAttribute(e):null,this}build(){let e=this.indexAttribute,t=this.positionAttribute,n=this.weightAttribute,r=e?e.count/3:t.count/3,i=new Float32Array(r);for(let a=0;a<r;a++){let r=1,o=3*a,s=3*a+1,c=3*a+2;e&&(o=e.getX(o),s=e.getX(s),c=e.getX(c)),n&&(r=n.getX(o)+n.getX(s)+n.getX(c)),F.a.fromBufferAttribute(t,o),F.b.fromBufferAttribute(t,s),F.c.fromBufferAttribute(t,c),r*=F.getArea(),i[a]=r}let a=new Float32Array(r),o=0;for(let e=0;e<r;e++)o+=i[e],a[e]=o;return this.distribution=a,this}setRandomGenerator(e){return this.randomFunction=e,this}sample(e,t,n,r){let i=this._sampleFaceIndex();return this._sampleFace(i,e,t,n,r)}_sampleFaceIndex(){let e=this.distribution[this.distribution.length-1];return this._binarySearch(this.randomFunction()*e)}_binarySearch(e){let t=this.distribution,n=0,r=t.length-1,i=-1;for(;n<=r;){let a=Math.ceil((n+r)/2);if(a===0||t[a-1]<=e&&t[a]>e){i=a;break}e<t[a]?r=a-1:n=a+1}return i}_sampleFace(e,t,n,r,i){let a=this.randomFunction(),o=this.randomFunction();a+o>1&&(a=1-a,o=1-o);let s=this.indexAttribute,c=3*e,l=3*e+1,u=3*e+2;return s&&(c=s.getX(c),l=s.getX(l),u=s.getX(u)),F.a.fromBufferAttribute(this.positionAttribute,c),F.b.fromBufferAttribute(this.positionAttribute,l),F.c.fromBufferAttribute(this.positionAttribute,u),t.set(0,0,0).addScaledVector(F.a,a).addScaledVector(F.b,o).addScaledVector(F.c,1-(a+o)),n!==void 0&&(this.normalAttribute===void 0?F.getNormal(n):(F.a.fromBufferAttribute(this.normalAttribute,c),F.b.fromBufferAttribute(this.normalAttribute,l),F.c.fromBufferAttribute(this.normalAttribute,u),n.set(0,0,0).addScaledVector(F.a,a).addScaledVector(F.b,o).addScaledVector(F.c,1-(a+o)).normalize())),r!==void 0&&this.colorAttribute!==void 0&&(F.a.fromBufferAttribute(this.colorAttribute,c),F.b.fromBufferAttribute(this.colorAttribute,l),F.c.fromBufferAttribute(this.colorAttribute,u),I.set(0,0,0).addScaledVector(F.a,a).addScaledVector(F.b,o).addScaledVector(F.c,1-(a+o)),r.r=I.x,r.g=I.y,r.b=I.z),i!==void 0&&this.uvAttribute!==void 0&&(L.fromBufferAttribute(this.uvAttribute,c),R.fromBufferAttribute(this.uvAttribute,l),z.fromBufferAttribute(this.uvAttribute,u),i.set(0,0).addScaledVector(L,a).addScaledVector(R,o).addScaledVector(z,1-(a+o))),this}};function V(e,t){let n=e,r=new Float32Array(4*t*t);for(let e=0;e<t*t;e++)r[4*e]=n[3*e],r[4*e+1]=n[3*e+1],r[4*e+2]=n[3*e+2],r[4*e+3]=0;let i=new u(r,t,t,S,C);return i.needsUpdate=!0,i}var H=class{constructor(e,t,n,r){this.type=`SphereEmitterShape`,this.targetMesh=void 0,this.size=e,this.type=n,this.textureSize=function(e){return Math.max(Math.ceil(Math.sqrt(e)),1)}(t),this.targetMesh=r?.geometry.type===`BufferGeometry`||r?.type===`Mesh`&&r&&r.geometry.hasAttribute(`position`)&&r.geometry.hasAttribute(`normal`)?r:this.getMesh(n,1);let{positions:i,dataTexture:a,dataTextureNormals:o}=this.createPositions(this.textureSize,this.targetMesh??this.getMesh(n,1));this.positionsTexture=a,this.positionsAttribute=i,this.directionsTexture=o}createPositions(e,t){let{positions:n,normals:r}=function(e,t){let n=new l(e.geometry,e.material),r=[],i=[],a=new _,o=new _;n.geometry.index!==null&&(n.geometry=n.geometry.toNonIndexed());let s=new B(n).build();for(let e=0;e<t;e++)s.sample(a,o),r.push(a.x,a.y,a.z),i.push(o.x,o.y,o.z);return{positions:new Float32Array(r),normals:new Float32Array(i)}}(t,e*e);return{dataTexture:V(n,e),positions:n,dataTextureNormals:V(r,e)}}getMesh(e,t){let i=null;switch(e){case`SphereEmitterShape`:i=new f(.5*t,32,32);break;case`TorusEmitterShape`:i=new b(.5*t,.3,15,40);break;case`ConeEmitterShape`:i=new o(t,t,15);break;case`BoxEmitterShape`:i=new n(t,t,t);break;case`PlaneEmitterShape`:i=new r(t,t),i.rotateX(-Math.PI/2);break;default:i=new f(t,32,32)}return new l(i,new s({color:16711680}))}applyToShader(e,t){this.size=new _().fromArray(t.size.map(e=>typeof e==`number`?e:1)),e.uEmitterSize.value=this.size}dispose(){this.positionsTexture.dispose(),this.directionsTexture.dispose(),this.positionsAttribute=new Float32Array}};function U(e){let t={...e},n=E.defaultData;t.forceFieldObjectId&&(t.colliderEntityId=t.forceFieldObjectId);let r={...n.shape,...t.shape},i={...n.renderMaterial,...t.renderMaterial};return{...n,...t,shape:r,renderMaterial:i}}var W=class extends y{constructor(e,t){super(),this.type=`ParticleEmitter`,this.debugMode=!1,this.worldSpace=!0,this.rootObject=null,this.gpuCompute=null,this.positionSimRT=null,this.velocitySimRT=null,this.emissionRateSimRT=null,this.emitterShape=void 0,this.isEmitting=!1,this.hasBeenReset=!1,this.emittedParticlesAmount=0,this.lastEmitTime=0,this.globalTime=0,this.targetFPS=60,this.previousRatio=1,this.lerpFactor=.4,this.particlesAmount=0,this.noiseStrength=0,this.noiseScale=0,this.isBillboardBased=!0,this.simFeaturesDefinition={USE_COLLIDER:!1,USE_ATTRACTOR:!1,USE_VORTEX:!1,USE_SPHERE_COLLIDER:!1,USE_BOX_COLLIDER:!1,USE_FORCE_LOCAL_SPACE:!1,USE_NORMALS:!1,USE_CURL_NOISE:!0,USE_SIMPLEX_NOISE:!1,USE_FBM_NOISE:!1},this.textureLoader=new d,this.textureRequestId=0,this.currentWorldPosition=new _,this.systemQuaternion=new m,this.worldGravity=new _(0,0,0),this.directionAxis=new _(0,0,0),this.colliderV3=new _(0,0,0),this.colliderQuaternion=new m(0,0,0,1),this.matrixAutoUpdate=!0,this.renderer=e,this.system=t,this.shared=t.context.shared;let n=t.data;this.material=P(e)?M()?.createMaterial(n.renderMaterial,t.context)??N().createMaterial(n.renderMaterial,t.context):N().createMaterial(n.renderMaterial,t.context),this.material.uniforms={uSize:{value:0},uSizeEnd:{value:0},uColor:{value:n.renderMaterial.color},uColor2:{value:n.renderMaterial.color2},uPosition:{value:new _(0,0,0)},uEmissionData:{value:new _(0,0,0)},uTexture:{value:this.defaultTexture},uWorldOffset:{value:new _(0,0,0)},uWorldQuaternion:{value:new v(0,0,0,1)},uRandScaleFactor:{value:n.randomScale??0},uRandRotationFactor:{value:n.randomRotation??0},uRotation:{value:n.renderMaterial.spriteRotation[0]??0},uRotationEnd:{value:n.renderMaterial.spriteRotation[1]??0}},this.setTexture(this.material.uniforms,n.renderMaterial.texture),this.init(n)}setTexture(e,t){let n=t.data,r=++this.textureRequestId;if(typeof t==`string`){let n=this.shared.image(t),i=()=>{if(r!==this.textureRequestId)return;let t=new g(n.img);t.needsUpdate=!0,e.uTexture.value=t};n.loaded?i():n.loadPromise.then(i);return}if(typeof n!=`string`){let t=new Image;t.onload=()=>{if(r!==this.textureRequestId)return;let n=new g(t);n.needsUpdate=!0,e.uTexture.value=n};let i=new Blob([n],{type:`image/*`});t.src=URL.createObjectURL(i)}}updateGeometryAttributes(e,t){let n=function(e){let t=new Float32Array(e*e*2);for(let n=0;n<e;n++)for(let r=0;r<e;r++){let i=n*e+r;t[2*i+0]=n/(e-1),t[2*i+1]=r/(e-1)}return t}(t);if(!this.emitterShape?.positionsAttribute)return;let r=new a(n,2);e.geometry.setAttribute(`ref`,r),P(this.renderer)&&e.geometry.setAttribute(`particleRef`,r)}applyWorldSpace(){if(!(this.system.started&&this.worldSpace&&this.positionSimRT&&this.velocitySimRT))return;let e=this.system;e.getWorldQuaternion(this.systemQuaternion),this.systemQuaternion.invert(),e.getWorldPosition(this.currentWorldPosition),this.material.uniforms.uWorldOffset.value=this.currentWorldPosition,this.material.uniforms.uWorldQuaternion.value.copy(this.systemQuaternion.normalize()),this.positionSimRT.material.uniforms.uWorldOffset.value=this.currentWorldPosition,this.systemQuaternion.invert(),this.positionSimRT.material.uniforms.uWorldQuaternion.value.copy(this.systemQuaternion.normalize()),this.velocitySimRT.material.uniforms.uWorldQuaternion.value.copy(this.systemQuaternion.normalize())}update(e,t){if(!this.gpuCompute||!this.positionSimRT||!this.velocitySimRT||!this.emissionRateSimRT||this.hasBeenReset)return;if(this.checkIfAllParticlesAreDead()&&!this.hasBeenReset)return void this.reset();this.applyWorldSpace(),this.globalTime=e,this.positionSimRT.material.uniforms.uTime.value=e,this.emissionRateSimRT.material.uniforms.uTime.value=e;let n=1e3/t,r=this.targetFPS/n,i=this.previousRatio+(r-this.previousRatio)*this.lerpFactor;this.positionSimRT.material.uniforms.uFPSRatio.value=i,this.previousRatio=i;let a=this.isEmitting?this.GoEmitSomeParticles(e,this.system.data.birthRatePerSec):0;this.emissionRateSimRT.material.uniforms.uLastIndexEmitted.value=this.emittedParticlesAmount,this.emissionRateSimRT.material.uniforms.uParticlesToEmit.value=a,this.material.uniforms.uPosition.value=this.gpuCompute.getCurrentRenderTarget(this.positionSimRT)?.texture,this.system.colliderEntities.length>0&&this.renderColliders(),this.gpuCompute.compute()}renderColliders(){if(!this.velocitySimRT)return;let e=this.system.colliderEntities[0],t=this.simFeaturesDefinition.USE_COLLIDER||this.simFeaturesDefinition.USE_ATTRACTOR||this.simFeaturesDefinition.USE_VORTEX;if(e.destroyedInAction&&t&&this.init(U({...this.system.data,colliderEntityId:null})),!e||e.destroyedInAction)return;e.getWorldPosition(this.colliderV3),this.colliderV3.y===0&&(this.colliderV3.y=1e-4),this.velocitySimRT.material.uniforms.uColliderPos.value.copy(this.colliderV3);let n=e.data.size;this.colliderV3.fromArray(n),this.velocitySimRT.material.uniforms.uColliderSize.value.copy(this.simFeaturesDefinition.USE_SPHERE_COLLIDER?this.colliderV3.multiplyScalar(.5):this.colliderV3),e.getWorldQuaternion(this.colliderQuaternion),this.velocitySimRT.material.uniforms.uColliderQuaternion.value.copy(this.colliderQuaternion.normalize()),this.velocitySimRT.material.uniforms.uColliderQuaternionInvert.value.copy(this.colliderQuaternion.normalize().invert())}updateState(e){!this.velocitySimRT||!this.positionSimRT||(e.renderMaterial&&this.updateMaterialState(e.renderMaterial),this.updateParticleState(e))}updateVariableState(e,t){if(!this.velocitySimRT||!this.positionSimRT)return;t[2]===`size`&&this.material.updateState({size:[e,this.material.uniforms.uSizeEnd.value]}),t[2]===`sizeEnd`&&this.material.updateState({size:[this.material.uniforms.uSize.value,e]});let n=(e,t)=>{let n=[...this.system.data.shape.size];n[e]=t,this.updateParticleState({shape:{...this.system.data.shape,size:n}})};t[2]===`shape_size_0`&&n(0,e),t[2]===`shape_size_1`&&n(1,e),t[2]===`shape_size_2`&&n(2,e),t[2]===`speed`&&(this.velocitySimRT.material.uniforms.uSpeed.value=e/10),t[2]===`gravity`&&this.worldGravity.set(0,e/100,0),t[2]===`noiseStrength`&&(this.noiseStrength=e,this.velocitySimRT.material.uniforms.uNoiseStrength.value=this.noiseStrength),t[2]===`noiseScale`&&(this.noiseScale=e,this.velocitySimRT.material.uniforms.uNoiseScale.value=this.noiseScale),t[2]===`direction_x`&&(this.directionAxis=this.getDirectionAxis([Number(e),this.system.data.direction[1],this.system.data.direction[2]])),t[2]===`direction_y`&&(this.directionAxis=this.getDirectionAxis([this.system.data.direction[0],Number(e),this.system.data.direction[2]])),t[2]===`direction_z`&&(this.directionAxis=this.getDirectionAxis([this.system.data.direction[0],this.system.data.direction[1],Number(e)]))}updateMaterialState(e){this.material.updateState({...e,size:e.size?[Number(this.shared.getVariable(e.size[0],[this.uuid,`particles`,`size`])),Number(this.shared.getVariable(e.size[1],[this.uuid,`particles`,`sizeEnd`]))]:[0,0]}),e.texture&&(this.setTexture(this.material.uniforms,e.texture),this.material.needsUpdate=!0)}updateParticleState(e){if(this.positionSimRT&&this.velocitySimRT){if(this.shouldReInitGPUCompute(e)&&this.init(U(this.system.data)),e.life!==void 0&&(this.positionSimRT.material.uniforms.uMaxLifeTime.value=e.life),e.speed!==void 0&&(this.velocitySimRT.material.uniforms.uSpeed.value=Number(this.shared.getVariable(e.speed,[this.uuid,`particles`,`speed`]))/10),e.collisionBounce!==void 0&&(this.velocitySimRT.material.uniforms.uBounce.value=e.collisionBounce),e.noiseStrength!==void 0&&(this.noiseStrength=Number(this.shared.getVariable(e.noiseStrength,[this.uuid,`particles`,`noiseStrength`])),this.velocitySimRT.material.uniforms.uNoiseStrength.value=this.noiseStrength),e.noiseScale!==void 0&&(this.noiseScale=Number(this.shared.getVariable(e.noiseScale,[this.uuid,`particles`,`noiseScale`])),this.velocitySimRT.material.uniforms.uNoiseScale.value=this.noiseScale),e.noiseSeed!==void 0&&(this.velocitySimRT.material.uniforms.uNoiseSeed.value=e.noiseSeed),e.randomMass!==void 0&&(this.velocitySimRT.material.uniforms.uRandomMassFactor.value=e.randomMass),e.renderMaterial?.size!==void 0){let t=this.shared.getVariable(e.renderMaterial.size[0],[this.uuid,`particles`,`size`]);this.velocitySimRT.material.uniforms.particleSize.value=Number(t)}if(e.renderMaterial?.spriteRotation!==void 0&&(this.material.uniforms.uRotation.value=e.renderMaterial.spriteRotation[0],this.material.uniforms.uRotationEnd.value=e.renderMaterial.spriteRotation[1]),e.shape!==void 0){let t=e.shape.size??this.system.data.shape.size,n=[Number(this.shared.getVariable(t[0],[this.uuid,`particles`,`shape_size_0`])),Number(this.shared.getVariable(t[1],[this.uuid,`particles`,`shape_size_1`])),Number(this.shared.getVariable(t[2],[this.uuid,`particles`,`shape_size_2`]))],r={...U(this.system.data).shape,size:n};this.emitterShape?.applyToShader(this.positionSimRT.material.uniforms,r)}if(e.gravity!==void 0&&(this.worldGravity.set(0,Number(this.shared.getVariable(this.system.data.gravity,[this.uuid,`particles`,`gravity`]))/100,0),this.velocitySimRT.material.uniforms.uGravity={value:this.worldGravity}),e.direction!==void 0){let t=this.getDirectionFromVariable(e.direction);this.directionAxis=this.getDirectionAxis(t),this.velocitySimRT.material.uniforms.uDirectionsAxis.value=this.directionAxis}e.randomRotation!==void 0&&(this.material.uniforms.uRandRotationFactor.value=e.randomRotation),e.randomScale!==void 0&&(this.material.uniforms.uRandScaleFactor.value=e.randomScale)}}updateForceFieldParameters(e){!this.velocitySimRT||(e.forceIntensity!==void 0&&(this.velocitySimRT.material.uniforms.uForceIntensity.value=e.forceIntensity),e.forceDambing!==void 0&&(this.velocitySimRT.material.uniforms.uForceDamping.value=e.forceDambing))}getDirectionAxis(e){let n=[Number(e[0])*i.DEG2RAD,Number(e[1])*i.DEG2RAD,Number(e[2])*i.DEG2RAD],r=new t(n[0],n[1],n[2],`XYZ`);return this.directionAxis.set(0,1,0).applyEuler(r).normalize(),this.velocitySimRT&&(this.velocitySimRT.material.uniforms.uDirectionsAxis.value=this.directionAxis),this.directionAxis}shouldReInitGPUCompute(e){let{birthRatePerSec:t,rootObjectType:n,colliderEntityId:r,shape:i,emitTimeDuration:a,emitTimeCycle:o,life:s,directionMode:c,noiseType:l}=e;return t!==void 0||n!==void 0||r||r===null||o!==void 0||i!==void 0||s!==void 0||a!==void 0||c!==void 0||l!==void 0}init(e){this.dispose(),this.particlesAmount=this.getMaxParticlesAmount({birthRatePerSecond:e.birthRatePerSec,particleMaxLifeTime:e.life,loopDuration:e.emitTimeCycle===`infinity`?0:e.emitTimeDuration}),this.particlesAmount>1e5&&(console.warn(`The maximum number of particles is limited to 100000.`),this.particlesAmount=1e5),this.emitterShape=this.createShape(e.shape,this.particlesAmount);let t=setInterval(()=>{if(!this.emitterShape)return;let n=this.emitterShape.positionsTexture.source.data.data;n&&!isNaN(n[0])?clearInterval(t):this.init(e)},100);if(!this.emitterShape)return;let n=this.updateSimulationDefinition(e),r=P(this.renderer)?M().createComputation(this.emitterShape.textureSize,this.emitterShape.textureSize,this.renderer,this.simFeaturesDefinition):N().createComputation(this.emitterShape.textureSize,this.emitterShape.textureSize,this.renderer),i=r.addVariable(`uCurrentPosition`,n+`



uniform sampler2D uOriginalPosition;
uniform float uTime;
uniform float uSpeed;     
uniform vec3 uWorldOffset;    
uniform vec4 uWorldQuaternion;
uniform float uMaxLifeTime;
uniform vec3 uEmitterSize;
uniform float uFPSRatio;     

float random (vec2 st) {
    return fract(sin(dot(st.xy,
        vec2(12.9898,78.233)))*
        43758.5453123);
}
vec3 applyQuaternionToVector( vec4 q, vec3 v ){
    return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
}

vec3 applyForce(vec3 force, float mass) {
    vec3 acceleration = force / mass;
    
    return acceleration;
  }
  

void main() {
    vec2 vUv = gl_FragCoord.xy / resolution.xy;
    vec3 position = texture2D( uCurrentPosition, vUv ).xyz;
    float currentLife = texture2D( uCurrentPosition, vUv ).w;   
    float isSpawning = texture2D( uCurrentEmissionRate, vUv ).r;        
    float isActive = texture2D( uCurrentEmissionRate, vUv ).g;          
    float timeStart = texture2D( uCurrentEmissionRate, vUv ).b;         
    vec3 originalPosition = ((texture2D( uOriginalPosition, vUv ).xyz) * uEmitterSize);
    vec3 velocity = texture2D( uCurrentVelocity, vUv ).xyz;
    float collisionFlag = texture2D( uCurrentVelocity, vUv ).w;             
    float lifeTime = uMaxLifeTime;

    
    
    float isColliding = step(0.5, collisionFlag); 
    float bounceOffset = 3.0 * isColliding; 
    vec3 collisionAdjustedVelocity = velocity * (1.0 + bounceOffset);

    
    vec3 fpsVelocity = velocity * min(uFPSRatio, 5.0);
    position += mix(fpsVelocity, collisionAdjustedVelocity, isColliding);

    
    
    
    vec3 newPosition = applyQuaternionToVector(uWorldQuaternion, originalPosition) + uWorldOffset;
    originalPosition = mix(originalPosition, newPosition, isSpawning);
    position = mix(position, originalPosition, isSpawning);;
    timeStart = mix(timeStart, uTime, isSpawning);

    
    float timeLeft = max(lifeTime - (uTime - timeStart), 0.0);
    float life_Normalize = timeLeft / lifeTime;

    
    vec4 activeColor = vec4(position, life_Normalize);
    
    gl_FragColor = mix(vec4(0.0), activeColor, isActive);

}
`,this.emitterShape.positionsTexture),a=r.addVariable(`uCurrentVelocity`,n+`



uniform sampler2D uOriginalPosition;
uniform sampler2D uDirections;     
uniform vec3 uDirectionsAxis;
uniform vec4 uWorldQuaternion;
uniform vec3 uGravity;        
uniform float uNoiseStrength;     
uniform float uNoiseScale;        
uniform float uNoiseSeed;         
uniform float particleSize;
uniform float uSpeed;     
uniform float uRandomMassFactor;


uniform vec3 uColliderPos;                
uniform vec3 uColliderSize;               
uniform vec4 uColliderQuaternion;         
uniform vec4 uColliderQuaternionInvert;   
uniform float uBounce;                    
uniform float uForceDamping;
uniform float uForceIntensity;




    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 permute(vec4 x) {
        return mod289(((x*34.0)+1.0)*x);
    }
    
    vec4 taylorInvSqrt(vec4 r)
    {
    return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

    float snoise(vec3 v)
    {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; 
    vec3 x3 = x0 - D.yyy;      
    
    
    i = mod289(i);
    vec4 p = permute( permute( permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    
    
    
    float n_ = 0.142857142857; 
    vec3  ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
    }
    
    vec3 snoiseVec3( vec3 x ){
    
      float s  = snoise(vec3( x ));
      float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
      float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
      vec3 c = vec3( s , s1 , s2 );
      return c;
    
    }
    
      
    vec3 curlNoise( vec3 p, float seed){
      p += seed;
      const float e = .1;
      vec3 dx = vec3( e   , 0.0 , 0.0 );
      vec3 dy = vec3( 0.0 , e   , 0.0 );
      vec3 dz = vec3( 0.0 , 0.0 , e   );
    
      vec3 p_x0 = snoiseVec3( p - dx );
      vec3 p_x1 = snoiseVec3( p + dx );
      vec3 p_y0 = snoiseVec3( p - dy );
      vec3 p_y1 = snoiseVec3( p + dy );
      vec3 p_z0 = snoiseVec3( p - dz );
      vec3 p_z1 = snoiseVec3( p + dz );
    
      float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
      float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
      float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
    
      const float divisor = 1.0 / ( 2.0 * e );
      return normalize( vec3( x , y , z ) * divisor );
    
    }



float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); 
  vec3 Pi1 = Pi0 + vec3(1.0); 
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); 
  vec3 Pf1 = Pf0 - vec3(1.0); 
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}


vec3 fbm_vec3(vec3 p, float frequency, float offset)
{
  return vec3(
    cnoise((p+vec3(offset))*frequency),
    cnoise((p+vec3(offset+20.0))*frequency),
    cnoise((p+vec3(offset-30.0))*frequency)
  );
}


float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
vec3 applyQuaternionToVector( vec4 q, vec3 v ){
    return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
 } 
vec3 applyForce(vec3 force, float mass) {
  vec3 acceleration = force / mass;
  
  return acceleration;
}

vec4 conjugate(vec4 q) {
  return vec4(q.w, -q.x, -q.y, -q.z);
}


vec3 ellipsoidNormal(vec3 p, vec3 radii) {
  return normalize(p / (radii * radii));
}

float friction = .3;

void main() {
    vec2 vUv = gl_FragCoord.xy / resolution.xy;
    vec3 position = texture2D( uCurrentPosition, vUv ).xyz;
    vec3 originalPosition = texture2D( uOriginalPosition, vUv ).xyz;
    float timeLeft = texture2D( uCurrentPosition, vUv ).w;
    vec3 directions = texture2D( uDirections, vUv ).xyz;    
    vec3 velocity = texture2D( uCurrentVelocity, vUv ).xyz;
    float mass = rand(originalPosition.xy) * 0.5 + 0.5;
    float isSpawning = texture2D( uCurrentEmissionRate, vUv ).x;        
    float isActive = texture2D( uCurrentEmissionRate, vUv ).y;          
    float collisionFlag =texture2D( uCurrentVelocity, vUv ).w;          

    
    mass = (1.0 - (uRandomMassFactor * mass));
    
    if (isActive == 1.0) {
      
      
      
      #ifdef USE_CURL_NOISE
        if (uNoiseScale > 0.0 ) {
          velocity = curlNoise(position * uNoiseScale * .002, uNoiseSeed) * ( uNoiseStrength + 1.0) * .05 * uSpeed;
        }
        
        if (uNoiseStrength > 0.0 && uNoiseScale == 0.0 ) {
          velocity += curlNoise( position, uNoiseSeed)  * uNoiseStrength * 0.05 * uSpeed;
        }
      #endif
      
      #ifdef USE_SIMPLEX_NOISE
        if (uNoiseScale > 0.0 ) {
          velocity = vec3(snoise(position * uNoiseScale * .001) * ( uNoiseStrength + 1.0) * .1);
          velocity *= uSpeed;
        }
        
        if (uNoiseStrength > 0.0 && uNoiseScale == 0.0) {
          velocity += vec3(snoise(position * uNoiseStrength * .001) * .05 * uSpeed);
        }
      #endif
      
      #ifdef USE_FBM_NOISE
        if (uNoiseScale > 0.0 ) {
          velocity = fbm_vec3(position * uNoiseScale * .001, ( uNoiseStrength + 1.0), uNoiseSeed);
          velocity *= uSpeed;
        }
        
        if (uNoiseStrength > 0.0 && uNoiseScale == 0.0 ) {      
          velocity += fbm_vec3(position * uNoiseStrength * .001, ( uNoiseStrength + 1.0), uNoiseSeed) * .1 * uSpeed;
        }
      #endif

      
      
  #ifdef USE_COLLIDER
    float restitution = max(uBounce * 2., .01); 
    
    
    #ifdef USE_SPHERE_COLLIDER       
      
      vec3 radii = uColliderSize;
      
      vec3 relPos = position - uColliderPos;
      
      relPos = applyQuaternionToVector(uColliderQuaternionInvert, relPos);            
      
      vec3 scaledPos = relPos / radii;
      
      float dist = length(scaledPos); 
      
      
      if (dist <= 1. + particleSize / length(radii) && collisionFlag == 0.0) {
          
        vec3 adjustedPos = scaledPos * (1.0 + particleSize / length(radii));          
        
        vec3 normal = ellipsoidNormal(adjustedPos, radii);
        
        normal = applyQuaternionToVector(uColliderQuaternion, normal);
        
        velocity = reflect(velocity, normal) * restitution;

        collisionFlag = 1.0;
      } else {
        collisionFlag = 0.0;
      }
    #endif

    
    
    #ifdef USE_BOX_COLLIDER
      
      vec3 boxHalfSize = uColliderSize / 2.0;
      
      vec3 localPos = applyQuaternionToVector(uColliderQuaternionInvert, position - uColliderPos);      
      
      vec3 localDistance = abs(localPos) - boxHalfSize;
      float distToSurface = max(localDistance.x, max(localDistance.y, localDistance.z));    

      
      if (distToSurface <= particleSize * 0.5 && collisionFlag == 0.0) {      
        
        vec3 normal;
        if (localDistance.x > localDistance.y && localDistance.x > localDistance.z) {
            normal = vec3(sign(localPos.x), 0.0, 0.0);
        } else if (localDistance.y > localDistance.z) {
            normal = vec3(0.0, sign(localPos.y), 0.0);
        } else {
            normal = vec3(0.0, 0.0, sign(localPos.z));
        }            
        
        normal = applyQuaternionToVector(uColliderQuaternion, normal);      
        
        velocity = reflect(velocity, normal) * restitution;
        
        collisionFlag = 1.0;
      } else {
        collisionFlag = 0.0;
      }
    #endif      
  #endif      
  

      
      
  #ifdef USE_ATTRACTOR

      #ifdef USE_SPHERE_COLLIDER      
        
        vec3 radii = uColliderSize;
        
        vec3 relPos = position - uColliderPos;
        
        relPos = applyQuaternionToVector(uColliderQuaternionInvert, relPos);            
        
        vec3 scaledPos = relPos / radii;
        
        float distToSurface = length(scaledPos); 
        float insideCheck = 1.0;

      #endif


      #ifdef USE_BOX_COLLIDER
        
        vec3 boxHalfSize = uColliderSize / 2.0;
        
        vec3 localPos = applyQuaternionToVector(uColliderQuaternionInvert, position - uColliderPos);      
        vec3 localDistance = abs(localPos) - boxHalfSize;
        float distToSurface = max(localDistance.x, max(localDistance.y, localDistance.z));
        float insideCheck = particleSize;
      #endif      
  
      
      #ifdef USE_FORCE_LOCAL_SPACE
        if (distToSurface <= insideCheck ) {    
            
            #ifdef USE_SPHERE_COLLIDER      
              float attractorStrength = (1.0 - distToSurface ) * uForceIntensity; 
            #endif

            #ifdef USE_BOX_COLLIDER
              float attractorStrength = max((1.0 - insideCheck / distToSurface), 0.) * uForceIntensity; 
              #endif

            float attractorDamping = uForceDamping;  
          
            
            vec3 attractorRadii = uColliderSize;
            
            vec3 relPos = position - uColliderPos;
            
            relPos = applyQuaternionToVector(uColliderQuaternionInvert, relPos);            
            
            vec3 scaledPos = relPos / attractorRadii;

            
            float attractorRadius = length(scaledPos);
            
            vec3 relativePosition = position - uColliderPos;
            
            vec3 attractorForce = normalize(relativePosition) * attractorStrength;
            
            velocity -= attractorForce;
            
            velocity *= attractorDamping;
        }
      #else 
            
            vec3 relativePosition = position - uColliderPos;
            
            vec3 attractorForce = normalize(relativePosition) * uForceIntensity;
            
            velocity -= attractorForce;
            
            velocity *= uForceDamping;
      #endif    
  #endif      
  
      
      
  #ifdef USE_VORTEX
    
    vec3 boxHalfSize = uColliderSize / 2.0;
    
    vec3 localPos = applyQuaternionToVector(uColliderQuaternionInvert, position - uColliderPos);      
    vec3 localDistance = abs(localPos) - boxHalfSize;
    float distToSurface = max(localDistance.x, max(localDistance.y, localDistance.z));

    
    if (distToSurface <= particleSize) {
      float vortexStrength = uForceIntensity;
      vec3 localTopCenter = vec3(0.0, 0., 0.0);

      
      vec3 vortexCenter = uColliderPos + applyQuaternionToVector(uColliderQuaternion, localTopCenter);
      
      vec3 vortexVector = vortexCenter - position;

      
      
      vec3 upVector = vec3(0.0, 1.0, 0.01);
      vec3 rotationAxis = cross(upVector, applyQuaternionToVector(uColliderQuaternion, vortexVector));
      rotationAxis = normalize(rotationAxis);

      
      float rotationSpeed = length(vortexVector * vortexStrength * 3.0) ; 

      vec3 rotationVelocity = rotationAxis * rotationSpeed;
      
      velocity = rotationVelocity * 0.005 ;

      
      
      
      vec3 originDirection = applyQuaternionToVector(uWorldQuaternion, directions);
      velocity += applyForce( originDirection * uSpeed * (1. - uForceDamping) , mass * .5);
    }
  #endif      

    } 
    

    
    
    
    #ifdef USE_NORMALS
      velocity = mix(velocity, applyQuaternionToVector(uWorldQuaternion, directions) * uSpeed, isSpawning);
    #else
      velocity = mix(velocity, applyQuaternionToVector(uWorldQuaternion, uDirectionsAxis) * uSpeed, isSpawning);    
    #endif
    
    
    velocity += applyForce(uGravity, mass * .5) * (1.0 - collisionFlag);

    gl_FragColor = vec4(velocity, collisionFlag);
}
`,this.emitterShape.directionsTexture),o=r.addVariable(`uCurrentEmissionRate`,`




uniform sampler2D uIndex; 
uniform float uLastIndexEmitted; 
uniform float uParticlesToEmit; 
uniform float uTime;

void main() {
    vec2 vUv = gl_FragCoord.xy / resolution.xy;
    float particleIndex = texture(uIndex, vUv).x;
    float timeLeft = texture2D( uCurrentPosition, vUv ).w;
    float isActive = texture2D( uCurrentEmissionRate, vUv ).g;    
    float timeStart = texture2D( uCurrentEmissionRate, vUv ).b;


    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    float emitLowerBound = step(uLastIndexEmitted, particleIndex);
    float emitUpperBound = step(particleIndex, uLastIndexEmitted + uParticlesToEmit - 1.0);
    float emitParticle = emitLowerBound * emitUpperBound; 

    
    timeStart = mix(timeStart, uTime, emitParticle);
    gl_FragColor = vec4(emitParticle, mix(isActive, 1.0, emitParticle), timeStart, 1.0);


}
`,function(e){let t=new Float32Array(4*e*e);for(let n=0;n<e*e;n++)t[4*n]=0,t[4*n+1]=0,t[4*n+2]=0,t[4*n+3]=0;let n=new u(t,e,e,S,C);return n.needsUpdate=!0,n}(this.emitterShape.textureSize));r.setVariableDependencies(i,[i,a,o]),r.setVariableDependencies(a,[i,a,o]),r.setVariableDependencies(o,[i,a,o]);let s=function({size:e}){let t=new Float32Array(4*e*e);for(let n=0;n<e*e;n++)t[4*n]=n,t[4*n+1]=0,t[4*n+2]=0,t[4*n+3]=0;let n=new u(t,e,e,S,C);return n.needsUpdate=!0,n}({size:this.emitterShape.textureSize}),c={uOriginalPosition:{value:this.emitterShape.positionsTexture},uWorldOffset:{value:new _(0,0,0)},uWorldQuaternion:{value:new v(0,0,0,1)},uTime:{value:0},uFPSRatio:{value:1},uMaxLifeTime:{value:e.life},uEmitterSize:{value:new _(Number(this.shared.getVariable(e.shape.size[0],[this.uuid,`particles`,`shape_size_0`])),Number(this.shared.getVariable(e.shape.size[1],[this.uuid,`particles`,`shape_size_1`])),Number(this.shared.getVariable(e.shape.size[2],[this.uuid,`particles`,`shape_size_2`])))},particleSize:{value:0}};i.material.uniforms=c;let l=this.getDirectionFromVariable(e.direction);this.directionAxis=this.getDirectionAxis(l),this.worldGravity.set(0,Number(this.shared.getVariable(this.system.data.gravity,[this.uuid,`particles`,`gravity`]))/100,0),this.noiseStrength=Number(this.shared.getVariable(e.noiseStrength,[this.uuid,`particles`,`noiseStrength`])),this.noiseScale=Number(this.shared.getVariable(e.noiseScale,[this.uuid,`particles`,`noiseScale`]));let d=e.colliderEntityId&&this.system.getColliderData(e.colliderEntityId),f={uOriginalPosition:{value:this.emitterShape.positionsTexture},uDirections:{value:this.emitterShape.directionsTexture},uDirectionsAxis:{value:this.directionAxis},uWorldQuaternion:{value:new v(0,0,0,1)},uColliderPos:{value:new _(0,0,0)},uColliderSize:{value:new _(0,0,0)},uForceIntensity:{value:d?d.forceIntensity:0},uForceDamping:{value:d?d.forceDambing:0},uColliderQuaternion:{value:new v(0,0,0,1)},uColliderQuaternionInvert:{value:new v(0,0,0,1)},particleSize:{value:0},uGravity:{value:this.worldGravity},uNoiseStrength:{value:this.noiseStrength},uNoiseScale:{value:this.noiseScale},uNoiseSeed:{value:e.noiseSeed},uRandomMassFactor:{value:e.randomMass},uBounce:{value:e.collisionBounce},uSpeed:{value:Number(this.shared.getVariable(e.speed,[this.uuid,`particles`,`speed`]))/10}};a.material.uniforms=f;let p={uIndex:{value:s},uTime:{value:0},uLastIndexEmitted:{value:0},uParticlesToEmit:{value:0}};o.material.uniforms=p;let m=[Number(this.shared.getVariable(e.shape.size[0],[this.uuid,`particles`,`shape_size_0`])),Number(this.shared.getVariable(e.shape.size[1],[this.uuid,`particles`,`shape_size_1`])),Number(this.shared.getVariable(e.shape.size[2],[this.uuid,`particles`,`shape_size_2`]))],h={...U(this.system.data).shape,size:m};this.emitterShape.applyToShader(i.material.uniforms,h),r.init(),this.gpuCompute=r,this.positionSimRT=i,this.velocitySimRT=a,this.emissionRateSimRT=o,this.material.uniforms.uPosition.value=r.getCurrentRenderTarget(i)?.texture,this.rootObject=this.createPrimaryEmitter(this.emitterShape.textureSize),this.add(this.rootObject),this.material.needsUpdate=!0}getDirectionFromVariable(e){return[Number(this.shared.getVariable(e[0],[this.uuid,`particles`,`direction_x`])),Number(this.shared.getVariable(e[1],[this.uuid,`particles`,`direction_y`])),Number(this.shared.getVariable(e[2],[this.uuid,`particles`,`direction_z`]))]}updateSimulationDefinition(e){if(this.simFeaturesDefinition.USE_COLLIDER=!1,this.simFeaturesDefinition.USE_ATTRACTOR=!1,this.simFeaturesDefinition.USE_VORTEX=!1,this.simFeaturesDefinition.USE_SPHERE_COLLIDER=!1,this.simFeaturesDefinition.USE_BOX_COLLIDER=!1,this.simFeaturesDefinition.USE_FORCE_LOCAL_SPACE=!1,this.simFeaturesDefinition.USE_NORMALS=!1,this.simFeaturesDefinition.USE_CURL_NOISE=!1,this.simFeaturesDefinition.USE_SIMPLEX_NOISE=!1,this.simFeaturesDefinition.USE_FBM_NOISE=!1,e.colliderEntityId&&this.system.colliderEntities.length>0){let t=this.system.getColliderData(e.colliderEntityId);switch(t?.forceType){case`attractor`:this.simFeaturesDefinition.USE_ATTRACTOR=!0;break;case`collider`:this.simFeaturesDefinition.USE_COLLIDER=!0;break;case`vortex`:this.simFeaturesDefinition.USE_VORTEX=!0}let n=t?.colliderType;n===`sphere`&&(this.simFeaturesDefinition.USE_SPHERE_COLLIDER=!0),n===`box`&&(this.simFeaturesDefinition.USE_BOX_COLLIDER=!0),t?.forceRange===`helper`&&(this.simFeaturesDefinition.USE_FORCE_LOCAL_SPACE=!0)}e.directionMode===`normals`&&(this.simFeaturesDefinition.USE_NORMALS=!0),e.noiseType===`curl`&&(this.simFeaturesDefinition.USE_CURL_NOISE=!0),e.noiseType===`simplex`&&(this.simFeaturesDefinition.USE_SIMPLEX_NOISE=!0),e.noiseType===`fbm`&&(this.simFeaturesDefinition.USE_FBM_NOISE=!0);let t=``;for(let[e,n]of Object.entries(this.simFeaturesDefinition))n&&(t+=`#define ${e}\n`);return t}createShape(e,t){this.emitterShape&&this.emitterShape.dispose();let n=new _(Number(this.shared.getVariable(e.size[0],[this.uuid,`particles`,`shape_size_0`])),Number(this.shared.getVariable(e.size[1],[this.uuid,`particles`,`shape_size_1`])),Number(this.shared.getVariable(e.size[2],[this.uuid,`particles`,`shape_size_2`])));if(e.type===`MeshEmitterShape`){let r=null;return this.system.context.scene.traverseEntity(t=>{t.uuid===e.fromMeshId&&(r=t)}),r?new H(n,t,e.type,r):new H(n,t,`SphereEmitterShape`)}return new H(n,t,e.type)}createPrimaryEmitter(t){let n=t*t,i=new e(new r(1,1,1),this.material,n);return i.renderOrder=1,this.updateGeometryAttributes(i,t),this.material.needsUpdate=!0,i.onBeforeRender=()=>{this.applyWorldSpace()},i}getMaxParticlesAmount({birthRatePerSecond:e,particleMaxLifeTime:t,loopDuration:n=0}){return Math.ceil(e*(t+n))}dispose(){!this.gpuCompute||(this.rootObject?.parent?.remove(this.rootObject),this.gpuCompute.dispose(),this.material.nodeMaterialDispose(),this.emitterShape?.dispose())}GoEmitSomeParticles(e,t){let n=e-this.lastEmitTime,r=1/t;if(n>=r){let t=Math.max(1,Math.floor(n/r));return this.lastEmitTime=e,this.emittedParticlesAmount+t>this.particlesAmount&&(this.emittedParticlesAmount=0),this.emittedParticlesAmount+=t,t}return 0}checkIfAllParticlesAreDead(){return this.lastEmitTime+this.system.data.life+1<this.globalTime}reset(){this.hasBeenReset=!0,this.lastEmitTime=0,this.emittedParticlesAmount=0,this.gpuCompute&&this.init(U(this.system.data))}startEmitting(e){this.isEmitting=!0,this.hasBeenReset=!1,this.lastEmitTime=e}stopEmitting(){this.isEmitting=!1}},G=class extends j{constructor(e,t,n){super(e,t),this.type=`ParticleSystem`,this.isParticleSystem=!0,this.geometry=new p,this.actualTime=0,this.currentLoopTime=0,this.started=!1,this.stopped=!1,this.timeoutId=void 0,this.isFrozen=!1,this.isIdle=!0,this.emitter=null,this.colliderEntities=[],this.renderer=null,this.isPreWarm=!1,this._hasOnAfterRenderBeenCalled=!1,this.onAfterRender=e=>{e.warmupInFlight||this._hasOnAfterRenderBeenCalled||(this._hasOnAfterRenderBeenCalled=!0,this.init(e))},this.context=n,this.data={...t,...U(t)},this.geometry.setAttribute(`position`,new x([],3)),this.material=new s({colorWrite:!1}),this.frustumCulled=!1}init(e){this.renderer=e,this.emitter=new W(e,this),this.add(this.emitter),this.updateParticleState(this.data)}update(e){if(!this.isReady||!this.started||this.isFrozen||this.isIdle)return;this.actualTime+=e,this.stopped||(this.currentLoopTime+=e);let t=this.data.emitTimeCycle===`one_time`;if((this.data.emitTimeCycle===`loop`||t)&&this.currentLoopTime>1e3*this.data.emitTimeDuration&&(this.stopped||(this.stop(),t||this.start(1e3*this.data.emitTimeDelay))),this.emitter&&this.started){let t=this.actualTime/1e3;this.emitter.update(t,e)}this.scale.set(1,1,1),this.updateMatrix()}isReady(){return!!this.emitter}hasCollider(e){return this.colliderEntities.some(t=>t.identity===e)}getColliderData(e){let t=this.colliderEntities.find(t=>t.identity===e);return t?t.data:null}updateByPatchedOp(e,t,n){super.updateByPatchedOp(e,t,n),A(e.path,[`renderMaterial`])&&this.updateParticleState({renderMaterial:{...this.data.renderMaterial,...D.drop(e,1).props}}),A(e.path,[`shape`])&&this.updateParticleState({shape:{...this.data.shape,...D.drop(e,1).props}})}updateState(e,t){super.updateState(e,t),this.updateParticleState(e)}updateParticleState(e){if(this.emitter){if(e.colliderEntityId!==void 0&&e.colliderEntityId!==null){let t=this.context.scene.find(e.colliderEntityId);this.colliderEntities=t?[t]:[]}e.colliderEntityId===null&&(this.colliderEntities=[]),this.emitter.updateState(e),e.emitTimeCycle&&this.started&&this.start()}}updateFromColliderEntity(e){!this.emitter||(this.emitter.updateForceFieldParameters(e),this.stop(),this.start())}start(e=0){this.currentLoopTime=0,e?this.timeoutId=window.setTimeout(()=>{this.start(0)},e):(this.started=!0,this.stopped=!1,this.isFrozen=!1,this.emitter?.startEmitting(this.actualTime/1e3),this._requestRender())}froze(){this.isFrozen=!0,this._requestRender()}unFroze(){this.isFrozen=!1,this._requestRender()}stop(){this.stopped=!0,this.currentLoopTime=0,this.emitter?.stopEmitting(),clearTimeout(this.timeoutId),this._requestRender()}reset(){this.started=!1,this.stopped=!1,this.emitter?.reset(),this._requestRender()}_requestRender(){this.context.shared.requestRender()}wakeUp(){this.isIdle=!1}sleep(){this.isIdle=!0,this.reset()}},K=class{constructor(e,t,n,r){this.data=e,this.page=t,this.shared=n,this.condition=r,this.delay=0,this.emission=e.emission,e.delay!==void 0&&(this.delay=e.delay),this.particleSystem=this.page.scene.find(this.data.emitterObjectId)}toggleEmitting(){this.particleSystem.started&&!this.particleSystem.stopped?this.stop(this.delay):this.start(this.delay)}toggleFroze(){this.particleSystem.started&&!this.particleSystem.isFrozen?this.freeze(this.delay):this.unFreeze(this.delay)}start(e=0){e?this.delayTimerId=window.setTimeout(()=>{this.start(0),this.clearDelay()},e):this.particleSystem.start()}stop(e=0){e?this.delayTimerId=window.setTimeout(()=>{this.stop(0),this.clearDelay()},e):this.particleSystem.stop()}freeze(e=0){e?this.delayTimerId=window.setTimeout(()=>{this.freeze(0),this.clearDelay()},e):this.particleSystem.froze()}unFreeze(e=0){e?this.delayTimerId=window.setTimeout(()=>{this.unFreeze(0),this.clearDelay()},e):this.particleSystem.unFroze()}reset(e=0){e?this.delayTimerId=window.setTimeout(()=>{this.reset(0),this.clearDelay()},e):this.particleSystem.reset()}reverseFromCurrent(){switch(this.emission){case`emitToggle`:this.toggleEmitting();break;case`pauseToggle`:this.toggleFroze()}}dispatchBasic(){if(!1===k(this.shared,this.condition)||!this.particleSystem)return!1;switch(this.emission){case`start`:this.start(this.delay);break;case`emitToggle`:this.toggleEmitting();break;case`pause`:this.freeze(this.delay);break;case`pauseToggle`:this.toggleFroze();break;case`stop`:this.stop(this.delay);break;case`reset`:this.reset(this.delay)}}dispatchConditional(){if(!1===k(this.shared,this.condition)||!this.particleSystem)return!1;switch(this.emission){case`start`:this.start(this.delay);break;case`stop`:this.stop(this.delay);break;case`reset`:this.reset(this.delay)}}dispatchGameControl(e){if(!1===k(this.shared,this.condition)||!this.particleSystem)return!1;e===`start`?this.start(this.delay):this.stop(this.delay)}dispose(){!this.particleSystem||(this.particleSystem.reset(),this.clearDelay())}clearDelay(){this.delayTimerId&&(clearTimeout(this.delayTimerId),delete this.delayTimerId)}};T(`Particle`,(e,t,n)=>new G(e,t,n)),O(`Particles`,({data:e,page:t,shared:n,actionCondition:r})=>new K(e,t,n,r)),w(`particles`);