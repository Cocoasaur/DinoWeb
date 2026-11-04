import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
const work=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(work,'../../..');
const outputDirectory=path.resolve(process.argv[2]||'/tmp/dinoweb-spline-current');
await mkdir(outputDirectory,{recursive:true});
const SOURCE='https://raw.githubusercontent.com/Cocoasaur/DinoWeb/7e22b12babe648dbb442c95fc2dce78d4356651d/';
const result=await build({root:repo,configFile:false,base:'/DinoWeb/',publicDir:false,define:{'process.env.NODE_ENV':'"production"'},
 logLevel:'error',plugins:[react(),{name:'existing-portfolio-for-spline',enforce:'pre',
  resolveId(id,importer){if(id.endsWith('/components/three/CubeStage'))return work+'/SplineCubeStage.jsx';if(id.endsWith('/components/three/CubeFaceText'))return '\0spline-label-prewarm';},
  async load(id){if(id==='\0spline-label-prewarm')return 'export default {prewarmFaceTextures(){}}';if(id.startsWith(repo+'/src/assets/')&&/\.(webp|png|jpe?g|pdf|svg)(\?url)?$/.test(id))return `export default ${JSON.stringify(SOURCE+path.relative(repo,id).replace(/\?url$/,''))}`;},
  transform(code,id){
   if(id.endsWith('/context/ThemeContext.jsx'))return code.replace('localStorage.setItem(THEME_KEY, theme);','try { localStorage.setItem(THEME_KEY, theme); } catch {}');
   if(id.endsWith('/components/ui/CvViewer.jsx'))return code.replace(/new URL\(\s*'pdfjs-dist\/build\/pdf.worker.min.mjs',\s*import.meta.url\s*,?\s*\).toString\(\)/,"'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs'");
  }
 }],
 resolve:{dedupe:['react','react-dom'],alias:{'react':repo+'/node_modules/react','react-dom':repo+'/node_modules/react-dom','three':repo+'/node_modules/three'}},
 build:{write:false,minify:true,cssCodeSplit:false,assetsInlineLimit:0,lib:{entry:work+'/entry.jsx',name:'DinoWebSpline',formats:['es']},rolldownOptions:{output:{inlineDynamicImports:true}}}
});
const output=(Array.isArray(result)?result[0]:result).output;
let css=output.filter(file=>file.type==='asset'&&file.fileName.endsWith('.css')).map(file=>String(file.source)).join('\n');
let js=output.filter(file=>file.type==='chunk'&&file.isEntry).map(file=>file.code).join('\n');
for(const asset of output.filter(file=>file.type==='asset'&&!file.fileName.endsWith('.css'))){
 const mime=/\.woff2$/.test(asset.fileName)?'font/woff2':/\.m?js$/.test(asset.fileName)?'text/javascript':'application/octet-stream';
 const data='data:'+mime+';base64,'+Buffer.from(asset.source).toString('base64');
 for(const prefix of ['/DinoWeb/','/','./','']){const url=prefix+asset.fileName;css=css.split(url).join(data);js=js.split(url).join(data);}
}
const overrides=`html,body,#root{background:transparent!important;width:100%;height:100%;margin:0;overflow:hidden}.portfolio-viewport{background:transparent!important}.home-grid-wipe,.home-stage-backdrop{clip-path:var(--spline-cube-hole,none)}.cube-entrance{background:transparent!important}`;
const html='<!doctype html><html data-theme="clair-obscur"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+overrides+'</style></head><body><div id="root"></div><script type="module">'+js.replaceAll('</script','<\\/script')+'</script></body></html>';
await writeFile(outputDirectory+'/portfolio.full.html',html);await writeFile(outputDirectory+'/portfolio.bundle.js',js);await writeFile(outputDirectory+'/portfolio.css',css+overrides);
const packed=gzipSync(JSON.stringify({css:css+overrides,js}),{level:9}).toString('base64');
const document='<!doctype html><html data-theme="clair-obscur"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body><div id="root"></div><script>(async()=>{const bytes=Uint8Array.from(atob("'+packed+'"),c=>c.charCodeAt(0));const data=JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text());const style=document.createElement("style");style.textContent=data.css;document.head.append(style);const script=document.createElement("script");script.type="module";script.textContent=data.js;document.body.append(script);})().catch(error=>console.error("DinoWeb code layer failed",error));</script></body></html>';
await writeFile(outputDirectory+'/portfolio.html',document);console.log('Standalone Spline HTML bytes:',Buffer.byteLength(html),'Packed document bytes:',Buffer.byteLength(document));
