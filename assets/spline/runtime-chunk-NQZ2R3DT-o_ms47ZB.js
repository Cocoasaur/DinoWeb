import{Gr as e,H as t,Kn as n,Kt as r,Mt as i,N as a,P as o,Q as s,Qt as c,Vr as l,ar as u,er as d,et as f,i as p,jn as m,kt as h,lt as g,ni as _,wt as v,xi as y}from"./runtime-chunk-KPOUV3HD-CpaXHhAq.js";import{a as b}from"./runtime-chunk-2PT2WH66-xlOF4GJL.js";import{_ as x,y as S}from"./runtime-chunk-7TRY6CGZ-DvCb3ayG.js";import{C,J as w}from"./runtime-chunk-2HUMYYK7-BuuOIpL_.js";import{t as T}from"./runtime-chunk-OVCUHOM3-DUFhcncr.js";import{t as E}from"./runtime-chunk-SBSO4UMN-56AjiAFq.js";var D=new d;D.setAttribute(`position`,new c(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));var O=class extends l{constructor(e){super({...e,depthTest:!1,depthWrite:!1,glslVersion:_,vertexShader:`
				precision highp float;
				in vec3 position;
				void main() {
					gl_Position = vec4(position, 1);
				}
			`})}customProgramCacheKey(){return``}};function k(){return{shapeInput:()=>`
			const float posRowCoord = 0.1;  
			const float quatRowCoord = 0.3;  
			const float param1RowCoord = 0.5;
			const float param2RowCoord = 0.7;
			const float colorRowCoord = 0.9; 
			uniform sampler2D shapesDataTexture;
			vec4 shapePos(float iin) { 
				vec4 r = texture(shapesDataTexture, vec2(iin, posRowCoord));
				return r;
			}
			vec4 shapeQuat(float iin) {
				vec4 r = texture(shapesDataTexture, vec2(iin, quatRowCoord));
				return r;
			}
			vec4 shapeParams1(float iin) {
				vec4 r = texture(shapesDataTexture, vec2(iin, param1RowCoord));
				return r;
			}
			vec4 shapeParams2(float iin) {
				vec4 r = texture(shapesDataTexture, vec2(iin, param2RowCoord));
				return r;
			}
			vec4 shapeColor(float iin) {
				vec4 r = texture(shapesDataTexture, vec2(iin, colorRowCoord));
				return r;
			}
		`,getxyzi:`
			// this code must complement lookup
			float xi = mod(gl_FragCoord.x - 0.5, VOXEL_RESOLUTION);
			float yi = mod(gl_FragCoord.y - 0.5, VOXEL_RESOLUTION);
			float zi = floor((gl_FragCoord.x - 0.5) * INV_VOXEL_RESOLUTION) + floor((gl_FragCoord.y - 0.5) * INV_VOXEL_RESOLUTION) * Z_LAYERS_PER_ROW;
		`,lookup:`
			uniform sampler2D potentialPassTexture;
			uniform sampler2D voxelPassTexture; 
			
			
			
			vec4 look(float xi, float yi, float zi, sampler2D rt) {
				vec2 uv = vec2(
					mod(zi, Z_LAYERS_PER_ROW) + (xi + 0.5) / VOXEL_RESOLUTION,
					floor(zi / Z_LAYERS_PER_ROW) + (yi + 0.5) / VOXEL_RESOLUTION
				); 
				uv /= Z_LAYERS_PER_ROW;
				return texture(rt, uv);
			}
		`,getpart:`
			float getpart(inout float a, float b) {
				float t = floor(a/b);
				float r = a - t*b;
				a = t;
				return r;
			}
		`,triTable:new Float32Array([-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,8,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,1,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,8,1,1,8,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,10,2,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,8,0,10,2,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,10,2,9,9,2,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,8,2,8,10,2,8,9,10,-1,-1,-1,-1,-1,-1,-1,2,11,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,11,0,0,11,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,9,1,11,3,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,11,1,11,9,1,11,8,9,-1,-1,-1,-1,-1,-1,-1,1,10,3,3,10,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,10,0,10,8,0,10,11,8,-1,-1,-1,-1,-1,-1,-1,0,9,3,9,11,3,9,10,11,-1,-1,-1,-1,-1,-1,-1,10,8,9,11,8,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,7,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,3,4,4,3,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,1,0,7,4,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,1,4,1,7,4,1,3,7,-1,-1,-1,-1,-1,-1,-1,10,2,1,7,4,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,4,3,4,0,3,10,2,1,-1,-1,-1,-1,-1,-1,-1,10,2,9,2,0,9,7,4,8,-1,-1,-1,-1,-1,-1,-1,9,10,2,7,9,2,3,7,2,4,9,7,-1,-1,-1,-1,7,4,8,2,11,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,4,11,4,2,11,4,0,2,-1,-1,-1,-1,-1,-1,-1,1,0,9,7,4,8,11,3,2,-1,-1,-1,-1,-1,-1,-1,11,7,4,11,4,9,2,11,9,1,2,9,-1,-1,-1,-1,1,10,3,10,11,3,4,8,7,-1,-1,-1,-1,-1,-1,-1,10,11,1,11,4,1,4,0,1,4,11,7,-1,-1,-1,-1,8,7,4,11,0,9,10,11,9,3,0,11,-1,-1,-1,-1,11,7,4,9,11,4,10,11,9,-1,-1,-1,-1,-1,-1,-1,4,5,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,5,9,3,8,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,5,0,0,5,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,5,8,5,3,8,5,1,3,-1,-1,-1,-1,-1,-1,-1,10,2,1,4,5,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,0,3,10,2,1,5,9,4,-1,-1,-1,-1,-1,-1,-1,10,2,5,2,4,5,2,0,4,-1,-1,-1,-1,-1,-1,-1,5,10,2,5,2,3,4,5,3,8,4,3,-1,-1,-1,-1,4,5,9,11,3,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,11,0,11,8,0,5,9,4,-1,-1,-1,-1,-1,-1,-1,4,5,0,5,1,0,11,3,2,-1,-1,-1,-1,-1,-1,-1,5,1,2,8,5,2,11,8,2,5,8,4,-1,-1,-1,-1,11,3,10,3,1,10,4,5,9,-1,-1,-1,-1,-1,-1,-1,5,9,4,1,8,0,1,10,8,10,11,8,-1,-1,-1,-1,0,4,5,11,0,5,10,11,5,3,0,11,-1,-1,-1,-1,8,4,5,10,8,5,11,8,10,-1,-1,-1,-1,-1,-1,-1,8,7,9,9,7,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,3,9,3,5,9,3,7,5,-1,-1,-1,-1,-1,-1,-1,8,7,0,7,1,0,7,5,1,-1,-1,-1,-1,-1,-1,-1,3,5,1,7,5,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,7,9,7,5,9,2,1,10,-1,-1,-1,-1,-1,-1,-1,2,1,10,0,5,9,0,3,5,3,7,5,-1,-1,-1,-1,2,0,8,5,2,8,7,5,8,2,5,10,-1,-1,-1,-1,5,10,2,3,5,2,7,5,3,-1,-1,-1,-1,-1,-1,-1,5,9,7,9,8,7,2,11,3,-1,-1,-1,-1,-1,-1,-1,7,5,9,2,7,9,0,2,9,11,7,2,-1,-1,-1,-1,11,3,2,8,1,0,8,7,1,7,5,1,-1,-1,-1,-1,1,2,11,7,1,11,5,1,7,-1,-1,-1,-1,-1,-1,-1,8,5,9,7,5,8,3,1,10,11,3,10,-1,-1,-1,-1,0,7,5,9,0,5,0,11,7,10,0,1,0,10,11,-1,0,10,11,3,0,11,0,5,10,7,0,8,0,7,5,-1,5,10,11,5,11,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,5,6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,8,0,6,10,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,0,9,6,10,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,8,1,8,9,1,6,10,5,-1,-1,-1,-1,-1,-1,-1,5,6,1,1,6,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,5,6,1,6,2,1,8,0,3,-1,-1,-1,-1,-1,-1,-1,5,6,9,6,0,9,6,2,0,-1,-1,-1,-1,-1,-1,-1,8,9,5,2,8,5,6,2,5,8,2,3,-1,-1,-1,-1,11,3,2,5,6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,0,11,0,2,11,5,6,10,-1,-1,-1,-1,-1,-1,-1,9,1,0,11,3,2,6,10,5,-1,-1,-1,-1,-1,-1,-1,6,10,5,2,9,1,2,11,9,11,8,9,-1,-1,-1,-1,11,3,6,3,5,6,3,1,5,-1,-1,-1,-1,-1,-1,-1,11,8,0,5,11,0,1,5,0,6,11,5,-1,-1,-1,-1,6,11,3,6,3,0,5,6,0,9,5,0,-1,-1,-1,-1,9,5,6,11,9,6,8,9,11,-1,-1,-1,-1,-1,-1,-1,6,10,5,8,7,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,3,4,3,7,4,10,5,6,-1,-1,-1,-1,-1,-1,-1,0,9,1,6,10,5,7,4,8,-1,-1,-1,-1,-1,-1,-1,5,6,10,7,9,1,3,7,1,4,9,7,-1,-1,-1,-1,2,1,6,1,5,6,8,7,4,-1,-1,-1,-1,-1,-1,-1,5,2,1,6,2,5,4,0,3,7,4,3,-1,-1,-1,-1,7,4,8,5,0,9,5,6,0,6,2,0,-1,-1,-1,-1,9,3,7,4,9,7,9,2,3,6,9,5,9,6,2,-1,2,11,3,4,8,7,5,6,10,-1,-1,-1,-1,-1,-1,-1,6,10,5,2,7,4,0,2,4,11,7,2,-1,-1,-1,-1,9,1,0,8,7,4,11,3,2,6,10,5,-1,-1,-1,-1,1,2,9,2,11,9,11,4,9,4,11,7,6,10,5,-1,7,4,8,5,11,3,1,5,3,6,11,5,-1,-1,-1,-1,11,1,5,6,11,5,11,0,1,4,11,7,11,4,0,-1,9,5,0,5,6,0,6,3,0,3,6,11,7,4,8,-1,9,5,6,11,9,6,9,7,4,9,11,7,-1,-1,-1,-1,9,4,10,10,4,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,6,10,4,10,9,4,3,8,0,-1,-1,-1,-1,-1,-1,-1,1,0,10,0,6,10,0,4,6,-1,-1,-1,-1,-1,-1,-1,1,3,8,6,1,8,4,6,8,10,1,6,-1,-1,-1,-1,9,4,1,4,2,1,4,6,2,-1,-1,-1,-1,-1,-1,-1,8,0,3,9,2,1,9,4,2,4,6,2,-1,-1,-1,-1,4,2,0,6,2,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,2,3,8,4,2,8,6,2,4,-1,-1,-1,-1,-1,-1,-1,9,4,10,4,6,10,3,2,11,-1,-1,-1,-1,-1,-1,-1,2,8,0,11,8,2,10,9,4,6,10,4,-1,-1,-1,-1,2,11,3,6,1,0,4,6,0,10,1,6,-1,-1,-1,-1,1,4,6,10,1,6,1,8,4,11,1,2,1,11,8,-1,4,6,9,6,3,9,3,1,9,3,6,11,-1,-1,-1,-1,1,11,8,0,1,8,1,6,11,4,1,9,1,4,6,-1,6,11,3,0,6,3,4,6,0,-1,-1,-1,-1,-1,-1,-1,8,4,6,8,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,6,10,7,10,8,7,10,9,8,-1,-1,-1,-1,-1,-1,-1,3,7,0,7,10,0,10,9,0,10,7,6,-1,-1,-1,-1,7,6,10,7,10,1,8,7,1,0,8,1,-1,-1,-1,-1,7,6,10,1,7,10,3,7,1,-1,-1,-1,-1,-1,-1,-1,6,2,1,8,6,1,9,8,1,7,6,8,-1,-1,-1,-1,9,6,2,1,9,2,9,7,6,3,9,0,9,3,7,-1,0,8,7,6,0,7,2,0,6,-1,-1,-1,-1,-1,-1,-1,2,3,7,2,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,3,2,8,6,10,9,8,10,7,6,8,-1,-1,-1,-1,7,0,2,11,7,2,7,9,0,10,7,6,7,10,9,-1,0,8,1,8,7,1,7,10,1,10,7,6,11,3,2,-1,1,2,11,7,1,11,1,6,10,1,7,6,-1,-1,-1,-1,6,9,8,7,6,8,6,1,9,3,6,11,6,3,1,-1,1,9,0,7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,8,7,6,0,7,0,11,3,0,6,11,-1,-1,-1,-1,6,11,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,6,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,0,3,6,7,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,1,0,6,7,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,1,8,1,3,8,6,7,11,-1,-1,-1,-1,-1,-1,-1,2,1,10,7,11,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,10,2,1,8,0,3,7,11,6,-1,-1,-1,-1,-1,-1,-1,0,9,2,9,10,2,7,11,6,-1,-1,-1,-1,-1,-1,-1,7,11,6,3,10,2,3,8,10,8,9,10,-1,-1,-1,-1,3,2,7,7,2,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,0,7,0,6,7,0,2,6,-1,-1,-1,-1,-1,-1,-1,6,7,2,7,3,2,9,1,0,-1,-1,-1,-1,-1,-1,-1,2,6,1,6,8,1,8,9,1,6,7,8,-1,-1,-1,-1,6,7,10,7,1,10,7,3,1,-1,-1,-1,-1,-1,-1,-1,6,7,10,10,7,1,7,8,1,8,0,1,-1,-1,-1,-1,7,3,0,10,7,0,9,10,0,7,10,6,-1,-1,-1,-1,10,6,7,8,10,7,9,10,8,-1,-1,-1,-1,-1,-1,-1,4,8,6,6,8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,6,3,6,0,3,6,4,0,-1,-1,-1,-1,-1,-1,-1,11,6,8,6,4,8,1,0,9,-1,-1,-1,-1,-1,-1,-1,6,4,9,3,6,9,1,3,9,6,3,11,-1,-1,-1,-1,4,8,6,8,11,6,1,10,2,-1,-1,-1,-1,-1,-1,-1,10,2,1,11,0,3,11,6,0,6,4,0,-1,-1,-1,-1,8,11,4,11,6,4,9,2,0,9,10,2,-1,-1,-1,-1,3,9,10,2,3,10,3,4,9,6,3,11,3,6,4,-1,3,2,8,2,4,8,2,6,4,-1,-1,-1,-1,-1,-1,-1,2,4,0,2,6,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,9,1,4,3,2,6,4,2,8,3,4,-1,-1,-1,-1,4,9,1,2,4,1,6,4,2,-1,-1,-1,-1,-1,-1,-1,3,1,8,1,6,8,6,4,8,1,10,6,-1,-1,-1,-1,0,1,10,6,0,10,4,0,6,-1,-1,-1,-1,-1,-1,-1,3,6,4,8,3,4,3,10,6,9,3,0,3,9,10,-1,4,9,10,4,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,5,9,4,11,6,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,3,8,0,5,9,4,6,7,11,-1,-1,-1,-1,-1,-1,-1,1,0,5,0,4,5,11,6,7,-1,-1,-1,-1,-1,-1,-1,6,7,11,4,3,8,4,5,3,5,1,3,-1,-1,-1,-1,4,5,9,2,1,10,11,6,7,-1,-1,-1,-1,-1,-1,-1,7,11,6,10,2,1,3,8,0,5,9,4,-1,-1,-1,-1,11,6,7,10,4,5,10,2,4,2,0,4,-1,-1,-1,-1,8,4,3,4,5,3,5,2,3,2,5,10,6,7,11,-1,3,2,7,2,6,7,9,4,5,-1,-1,-1,-1,-1,-1,-1,4,5,9,6,8,0,2,6,0,7,8,6,-1,-1,-1,-1,2,6,3,6,7,3,0,5,1,0,4,5,-1,-1,-1,-1,8,2,6,7,8,6,8,1,2,5,8,4,8,5,1,-1,4,5,9,6,1,10,6,7,1,7,3,1,-1,-1,-1,-1,10,6,1,6,7,1,7,0,1,0,7,8,4,5,9,-1,10,0,4,5,10,4,10,3,0,7,10,6,10,7,3,-1,10,6,7,8,10,7,10,4,5,10,8,4,-1,-1,-1,-1,5,9,6,9,11,6,9,8,11,-1,-1,-1,-1,-1,-1,-1,11,6,3,3,6,0,6,5,0,5,9,0,-1,-1,-1,-1,8,11,0,11,5,0,5,1,0,11,6,5,-1,-1,-1,-1,3,11,6,5,3,6,1,3,5,-1,-1,-1,-1,-1,-1,-1,10,2,1,11,5,9,8,11,9,6,5,11,-1,-1,-1,-1,3,11,0,11,6,0,6,9,0,9,6,5,10,2,1,-1,5,8,11,6,5,11,5,0,8,2,5,10,5,2,0,-1,3,11,6,5,3,6,3,10,2,3,5,10,-1,-1,-1,-1,9,8,5,8,2,5,2,6,5,2,8,3,-1,-1,-1,-1,6,5,9,0,6,9,2,6,0,-1,-1,-1,-1,-1,-1,-1,8,5,1,0,8,1,8,6,5,2,8,3,8,2,6,-1,6,5,1,6,1,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,6,3,1,10,6,1,6,8,3,9,6,5,6,9,8,-1,0,1,10,6,0,10,0,5,9,0,6,5,-1,-1,-1,-1,8,3,0,10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,6,5,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,10,5,11,11,5,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,10,5,11,5,7,11,0,3,8,-1,-1,-1,-1,-1,-1,-1,7,11,5,11,10,5,0,9,1,-1,-1,-1,-1,-1,-1,-1,5,7,10,7,11,10,1,8,9,1,3,8,-1,-1,-1,-1,2,1,11,1,7,11,1,5,7,-1,-1,-1,-1,-1,-1,-1,3,8,0,7,2,1,5,7,1,11,2,7,-1,-1,-1,-1,5,7,9,7,2,9,2,0,9,7,11,2,-1,-1,-1,-1,2,5,7,11,2,7,2,9,5,8,2,3,2,8,9,-1,10,5,2,5,3,2,5,7,3,-1,-1,-1,-1,-1,-1,-1,0,2,8,2,5,8,5,7,8,5,2,10,-1,-1,-1,-1,1,0,9,3,10,5,7,3,5,2,10,3,-1,-1,-1,-1,2,8,9,1,2,9,2,7,8,5,2,10,2,5,7,-1,5,3,1,5,7,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,8,0,1,7,0,5,7,1,-1,-1,-1,-1,-1,-1,-1,3,0,9,5,3,9,7,3,5,-1,-1,-1,-1,-1,-1,-1,7,8,9,7,9,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,4,8,5,8,10,5,8,11,10,-1,-1,-1,-1,-1,-1,-1,4,0,5,0,11,5,11,10,5,0,3,11,-1,-1,-1,-1,9,1,0,10,4,8,11,10,8,5,4,10,-1,-1,-1,-1,4,11,10,5,4,10,4,3,11,1,4,9,4,1,3,-1,1,5,2,5,8,2,8,11,2,8,5,4,-1,-1,-1,-1,11,4,0,3,11,0,11,5,4,1,11,2,11,1,5,-1,5,2,0,9,5,0,5,11,2,8,5,4,5,8,11,-1,5,4,9,3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,10,5,2,2,5,3,5,4,3,4,8,3,-1,-1,-1,-1,2,10,5,4,2,5,0,2,4,-1,-1,-1,-1,-1,-1,-1,2,10,3,10,5,3,5,8,3,8,5,4,9,1,0,-1,2,10,5,4,2,5,2,9,1,2,4,9,-1,-1,-1,-1,5,4,8,3,5,8,1,5,3,-1,-1,-1,-1,-1,-1,-1,5,4,0,5,0,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,5,4,8,3,5,8,5,0,9,5,3,0,-1,-1,-1,-1,5,4,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,11,4,11,9,4,11,10,9,-1,-1,-1,-1,-1,-1,-1,3,8,0,7,9,4,7,11,9,11,10,9,-1,-1,-1,-1,11,10,1,4,11,1,0,4,1,11,4,7,-1,-1,-1,-1,4,1,3,8,4,3,4,10,1,11,4,7,4,11,10,-1,7,11,4,4,11,9,11,2,9,2,1,9,-1,-1,-1,-1,4,7,9,7,11,9,11,1,9,1,11,2,3,8,0,-1,4,7,11,2,4,11,0,4,2,-1,-1,-1,-1,-1,-1,-1,4,7,11,2,4,11,4,3,8,4,2,3,-1,-1,-1,-1,10,9,2,9,7,2,7,3,2,9,4,7,-1,-1,-1,-1,7,10,9,4,7,9,7,2,10,0,7,8,7,0,2,-1,10,7,3,2,10,3,10,4,7,0,10,1,10,0,4,-1,2,10,1,4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,9,4,7,1,4,3,1,7,-1,-1,-1,-1,-1,-1,-1,1,9,4,7,1,4,1,8,0,1,7,8,-1,-1,-1,-1,3,0,4,3,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,7,8,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,10,9,8,11,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,9,0,3,11,9,3,10,9,11,-1,-1,-1,-1,-1,-1,-1,10,1,0,8,10,0,11,10,8,-1,-1,-1,-1,-1,-1,-1,10,1,3,10,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,2,1,9,11,1,8,11,9,-1,-1,-1,-1,-1,-1,-1,9,0,3,11,9,3,9,2,1,9,11,2,-1,-1,-1,-1,11,2,0,11,0,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,11,2,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,3,2,10,8,2,9,8,10,-1,-1,-1,-1,-1,-1,-1,2,10,9,2,9,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,3,2,10,8,2,8,1,0,8,10,1,-1,-1,-1,-1,2,10,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,3,1,8,1,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,9,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,8,3,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]),numTrisTable:new Float32Array([0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,2,1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,3,1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,3,2,3,3,2,3,4,4,3,3,4,4,3,4,5,5,2,1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,3,2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,4,2,3,3,4,3,4,2,3,3,4,4,5,4,5,3,2,3,4,4,3,4,5,3,2,4,5,5,4,5,2,4,1,1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,3,2,3,3,4,3,4,4,5,3,2,4,3,4,3,5,2,2,3,3,4,3,4,4,5,3,4,4,5,4,5,5,4,3,4,4,3,4,5,5,4,4,3,5,2,5,4,2,1,2,3,3,4,3,4,4,5,3,4,4,5,2,3,3,2,3,4,4,5,4,5,5,2,4,3,5,4,3,2,4,1,3,4,4,5,4,5,3,4,4,5,5,2,3,4,2,1,2,3,3,2,3,4,2,1,3,2,4,1,2,1,1,0])}}var A=new e,j=null;function M(e){j=e}function ee(){return j}var N=null;function P(e){N=e}function F(){return N}var I=null;function L(e){I=e}function R(){return I}var z=k(),B=!1,V=!0;try{let e=new URLSearchParams(window.location.search);B=e.get(`dbgsbstatic`)===`0`,V=e.get(`sb512`)!==`0`}catch{}function H(e){let t=e.getAttribute(`position`);return t===void 0?-1:1048576*(t.version??t.data?.version??0)+(t.count??0)%1048576}var U=class extends C{constructor(e,t,r){super(e,t,r),this.data=t,this.isShapeBlendEntity=!0,this.needsRebuild=!0,this.customDepthMaterialNeedsUpdate=!1,this._prevShapeData=null,this._prevSpan=-1,this._reach=new Float32Array(96),this._prevReach=new Float32Array(96),this._fieldDirtyFull=!0,this._fieldDirtyMin=new m,this._fieldDirtyMax=new m,this._maxBlendK=0,this._meshSdfBaked=new Map,this._meshSdfWanted=new Map,this._passesRenderer=null,this._npart=-1,this.spatialn=1,this.drawRangeNeedsForceUpdate=!0,this._resolutionLevel=-1,this._authoredResolutionLevel=-1,this.ultraFieldResolution=0,this.resolution=64,this.spatialDivisions=25,this.zLayersPerRow=8,this.basePyramidSize=512,this.pyramidTexture1Width=341,this.pyramidTexture1Height=256,this.pyramidTexture2Width=170,this.pyramidTexture2Height=128,this.numLevels=9,this.pyramidLevelSizes=[1,2,4,8,16,32,64,128,256,512],this.bboxSize=0,this.bboxOffset=0,this.shapesDataTexture={value:void 0},this.spatialscene=new u,this.potentialPassScene=new u,this.voxelPassScene=new u,this._spatialPassRenderTargets=[],this._potentialPassRenderTargets=[],this._voxelPassRenderTargets=[],this._pyramidRenderTargets=[],this.geometry=new d,this.geometry.drawRange.count=0,this.spatialPassUniforms={span:{value:-1},shapesDataTexture:this.shapesDataTexture,npart:{value:this.npart},spatialn:{value:this.spatialn}},this.spatialMesh=new o(D,this.spatialPassMaterial()),this.spatialMesh.frustumCulled=!1,this.spatialscene.add(this.spatialMesh);let i=new s(z.triTable,16,256,a,y);i.needsUpdate=!0;let l=new s(z.numTrisTable,256,1,a,y);l.needsUpdate=!0,this.voxelPassUniforms={potentialPassTexture:{value:void 0},numTrisTable:{value:l}},this.voxelMesh=new o(D,this.voxelPassMaterial()),this.voxelMesh.frustumCulled=!1,this.voxelPassScene.add(this.voxelMesh),this.potentialPassUniforms={shapesDataTexture:this.shapesDataTexture,spatialPassTexture:{value:void 0},npart:{value:this.npart},spatialn:{value:this.spatialn}},this.potentialMesh=new o(D,this.potentialPassMaterial()),this.potentialMesh.frustumCulled=!1,this.potentialPassScene.add(this.potentialMesh),this.marchPassUniforms={triTable:{value:i},potentialPassTexture:{value:void 0},voxelPassTexture:{value:void 0},pyramidTexture1:{value:void 0},pyramidTexture1Size:{value:void 0},pyramidTexture2:{value:void 0},pyramidTexture2Size:{value:void 0}},this.frustumCulled=!1,this.onBeforeShadowPass=e=>{let t=$.call(this);if(this.npart===0)return void(this.geometry.drawRange.count=0);let r=this.material.root;if(r.shadersPatchedForShapeBlend){if(this.customDepthMaterialNeedsUpdate){this.customDepthMaterialNeedsUpdate=!1,this.customDepthMaterial=new n({vertexShader:r.vertexShader,fragmentShader:`
						#include <packing>
						void main()
						{
							gl_FragColor = packDepthToRGBA(gl_FragCoord.z);
						}
					`,uniforms:r.uniforms,defines:this.material.defines}),this.isMeshDepthMaterial=!0,this.customDistanceMaterial=new n({vertexShader:r.vertexShader,fragmentShader:`
					#include <common>
					#include <packing>
					uniform vec3 referencePosition;
					uniform float nearDistance;
					uniform float farDistance;
					
					varying vec3 vWPosition;
					void main()
					{
						float dist = length(vWPosition - referencePosition);
						dist = (dist - nearDistance) / (farDistance - nearDistance);
						dist = saturate(dist);
						
						gl_FragColor = packDepthToRGBA( dist );
					}`,uniforms:{nearDistance:{value:0},farDistance:{value:0},referencePosition:{value:new m},opacity:{value:0},...r.uniforms},defines:this.material.defines});let e=this.customDistanceMaterial;e.referencePosition=new m,e.nearDistance=0,e.farDistance=0,e.opacity=1,e.isMeshDistanceMaterial=!0}}else this.patchVertexShaderForShapeBlend(r),r.shadersPatchedForShapeBlend=!0,this.customDepthMaterialNeedsUpdate=!0;this.spatialPassUniforms.npart.value=this.npart,this.spatialPassUniforms.spatialn.value=this.spatialn,this.potentialPassUniforms.npart.value=this.npart,this.potentialPassUniforms.spatialn.value=this.spatialn;let i=this.needsRebuild;if(this.needsRebuild){this.needsRebuild=!1,this.spatialMesh.material.defines.RES=this.resolutionLevel,this.spatialMesh.material.needsUpdate=!0,this.potentialMesh.material.defines.RES=this.resolutionLevel,this.potentialPassUniforms.spatialPassTexture.value=this.spatialPassRenderTarget.texture,this.potentialMesh.material.needsUpdate=!0,this.voxelMesh.material.defines.RES=this.resolutionLevel,this.voxelMesh.material.needsUpdate=!0,this.voxelPassUniforms.potentialPassTexture.value=this.potentialPassRenderTarget.texture,this.marchPassUniforms.potentialPassTexture.value=this.potentialPassRenderTarget.texture,this.marchPassUniforms.voxelPassTexture.value=this.voxelPassRenderTarget.textures[0],this.material.defines.RES=this.resolutionLevel,this.material.defines.LEVELS=this.pyramidLevelSizes.length,this.material.defines.LOOP=this.pyramidLevelSizes.length%2==0?this.pyramidLevelSizes.length-3:this.pyramidLevelSizes.length-2,this.material.defines.HALF=+(this.pyramidLevelSizes.length%2==0),this.material.needsUpdate=!0;let e=this.pyramidLevelSizes.length%2==0?0:1,t=+(this.pyramidLevelSizes.length%2==0);this.marchPassUniforms.pyramidTexture2.value=this.pyramidRenderTarget[e].texture,this.marchPassUniforms.pyramidTexture2Size.value=new p(this.pyramidRenderTarget[e].width,this.pyramidRenderTarget[e].height),this.marchPassUniforms.pyramidTexture1.value=this.pyramidRenderTarget[t].texture,this.marchPassUniforms.pyramidTexture1Size.value=new p(this.pyramidRenderTarget[t].width,this.pyramidRenderTarget[t].height),Object.assign(this.material.uniforms,this.marchPassUniforms)}if(!t&&!i&&!this.drawRangeNeedsForceUpdate&&this._passesRenderer===e)return;this._passesRenderer=e;let a=e.shadowMap.enabled;e.shadowMap.enabled=!1;let o=e.getRenderTarget();e.setRenderTarget(this.spatialPassRenderTarget),e.render(this.spatialscene,A),e.setRenderTarget(this.potentialPassRenderTarget),e.render(this.potentialPassScene,A),e.setRenderTarget(this.voxelPassRenderTarget),e.render(this.voxelPassScene,A),U.streamCompaction.renderPyramid(this.resolutionLevel,this.pyramidLevelSizes,e,this.voxelPassRenderTarget,this.pyramidRenderTarget).then(e=>{this.material.wireframe&&(3*e>this.geometry.attributes.position.count||this.drawRangeNeedsForceUpdate)&&(this.geometry.dispose(),this.geometry=new d,this.geometry.userData.parameters={width:this.bboxSize,height:this.bboxSize,depth:this.bboxSize,centerOffset:[this.bboxOffset,this.bboxOffset,this.bboxOffset]},this.geometry.attributes.position=new c(new Float32Array(3*e*2),3)),(3*e>this.geometry.drawRange.count||this.drawRangeNeedsForceUpdate)&&(this.geometry.drawRange.count=3*Math.floor(1.2*e),this.markSceneShadowsDirty()),this.drawRangeNeedsForceUpdate=!1}),e.shadowMap.enabled=a,e.setRenderTarget(o)}}markSceneShadowsDirty(){let e=this.parent;if(e!==null){for(;e.parent;)e=e.parent;e.markShadowsDirty?.()}}set npart(e){e!==this._npart&&(this.drawRangeNeedsForceUpdate=!0,this._npart=e,this.spatialn=Math.ceil(e/96))}get npart(){return this._npart}set resolutionLevel(e){let t=Math.min(V?9:8,Math.max(5,e));if(t===this._authoredResolutionLevel)return;this._authoredResolutionLevel=t,this.ultraFieldResolution=2**t;let n=Math.min(8,t);switch(this._resolutionLevel=n,this.resolution=2**n,this.resolutionLevel){case 5:this.pyramidLevelSizes=[1,2,4,6,12,24,48,96,192],this.bboxSize=496,this.bboxOffset=-8;break;case 6:this.pyramidLevelSizes=[1,2,4,8,16,32,64,128,256,512],this.bboxSize=504,this.bboxOffset=-4;break;case 7:this.pyramidLevelSizes=[1,2,4,6,12,24,48,96,192,384,768,1536],this.bboxSize=508,this.bboxOffset=-2;break;case 8:this.pyramidLevelSizes=[1,2,4,8,16,32,64,128,256,512,1024,2048,4096],this.bboxSize=510,this.bboxOffset=-1}this.pyramidTexture1Width=0,this.pyramidTexture2Width=0,this.pyramidTexture1Height=this.pyramidLevelSizes[this.pyramidLevelSizes.length-2],this.pyramidTexture2Height=this.pyramidLevelSizes[this.pyramidLevelSizes.length-3];for(let e=this.pyramidLevelSizes.length-2;e>=0;e--)(this.pyramidLevelSizes.length-2)%2==e%2?this.pyramidTexture1Width+=this.pyramidLevelSizes[e]:this.pyramidTexture2Width+=this.pyramidLevelSizes[e];this.basePyramidSize=this.pyramidLevelSizes[this.pyramidLevelSizes.length-1],this.zLayersPerRow=this.basePyramidSize/this.resolution,this.numLevels=this.pyramidLevelSizes.length-1,this.geometry.userData.parameters={width:this.bboxSize,height:this.bboxSize,depth:this.bboxSize,centerOffset:[this.bboxOffset,this.bboxOffset,this.bboxOffset]},this.needsRebuild=!0,this.customDepthMaterialNeedsUpdate=!0}get resolutionLevel(){return this._resolutionLevel}get spatialPassRenderTarget(){let e=this._spatialPassRenderTargets[this.resolutionLevel];return e||(e=new h(this.spatialDivisions*this.spatialn,this.spatialDivisions**2,{format:1023,type:1015,stencilBuffer:!1,depthBuffer:!1,generateMipmaps:!1,minFilter:1003,magFilter:1003}),this._spatialPassRenderTargets[this.resolutionLevel]=e),e}get potentialPassRenderTarget(){let e=this._potentialPassRenderTargets[this.resolutionLevel];return e||(e=new h(this.basePyramidSize,this.basePyramidSize,{format:1023,type:1015,stencilBuffer:!1,depthBuffer:!1,generateMipmaps:!1,minFilter:1003,magFilter:1003}),this._potentialPassRenderTargets[this.resolutionLevel]=e),e}get voxelPassRenderTarget(){let e=this._voxelPassRenderTargets[this.resolutionLevel];return e||(e=new h(this.basePyramidSize,this.basePyramidSize,{count:2,stencilBuffer:!1,depthBuffer:!1,generateMipmaps:!1,minFilter:1003,magFilter:1003}),e.textures[0].format=1023,e.textures[0].type=1015,e.textures[1].format=1028,e.textures[1].type=1015,this._voxelPassRenderTargets[this.resolutionLevel]=e),e}get pyramidRenderTarget(){let e=this._pyramidRenderTargets[this.resolutionLevel];return e||(e=[new h(this.pyramidTexture1Width,this.pyramidTexture1Height,{format:1023,type:1015,stencilBuffer:!1,depthBuffer:!1,magFilter:1003,minFilter:1003}),new h(this.pyramidTexture2Width,this.pyramidTexture2Height,{format:1023,type:1015,stencilBuffer:!1,depthBuffer:!1,magFilter:1003,minFilter:1003})],this._pyramidRenderTargets[this.resolutionLevel]=e),e}updateGeometryInteractions(){}updateState(e,t){let n=this.material;super.updateState(e,t),n!==this.material&&(this.needsRebuild=!0),e.geometry&&(this.resolutionLevel=e.geometry.resolutionLevel,this.geometry.userData.parameters={width:this.bboxSize,height:this.bboxSize,depth:this.bboxSize,centerOffset:[this.bboxOffset,this.bboxOffset,this.bboxOffset]}),e.wireframe&&!this.geometry.getAttribute(`position`)?this.geometry.setAttribute(`position`,new c(new Float32Array(3*this.geometry.drawRange.count),3)):!e.wireframe&&this.geometry.getAttribute(`position`)&&this.geometry.deleteAttribute(`position`)}spatialPassMaterial(){return new O({name:`Spatial Pass`,fragmentShader:`\n\t\t\tprecision highp float;\n\t\t\tout vec4 pc_FragColor;\n\t\t\tconst float spatialDivisions = ${this.spatialDivisions}.;\n\t\t\tuniform float span;\n\t\t\tuniform float npart;\n\t\t\tuniform float spatialn;\n\t\t\t${z.shapeInput()}\n\n\t\t\tvec3 low, high;     \n\n\t\t\t\n\t\t\t\n\t\t\t\n\t\t\tfloat spatialKey(float lowi) {\n\t\t\t\tfloat t = 0.;\n\t\t\t\tfor (float ii = 23.; ii >= 0.; ii--) {\n\t\t\t\t\tfloat i = ii + lowi;\n\t\t\t\t\tfloat iin = (i + 0.5) / 96.;\n\t\t\t\t\tvec4 shape = shapePos(iin);\n\t\t\t\t\tvec3 d = shape.xyz;\n\t\t\t\t\tfloat op = shape.w;\n\t\n\t\t\t\t\tt *= 2.;\n\t\t\t\t\tt += (\n\t\t\t\t\t\tlow.x < d.x && d.x < high.x &&\n\t\t\t\t\t\tlow.y < d.y && d.y < high.y &&\n\t\t\t\t\t\tlow.z < d.z && d.z < high.z &&\n\t\t\t\t\t\ti < npart || op == -2. \n\t\t\t\t\t) ? 1. : 0.;\n\t\t\t\t}\n\t\t\t\treturn t;\n\t\t\t}\n\n\t\t\t${z.getpart}\n\n\t\t\tvoid main() {               \n\t\t\t\t\n\t\t\t\tvec3 div;                               \n\t\t\t\t\n\t\t\t\tfloat yz = float(gl_FragCoord.y - 0.5);     \n\t\t\t\tdiv.y = getpart(yz, spatialDivisions);\n\t\t\t\tdiv.z = yz; \n\n\t\t\t\tfloat lx = float(gl_FragCoord.x - 0.5);     \n\t\t\t\tfloat lowi = getpart(lx, spatialn) * 96.;\n\t\t\t\tdiv.x = lx;\n\n\t\t\t\tlow = div / spatialDivisions * 2. - 1. - span;\n\t\t\t\thigh = (div+1.) / spatialDivisions * 2. - 1. + span;\n\n\t\t\t\t\n\t\t\t\tpc_FragColor.x = spatialKey(lowi);\n\t\t\t\tpc_FragColor.y = spatialKey(lowi+24.);\n\t\t\t\tpc_FragColor.z = spatialKey(lowi+48.);\n\t\t\t\tpc_FragColor.w = spatialKey(lowi+72.);\n\t\t\t}\n\t\t`,uniforms:this.spatialPassUniforms})}potentialPassMaterial(){return new O({name:`PotentialPass`,fragmentShader:`\n\t\t\tprecision highp float;\n\t\t\tout vec4 pc_FragColor;\n\n\t\t\t${z.shapeInput()}\n\t\t\tuniform sampler2D spatialPassTexture;\n\n\t\t\tconst float res = float(RES);\n\t\t\tconst float VOXEL_RESOLUTION = pow(2., res);\n\t\t\tconst float Z_LAYERS_PER_ROW = ceil(pow(2., res / 2.));\n\t\t\tconst float VOXEL_RESOLUTION_SUB1 = VOXEL_RESOLUTION - 1.;\n\t\t\tconst float INV_VOXEL_RESOLUTION = 1.0 / VOXEL_RESOLUTION;\n\n\t\t\tuniform float npart;\n\t\t\tuniform float spatialn;\n\t\t\tconst float spatialDivisions = ${this.spatialDivisions}.;\n\t\t\tconst float spatialDivisions2 = spatialDivisions * spatialDivisions;\n\t\t\tconst float spatialDivisionsSub1 = spatialDivisions - 1.;\n\n\t\t\t${z.getpart}\n\n\t\t\tvec3 packRGBAToVec3(vec4 color) {\n\t\t\t\tuint r = uint(color.r * 255.);\n\t\t\t\tuint g = uint(color.g * 255.);\n\t\t\t\tuint combined = (r << 8) | g; \n\t\t\t\treturn vec3(float(combined) * 0.00001525902, color.b, color.a); \n\t\t\t}\n\n\t\t\tvoid applyQuaternionToVector(in vec4 q, inout vec3 v) {\n\t\t\t\tv += 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n\t\t\t}\n\n\t\t\t\n\n\n\n\t\t\t\n\t\t\tfloat smoothOperation(float op, float sdf, float d, float k) {\n\t\t\t  \n\t\t\t  \n\t\t\t\t\n\n\t\t\t\tfloat signSubtract = clamp(op, -1., 1.);\n\t\t\t\tfloat signIntersection = 2. * (op - signSubtract) + 1.;\n\t\t\t\tfloat h = clamp(\n\t\t\t\t\t0.5 + signSubtract * 0.5 * (sdf - signSubtract * signIntersection * d) / k,\n\t\t\t\t\t0.0,\n\t\t\t\t\t1.0\n\t\t\t\t);\n\t\t\t\treturn mix(sdf, signSubtract * signIntersection * d, h) - \n\t\t\t\t\t\t\t signSubtract * k * h * (1.0 - h);\n\t\t\t}\n\n\t\t\tfloat sdSphere( vec3 p, float s )\n\t\t\t{\n\t\t\t\treturn length(p)-s;\n\t\t\t}\n\n\t\t\tfloat sdEllipsoid( vec3 p, vec3 r )\n\t\t\t{\n\t\t\t\tfloat k0 = length(p/r);\n\t\t\t\tfloat k1 = length(p/(r*r));\n\t\t\t\treturn k0*(k0-1.0)/k1;\n\t\t\t}\n\n\t\t\tfloat sdBox( vec3 p, vec3 b )\n\t\t\t{\n\t\t\t\tvec3 q = abs(p) - b;\n\t\t\t\treturn length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);\n\t\t\t}\n\n\t\t\tfloat sdTorus( vec3 p, vec2 t )\n\t\t\t{\n\t\t\t\tvec2 q = vec2(length(p.xy)-t.x,p.z);\n\t\t\t\treturn length(q)-t.y;\n\t\t\t}\n\n\t\t\tfloat sdCappedTorus( vec3 p, vec2 sc, float ra, float rb)\n\t\t\t{\n\t\t\t\tp.x = abs(p.x);\n\t\t\t\tfloat k = (sc.y*p.x>sc.x*p.y) ? dot(p.xy,sc) : length(p.xy);\n\t\t\t\treturn sqrt( dot(p,p) + ra*ra - 2.0*ra*k ) - rb;\n\t\t\t}\n\n\t\t\tfloat dot2( in vec2 v ) { return dot(v,v); }\n\t\t\tfloat sdCappedCone( vec3 p, float h, float r1, float r2 )\n\t\t\t{\n\t\t\t\tvec2 q = vec2( length(p.xz), p.y );\n\t\t\t\tvec2 k1 = vec2(r2,h);\n\t\t\t\tvec2 k2 = vec2(r2-r1,2.0*h);\n\t\t\t\tvec2 ca = vec2(q.x-min(q.x,(q.y<0.0)?r1:r2), abs(q.y)-h);\n\t\t\t\tvec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot2(k2), 0.0, 1.0 );\n\t\t\t\tfloat s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;\n\t\t\t\treturn s*sqrt( min(dot2(ca),dot2(cb)) );\n\t\t\t}\n\n\t\t\tfloat sdCappedCylinder( vec3 p, float h, float r )\n\t\t\t{\n\t\t\t\tvec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);\n\t\t\t\treturn min(max(d.x,d.y),0.0) + length(max(d,0.0));\n\t\t\t}\n\n\t\t\tfloat maxBlend = 0.0;\n\t\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n\t\t\tvoid fillSpatialInner(\n\t\t\t\tfloat ii,\n\t\t\t\tfloat activeKey,\n\t\t\t\tvec3 corner,\n\t\t\t\tinout float sdf,\n\t\t\t\tinout float colorDivisor,\n\t\t\t\tinout vec4 trackColor\n\t\t\t) {\n\t\t\t\tfor (float i = 0.; i < 24.; i++) {\n\t\t\t\t\tif (activeKey < 1.) break; \n\t\t\t\t\tactiveKey *= 0.5;\n\t\t\t\t\tif (fract(activeKey) < 0.5) continue;\n\n\t\t\t\t\tfloat iin = (i + ii + 0.5) * ${1/96};\n\t\t\t\t\tvec4 shape = shapePos(iin);\n\t\t\t\t\tvec4 quat = shapeQuat(iin);\n\t\t\t\t\tvec4 params1 = shapeParams1(iin);\n\t\t\t\t\tvec4 params2 = shapeParams2(iin);\n\n\t\t\t\t\tvec3 p = corner - shape.xyz;\n\t\t\t\t\tapplyQuaternionToVector(quat, p);\n\t\t\t\t\tp /= params2.z; // scale\n\t\t\t\t\tfloat d; // d in -1..1 coordinates\n\t\t\t\t\tswitch (int(params1.x)) {\n\t\t\t\t\t\tcase 0: d = sdSphere(p, params1.y); break;\n\t\t\t\t\t\tcase 1: d = sdEllipsoid(p, params1.yzw); break;\n\t\t\t\t\t\tcase 2: d = sdBox(p, params1.yzw); break;\n\t\t\t\t\t\tcase 3: d = sdCappedCylinder(p, params1.y, params1.z); break;\n\t\t\t\t\t\tcase 4: d = sdCappedCone(p, params1.y, params1.z, params1.w); break;\n\t\t\t\t\t\tcase 5: d = sdTorus(p, params1.yz); break;\n\t\t\t\t\t\tcase 6: d = sdCappedTorus(p, params1.yz, params1.w, params2.w); break;\n\t\t\t\t\t\t// Mesh children (type 7) live in a WebGPU-only baked SDF\n\t\t\t\t\t\t// atlas — the GLSL evaluator skips the shape entirely\n\t\t\t\t\t\t// (also closes the latent uninitialized-d default).\n\t\t\t\t\t\tdefault: continue;\n\t\t\t\t\t}\n\t\t\t\t\td -= params2.y; // rounded edge\n\t\t\t\t\td *= params2.z; // scale\n\n\t\t\t\t\tfloat k = params2.x;\n\t\t\t\t\tfloat op = shape.w;\n\n\t\t\t\t\tsdf = smoothOperation(shape.w, sdf, d, k);\n\n\t\t\t\t\tfloat isNegativeOne = step(-1.5, op) * step(op, -0.5); // 1 when op == -1, 0 otherwise\n\t\t\t\t\tfloat colorCull = smoothstep(maxBlend, 0., -d);\n\t\t\t\t\tfloat cullFactor = mix(1.0, colorCull, isNegativeOne);\n\t\t\t\t\ttrackColor *= cullFactor;\n\t\t\t\t\tcolorDivisor *= cullFactor;\n\n\t\t\t\t\tmaxBlend = max(maxBlend, k);\n\n\t\t\t\t\tk += 2. * INV_VOXEL_RESOLUTION; // avoid division by zero, and other color artifacts with very small k\n\t\t\t\t\tfloat nearness = smoothstep(k, 0., d);\n\n\t\t\t\t\tvec4 color = shapeColor(iin);\n\t\t\t\t\tnearness *= float(color.a >= 0.);\n\n\t\t\t\t\tcolorDivisor += nearness;\n\t\t\t\t\ttrackColor += color * nearness;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tvec3 div;\n\t\t\t// compute potential from all spheres; collect +ve and =ve values separately\n\t\t\t// work in blocks of A*4 (=96) spheres, using the bit flags in 4 float channel 'activeKey' values\n\t\t\t// TODO check if extra vec3 output useful, not really used at present\n\t\t\tfloat fillSpatial(vec3 corner, inout vec4 trackColor) {\n\t\t\t\tfloat sdf = 1e3; // hack: initialize to large value\n\t\t\t\tfloat colorDivisor = 0.;\n\t\t\t\t// spatialPassTexture holds x=> lowi, x faster moving and y=> z, y faster moving\n\t\t\t\tfloat divyz = (div.y + div.z * spatialDivisions + 0.5) / (spatialDivisions2);\n\t\t\t\tfor (float ii = 0.; ii < spatialn; ii++) {\n\t\t\t\t\tfloat i = ii * 96.;\n\n\t\t\t\t\tvec4 activeKey = texture(spatialPassTexture, vec2((div.x * spatialn + ii + 0.5)/(spatialn * spatialDivisions), divyz));\n\t\t\t\t\tfillSpatialInner(i, activeKey.x, corner, sdf, colorDivisor, trackColor);\n\t\t\t\t\tfillSpatialInner(i+24., activeKey.y, corner, sdf, colorDivisor, trackColor);\n\t\t\t\t\tfillSpatialInner(i+48., activeKey.z, corner, sdf, colorDivisor, trackColor);\n\t\t\t\t\tfillSpatialInner(i+72., activeKey.w, corner, sdf, colorDivisor, trackColor);\n\t\t\t\t}\n\n\t\t\t\ttrackColor /= colorDivisor;\n\t\t\t\treturn mix(sdf, 0.0, step(1e20 - 0.1, sdf));\n\t\t\t}\n\n\t\t\tvoid main() {\n\t\t\t\t${z.getxyzi}    \n\n\t\t\t\tvec3 xyzi = vec3(xi,yi,zi);\n\t\t\t\tvec3 corner = xyzi / VOXEL_RESOLUTION_SUB1 * 2. - 1.;  \n\n\t\t\t\tdiv = floor(xyzi / VOXEL_RESOLUTION_SUB1 * spatialDivisionsSub1);\n\n\t\t\t\tvec4 c = vec4(0.);\n\t\t\t\tfloat t = fillSpatial(corner, c);\n\n\t\t\t\tpc_FragColor = vec4(t, packRGBAToVec3(c)); \n\t\t\t}\n\t\t`,uniforms:this.potentialPassUniforms})}voxelPassMaterial(){return new O({name:`VoxelPass`,fragmentShader:`\n\t\t\tprecision highp float;\n\t\t\tlayout(location = 0) out vec4 pc_FragColor;\n\t\t\tlayout(location = 1) out vec4 numTris;\n\n\t\t\tconst float res = float(RES);\n\t\t\tconst float VOXEL_RESOLUTION = pow(2., res);\n\t\t\tconst float VOXEL_RESOLUTION_SUB1 = VOXEL_RESOLUTION - 1.; \n\t\t\tconst float Z_LAYERS_PER_ROW = ceil(pow(2., res / 2.));\n\t\t\tconst float INV_VOXEL_RESOLUTION = 1.0 / VOXEL_RESOLUTION;\n\t\t\tuniform sampler2D numTrisTable; \n\n\t\t\tfloat keyi(float f000, float f100, float f010, float f110, float f001, float f101, float f011, float f111) {\n\t\t\t\treturn (float(f000 < 0.) * 1.) +\n\t\t\t\t\t\t\t (float(f100 < 0.) * 2.) +\n\t\t\t\t\t\t\t (float(f010 < 0.) * 8.) +\n\t\t\t\t\t\t\t (float(f110 < 0.) * 4.) +\n\t\t\t\t\t\t\t (float(f001 < 0.) * 16.) +\n\t\t\t\t\t\t\t (float(f101 < 0.) * 32.) +\n\t\t\t\t\t\t\t (float(f011 < 0.) * 128.) +\n\t\t\t\t\t\t\t (float(f111 < 0.) * 64.);\n\t\t\t}\n\n\t\t\t${z.lookup}\n\n\t\t\tvec3 compNormi(float xi, float yi, float zi) {\n\t\t\t\tfloat dx = look(xi + 1., yi, zi, potentialPassTexture).r - look(xi - 1., yi, zi, potentialPassTexture).r;\n\t\t\t\tfloat dy = look(xi, yi + 1., zi, potentialPassTexture).r - look(xi, yi - 1., zi, potentialPassTexture).r;\n\t\t\t\tfloat dz = look(xi, yi, zi + 1., potentialPassTexture).r - look(xi, yi, zi - 1., potentialPassTexture).r;\n\t\t\t\t\n\t\t\t\t\n\t\t\t\tif (dx == 0.0 && dy == 0.0 && dz == 0.0) {\n\t\t\t\t\treturn vec3(0.199, 0.299, 0.399);\n\t\t\t\t}\n\t\t\t\treturn normalize(vec3(dx, dy, dz));\n\t\t\t}\n\n\t\t\tvoid main() {\n\t\t\t\t${z.getxyzi}    \n\n\t\t\t\tvec3 normal = compNormi(xi, yi, zi);  \n\n\t\t\t\tif (xi >= VOXEL_RESOLUTION_SUB1 || yi >= VOXEL_RESOLUTION_SUB1 || zi >= VOXEL_RESOLUTION_SUB1) {\n\t\t\t\t\tpc_FragColor = vec4(normal, 0.);\n\t\t\t\t\tnumTris = vec4(0.);\n\t\t\t\t\treturn;\n\t\t\t\t}\n\n\t\t\t\tfloat\n\t\t\t\t\tf000 = look(xi, yi, zi, potentialPassTexture).r,\n\t\t\t\t\tf100 = look(xi+1., yi, zi, potentialPassTexture).r,\n\t\t\t\t\tf010 = look(xi, yi+1., zi, potentialPassTexture).r,\n\t\t\t\t\tf110 = look(xi+1., yi+1., zi, potentialPassTexture).r,\n\t\t\t\t\tf001 = look(xi, yi, zi+1., potentialPassTexture).r,\n\t\t\t\t\tf101 = look(xi+1., yi, zi+1., potentialPassTexture).r,\n\t\t\t\t\tf011 = look(xi, yi+1., zi+1., potentialPassTexture).r,\n\t\t\t\t\tf111 = look(xi+1., yi+1., zi+1., potentialPassTexture).r;\n\t\t\t\tfloat key = keyi(f000, f100, f010, f110, f001, f101, f011, f111);\n\n\t\t\t\tpc_FragColor = vec4(normal, key);\n\n\t\t\t\tnumTris = texture(numTrisTable, vec2((key + 0.5) / 256., 0.5));\n\t\t\t}\n\t\t`,uniforms:this.voxelPassUniforms})}patchVertexShaderForShapeBlend(e){e.vertexShader=`\n\t\t#ifdef SHAPEBLEND \n\t\t\tprecision highp sampler2D;\n\n\t\t\tuniform float isol;\n\n\t\t\tuniform sampler2D triTable;     \n\t\t\tuniform sampler2D pyramidTexture1;\n\t\t\tuniform vec2 pyramidTexture1Size;\n\t\t\tuniform sampler2D pyramidTexture2;\n\t\t\tuniform vec2 pyramidTexture2Size;\n\n\t\t\tconst vec2 halfPixelOffset = vec2(0.5, 0.5);\n\n\t\t\tconst vec2 rShift = vec2(0., 1.);\n\t\t\tconst vec2 gShift = vec2(1., 1.);\n\t\t\tconst vec2 bShift = vec2(1., 0.);\n\n\t\t\tconst float res = float(RES);\n\t\t\tconst float VOXEL_RESOLUTION = pow(2., res);\n\t\t\tconst float Z_LAYERS_PER_ROW = ceil(pow(2., res / 2.));\n\t\t\tconst float INV_VOXEL_RESOLUTION = 1.0 / VOXEL_RESOLUTION;\n\n\t\t\tconst float scale_factor = 2.;\n\n\t\t\t#if SHAPEBLEND == 5\n\t\t\t\tconst float levelShiftX[7] = float[7](4., 6., 12., 24., 48., 96., 192.);\n\t\t\t\tconst float scale = 8. * scale_factor;\n\t\t\t\tconst vec3 originOffset = vec3(16.);\n\t\t\t#elif SHAPEBLEND == 7\n\t\t\t\tconst float levelShiftX[10] = float[10](4., 6., 12., 24., 48., 96., 192., 384., 768., 1536.); \n\t\t\t\tconst float scale = 2. * scale_factor;\n\t\t\t\tconst vec3 originOffset = vec3(64.);\n\t\t\t#elif SHAPEBLEND == 8\n\t\t\t\tconst float levelShiftX[11] = float[11](4., 8., 16., 32., 64., 128., 256., 512., 1024., 2048., 4096.);\n\t\t\t\tconst float scale = scale_factor;\n\t\t\t\tconst vec3 originOffset = vec3(128.);\n\t\t\t#else\n\t\t\t\tconst float levelShiftX[8] = float[8](4., 8., 16., 32., 64., 128., 256., 512.);\n\t\t\t\tconst float scale = 4. * scale_factor;\n\t\t\t\tconst vec3 originOffset = vec3(32.);\n\t\t\t#endif\n\n\t\t\t${z.lookup}\n\n\t\t\tconst vec3 offsets[24] = vec3[](\n\t\t\t\tvec3(0., 0., 0.), vec3(1., 0., 0.),\n\t\t\t\tvec3(1., 0., 0.), vec3(1., 1., 0.),\n\t\t\t\tvec3(0., 1., 0.), vec3(1., 1., 0.),\n\t\t\t\tvec3(0., 0., 0.), vec3(0., 1., 0.),\n\t\t\t\tvec3(0., 0., 1.), vec3(1., 0., 1.),\n\t\t\t\tvec3(1., 0., 1.), vec3(1., 1., 1.),\n\t\t\t\tvec3(0., 1., 1.), vec3(1., 1., 1.),\n\t\t\t\tvec3(0., 0., 1.), vec3(0., 1., 1.),\n\t\t\t\tvec3(0., 0., 0.), vec3(0., 0., 1.),\n\t\t\t\tvec3(1., 0., 0.), vec3(1., 0., 1.),\n\t\t\t\tvec3(1., 1., 0.), vec3(1., 1., 1.),\n\t\t\t\tvec3(0., 1., 0.), vec3(0., 1., 1.)\n\t\t\t);\n\n\t\t\tvec2 computeShiftedPosition1(vec2 xy, float levelOriginX) {\n\t\t\t\tvec2 xyShifted = xy;\n\t\t\t\txyShifted.x += levelOriginX;\n\t\t\t\treturn (xyShifted + halfPixelOffset) / pyramidTexture1Size;\n\t\t\t}\n\n\t\t\tvec2 computeShiftedPosition2(vec2 xy, float levelOriginX) {\n\t\t\t\tvec2 xyShifted = xy;\n\t\t\t\txyShifted.x += levelOriginX;\n\t\t\t\treturn (xyShifted + halfPixelOffset) / pyramidTexture2Size;\n\t\t\t}\n\n\t\t\tvec4 unpackVec3ToRGBA(vec3 vec) {\n\t\t\t\tuint combined = uint(vec.x * 65535.0 + 0.5); \n\t\t\t\tfloat g = float(combined & uint(0xFF)) * 0.00392156862; \n\t\t\t\tfloat r = float((combined >> 8) & uint(0xFF)) * 0.00392156862; \n\t\t\n\t\t\t\treturn vec4(r, g, vec.y, vec.z);\n\t\t\t}\n\n\t\t\tout vec4 marchColor;\n\t\t\t\n\t\t#endif\n\t\t`+e.vertexShader.replace(`#include <project_vertex>`,`
		#ifdef SHAPEBLEND
			float triIndex = floor(float(gl_VertexID/3));
			float vertexIndex = float(gl_VertexID);
			
			
			float levelOriginX1 = pyramidTexture1Size.x - 2.;
			float levelOriginX2 = pyramidTexture2Size.x - 1.;
			vec2 xy = vec2(0.);
			vec4 lookUp = texture(pyramidTexture2, computeShiftedPosition2(xy, levelOriginX2));
			
			
			if (triIndex >= lookUp.r) return;
			
			
			float start = 0.;
			vec4 triIndexVec = vec4(triIndex);
			
			
			for (int i = 0; i < LOOP;) {
				
				vec4 ends = lookUp + vec4(start);
				vec4 starts = vec4(ends.gba, start);
				vec4 check = vec4(greaterThanEqual(triIndexVec, starts)) * 
											vec4(lessThan(triIndexVec, ends));
				
				
				xy *= 2.;
				xy += check.r * rShift + check.g * gShift + check.b * bShift;
				
				
				start = dot(check, starts);
				levelOriginX2 -= levelShiftX[i];
				
				
				lookUp = texture(pyramidTexture1, computeShiftedPosition1(xy, levelOriginX1));
				i++;

				ends = lookUp + vec4(start);
				starts = vec4(ends.gba, start);
				check = vec4(greaterThanEqual(triIndexVec, starts)) * 
											vec4(lessThan(triIndexVec, ends));
				
				
				xy *= 2.;
				xy += check.r * rShift + check.g * gShift + check.b * bShift;
				
				
				start = dot(check, starts);
				levelOriginX1 -= levelShiftX[i];
				
				
				lookUp = texture(pyramidTexture2, computeShiftedPosition2(xy, levelOriginX2));

				i++;
			}

			#if HALF == 1
				vec4 ends = lookUp + vec4(start);
				vec4 starts = vec4(ends.gba, start);
				vec4 check = vec4(greaterThanEqual(triIndexVec, starts)) * vec4(lessThan(triIndexVec, ends));
			
				
				xy *= 2.;
				xy += check.r * rShift + check.g * gShift + check.b * bShift;
			
				
				start = dot(check, starts);
			#endif
			
			
			vec3 gridPos;
			gridPos.x = mod(xy.x, VOXEL_RESOLUTION);
			gridPos.y = mod(xy.y, VOXEL_RESOLUTION);
			gridPos.z = floor(xy.x * INV_VOXEL_RESOLUTION) + 
									floor(xy.y * INV_VOXEL_RESOLUTION) * Z_LAYERS_PER_ROW;
			
			
			vertexIndex -= start * 3.;
			float vk = vertexIndex * 0.0625 + 0.03125; 
			
			
			vec4 voxel = look(gridPos.x, gridPos.y, gridPos.z, voxelPassTexture);
			float key = (voxel.w + 0.5) * 0.00390625; 
			
			
			float edgeNum = texture(triTable, vec2(vk, key)).x;
			int edgeIndex = int(edgeNum) * 2;
			
			
			vec3 p1 = gridPos + offsets[edgeIndex];
			vec3 p2 = gridPos + offsets[edgeIndex + 1];
			
			
			vec4 potential1 = look(p1.x, p1.y, p1.z, potentialPassTexture);
			vec4 potential2 = look(p2.x, p2.y, p2.z, potentialPassTexture);
			
			
			float mu = potential1.r / (potential1.r - potential2.r);

			marchColor = mix(
				unpackVec3ToRGBA(potential1.gba),
				unpackVec3ToRGBA(potential2.gba),
				mu
			);

			transformed = p1 + (p2 - p1) * mu;
			transformed -= originOffset;
			transformed *= scale;
			vec4 data1 = look(p1.x, p1.y, p1.z, voxelPassTexture);
			vec4 data2 = look(p2.x, p2.y, p2.z, voxelPassTexture);
			objectNormal = normalize(mix(data1.xyz, data2.xyz, mu));
			transformedNormal = normalMatrix * objectNormal;
			#ifndef FLAT_SHADED
				vNormal = transformedNormal;
			#endif
		#endif
		
#include <project_vertex>`);let t=e.fragmentShader.match(/vec3 diffuseColor[^\n]*\n/);if(!t)return;let n=`\n\t\t#ifdef SHAPEBLEND_C\n\t\t\t#if SHAPEBLEND_C == 1\n\t\t\t\t${t[0].replace(/nodeU0,/g,`marchColor.rgb,`).replace(/nodeU\d+(?=,g_uid\d+_calpha\))/g,`marchColor.a`)}\n\t\t\t#else\n\t\t\t\t${t[0]}\n\t\t\t#endif\n\t\t#else\n\t\t\t${t[0]}\n\t\t#endif\n\t\t`;e.fragmentShader=`in vec4 marchColor;
`+e.fragmentShader.replace(t[0],n),Object.assign(e.uniforms,this.marchPassUniforms)}initDebugPass(e){console.log(`fboToDebug.width`,e.width,e.height),this.geometry=new r(e.width,e.height),this.geometry.userData={parameters:{width:4,height:4}};let t={inputTexture:{value:e.textures.length>1?e.textures[1]:e.texture},pyramidTextureSize:{value:void 0}},n=e=>{e.vertexShader=`
				precision highp float;

				varying vec2 vUv;

				void main() {
						gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
						vUv = uv;
				}
			`,e.fragmentShader=`
				layout(location = 1) out vec4 gVelocity;

				precision highp float;
				
				uniform sampler2D inputTexture;
				varying vec2 vUv;

				uniform vec2 pyramidTextureSize;

				void main() {
						
						gl_FragColor = texture(inputTexture, vUv);
						gVelocity = vec4(0.0);
				}
			`,t.pyramidTextureSize.value=new p(this.pyramidRenderTarget[0].width,this.pyramidRenderTarget[0].height),Object.assign(e.uniforms,t)};this.material.shapeBlendhack=n,this.material.root.shapeBlendhack=n}dispose(){super.dispose(),R()?.release(this)}},W=U;W.streamCompaction=new class{constructor(){this.pyramidPassScene=new u,this.pyramidPassMaterial=new O({name:`PyramidPass`}),this.pyramidPassUniforms={inputTexture:{value:void 0},inputWidth:{value:0},inputHeight:{value:0},inputShiftX:{value:0},outputShiftX:{value:0}},this.pyramidTopLevelReadPixelBuffer=new Float32Array(4),this.pyramidPassMaterial.fragmentShader=`
			precision highp float;
			precision highp sampler2D;
			layout(location = 0) out vec4 pc_FragColor;
			uniform sampler2D inputTexture;
			uniform float inputWidth;
			uniform float inputHeight;
			uniform float inputShiftX;
			uniform float outputShiftX;
			const vec2 half_unit_coord = vec2(0.5);
			const vec4 one = vec4(1.0);
			void main() {
				vec2 inputSize = vec2(inputWidth, inputHeight);
				vec2 input_pixel_uv = 1. / inputSize;
				vec2 coord = gl_FragCoord.xy - half_unit_coord;
				coord.x -= outputShiftX;
				coord = coord * 2. + half_unit_coord;
				coord.x += inputShiftX;

				
				vec2 input_uv = coord / inputSize;
				float bl = texture(inputTexture, input_uv).r;

				
				input_uv.x += input_pixel_uv.x;
				float br = texture(inputTexture, input_uv).r;

				
				input_uv.y += input_pixel_uv.y;
				float tr = texture(inputTexture, input_uv).r;

				
				input_uv.x -= input_pixel_uv.x;
				float tl = texture(inputTexture, input_uv).r;

				pc_FragColor.a = bl;
				pc_FragColor.b = pc_FragColor.a + br;
				pc_FragColor.g = pc_FragColor.b + tr;
				pc_FragColor.r = pc_FragColor.g + tl; 
			}
		`,this.pyramidPassMaterial.uniforms=this.pyramidPassUniforms,this.pyramidPassMaterial.depthTest=!1,this.pyramidPassMaterial.depthWrite=!1;let e=new o(D,this.pyramidPassMaterial);e.frustumCulled=!1,this.pyramidPassScene.add(e)}renderPyramid(e,n,r,i,a){new t().min.setScalar(0);let o=n.length-1,s=new g;r.getViewport(s),this.pyramidPassUniforms.inputShiftX.value=0,this.pyramidPassUniforms.outputShiftX.value=0;let c=o-1;for(let t=c;t>=0;t--){let o=t%2==c%2?a[0]:a[1],s=t===c?i:t%2==c%2?a[1]:a[0];this.pyramidPassUniforms.inputTexture.value=s.textures.length>1?s.textures[1]:s.texture,this.pyramidPassUniforms.inputWidth.value=`width`in s?s.width:1,this.pyramidPassUniforms.inputHeight.value=`height`in s?s.height:1,r.setRenderTarget(o);let l=n[t],u=r.getPixelRatio();r.setViewport(this.pyramidPassUniforms.outputShiftX.value/u,0,l/u,l/u),t===2&&e%2!=0&&r.setViewport(this.pyramidPassUniforms.outputShiftX.value/u,0,3/u,3/u),r.render(this.pyramidPassScene,A);let d=this.pyramidPassUniforms.inputShiftX.value;this.pyramidPassUniforms.inputShiftX.value=this.pyramidPassUniforms.outputShiftX.value,this.pyramidPassUniforms.outputShiftX.value=d,t<c&&(this.pyramidPassUniforms.outputShiftX.value+=n[t+1])}r.setViewport(s);let l=n.length%2==0?0:1;return r.readRenderTargetPixelsAsync(a[l],a[l].width-1,0,1,1,this.pyramidTopLevelReadPixelBuffer).then(()=>this.pyramidTopLevelReadPixelBuffer[0])}};var G=new i,K=new i,q=new f,J=new m,Y=new m,X=new f;function Z(e,t=0){let n=this.children.length;for(;n--;){let r=this.children[n];S.is(r)&&Q.call(r,e,t+1)}}function Q(e,t=0){if(!0!==e(this,t)){let n=this.children.length;for(;n--;){let r=this.children[n];S.is(r)&&Q.call(r,e,t+1)}}}function $(){if(this.shapesDataTexture.value===void 0){let e=new s(new Float32Array(1920),96,5,v,y);this.shapesDataTexture.value=e}let e=this.shapesDataTexture.value,t=e.image.data,n=0,r=0,i=this.data.geometry.blendRange,a=G.copy(this.matrixWorld).invert(),o=this._npart,c=0;this._meshSdfWanted.clear();let l=null;if(Z.call(this,e=>{if(!1===e.visible)return!0;let o;if(e instanceof E||e instanceof T||b(e))return;o=e instanceof w?e.object:e;let s=e.data?.cloner;if(x.is(e)&&s&&!s.hideBase&&s.type!==`radial`&&!0!==s.disabled||!(o instanceof C))return;let u=o.geometry.userData.parameters,d=u?.shapeBlendNode??o.dataPatched?.geometry?.shapeBlendNode;if(d===void 0)return;if(K.multiplyMatrices(a,e.matrixWorld).decompose(Y,q,J),u?.type===`TorusGeometry`&&u.arc!==360){let e=u.arc*Math.PI/180;e/=4,q.multiply(X.set(0,0,Math.sin(e),Math.cos(e)))}let f=d.overrideGlobalBlend?d.blendRange:i;f=f/this.bboxSize*2,t[4*c]=(Y.x-this.bboxOffset)/this.bboxSize*2,t[4*c+1]=(Y.y-this.bboxOffset)/this.bboxSize*2,t[4*c+2]=(Y.z-this.bboxOffset)/this.bboxSize*2,t[4*c+3]=d.operation===0?1:d.operation===2?-1:-2,t[384+4*c]=-q.x,t[384+4*c+1]=-q.y,t[384+4*c+2]=-q.z,t[384+4*c+3]=q.w;let p=new Float32Array(4),m=0,h=f;if(u?.type===`SphereGeometry`)u.width===u.height&&u.width===u.depth?p[0]=0:p[0]=1,p[1]=u.width/this.bboxSize,p[2]=u.height/this.bboxSize,p[3]=u.depth/this.bboxSize,h=Math.max(p[1],p[2],p[3])*J.x+f;else if(u?.type===`CubeGeometry`){m=u.cornerRadius;let e=u.width,t=u.height,n=u.depth;p[0]=2,p[1]=(e-2*m)/this.bboxSize,p[2]=(t-2*m)/this.bboxSize,p[3]=(n-2*m)/this.bboxSize,h=Math.sqrt(e**2+t**2+n**2)/this.bboxSize*J.x+f}else if(u?.type===`CylinderGeometry`){m=u.cornerRadius;let e=u.height,t=u.radiusBottom,n=u.radiusTop;if(n>=t){let r=Math.atan2(n-t,e),i=(Math.PI/2-r)/2;n-=m/Math.tan(i),t-=m*Math.tan(i)}else if(t>n){let r=Math.atan2(t-n,e),i=(Math.PI/2-r)/2;n-=m*Math.tan(i),t-=m/Math.tan(i)}p[1]=(u.height-2*m)/this.bboxSize,t===n?(p[0]=3,p[2]=t/this.bboxSize*2):(p[0]=4,p[2]=t/this.bboxSize*2,p[3]=n/this.bboxSize*2),h=(Math.hypot(p[1],Math.max(Math.abs(p[2]),Math.abs(p[3])))+m/this.bboxSize*2)*J.x+f}else if(u?.type===`TorusGeometry`){if(p[0]=5,p[1]=(u.width-u.depth)/this.bboxSize,p[2]=u.depth/this.bboxSize,u.arc!==360){p[0]=6,p[3]=p[1],t[1152+4*c+3]=p[2];let e=2*Math.atan2(p[2]/2,p[1]),n=u.arc*Math.PI/180/2-e;p[1]=Math.sin(n),p[2]=Math.cos(n)}h=u.width*J.x/this.bboxSize+f}else{let e=o.geometry;(l??(l=new Set)).add(e.uuid);let n=this._meshSdfBaked.get(e.uuid),r=H(e);if((n===void 0||n.posVersion!==r)&&this._meshSdfWanted.set(e.uuid,e),n===void 0)return;p[0]=7,p[1]=n.slot,p[2]=n.boxHalf.x/this.bboxSize*2,p[3]=n.boxHalf.y/this.bboxSize*2,t[1152+4*c+3]=n.boxHalf.z/this.bboxSize*2,h=Math.hypot(n.boxHalf.x,n.boxHalf.y,n.boxHalf.z)/this.bboxSize*2*J.x+f}t.set(p,768+4*c),n=Math.max(n,h),r=Math.max(r,f),this._reach[c]=h,t[1152+4*c]=f,t[1152+4*c+1]=m/this.bboxSize*2,t[1152+4*c+2]=J.x;let g,_,v=Array.isArray(o.material)?o.material[0]:o.material,y=v;if(y?.getShapeBlendBaseColor){let e=y.getShapeBlendBaseColor();g=e,_=e.a}else v?.uniforms?.nodeU0===void 0?(g={r:1,g:1,b:1},_=1):(g=v.uniforms.nodeU0.node.value,_=v.uniforms.nodeU1?.value??1);d.operation!==0&&!d.useColor&&(_=-1),t[1536+4*c]=g.r,t[1536+4*c+1]=g.g,t[1536+4*c+2]=g.b,t[1536+4*c+3]=_,_<1&&this.material.defines?.SHAPEBLEND_C===1&&this.material.setTransparent(!0),c++}),this._meshSdfBaked.size>0){let e=l??new Set;for(let t of this._meshSdfBaked.keys())e.has(t)||this._meshSdfBaked.delete(t)}this.npart=c,this._maxBlendK=r;let u=1.1*n+2/(this.spatialDivisions-1)+4/(this.resolution-1);this.spatialPassUniforms.span.value=u;let d=this._prevShapeData,f=o!==c,p=d===null||this._prevSpan!==u||f,m=p||B,h=this._fieldDirtyMin.set(1/0,1/0,1/0),g=this._fieldDirtyMax.set(-1/0,-1/0,-1/0);if(d!==null){let e=Math.max(c,o);for(let n=0;n<e;n++){let e=!1;for(let r=0;r<5;r++){let i=384*r+4*n;if(t[i]!==d[i]||t[i+1]!==d[i+1]||t[i+2]!==d[i+2]||t[i+3]!==d[i+3]){e=!0;break}}if(!e)continue;if(p=!0,m)break;let r=t[4*n],i=t[4*n+1],a=t[4*n+2],o=d[4*n],s=d[4*n+1],c=d[4*n+2],l=this._reach[n],u=this._prevReach[n];Number.isFinite(r+i+a+l)&&Number.isFinite(o+s+c+u)?(h.x=Math.min(h.x,r-l,o-u),h.y=Math.min(h.y,i-l,s-u),h.z=Math.min(h.z,a-l,c-u),g.x=Math.max(g.x,r+l,o+u),g.y=Math.max(g.y,i+l,s+u),g.z=Math.max(g.z,a+l,c+u)):m=!0}}return B&&(p=!0),this._fieldDirtyFull=m||h.x===1/0,p&&(d===null?this._prevShapeData=new Float32Array(t):d.set(t),this._prevReach.set(this._reach),this._prevSpan=u,e.needsUpdate=!0),p}function te(e){return $.call(e)}export{ee as a,W as c,H as i,k as l,M as n,F as o,P as r,L as s,R as t,te as u};