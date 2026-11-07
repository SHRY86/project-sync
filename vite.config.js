import {defineConfig} from 'vite';
import {readFileSync,readdirSync} from 'node:fs';
export default defineConfig({
  plugins:[{
    name:'local-submission-documents',
    generateBundle(){for(const name of readdirSync('docs'))if(/\.(md|json)$/.test(name))this.emitFile({type:'asset',fileName:`docs/${name}`,source:readFileSync(`docs/${name}`)});}
  }],
  build:{rollupOptions:{output:{manualChunks(id){
    if(id.includes('node_modules/three/'))return 'three';
    if(id.includes('node_modules/@pixiv/'))return 'vrm';
  }}}}
});
