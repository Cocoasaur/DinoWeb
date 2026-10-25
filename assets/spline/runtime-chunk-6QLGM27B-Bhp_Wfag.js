import{t as e}from"../index-DoqEn160.js";import{Br as t,Dn as n,Dr as r,Kn as i,Lr as a,Mt as o,Nt as s,O as c,P as l,Q as u,Qt as d,Xn as f,Zn as p,_r as m,ar as h,er as g,et as _,fn as ee,i as v,jn as y,l as te,mi as ne,on as b,pi as re,t as ie,vt as x,wt as ae,x as oe,xi as se}from"./runtime-chunk-KPOUV3HD-CpaXHhAq.js";import{n as S}from"./runtime-chunk-ML3Z74BL-NNqON7l0.js";import{i as C,l as w,s as T}from"./runtime-chunk-TZCHGFVF-3CJiZcdT.js";import{At as ce,Mt as le,Vt as ue,at as de,gt as fe,it as pe,ot as me,tt as he}from"./runtime-chunk-NY4SLVL4-ze-S03el.js";import{a as ge,c as E,i as _e,l as D,n as ve,r as O,t as k}from"./runtime-chunk-2PT2WH66-xlOF4GJL.js";import{_ as A,g as ye,h as be,n as xe,y as Se}from"./runtime-chunk-7TRY6CGZ-BxKYWZx5.js";import{$ as Ce,C as j,M as we,n as Te}from"./runtime-chunk-2HUMYYK7-CJI6_i0H.js";import{n as Ee,t as De}from"./runtime-chunk-IYAKCYLB-XmSNuS_a.js";import{r as Oe}from"./runtime-chunk-E5ILRC2A-ggOSfL4O.js";import{a as M,o as N,r as ke,s as P,t as F}from"./runtime-chunk-IAW24WOU-C79MawyK.js";import{t as Ae}from"./runtime-chunk-IXA2KDU3-DOIZoDU3.js";import{t as je}from"./runtime-chunk-K3573LAV-Dd9DChJq.js";import{t as I}from"./runtime-chunk-SDONCJER-B1Pyh1XR.js";import{t as Me}from"./runtime-chunk-UXOXNYKE-CxmV5BVf.js";import{n as Ne,t as Pe}from"./runtime-chunk-JZ5DCIEI-CM6RJ6H9.js";import{a as L,i as Fe,n as Ie,r as Le,s as Re}from"./runtime-chunk-DPEYXSWS-DBBTlaSa.js";import{t as ze}from"./runtime-chunk-OVCUHOM3-CZ5RYkPG.js";import{n as Be}from"./runtime-chunk-6NVC3IWW-CTsQ3iiC.js";var R=null;function Ve(e){R=e}var He=new WeakMap,Ue=1;function We(e){let t=He.get(e);return t===void 0&&(t=Ue++,He.set(e,t)),t}function Ge(e){let t=e.states;return t!==void 0&&Object.keys(t).length>0?t:void 0}function Ke(e,t,n){let r=ve(e)?e.object:e;return r.builtSharedGeometry===t&&r.material===n}function qe(e,t,n,r){let i=e,a=t;return[We(n),We(r),i.layers?.mask??0,i.renderOrder??0,+(!0===(i.castShadow??a.castShadow)),+(!0===(i.receiveShadow??a.receiveShadow))].join(`:`)}var z=[8,32,128,512],Je=z[z.length-1],B=new o().makeScale(0,0,0),Ye=class extends r{constructor(e,t,n,r){super(e,t,n),this.isInstanceGroup=!0,this.members=Array(n).fill(null),this.raycast=()=>{},this.matrixAutoUpdate=!1,this.frustumCulled=!1,this.adoptPassState(r);for(let e=0;e<n;e++)this.setMatrixAt(e,B);this.instanceMatrix.needsUpdate=!0}adoptPassState(e){this.layers.mask=e.layers.mask,this.renderOrder=e.renderOrder,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow}assign(e,t){this.members[e]=t}writeSlot(e,t,n){return!1===n?(this.setMatrixAt(e,B),!1):(this.setMatrixAt(e,t.matrixWorld),!0)}park(e){this.members[e]=null,this.setMatrixAt(e,B)}get memberCount(){let e=0;for(let t of this.members)t!==null&&e++;return e}};function Xe(e,t,n){let r=n.get(e);if(r!==void 0)return r;let i=e.parent,a=i===null?1:Xe(i,t,n),o=e.visible?1&a:0;return(e===t||2&a)&&(o|=2),n.set(e,o),o}var Ze=class{constructor(e=8){this.minGroupSize=e,this.groups=[],this.groupKeys=new WeakMap,this.placements=new Map,this.drawStateMemo=new Map,this.transparencyDissolves=new WeakMap,this.frame=0,this.mirrored=[],this.page=null,this.stats={instancingGroups:0,instancedDrawsSaved:0,instancingRegroups:0,instancingParks:0,instancingIneligible:{}},this.reconcileRequested=!1}update(e,t){this.frame++,this.page!==e&&(this.teardown(),this.page=e,t=!0),!0===e.matrixWorldAutoUpdate&&e.updateMatrixWorld(),t&&this.reconcile(e),this.refresh(e);for(let e of this.mirrored)if(e.matrixWorld.determinant()>=0){this.reconcileRequested=!0;break}this.reconcileRequested&&(this.reconcileRequested=!1,this.reconcile(e),this.refresh(e),this.reconcileRequested=!1)}reconcile(e){let t,n={},r=new Map,i=[];for(let e of this.groups){let n=e.material;if(!0!==n.transparent||t?.has(n))continue;(t??(t=new Set)).add(n);let r=this.transparencyDissolves.get(n),i=r!==void 0&&this.frame-r.frame<=600;this.transparencyDissolves.set(n,{count:i?r.count+1:1,frame:this.frame})}e.traverse(e=>{if(!0===e.isInstanceGroup)return;let t=function(e){if(!0!==e.isMesh)return`not-a-mesh`;if(O(e)||E(e)||D(e)||ge(e))return`excluded-type`;let t=function(e){let t=ve(e)?e.object:e;return t.geometry===void 0?void 0:t}(e);if(t===void 0)return`not-a-mesh`;let n=t.material;if(n===void 0)return`not-a-mesh`;if(Array.isArray(n))return`array-material`;let r=t.builtSharedGeometry;if(r===void 0)return`unrealized-geometry`;if(!function(e){return!0===e.isShared}(r))return`unshared-geometry`;if(r.attributes.position===void 0)return`empty-geometry`;if(r.morphAttributes.position!==void 0)return`morph`;if(!0===t.isSkinnedMesh)return`skinned`;let i=t.morphTargetInfluences;if(i!==void 0&&i.length>0)return`morph`;if(r.drawRange.start!==0||r.drawRange.count!==1/0)return`draw-range`;let a=n;if(a.positionNode!=null||a.castShadowPositionNode!=null)return`position-node`;if(!0===a.transparent)return`transparent`;if(t.userData?.__splinePlanarMirror!==void 0)return`reflection`;let o=function(e){let t=e;if(Ge(t)!==void 0)return`interaction-states`;for(let e=t.parent;e!==null;e=e.parent){let t=Ge(e);if(t===void 0)continue;let n=e;for(let e of Object.values(t)){if(n.cloner!==void 0||e.cloner!=null&&!0!==e.cloner.disabled)return`interaction-states`;let t=e.scale;if(t!==void 0&&((t.x??1)<0||(t.y??1)<0||(t.z??1)<0))return`mirrored`}}}(t);return o===void 0?e.matrixWorld.determinant()<0?`mirrored`:{object:e,owner:t,geometry:r,material:n,key:qe(e,t,r,n)}:o}(e);if(typeof t!=`string`&&this.isChurning(t.material)&&(t=`transparency-churn`),typeof t==`string`)return n[t]=(n[t]??0)+1,void(t===`mirrored`&&e.matrixWorld.determinant()<0&&i.push(e));let a=r.get(t.key);a===void 0?r.set(t.key,[t]):a.push(t)});let a=new Map;for(let[e,t]of r)for(let n of t)a.set(n.object,e);let o=!1;for(let[e,t]of this.placements)a.get(e)!==this.groupKeys.get(t.group)&&this.parkPlacement(e,t);for(let e=this.groups.length-1;e>=0;e--){let t=this.groups[e];t.memberCount>=this.minGroupSize||(this.destroyGroup(t),this.groups.splice(e,1),o=!0)}for(let[t,n]of r){let r=n.filter(e=>!this.placements.has(e.object));if(r.length===0)continue;let i=0;for(let e of this.groups){if(i>=r.length)break;if(this.groupKeys.get(e)!==t)continue;let{members:n}=e;for(let t=0;t<n.length&&i<r.length;t++)n[t]===null&&this.place(e,t,r[i++].object)}for(;r.length-i>=this.minGroupSize;){let n=r.slice(i,i+Je);this.groups.push(this.createGroup(e,t,n)),i+=n.length,o=!0}}o&&this.stats.instancingRegroups++,this.publishGroupStats(),this.stats.instancingIneligible=n,this.mirrored=i}isChurning(e){let t=this.transparencyDissolves.get(e);return t!==void 0&&t.count>=2&&this.frame-t.frame<=600}createGroup(e,t,n){let r=n[0],i=new Ye(r.geometry,r.material,function(e){for(let t of z)if(e<=t)return t;return Je}(n.length),r.object);this.groupKeys.set(i,t);for(let e=0;e<n.length;e++)this.place(i,e,n[e].object);return e.add(i),i}destroyGroup(e){for(let t=0;t<e.members.length;t++){let n=e.members[t];n!==null&&this.parkPlacement(n,{group:e,slot:t})}e.removeFromParent(),e.dispose()}place(e,t,n){e.assign(t,n),this.placements.set(n,{group:e,slot:t}),n.isDrawSuppressed=!0}parkPlacement(e,t){t.group.park(t.slot),t.group.instanceMatrix.needsUpdate=!0,this.placements.delete(e),e.isDrawSuppressed=!1,this.stats.instancingParks++}refresh(e){this.drawStateMemo.clear();for(let t of this.groups){let{members:n}=t,r=t.material;(!0===r.transparent||r.positionNode!=null||r.castShadowPositionNode!=null)&&(this.reconcileRequested=!0);let i=null;for(let r=0;r<n.length;r++){let a=n[r];if(a===null)continue;i===null&&(i=a);let o=Xe(a,e,this.drawStateMemo),s=!!(1&o);(!(2&o)||a.matrixWorld.determinant()<0||!Ke(a,t.geometry,t.material))&&(s=!1,this.reconcileRequested=!0),t.writeSlot(r,a,s)}i!==null&&(t.adoptPassState(i),t.instanceMatrix.needsUpdate=!0)}}teardown(){for(let e of this.groups)this.destroyGroup(e);this.groups.length=0;for(let e of this.placements.keys())e.isDrawSuppressed=!1;this.placements.clear(),this.publishGroupStats()}dispose(){this.teardown(),this.page=null,this.mirrored=[]}publishGroupStats(){let e=0;for(let t of this.groups){let n=t.memberCount;n>0&&(e+=n-1)}this.stats.instancingGroups=this.groups.length,this.stats.instancedDrawsSaved=e}},V=function(){let e=new Float32Array(1),t=new Int32Array(e.buffer);return function(n){return e[0]=n,t[0]}}(),Qe=function(e,t,n,r){return e+(t<<8)+(n<<16)+(r<<24)},H=new v;function $e(e){let t=!1;return e.scene.objects.traverse((e,n)=>{if(!1===n.visible)return!0;n.type===`Splat`&&(t=!0)}),t}var et,tt,U=class extends l{constructor(e,t,n,r,i=!1,a=1,o,s){super(n,r),this.splatCount=t,this.meshIndexIntervals=o,this.meshMatrixWorlds=s,this.splatBuffers=e,this.geometry=n,this.material=r,this.splatDataTextures=null,this.halfPrecisionCovariancesOnGPU=i,this.devicePixelRatio=a,this.resetLocalSplatDataAndTexturesFromSplatBuffer()}static buildMesh(e,t,n=!1,r=1,i,a){return new U(e,t,U.buildGeomtery(t),U.buildMaterial(i),n,r,i,a)}static buildMaterial(e){return Ce()===`webgpu`&&R?R.createSplatMaterial(e):new i({uniforms:{covariancesTexture:{type:`t`,value:null},centersColorsTexture:{type:`t`,value:null},meshIndexIntervals:{value:e},meshMatrixWorldsTexture:{type:`t`,value:null},focal:{type:`v2`,value:new v},viewport:{type:`v2`,value:new v},basisViewport:{type:`v2`,value:new v},debugColor:{type:`v3`,value:new m},covariancesTextureSize:{type:`v2`,value:new v(1024,1024)},centersColorsTextureSize:{type:`v2`,value:new v(1024,1024)},orthoZoom:{type:`f`,value:-1}},vertexShader:`
            precision highp float;
            #include <common>

            attribute uint splatIndex;

            uniform highp sampler2D covariancesTexture;
            uniform highp usampler2D centersColorsTexture;
            uniform vec2 focal;
            uniform vec2 viewport;
            uniform vec2 basisViewport;
            uniform vec2 covariancesTextureSize;
            uniform vec2 centersColorsTextureSize;
						uniform highp sampler2D meshMatrixWorldsTexture;
						uniform uint meshIndexIntervals[257];
						uniform float orthoZoom;

            varying vec4 vColor;
            varying vec2 vUv;

            varying vec2 vPosition;

            const vec4 encodeNorm4 = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);
            const uvec4 mask4 = uvec4(uint(0x000000FF), uint(0x0000FF00), uint(0x00FF0000), uint(0xFF000000));
            const uvec4 shift4 = uvec4(0, 8, 16, 24);
            vec4 uintToRGBAVec (uint u) {
               uvec4 urgba = mask4 & u;
               urgba = urgba >> shift4;
               vec4 rgba = vec4(urgba) * encodeNorm4;
               return rgba;
            }

            vec2 getDataUV(in int stride, in int offset, in vec2 dimensions) {
                vec2 samplerUV = vec2(0.0, 0.0);
                float d = float(splatIndex * uint(stride) + uint(offset)) / dimensions.x;
                samplerUV.y = float(floor(d)) / dimensions.y;
                samplerUV.x = fract(d);
                return samplerUV;
            }

            void main () {
                uvec4 sampledCenterColor = texture(centersColorsTexture, getDataUV(1, 0, centersColorsTextureSize));
                vec3 splatCenter = uintBitsToFloat(uvec3(sampledCenterColor.gba));
                vColor = uintToRGBAVec(sampledCenterColor.r);

                vPosition = position.xy * 2.0;

								uint meshIndex;
								for (int i = 1; i < 257; i++) {
									if (splatIndex < meshIndexIntervals[i]) {
										meshIndex = uint(i - 1);
										break;
									}
								}

								float strideMulmeshIndex = float(4u*meshIndex);
								float meshMatrixWorldsTextureLength = float(256*4);

								mat4 modelMat = mat4(
									texture(meshMatrixWorldsTexture, vec2((strideMulmeshIndex+0.0)/meshMatrixWorldsTextureLength, 0)),
									texture(meshMatrixWorldsTexture, vec2((strideMulmeshIndex+1.0)/meshMatrixWorldsTextureLength, 0)),
									texture(meshMatrixWorldsTexture, vec2((strideMulmeshIndex+2.0)/meshMatrixWorldsTextureLength, 0)),
									texture(meshMatrixWorldsTexture, vec2((strideMulmeshIndex+3.0)/meshMatrixWorldsTextureLength, 0))
								);
								mat4 modelViewMat = viewMatrix * modelMat;
								vec4 viewCenter = modelViewMat * vec4(splatCenter, 1.0); 
                vec4 clipCenter = projectionMatrix * viewCenter;

                vec2 sampledCovarianceA = texture(covariancesTexture, getDataUV(3, 0, covariancesTextureSize)).rg;
                vec2 sampledCovarianceB = texture(covariancesTexture, getDataUV(3, 1, covariancesTextureSize)).rg;
                vec2 sampledCovarianceC = texture(covariancesTexture, getDataUV(3, 2, covariancesTextureSize)).rg;

                vec3 cov3D_M11_M12_M13 = vec3(sampledCovarianceA.rg, sampledCovarianceB.r);
                vec3 cov3D_M22_M23_M33 = vec3(sampledCovarianceB.g, sampledCovarianceC.rg);

                
                mat3 Vrk = mat3(
                    cov3D_M11_M12_M13.x, cov3D_M11_M12_M13.y, cov3D_M11_M12_M13.z,
                    cov3D_M11_M12_M13.y, cov3D_M22_M23_M33.x, cov3D_M22_M23_M33.y,
                    cov3D_M11_M12_M13.z, cov3D_M22_M23_M33.y, cov3D_M22_M23_M33.z
                );
                float s = 1.0 / (viewCenter.z * viewCenter.z);

                mat3 W = transpose(mat3(modelViewMat));
                mat3 T = orthoZoom > 0.0 ? W : W * mat3(
									focal.x / viewCenter.z, 0., -(focal.x * viewCenter.x) * s,
									0., focal.y / viewCenter.z, -(focal.y * viewCenter.y) * s,
									0., 0., 0.
								);
                mat3 cov2Dm = transpose(T) * Vrk * T;
                cov2Dm[0][0] += 0.3;
                cov2Dm[1][1] += 0.3;

                
                
                
                
                vec3 cov2Dv = vec3(cov2Dm[0][0], cov2Dm[0][1], cov2Dm[1][1]);

                vec3 ndcCenter = clipCenter.xyz / clipCenter.w;

                
                
                
                
                
                
                
                
                float a = cov2Dv.x;
                float d = cov2Dv.z;
                float b = cov2Dv.y;
                float D = a * d - b * b;
                float trace = a + d;
                float traceOver2 = 0.5 * trace;
                float term2 = sqrt(trace * trace / 4.0 - D);
                float eigenValue1 = traceOver2 + term2;
								float eigenValue2 = max(traceOver2 - term2, 0.00); 

                const float maxSplatSize = 1024.0;
                vec2 eigenVector1 = normalize(vec2(b, eigenValue1 - a));
                
                vec2 eigenVector2 = vec2(eigenVector1.y, -eigenVector1.x);
                vec2 basisVector1 = eigenVector1 * min(sqrt(2.0 * eigenValue1), maxSplatSize);
                vec2 basisVector2 = eigenVector2 * min(sqrt(2.0 * eigenValue2), maxSplatSize);

                vec2 ndcOffset = vec2(vPosition.x * basisVector1 + vPosition.y * basisVector2) * basisViewport;

								if (orthoZoom > 0.0) {
									ndcOffset *= orthoZoom;
								}

                gl_Position = vec4(ndcCenter.xy + ndcOffset, ndcCenter.z, 1.0);
            }`,fragmentShader:`
            precision highp float;
            #include <common>

            uniform vec3 debugColor;

            varying vec4 vColor;
            varying vec2 vUv;

            varying vec2 vPosition;
						layout(location = 1) out vec4 gVelocity; 

            void main () {
                
                
                float A = -dot(vPosition, vPosition);
                if (A < -4.0) discard;
                vec3 color = vColor.rgb;
                A = exp(A) * vColor.a;
                gl_FragColor = vec4(color.rgb, A);
								gVelocity = vec4(0.0); 
            }`,transparent:!0,alphaTest:1,blending:1,depthTest:!0,depthWrite:!1,side:2})}static buildGeomtery(e){let t=new g;t.setIndex([0,1,2,0,2,3]);let n=new d(new Float32Array(12),3);t.setAttribute(`position`,n),n.setXYZ(0,-1,-1,0),n.setXYZ(1,-1,1,0),n.setXYZ(2,1,1,0),n.setXYZ(3,1,-1,0),n.needsUpdate=!0;let r=new ne().copy(t),i=new a(new Uint32Array(e),1,!1);return i.setUsage(re),r.setAttribute(`splatIndex`,i),r.instanceCount=e,r}resetLocalSplatDataAndTexturesFromSplatBuffer(){this.updateLocalSplatDataFromSplatBuffer(),this.allocateAndStoreLocalSplatDataInTextures()}updateLocalSplatDataFromSplatBuffer(){this.splatBuffers.forEach(e=>e.buildPreComputedBuffers()),this.covariances=new Float32Array(6*this.splatCount),this.colors=new Uint8Array(4*this.splatCount),this.centers=new Float32Array(3*this.splatCount);let e=0,t=0,n=0;for(let r of this.splatBuffers){let i=r.nsplats;this.colors.subarray(e,e+4*i).set(r.colorsA),e+=4*i,this.centers.subarray(t,t+3*i).set(r.decoded.xyz.denormDequant().data),t+=3*i,this.covariances.subarray(n,n+6*i).set(new Float32Array(r.precomputedCovarianceBufferData)),n+=6*i}}allocateAndStoreLocalSplatDataInTextures(){let e=this.splatCount,t=new v(4096,1024);for(;t.x*t.y*2<6*e;)t.y*=2;let n,r,i=new v(4096,1024);for(;i.x*i.y*4<4*e;)i.y*=2;if(this.halfPrecisionCovariancesOnGPU){r=new Uint16Array(t.x*t.y*2);for(let e=0;e<this.covariances.length;e++)r[e]=f.toHalfFloat(this.covariances[e]);n=new u(r,t.x,t.y,oe,s)}else r=new Float32Array(t.x*t.y*2),r.set(this.covariances),n=new u(r,t.x,t.y,oe,se);n.needsUpdate=!0,this.material.uniforms.covariancesTexture.value=n,this.material.uniforms.covariancesTextureSize.value.copy(t);let a=new Uint32Array(i.x*i.y*4);for(let t=0;t<e;t++){let e=4*t,n=3*t,r=4*t;a[r]=Qe(this.colors[e],this.colors[e+1],this.colors[e+2],this.colors[e+3]),a[r+1]=V(this.centers[n]),a[r+2]=V(this.centers[n+1]),a[r+3]=V(this.centers[n+2])}let o=new u(a,i.x,i.y,p,te);Ce()!==`webgpu`&&(o.internalFormat=`RGBA32UI`),o.needsUpdate=!0,this.material.uniforms.centersColorsTexture.value=o,this.material.uniforms.centersColorsTextureSize.value.copy(i);let c=new Float32Array(4096);for(let e=0;e<this.meshMatrixWorlds.length;e++)c.set(this.meshMatrixWorlds[e].elements,16*e);let l=new u(c,1024,1,ae,se);l.needsUpdate=!0,this.material.uniforms.meshMatrixWorldsTexture.value=l,this.material.uniformsNeedUpdate=!0,this.splatDataTextures={covariances:{data:r,texture:n,size:t},centerColors:{data:a,texture:o,size:i},meshMatrixWorlds:{data:c,texture:l}}}updateIndexes(e){let t=this.geometry;t.attributes.splatIndex.set(e),t.attributes.splatIndex.needsUpdate=!0,t.instanceCount=e.length}updateUniforms(e,t,n,r){this.splatCount>0&&(H.set(e.x*this.devicePixelRatio,e.y*this.devicePixelRatio),this.material.uniforms.viewport.value.copy(H),this.material.uniforms.basisViewport.value.set(2/H.x,2/H.y),this.material.uniforms.focal.value.set(t,n),this.material.uniforms.orthoZoom.value=r,this.material.uniformsNeedUpdate=!0)}getSplatDataTextures(){return this.splatDataTextures}getSplatCount(){return this.splatCount}getCenters(){return this.centers}getColors(){return this.colors}getCovariances(){return this.covariances}dispose(){this.geometry.dispose(),this.material.dispose(),this.splatDataTextures&&(this.splatDataTextures.covariances.texture.dispose(),this.splatDataTextures.centerColors.texture.dispose(),this.splatDataTextures.meshMatrixWorlds.texture.dispose()),this.removeFromParent()}},nt=new Promise(e=>{et=e}),rt=!1;function it(){if(!rt)return tt||(tt=async function(){let t=await e(()=>import(`./gaussian-splat-compression-B1iKVFJP.js`),[]);et(t),rt=!0}())}var W=new o,G=new ee,K=new y,q=new y,J=new y,Y=new y,at=new y,X=new y;function ot(e,t,n){n.length=0;let{axis:r,sign:i,limit:a}=t;for(let t=0;t<e.length;t++){let o=e[t],s=e[(t+1)%e.length],c=(r===0?o.px:r===1?o.py:o.pz)*i-a,l=(r===0?s.px:r===1?s.py:s.pz)*i-a,u=c<=0,d=l<=0;if(u&&n.push(o),u!==d){let e=c/(c-l);n.push({px:o.px+(s.px-o.px)*e,py:o.py+(s.py-o.py)*e,pz:o.pz+(s.pz-o.pz)*e,nx:o.nx+(s.nx-o.nx)*e,ny:o.ny+(s.ny-o.ny)*e,nz:o.nz+(s.nz-o.nz)*e})}}return n}function st(e,t,n,r,i,a,o,s,c){let l=e.geometry,u=l.getAttribute(`position`);if(u===void 0||u.count===0)return!0;let d=l.getAttribute(`normal`),f=l.getIndex(),p=f===null?u.count:f.count;if(p>15e5)return!0;let m=l.drawRange.start,h=m+(l.drawRange.count===1/0?p-m:Math.min(l.drawRange.count,p-m));W.copy(e.objectToDecal),G.getNormalMatrix(W);let g=[],_=[];for(let e=m;e+2<h;e+=3){let l=f===null?e:f.getX(e),p=f===null?e+1:f.getX(e+1),m=f===null?e+2:f.getX(e+2);if(K.fromBufferAttribute(u,l).applyMatrix4(W),q.fromBufferAttribute(u,p).applyMatrix4(W),J.fromBufferAttribute(u,m).applyMatrix4(W),K.z>n&&q.z>n&&J.z>n||K.z<-n&&q.z<-n&&J.z<-n)continue;Y.subVectors(q,K),at.subVectors(J,K),X.crossVectors(Y,at);let h=X.length();if(!(h===0||X.z/h<=.01)){if(g.length=0,d!==void 0)Y.fromBufferAttribute(d,l).applyMatrix3(G),g.push({px:K.x,py:K.y,pz:K.z,nx:Y.x,ny:Y.y,nz:Y.z}),Y.fromBufferAttribute(d,p).applyMatrix3(G),g.push({px:q.x,py:q.y,pz:q.z,nx:Y.x,ny:Y.y,nz:Y.z}),Y.fromBufferAttribute(d,m).applyMatrix3(G),g.push({px:J.x,py:J.y,pz:J.z,nx:Y.x,ny:Y.y,nz:Y.z});else{X.divideScalar(h);for(let e of[K,q,J])g.push({px:e.x,py:e.y,pz:e.z,nx:X.x,ny:X.y,nz:X.z})}for(let e of t){if(g.length===0)break;let t=ot(g,e,_);_=g,g=t}if(!(g.length<3)){if(o.length/3+3*(g.length-2)>3e5)return!1;for(let e=1;e+1<g.length;e++)for(let t of[g[0],g[e],g[e+1]]){c.push(t.px*r+.5,t.py*i+.5);let e=t.nx,n=t.ny,l=t.nz,u=Math.hypot(e,n,l);u>0?(e/=u,n/=u,l/=u):(e=0,n=0,l=1),o.push(t.px+e*a,t.py+n*a,t.pz+l*a),s.push(e,n,l)}}}}return!0}var Z=new b,ct=new b,lt=new o,ut=new y,Q=class extends we{constructor(e,t,n){super(e,t),this.data=t,this.geometry=new g,this.lastSignature=[],this.nextSignature=[],this.scanned=[],this.lastParams={width:0,height:0,depth:0,offset:0},this.targetFilter=new Set,this.context=n;let r=this.data.geometry;this.lastParams={width:this.resolveNumber(r.width,0),height:this.resolveNumber(r.height,0),depth:this.resolveNumber(r.depth,0),offset:r.offset??0},this.geometry.userData={type:`DecalGeometry`,parameters:{...this.lastParams}}}get isLOD(){return this.updateDecal(),!1}get isDecalObject(){return!0}resolveNumber(e,t){if(typeof e==`number`)return e;let n=Number(this.context.shared.getVariable(e));return Number.isFinite(n)?n:t}currentParams(){let e=this.dataPatched.geometry;return{width:this.resolveNumber(e.width,this.lastParams.width),height:this.resolveNumber(e.height,this.lastParams.height),depth:this.resolveNumber(e.depth,this.lastParams.depth),offset:e.offset??0}}projectionRoot(){let e=this.parent;for(;e!==null&&A.is(e);){if(e.data?.type===`Page`)return e;e=e.parent}return this.context.scene}currentTargetFilter(){let e=this.dataPatched.geometry;if(e.projection!==`select`)return null;let t=e.projectionTargets;if(t!==this.targetFilterSource&&(this.targetFilterSource=t,this.targetFilter.clear(),t!==void 0))for(let e of t)this.targetFilter.add(e);return this.targetFilter}static matchesTargetFilter(e,t,n){let r=e;for(;r!==null&&r!==n;){if(t.has(r.uuid))return!0;r=r.parent}return!1}scanTargets(e,t,n){let r=this.scanned;r.length=0;let i=this.projectionRoot();if(i===null)return r;let a=this.currentTargetFilter();if(a!==null&&a.size===0)return r;Z.makeEmpty();for(let r=0;r<8;r++)ut.set((1&r?.5:-.5)*e,(2&r?.5:-.5)*t,(4&r?.5:-.5)*n).applyMatrix4(this.matrixWorld),Z.expandByPoint(ut);return i.traverse(e=>{if(e===this||!A.is(e)||!(e instanceof be)||e instanceof Q||e.dataPatched?.type!==`Mesh`||!e.visible||e.destroyedInAction||512&e.layers.mask||a!==null&&!Q.matchesTargetFilter(e,a,i))return;let t=e.geometry,n=t?.getAttribute(`position`);n===void 0||n.count===0||t.drawRange.count!==0&&(t.boundingBox===null&&t.computeBoundingBox(),ct.copy(t.boundingBox).applyMatrix4(e.matrixWorld),Z.intersectsBox(ct)&&r.push(e))}),r}collectSignature(e,t,n){e.length=0,e.push(n.width,n.height,n.depth,n.offset);for(let t of this.matrixWorld.elements)e.push(t);for(let n of t){e.push(n.id,n.geometry.id);let t=n.geometry.getAttribute(`position`);e.push(t===void 0?-1:`version`in t?t.version:t.data.version);let r=n.geometry.getIndex();e.push(r===null?-1:r.version),e.push(n.geometry.drawRange.count===1/0?-1:n.geometry.drawRange.count);for(let t of n.matrixWorld.elements)e.push(t)}}signaturesEqual(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}updateDecal(){if(this.disposed)return!1;this.updateWorldMatrix(!0,!1);let e=this.currentParams(),t=this.scanTargets(e.width,e.height,e.depth);if(this.collectSignature(this.nextSignature,t,e),this.signaturesEqual(this.nextSignature,this.lastSignature))return!1;let r=this.lastSignature;this.lastSignature=this.nextSignature,this.nextSignature=r,this.lastParams=e,lt.copy(this.matrixWorld).invert();let i=t.map(e=>({geometry:e.geometry,objectToDecal:new o().multiplyMatrices(lt,e.matrixWorld)}));return this.geometry.dispose(),this.geometry=function(e,t){let r=Math.max(Math.abs(t.width),1e-6),i=Math.max(Math.abs(t.height),1e-6),a=Math.max(Math.abs(t.depth),1e-6),o=[{axis:0,sign:1,limit:r/2},{axis:0,sign:-1,limit:r/2},{axis:1,sign:1,limit:i/2},{axis:1,sign:-1,limit:i/2},{axis:2,sign:1,limit:a/2},{axis:2,sign:-1,limit:a/2}],s=[],c=[],l=[];for(let n of e)if(!st(n,o,a/2,1/r,1/i,t.offset,s,c,l))break;let u=new g;return u.setAttribute(`position`,new x(s,3)),u.setAttribute(`normal`,new x(c,3)),u.setAttribute(`uv`,new x(l,2)),s.length===0?(u.setDrawRange(0,0),u.boundingSphere=new n):u.computeBoundingSphere(),u}(i,e),this.geometry.userData={type:`DecalGeometry`,parameters:{width:e.width,height:e.height,depth:e.depth}},De(this),Ee(this),this.resetBBoxNeedsUpdate(),!0}updateByPatchedOp(e,t,n){super.updateByPatchedOp(e,t,n),ye(e.path,[`geometry`])&&this.resetBBoxNeedsUpdate()}updateEntityBoxSize(e,t){let n=this.currentParams();e.setScalar(0),t.set(n.width,n.height,n.depth).multiplyScalar(.5)}dispose(){super.dispose(),this.geometry.dispose()}},dt=class extends Oe(ie,je){constructor(e,t){super(),this.super_Entity(e,t),this.objectHelper.update(),this.matrixAutoUpdate=!0}updateState(e,t){this.updateState_Entity(e,t)}},ft=function(){try{let e=window.location.href;if(e.includes(`reducesubdiv=`)){let t=e.indexOf(`reducesubdiv=`)+13;return parseInt(e.slice(t,t+1))}}catch{}}();function pt(e,t,n){if(console.assert(t.type!==void 0),t.type===`Mesh`)return function(e,t,n){let r;if(ft!==void 0&&t?.geometry&&`subdivisions`in t.geometry&&(t.geometry.subdivisions??0)>ft&&Object.assign(t.geometry,{subdivisions:ft}),t.geometry.type===`TextGeometry`||t.geometry.type===`InputGeometry`){let r=T(t.geometry.type);return r?r(e,t,n):(w(t.geometry.type===`InputGeometry`?`textinputs`:`text`,`a Mesh with ${t.geometry.type}`),new j(e,t,n))}if(t.geometry.type===`SubdivGeometry`)r=new Be(e,t,n);else if(t.geometry.type===`PathGeometry`||t.geometry.type===`VectorGeometry`||t.geometry.type===`ShapeBlendGeometry`){let i=T(t.geometry.type);i?r=i(e,t,n):(w(t.geometry.type===`ShapeBlendGeometry`?`shape-blends`:t.geometry.type===`PathGeometry`?`3d-paths`:`vector-shapes`,`a Mesh with ${t.geometry.type}`),r=new j(e,t,n))}else if(t.geometry.type===`BooleanGeometry`)r=new N(e,t,n);else if(t.geometry.type===`DecalGeometry`)r=new Q(e,t,n);else if(t.geometry.type===`UIGeometry`){let i=T(`UIGeometry`);i?r=i(e,t,n):(w(`ui-2d`,`a Mesh with UIGeometry`),r=new j(e,t,n))}else r=new j(e,t,n);return r}(e,t,n);if(t.type===`Empty`)return new I(e,t);if(t.type===`Particle`){let r=C(`Particle`);return r?r(e,t,n):(w(`particles`,`a Particle system`),new I(e,t))}if(t.type===`ParticleCollider`)return new ze(e,t,n);if(t.type===`Hair`){let r=C(`Hair`);return r?r(e,t,n):(w(`hair`,`a Hair System`),new I(e,t))}if(t.type===`Splat`)return new I(e,t);if(t.type===`Bone`)return new dt(e,t);if(t.type===`Page`)return new L(e,t,n);if(t.type===`PointLight`)return new Ae(e,t,n);if(t.type===`SpotLight`)return new Ne(e,t,n);if(t.type===`DirectionalLight`)return new Pe(e,t,n);if(t.type===`Component`||t.type===`Instance`){let r=C(t.type);return r?r(e,t,n):(w(`components`,`a ${t.type}`),new I(e,t))}return pe.is(t.type)?new F(e,t):(console.error(t),new I(e,t))}xe.createEntity=pt,xe.changeEntityProptotype=function(e,t,n){let r=pt(e.identity,t,n),i=e.children,a=e.attachedPaths,o=e.parent,s=e.component,c=e.instances,l=e.overrideData,u=e.uuid,d=e.stateSelection;e.dispose();for(let t of Object.keys(e))delete e[t];Object.setPrototypeOf(e,Object.getPrototypeOf(r));for(let t of Object.keys(r))e[t]=r[t];e.children=[...e.children,...i],e.attachedPaths=a,e.parent=o,e.component=s,e.instances=c,e.uuid=u,e.overrideData=l,e.updateState(e.data,n),d&&e.changeSelectedState(d,n),e.resetBBoxNeedsUpdate()};var mt,ht=class{constructor(){this._constraints=new Map}setConstraint(e,t){t===null?this._constraints.delete(e):this._constraints.set(e,t)}removeDependencies(e){this._constraints.delete(e)}applyConstraints(e){let t=new Set;this._constraints.forEach((n,r)=>{let i=[r,n],a=n;for(;this._constraints.has(a);){if(a=this._constraints.get(a),i.includes(a)){console.warn(`circular dependency detected: ${i.join(` -> `)}`);break}t.has(a)||i.push(a)}for(let n=i.length-2;n>=0;n--)if(!t.has(i[n])){let r=e.find(i[n]);r?r.applyPathSnapping(e):console.warn(`missing entity ${i[n]}`),t.add(i[n])}})}findDependency(e,t){let n=e;for(;this._constraints.has(n);)if(n=this._constraints.get(n),n===t)return!0;return!1}},$=class{};S($,`DepthMapRange`,65536),S($,`MemoryPageSize`,65536),S($,`BytesPerFloat`,4),S($,`BytesPerInt`,4),nt.then(e=>mt=e);var gt=class{constructor(e={}){S(this,`updateView`,function(){let e=new o,t=[],n=new y(0,0,-1),r=new y(0,0,-1),i=new y,a=new y;return function(o=!1,s){let c=this.updateMatrixWorldsInWorkerIfNeeded(),l=this.cropsChanged();if(!o){r.set(0,0,-1).applyQuaternion(s.quaternion);let e=!1,t=!1;if(r.dot(n)<=.95&&(e=!0),a.copy(s.position).sub(i).length()>=1&&(t=!0),!(e||t||c||l||this.needsInitialRender))return}this.needsInitialRender=!1,i.copy(s.position),n.copy(r),e.copy(s.matrixWorld).invert(),e.premultiply(this.dummyPerspectiveMatrix),t[0]=s.position.x,t[1]=s.position.y,t[2]=s.position.z;let u={sort:{view:e.elements,cameraPosition:t,splatRenderCount:this.splatRenderCount,splatSortCount:this.splatRenderCount},...c?{newMatrixWorlds:this.meshMatrixWorlds}:{},...l?{newCropsArray:this.cropsArray}:{}};this.sortRunning?this.queuedMessage=u:(this.queuedMessage=null,this.sortRunning=!0,this.sortWorker.postMessage(u))}}()),this.scene=e.scene,this.currentPage=null,this.devicePixelRatio=window.devicePixelRatio,this.sortWorker=null,this.splatRenderCount=0,this.splatSortCount=0,this.splatMesh=null,this.sortRunning=!1,this.meshMatrixWorlds=null,this.meshMatrixWorldsOld=null,this.cropsArray=null,this.splatEntries=null,this.queuedMessage=null,this.needsInitialRender=!0,this.dummyPerspectiveMatrix=new o().makePerspective(-1,1,-1,1,.1,1e3)}updateSplatMeshUniforms(e,t){let n=new v;this.splatMesh!==null&&this.splatMesh.getSplatCount()>0&&(e.getSize(n),this.cameraFocalLengthX=t.projectionMatrix.elements[0]*this.devicePixelRatio*n.x*.45,this.cameraFocalLengthY=t.projectionMatrix.elements[5]*this.devicePixelRatio*n.y*.45,this.splatMesh.updateUniforms(n,this.cameraFocalLengthX,this.cameraFocalLengthY,t.isPerspectiveCamera?-1:t.zoom*this.devicePixelRatio))}loadSplat(e={}){this.activePage=this.scene.activePage,e.position&&(e.position=new y().fromArray(e.position)),e.orientation&&(e.orientation=new _().fromArray(e.orientation)),e.halfPrecisionCovariances=!!e.halfPrecisionCovariances;let t=[];if(this.splatEntries=t,this.activePage.traverseVisibleEntity(e=>{e.data.type===`Splat`&&t.push(e)}),this.splatMesh&&this.splatMesh.dispose(),t.length===0)return this.splatMesh=null,!1;this.meshMatrixWorlds=t.map(e=>e.matrixWorld),this.meshMatrixWorldsOld=t.map(e=>e.matrixWorld.clone()),this.cropsArray=t.map(e=>e.data.crops.map(e=>e.data)),this._splatBufferCache??(this._splatBufferCache=new WeakMap);let n=t.map(e=>{let t=this._splatBufferCache.get(e.data.buffer);return t===void 0&&(t=new mt.GSplineBuffer(new Uint8Array(e.data.buffer).buffer),this._splatBufferCache.set(e.data.buffer,t)),t}),r=0,i=[0];for(let e of n)r+=e.getSplatCount(),i.push(r);return this.setupSplatMesh(n,r,e.position,e.orientation,e.halfPrecisionCovariances,this.devicePixelRatio,i,this.meshMatrixWorlds),this.setupSortWorker(r),!0}updateMatrixWorldsInWorkerIfNeeded(){let e=this.splatDataTextures.meshMatrixWorlds.data;for(let t=0;t<this.meshMatrixWorlds.length;t++)e.set(this.meshMatrixWorlds[t].elements,16*t);return this.splatDataTextures.meshMatrixWorlds.texture.needsUpdate=!0,!this.meshMatrixWorlds.every((e,t)=>e.equals(this.meshMatrixWorldsOld[t]))&&(this.meshMatrixWorldsOld=this.meshMatrixWorlds.map(e=>e.clone()),!0)}cropsChanged(){let e=!1;return this.splatEntries.forEach((t,n)=>{t.data.crops.forEach((t,r)=>{this.cropsArray[n][r]===void 0?(e=!0,this.cropsArray[n][r]=t.data):Object.entries(t.data).forEach(([t,i])=>{(Array.isArray(i)&&i.some((e,i)=>e!==this.cropsArray[n][r][t][i])||i!==this.cropsArray[n][r]?.[t])&&(e=!0,this.cropsArray[n][r][t]=i)})}),t.data.crops.length!==this.cropsArray[n]?.length&&(this.cropsArray[n].length=t.data.crops.length,e=!0)}),e}setupSplatMesh(e,t,n=new y,r=new _,i=!1,a=1,o,s){this.splatMesh=U.buildMesh(e,t,i,a,o,s),this.splatMesh.position.copy(n),this.splatMesh.quaternion.copy(r),this.splatMesh.frustumCulled=!1,this.splatMesh.renderOrder=99999,this.splatRenderCount=t,this.splatMesh.onBeforeRender=(e,t,n)=>this.update(e,n)}setupSortWorker(e){this.sortWorker=function(e){let t=new Worker(URL.createObjectURL(new Blob([`(`,`
function sortWorker(self) {
	let wasmInstance;
	let splatCount;
	let splatRC;
	let indexesOffset;
	let positionsOffset;
	let viewProjOffset;
	let frequenciesOffset;
	let indexesOutOffset;
	let sortBuffersOffset;
	let wasmMemory;
	let positions;

	let Constants;
	let floatPositions;
	let meshIndexIntervals;
	let meshMatrixWorlds;
	let cropsArray;

	function sort(viewProj) {
		// console.time('WASM SORT');
		const viewProjArray = new Float64Array(wasmMemory, viewProjOffset, 16);
		for (let i = 0; i < 16; i++) {
			viewProjArray[i] = viewProj[i];
		}
		let indexesBuffer;
		// console.timeEnd('WASM SORT');
		if (splatRC > 1) {
			wasmInstance.exports.sortIndexes(
				indexesOffset,
				positionsOffset,
				sortBuffersOffset,
				viewProjOffset,
				frequenciesOffset,
				indexesOutOffset,
				Constants.DepthMapRange,
				splatRC
			);
			const indexes = new Uint32Array(splatRC);
			indexesBuffer = indexes.buffer;
			indexes.set(new Uint32Array(wasmMemory, indexesOutOffset, splatRC));
		} else if (splatRC === 1) {
			const indexes = new Uint32Array(splatRC);
			indexes[0] = new Uint32Array(wasmMemory, indexesOffset, splatCount)[0];
			indexesBuffer = indexes.buffer;
		} else {
			indexesBuffer = new ArrayBuffer(0);
		}

		self.postMessage(
			{
				sortDone: true,
				indexesBuffer,
			},
			[indexesBuffer]
		);
	}
	function updateRenderedSplats(
		meshMatrixWorlds,
		cropsArray,
		meshIndexIntervals
	) {
		const renderedPositions = new Float32Array(
			wasmMemory,
			positionsOffset,
			splatCount * 3
		);
		splatRC = 0;
		const wasmMemoryIndexes = new Uint32Array(
			wasmMemory,
			indexesOffset,
			splatCount
		);
		for (let i = 0; i < meshIndexIntervals.length - 1; i++) {
			const crops = cropsArray[i];
			const matrixWorld = meshMatrixWorlds[i].elements;
			const paramsIn = crops
				.filter((a) => a.enabled && a.mode === 'Include')
				.map((c) =>
					c.type === 'Box'
						? computeBoundingBoxVertices(c)
						: computeEllipsoidParams(c)
				);
			const paramsOut = crops
				.filter((a) => a.enabled && a.mode === 'Exclude')
				.map((c) =>
					c.type === 'Box'
						? computeBoundingBoxVertices(c)
						: computeEllipsoidParams(c)
				);
			for (let j = meshIndexIntervals[i]; j < meshIndexIntervals[i + 1]; j++) {
				const x = floatPositions[j * 3];
				const y = floatPositions[j * 3 + 1];
				const z = floatPositions[j * 3 + 2];
				if (
					(paramsIn.length === 0 || isInBounds(x, y, z, paramsIn)) &&
					(paramsOut.length === 0 || !isInBounds(x, y, z, paramsOut))
				) {
					const w =
						1 /
						(matrixWorld[3] * x +
							matrixWorld[7] * y +
							matrixWorld[11] * z +
							matrixWorld[15]);
					renderedPositions[splatRC * 3] =
						(matrixWorld[0] * x +
							matrixWorld[4] * y +
							matrixWorld[8] * z +
							matrixWorld[12]) *
						w;
					renderedPositions[splatRC * 3 + 1] =
						(matrixWorld[1] * x +
							matrixWorld[5] * y +
							matrixWorld[9] * z +
							matrixWorld[13]) *
						w;
					renderedPositions[splatRC * 3 + 2] =
						(matrixWorld[2] * x +
							matrixWorld[6] * y +
							matrixWorld[10] * z +
							matrixWorld[14]) *
						w;
					wasmMemoryIndexes[splatRC] = j;
					splatRC++;
				}
			}
		}
	}
	function getOutOfBoundsIndexes(floatPositions, crops) {
		const outOfBoundsIndexes = [];
		const paramsIn = crops
			.filter((a) => a.enabled && a.mode === 'Include')
			.map((c) =>
				c.type === 'Box'
					? computeBoundingBoxVertices(c)
					: computeEllipsoidParams(c)
			);
		const paramsOut = crops
			.filter((a) => a.enabled && a.mode === 'Exclude')
			.map((c) =>
				c.type === 'Box'
					? computeBoundingBoxVertices(c)
					: computeEllipsoidParams(c)
			);

		const len = floatPositions.length;
		for (let j = 0; j < len; j += 3) {
			const x = floatPositions[j];
			const y = floatPositions[j + 1];
			const z = floatPositions[j + 2];
			if (
				(paramsIn.length === 0 || isInBounds(x, y, z, paramsIn)) &&
				(paramsOut.length === 0 || !isInBounds(x, y, z, paramsOut))
			) {
				// in bounds: intentionally skip
			} else {
				outOfBoundsIndexes.push(j / 3);
			}
		}
		// console.log(outOfBoundsIndexes);
		return outOfBoundsIndexes;
	}

	function isInBounds(x, y, z, params, mode) {
		return params[mode === 'Intersect' ? 'every' : 'some']((param) => {
			const t = applyRotationMatrix(
				x,
				y,
				z,
				param.invRotationMatrix,
				param.cropCenter
			);
			return Array.isArray(param)
				? isVertexInsideBoundingBox(t.x, t.y, t.z, param)
				: isPointInsideEllipsoid(t.x, t.y, t.z, param);
		});
	}
	function applyRotationMatrix(_x, _y, _z, e, pivot) {
		const x = _x - pivot[0];
		const y = _y - pivot[1];
		const z = _z - pivot[2];
		const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
		return {
			x: (e[0] * x + e[4] * y + e[8] * z + e[12]) * w + pivot[0],
			y: (e[1] * x + e[5] * y + e[9] * z + e[13]) * w + pivot[1],
			z: (e[2] * x + e[6] * y + e[10] * z + e[14]) * w + pivot[2],
		};
	}
	function computeBoundingBoxVertices(box) {
		const halfSizeX = box.cropSize[0] / 2;
		const halfSizeY = box.cropSize[1] / 2;
		const halfSizeZ = box.cropSize[2] / 2;
		const bounds = [
			box.cropCenter[0] - halfSizeX,
			box.cropCenter[1] - halfSizeY,
			box.cropCenter[2] - halfSizeZ,
			box.cropCenter[0] + halfSizeX,
			box.cropCenter[1] + halfSizeY,
			box.cropCenter[2] + halfSizeZ,
		];
		const invRotationMatrix = getInvRotationMatrix(box.cropRotation);
		return Object.assign(bounds, {
			invRotationMatrix,
			cropCenter: box.cropCenter,
		});
	}
	function getInvRotationMatrix(_rotation) {
		const te = [];
		const x = (_rotation[0] * Math.PI) / 180,
			y = (_rotation[1] * Math.PI) / 180,
			z = (_rotation[2] * Math.PI) / 180;
		const a = Math.cos(x),
			b = Math.sin(x);
		const c = Math.cos(y),
			d = Math.sin(y);
		const e = Math.cos(z),
			f = Math.sin(z);
		const ae = a * e,
			af = a * f,
			be = b * e,
			bf = b * f;

		te[0] = c * e;
		te[1] = -c * f;
		te[2] = d;

		te[4] = af + be * d;
		te[5] = ae - bf * d;
		te[6] = -b * c;

		te[8] = bf - ae * d;
		te[9] = be + af * d;
		te[10] = a * c;

		te[12] = 0;
		te[13] = 0;
		te[14] = 0;

		te[3] = 0;
		te[7] = 0;
		te[11] = 0;
		te[15] = 1;

		return te;
	}
	function isVertexInsideBoundingBox(x, y, z, bounds) {
		return (
			x >= bounds[0] &&
			x <= bounds[3] &&
			y >= bounds[1] &&
			y <= bounds[4] &&
			z >= bounds[2] &&
			z <= bounds[5]
		);
	}
	function computeEllipsoidParams(ellipsoid) {
		// Precompute the scaling factors
		const invRadiusX = 2 / ellipsoid.cropSize[0];
		const invRadiusY = 2 / ellipsoid.cropSize[1];
		const invRadiusZ = 2 / ellipsoid.cropSize[2];
		const invRotationMatrix = getInvRotationMatrix(ellipsoid.cropRotation);
		return {
			invRadiusX,
			invRadiusY,
			invRadiusZ,
			cropCenter: ellipsoid.cropCenter,
			invRotationMatrix,
		};
	}
	function isPointInsideEllipsoid(x, y, z, ellipsoidParams) {
		const _x = (x - ellipsoidParams.cropCenter[0]) * ellipsoidParams.invRadiusX;
		const _y = (y - ellipsoidParams.cropCenter[1]) * ellipsoidParams.invRadiusY;
		const _z = (z - ellipsoidParams.cropCenter[2]) * ellipsoidParams.invRadiusZ;
		return _x * _x + _y * _y + _z * _z <= 1;
	}

	self.onmessage = (e) => {
		if (e.data.getCroppedIndexes) {
			const outOfBoundsIndexes = new Uint32Array(
				getOutOfBoundsIndexes(new Float32Array(e.data.positions), e.data.crops)
			).buffer;
			self.postMessage(
				{
					outOfBoundsIndexes,
				},
				[outOfBoundsIndexes]
			);
		} else if (e.data.positions) {
			positions = e.data.positions;
			floatPositions = new Float32Array(positions);
			meshMatrixWorlds = e.data.meshMatrixWorlds;
			cropsArray = e.data.cropsArray;
			meshIndexIntervals = e.data.meshIndexIntervals;
			updateRenderedSplats(meshMatrixWorlds, cropsArray, meshIndexIntervals);
			self.postMessage({
				sortSetupComplete: true,
			});
		} else if (e.data.sort || e.data.newMatrixWorlds || e.data.newCropsArray) {
			if (e.data.newMatrixWorlds || e.data.newCropsArray) {
				cropsArray = e.data.newCropsArray || cropsArray;
				meshMatrixWorlds = e.data.newMatrixWorlds || meshMatrixWorlds;
				updateRenderedSplats(meshMatrixWorlds, cropsArray, meshIndexIntervals);
			}
			sort(e.data.sort.view, e.data.sort.cameraPosition);
		} else if (e.data.init) {
			// Yep, this is super hacky and gross :(
			Constants = e.data.init.Constants;

			splatCount = e.data.init.splatCount;

			const INDEXES_BYTES_PER_ENTRY = Constants.BytesPerInt;
			const POSITIONS_BYTES_PER_ENTRY = Constants.BytesPerFloat * 3;

			const sorterWasmBytes = new Uint8Array(e.data.init.sorterWasmBytes);
			const memoryBytesPerVertex =
				INDEXES_BYTES_PER_ENTRY + POSITIONS_BYTES_PER_ENTRY;
			const memoryRequiredForVertices = splatCount * memoryBytesPerVertex;
			const memoryRequiredForSortBuffers =
				splatCount * Constants.BytesPerInt * 2 +
				Constants.DepthMapRange * Constants.BytesPerInt * 2;
			const extraMemory = Constants.MemoryPageSize * 32;
			const totalRequiredMemory =
				memoryRequiredForVertices + memoryRequiredForSortBuffers + extraMemory;
			const totalPagesRequired =
				Math.floor(totalRequiredMemory / Constants.MemoryPageSize) + 1;
			const sorterWasmImport = {
				module: {},
				env: {
					memory: new WebAssembly.Memory({
						initial: totalPagesRequired * 2,
						maximum: totalPagesRequired * 3,
						shared: true,
					}),
				},
			};
			WebAssembly.compile(sorterWasmBytes)
				.then((wasmModule) => {
					return WebAssembly.instantiate(wasmModule, sorterWasmImport);
				})
				.then((instance) => {
					wasmInstance = instance;
					indexesOffset = 0;
					positionsOffset = splatCount * INDEXES_BYTES_PER_ENTRY;
					viewProjOffset =
						positionsOffset + splatCount * POSITIONS_BYTES_PER_ENTRY;
					sortBuffersOffset = viewProjOffset + 16 * Constants.BytesPerFloat * 2;
					frequenciesOffset =
						sortBuffersOffset + splatCount * Constants.BytesPerInt;
					indexesOutOffset =
						frequenciesOffset + Constants.DepthMapRange * Constants.BytesPerInt;
					wasmMemory = sorterWasmImport.env.memory.buffer;
					self.postMessage({
						sortSetupPhase1Complete: true,
					});
				});
		}
	};
}
`,`)(self)`],{type:`application/javascript`}))),n=atob(`AGFzbQEAAAAADwhkeWxpbmsuMAEEAAAAAAETA2AAAGAIf39/f39/f38AYAABfwISAQNlbnYGbWVtb3J5AgMAgIAEAwQDAAECBzkDEV9fd2FzbV9jYWxsX2N0b3JzAAALc29ydEluZGV4ZXMAARNlbXNjcmlwdGVuX3Rsc19pbml0AAIK3gMDAwABC9IDAwF/BnwBfgJAIAdFDQAgAysDUCEMIAMrAzAhDSADKwMQIQ5BACEDRP///////+9/IQtEAAAAAAAAEAAhCgNAIAIgA0ECdGoCfyAOIAEgA0EMbGoiCCoCALuiIA0gCCoCBLuioCAMIAgqAgi7oqBEAAAAAAAAsECiIgmZRAAAAAAAAOBBYwRAIAmqDAELQYCAgIB4CzYCACAJIAsgCSALYxshCyAJIAogCSAKZBshCiADQQFqIgMgB0cNAAsgB0UNACAGuCAKIAuhoyEJQQAhAwNAAn8gCSACIANBAnRqIgEoAgC3IAuhoiIKmUQAAAAAAADgQWMEQCAKqgwBC0GAgICAeAshCCABIAg2AgAgBCAIQQJ0aiIBIAEoAgBBAWo2AgAgA0EBaiIDIAdHDQALCyAGQQJPBEAgBCgCACEIQQEhAwNAIAQgA0ECdGoiASABKAIAIAhqIgg2AgAgA0EBaiIDIAZHDQALCyAHQQFrIgGtIQ8DQCAEIAIgD6dBAnQiA2ooAgBBAnRqIgcgBygCAEEBayIHNgIAIAUgASAHa0ECdGogACADaigCADYCACAPUCEDIA9CAX0hDyADRQ0ACyAGBEAgBEEAIAZBAnT8CwALCwQAQQAL`),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return t.postMessage({init:{sorterWasmBytes:r.buffer,splatCount:e,Constants:{BytesPerFloat:$.BytesPerFloat,BytesPerInt:$.BytesPerInt,DepthMapRange:$.DepthMapRange,MemoryPageSize:$.MemoryPageSize}}}),t}(e),this.sortWorker.onmessage=e=>{e.data.sortDone?(this.sortRunning=!1,this.splatMesh?.updateIndexes(new Uint32Array(e.data.indexesBuffer)),this.lastSortTime=e.data.sortTime,this.queuedMessage&&(this.sortWorker.postMessage(this.queuedMessage),this.queuedMessage=null)):e.data.sortCanceled?this.sortRunning=!1:e.data.sortSetupPhase1Complete?this.sortWorker.postMessage({positions:this.splatMesh.getCenters().buffer,meshMatrixWorlds:this.splatMesh.meshMatrixWorlds,meshIndexIntervals:this.splatMesh.meshIndexIntervals,cropsArray:this.cropsArray}):e.data.sortSetupComplete&&(this.splatDataTextures=this.splatMesh.getSplatDataTextures(),this.scene.activePage.add(this.splatMesh),this.needsInitialRender=!0)}}update(e,t){this.splatMesh!==null&&(this.updateSplatMeshUniforms(e,t),this.updateView(!1,t))}getSplatMesh(){return this.splatMesh}},_t=new c;_t.wireframe=!0;var vt=new y,yt=class extends h{constructor(e,t){super(),this.data=e,this.sharedAssets=t,this.enableHelpers=!1,this.wireframeState=!1,this.needsTransmissionDirty=!0,this.needsNormalDirty=!0,this.needsReflectionDirty=!0,this._needsTransmission=!1,this._needsNormal=!1,this._normalPassNeeds={outline:!1,cavity:!1},this._needsReflection=!1,this.geometryCacheChanged=!1,this.splatViewer=null,this.shapeBlendIntances=[],this.hairInstances=[],this.shadowsDirty=!0,this.instanceGroupsDirty=!0,this._autoInstancing=null,this.entityByUuid={},this.entityIdentityToEntity={},this.toExpandCloner=new Set,this.toUpdateCloner=new Set,this.pendingCommands=[],this.pathConstraints=new ht,this.invisibleObjects=new I(`jflkdsafjasdifjaslk`,{...de.defaultData,visible:!1,name:`buildin invisible`}),this.needsRecomputeInstances=!1,this.init(e,t),this.matrixAutoUpdate=!1,this.errorPage=new L(`fdasfa`,{...he.defaultData,name:``},{shared:t,scene:this})}markGeometryCacheDirty(){this.geometryCacheChanged=!0}markShadowsDirty(){this.shadowsDirty=!0}markInstanceGroupsDirty(){this.instanceGroupsDirty=!0}get autoInstancing(){return this._autoInstancing}updateInstanceGroups(e,t){let n=this._autoInstancing;(n===null||n.minGroupSize!==t)&&(n?.dispose(),n=new Ze(t),this._autoInstancing=n);let r=this.instanceGroupsDirty;return this.instanceGroupsDirty=!1,n.update(e,r),n.stats}releaseInstanceGroups(){this._autoInstancing?.teardown(),this.instanceGroupsDirty=!0}markNeedsUpdateRendererDirty(){this.needsTransmissionDirty=!0,this.needsNormalDirty=!0,this.needsReflectionDirty=!0,this.shadowsDirty=!0,this.instanceGroupsDirty=!0}needsTransmission(){return this.needsTransmissionDirty&&(this._needsTransmission=Ie(this),this.needsTransmissionDirty=!1),this._needsTransmission}needsNormal(){return this.needsNormalDirty&&(this._normalPassNeeds=Re(this),this._needsNormal=this._normalPassNeeds.outline||this._normalPassNeeds.cavity,this.needsNormalDirty=!1),this._needsNormal}normalPassNeeds(){return this.needsNormal(),this._normalPassNeeds}needsReflection(){return this.needsReflectionDirty&&(this._needsReflection=Fe(this),this.needsReflectionDirty=!1),this._needsReflection}registerInstanceAndSetUuid(e){let t=e.identity.join(`-`),n=this.entityIdentityToEntity[t];n&&(e.uuid=n.uuid),this.entityIdentityToEntity[t]=e,this.entityByUuid[e.uuid]=e}markPenumbraSizeDirty(){for(let e of this.children)e instanceof L&&(e.penumbraSizeArrayCache=null)}findInstance(e){return this.entityIdentityToEntity[e.join(`-`)]}get bgColor(){return this.activePage.bgColor}get postprocessing(){return this.activePage.data.postprocessing}getWithSortKey(e){let t=this.find(e);if(t===void 0)return;let n=[],r=t;for(;r!==this;){let e=r;r=r.parent;let t=r.children.indexOf(e);n.splice(0,0,t)}return{entity:t,sortKey:n}}getAllSorted(e){let t=[];for(let n of e){let e=this.getWithSortKey(n.id);e!==void 0&&t.push(e)}return t.sort((e,t)=>ue(e.sortKey,t.sortKey)),t.map(e=>e.entity)}nonExistOrDescendantOf(e,t){let n=this.find(e);if(n===void 0)return!0;for(;n;){if(n.uuid===t)return!0;n=n.parent}return!1}find(e){if(this.activePage&&this.activePage.personalCamera.parent&&(e===`f23858d0-4a3b-4bd8-8173-66ed0af7f6fb-personalCamera`||e===`personal camera`))return this.activePage.personalCamera;if(e===``||e===void 0)return;let t=this.entityByUuid[e];return t===void 0?this.getObjectByProperty(`uuid`,e):t}find2D(e){for(let t of this.children)if(t instanceof L&&t.uiScene){let n=t.uiScene.find(e);if(n)return n}}findScene2DfromObject2D(e){for(let t of this.children)if(t instanceof L&&t.uiScene&&t.uiScene.find(e))return t.uiScene}find2DInUIObjects(e){let t;return this.traverseEntity(n=>{t===void 0&&E(n)&&(t=n.uiCanvas.find(e))}),t}traverse2D(e){for(let t of this.children)t instanceof L&&t.uiScene&&t.uiScene.traverse(e)}debugEnsureEntity(e){let t=this.find(e);t?Array.isArray(t.identity)&&this.findInstance(t.identity)===void 0&&console.error(`not found instance`):console.error(`not found`)}addPendingExpandCloner(e){this.toExpandCloner.add(e)}addPendingUpdateCloner(e){this.toUpdateCloner.add(e)}markToExpandCloner(e){this.toExpandCloner.add(e),e.traverseEntityAncestors(e=>{this.toExpandCloner.add(e)})}doPendingExpandCloner(e){this.toExpandCloner.forEach(t=>{t.expandCloner(e)}),this.toExpandCloner.clear()}doPendingUpdateCloner(e){this.toUpdateCloner.forEach(t=>{t.cloner?.update(e)}),this.toUpdateCloner.clear()}doPendingUpdates(e){this.doPendingExpandCloner(e),this.doPendingUpdateCloner(e),this.applyPendingCommands()}addPendingCommand(e){this.pendingCommands.push(e)}applyPendingCommands(){this.pendingCommands.forEach(e=>e()),this.pendingCommands.length=0}updateByLibOp(e,t){e.path.length===1&&e.path[0]===`components`&&e.type===1&&this.createChildrenObjects([{...e.data.asset,id:e.id}],this.invisibleObjects,t)}updateTreeByOp(e,t){if(e.path.length===0&&e.type===7){let n=e.parent===null?this:this.find(e.parent);if(n===void 0)throw Error(`scene tree add: parent ${e.parent} not found for object ${e.id}`);let r=this.createObject(e.id,e.data,e.children,n,e.localIndex,t);r.updateVisible(this),r.resetBBoxNeedsUpdate(),P(r)&&M(r.parent)&&(r.invalidateUpstreamBooleanData(),r.parent.invalidateDownstreamBooleanData().recomputeBoolean()),this.markNeedsRecomputeInstancesForAncessors(n),this.markNeedsRecomputeInstancesForChildren(r),this.markToExpandCloner(r),this.markPenumbraSizeDirty(),r.updatePathSnapping()}else if(e.path.length===0&&e.type===8){let t=this.find(e.id);if(t===void 0)throw Error(`scene tree delete: object ${e.id} not found`);t.traverseEntity(e=>{O(e)&&(this.shapeBlendIntances=this.shapeBlendIntances.filter(t=>t!==e)),D(e)&&(this.hairInstances=this.hairInstances.filter(t=>t!==e))}),this.markToExpandCloner(t),t.resetBBoxNeedsUpdate(),this.unregisterObject(t);let n=t.parent;this.markNeedsRecomputeInstancesForAncessors(n),this.markNeedsRecomputeInstancesForChildren(t),this.markPenumbraSizeDirty(),t.parent.remove(t),M(t.parent)&&(t.parent.invalidateUpstreamBooleanData(),t.parent.invalidateDownstreamBooleanData().recomputeBoolean()),P(t)&&(t.freeBooleanPointer(),n instanceof N&&n.invalidateDownstreamBooleanData().recomputeBoolean()),_e(t)&&t.detachShape(),this.disposeAndUnregisterEntityRecursivelyIfNotReregistered(t),this.pathConstraints.removeDependencies(t.uuid),t.updatePathSnapping()}else if(e.path.length===0&&e.type===9){let t=this.find(e.id);if(t===void 0)throw Error(`scene tree move: object ${e.id} not found`);this.markNeedsRecomputeInstancesForChildren(t);let n=t.parent;this.markNeedsRecomputeInstancesForAncessors(n),t.cloner?.resetOnMove(),this.markToExpandCloner(t);let r=e.parent===null?this:this.find(e.parent);if(r===void 0)throw Error(`scene tree move: new parent ${e.parent} not found for object ${e.id}`);r.add(t),this.markNeedsRecomputeInstancesForAncessors(r),this.markToExpandCloner(t),t.invalidateClonerTransform(t),t.updateVisible(this),t.resetBBoxNeedsUpdate(),this.markPenumbraSizeDirty();let i=e.localIndex;r.children.splice(i,0,r.children.pop()),P(t)&&(t.invalidateUpstreamBooleanData(),M(t.parent)?t.parent.invalidateDownstreamBooleanData().recomputeBoolean():n instanceof N&&n.invalidateDownstreamBooleanData().recomputeBoolean()),t.updatePathSnapping()}this.markNeedsUpdateRendererDirty(),this.markGeometryCacheDirty()}get playPage(){return this.find(this.data.publish.playPage)??this.errorPage}updatePage(e){this.shadowsDirty=!0,this.activePage&&this.activePage.onDeactive(),this.activePage=this.errorPage;for(let t of this.children)t instanceof L&&(t.visible=t.uuid===e,t.visible&&(this.activePage=t,this.activePage.onActive(this)));this.activePage!==this.splatViewer?.activePage&&this.reloadSplats()}updateEntityByOp(e,t,n,r){if(this.shadowsDirty=!0,t.type===0){if((`overrides`in t.props||`component`in t.props)&&this.markNeedsRecomputeInstances(),`visible`in t.props&&this.markPenumbraSizeDirty(),t.path.includes(`overrides`)&&`states`in t.props){let{rest:e}=t.props;t={...t,props:e},this.markNeedsRecomputeInstances()}t.path[0]===`pathSnapping`&&t.props.pathId!==void 0&&this.pathConstraints.setConstraint(e,t.props.pathId)}let i=this.find(e);if(i)try{(function(e,t,n,r){e.updateByOp(t,n,r,!1)})(i,t,n,{scene:this,shared:r}),i instanceof j&&i.updateGeometryGroupsIfNeeded()}catch(e){console.error(e)}}updateEntity2DByOp(e,t,n,r,i,a=[]){e.updateEntityByOp(t,n,r,i),this.traverseEntity(e=>{(E(e)||e instanceof L)&&(a.includes(e.frameId??``)||e.frameId===t)&&e.updateEntity2DByOp(t,n,r,i)})}get activeCamera(){return this.activePage.activeCamera}switchActiveCamera(e){this.activePage.switchActiveCamera(e)}isInvisibleObjects(e){return e===this.invisibleObjects||e.hasAnccestor(this.invisibleObjects)}init(e,t){let n=Object.entries(t.data.lib.components).map((e,t)=>({data:e[1].asset.data,children:e[1].asset.children,id:e[0],fi:t}));this.invisibleObjects.updateState(this.invisibleObjects.data,{scene:this,shared:t}),this.add(this.invisibleObjects),this.createChildrenObjects(n,this.invisibleObjects,t),this.createChildrenObjects(e.objects,this,t),this.updatePage(e.publish.playPage),this.activePage.switchToPlayCamera(),this.expandInstances(t,!0),this.traverseEntity(e=>{e instanceof F&&e.updateUp()}),this.doPendingExpandCloner({scene:this,shared:t}),this.applyPendingCommands()}markNeedsRecomputeInstances(){this.needsRecomputeInstances=!0}markNeedsRecomputeInstancesForChildren(e){e.traverseEntity(e=>{(e.data.type===`Component`||e.data.type===`Instance`)&&this.markNeedsRecomputeInstances()})}markNeedsRecomputeInstancesForAncessors(e){A.is(e)&&(e.data.type===`Component`&&this.markNeedsRecomputeInstances(),e.traverseAncestors(e=>{A.is(e)&&e.data.type===`Component`&&this.markNeedsRecomputeInstances()}))}relativeizeInner(e,t,n,r,i,a,o){if(e){let s=r.find(e);s&&s!==r&&i.forInstancesRec(r=>{r.data=fe(r.data,i=>{let s=i.events.data(o.id),c=r.goUp(a);if(c){let r=[...ce(c.identity),e].join(`-`),i=this.entityIdentityToEntity[r];if(i){let e=i.uuid;me.zoom(s,t)[n]=e}else console.warn(`cannot find instance`)}}).data})}}rewriteActions(e,t,n,r,i,a){e.forEach(e=>{e.data.type===`Transition`||e.data.type===`Animation`&&e.data.object?this.relativeizeInner(e.data.object,[...t,e.id],`object`,n,r,i,a):e.data.type===`Conditional`&&(this.rewriteActions(e.data.ifActions,[...t,e.id,`ifActions`],n,r,i,a),this.rewriteActions(e.data.elseActions,[...t,e.id,`elseActions`],n,r,i,a))})}rewriteEventsBeforeGoToPlayMode(){this.traverseEntity(e=>{if(k(e)&&typeof e.identity==`string`&&e.data.type===`Component`)return e.traverseEntity((t,n)=>{t.data.events.forEach(r=>{if(r.data.type===`GameControl`){let i=!1;if(t.forInstancesRec(e=>{e.data=fe(e.data,t=>{e.isInstanceRoot||(t.events.delete(r.id),i=!0)}).data}),!1===i)for(let i of le.list)this.rewriteActions(r.data.gameActions[i],[`gameActions`,i],e,t,n,r)}else r.data.type===`Conditional`?(r.data.condition.type===`Distance`?(this.relativeizeInner(r.data.condition.fromObject,[`condition`],`fromObject`,e,t,n,r),this.relativeizeInner(r.data.condition.toObject,[`condition`],`toObject`,e,t,n,r)):r.data.condition.type===`State`?this.relativeizeInner(r.data.condition.object,[`condition`],`object`,e,t,n,r):r.data.condition.type===`Comparison`&&(r.data.condition.lOperand.type===`Property`&&this.relativeizeInner(r.data.condition.lOperand.value[0],[`condition`,`lOperand`,`value`],0,e,t,n,r),r.data.condition.rOperand.type===`Property`&&this.relativeizeInner(r.data.condition.rOperand.value[0],[`condition`,`rOperand`,`value`],0,e,t,n,r)),this.rewriteActions(r.data.inActions,[`inActions`],e,t,n,r),this.rewriteActions(r.data.outActions,[`outActions`],e,t,n,r)):`actions`in r.data&&this.rewriteActions(r.data.actions,[`actions`],e,t,n,r)})}),!0})}expandInstances(e,t,n){let r=new Set;this.traverseEntity(i=>{if(k(i)&&i.isInstanceRoot)return i.expandInstanceChildren({scene:this,shared:e,pendingDeletes:r}),t||i.resetBBoxNeedsUpdate(),n&&i.traverseEntity(e=>{n.addClip(e)}),!0});for(let e of r)this.disposeAndUnregisterEntityRecursivelyIfNotReregistered(e),Me(e)}recomputeInstances(e,t){this.needsRecomputeInstances&&(this.needsRecomputeInstances=!1,this.traverseEntity(e=>{k(e)&&e.isInstanceRoot&&(e.component=void 0)}),this.expandInstances(e,!1,t))}disposeAndUnregisterEntityRecursivelyIfNotReregistered(e){e.traverseEntity(e=>{let t=typeof e.identity==`string`?e.identity:e.identity.join(`-`);this.entityIdentityToEntity[t]===e&&(delete this.entityByUuid[e.uuid],delete this.entityIdentityToEntity[t]),e.dispose()})}clearScene(){this._autoInstancing?.dispose(),this._autoInstancing=null,this.instanceGroupsDirty=!0;for(let e of this.children)A.is(e)&&e.disposeRecursively();this.children.length=0}resetAfterClear(e,t){this.init(e,t)}raycast(e){return this.raycast1(e,!1)}raycast1(e,t){let n=[],r=i=>{for(let a of i.children){let i=a.cloner;if(A.is(a)&&!a.raycastLock&&(a.visible||i?.object.data.visible))if(!0===t&&a.isInstanceRoot){let t=[];if(e.intersectObject(a,!0,t),t.length){let e=t[0];e.object=a,e.point.applyMatrix4(e.object.matrixWorld);let r=a.matrixWorld.clone().invert();e.point.applyMatrix4(r),n.push(e)}}else (P(a)||ke(a)&&this.enableHelpers&&a.objectHelper.visible)&&(e.intersectObject(a,!1,n),Le(a,e,n)),r(a)}};return r(this.activePage),n}raycastWithClones(e){let t=[],n=r=>{for(let i of r.children){let r=i.cloner;A.is(i)&&(i.visible||r?.object.data.visible)&&((P(i)||ke(i)&&this.enableHelpers&&i.objectHelper.visible)&&(e.intersectObject(i,!1,t),Le(i,e,t,!0)),n(i))}};return n(this),t}forEachEntity(e){for(let t of this.children)A.is(t)&&e(t)}traverseConcreteEntity(e){for(let t of this.children)A.is(t)&&t.isConcreteEntity&&t.traverseEntity(e)}traverseEntity(e){for(let t of this.children)A.is(t)&&t.traverseEntity(e)}updateFont(e,t){this.traverseEntity(n=>{if(n instanceof j&&n.data.type===`Mesh`&&(n.data.geometry.type===`TextGeometry`||n.data.geometry.type===`InputGeometry`)&&n.data.geometry.font===e){let r=n.geometry,i=n.data.geometry;r.updateFont(e,t).then(()=>{r.update(i,t);let e=n.invalidateDownstreamBooleanData();M(e)&&e.recomputeBoolean()})}})}traverseObject(e){for(let t of this.children)Se.is(t)&&t.traverseObject(e)}traverseVisibleEntity(e){for(let t of this.children)A.is(t)&&t.visible&&t.traverseVisibleEntity(e)}dispose(){this.clearScene()}createChildrenObjects(e,t,n){let r=0;for(let i of e)this.createObject(i.id,i.data,i.children,t,r,n),r+=1}registerObjectCreatedInLegacy(e){this.entityByUuid[e.uuid]=e}unregisterObject(e){delete this.entityByUuid[e.uuid];for(let t of e.children)this.unregisterObject(t)}createObject(e,n,r,i,a,s){let c={scene:this,shared:s},l=pt(e,n,c);return O(l)&&this.shapeBlendIntances.push(l),D(l)&&this.hairInstances.push(l),l&&(this.entityByUuid[e]=l,i.add(l),i.children.splice(a,0,i.children.pop()),r.length>0&&(l.isInstanceRoot?console.error(`instance should not have children!`):this.createChildrenObjects(r,l,s)),l.updateState(n,c),l instanceof j&&l.updateGeometryGroupsIfNeeded(),l.updateVisible(this),l.cloner&&this.toExpandCloner.add(l),n.pathSnapping?.pathId&&this.pathConstraints.setConstraint(e,n.pathSnapping.pathId)),n.type===`Empty`&&n.animations&&l.traverseEntity(e=>{let n=e.dataPatched;if(e instanceof j&&n.bones&&n.boneInverses){let r=new t(n.bones.map(e=>this.find(e)),n.boneInverses.map(e=>new o().fromArray(e)));e.bind(r,e.bindMatrix)}else e.matrixAutoUpdate=!0}),l}getCenter(e){let t=[];for(let n=0,r=e.length;n<r;++n){let{id:r,recursive:i}=e[n],a=this.find(r),o=i?a.recursiveBBox:a.singleBBox;t.push(...o.vertices)}let n=new b;return n.setFromPoints(t),n.getCenter(vt),vt}copyMatrixWorld(e,t){if(e===null)return void t.identity();let n=this.find(e);n?(n.updateWorldMatrix(!0,!1),t.copy(n.matrixWorld)):t.identity()}copyParentMatrixWorld(e,t){if(e===null)return void t.identity();let n=this.find(e)?.parent;n?(n.updateWorldMatrix(!0,!1),t.copy(n.matrixWorld)):t.identity()}traverseMaterial(e){this.traverseEntity(t=>{if(t instanceof be)if(Array.isArray(t.material))for(let n=0;n<t.material.length;n++)Te(t.material[n])&&e(t.material[n]);else Te(t.material)&&e(t.material)})}updateViewPlaneSize(e,t,n=!1){this.traverseConcreteEntity(r=>{r instanceof F&&r.setViewplaneSize(e,t,n)})}initializeSplatViewer(){this.splatViewer=new gt({scene:this}),this.reloadSplats()}reloadSplats(){this.splatViewer?.loadSplat()}};export{yt as a,$e as i,Ve as n,it as r,_t as t};