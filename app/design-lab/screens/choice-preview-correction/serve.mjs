import { pathToFileURL, fileURLToPath } from 'node:url';
// Reuse installed dependencies read-only when this fresh worktree has none.
const vite = process.env.CHOICE_REVIEW_VITE ?? fileURLToPath(new URL('../../../node_modules/vite/dist/node/index.js', import.meta.url));
const { createServer } = await import(pathToFileURL(vite));
const root = fileURLToPath(new URL('../../', import.meta.url));
const stub = fileURLToPath(new URL('../../native.ts', import.meta.url));
const server = await createServer({ configFile:false, root, publicDir:false, optimizeDeps:{noDiscovery:true},
  plugins:[{name:'choice-draft-native-refusal',enforce:'pre',resolveId(id){
    if(id==='@tauri-apps/api/core')return stub;
    if(id.startsWith('@tauri-apps/'))throw Error('Native APIs are unavailable in this draft.');
  }}],
  server:{host:'127.0.0.1',port:5186,strictPort:true,hmr:false,watch:null,fs:{allow:[fileURLToPath(new URL('../../../',import.meta.url))]}},
});
await server.listen();
console.log('Choice draft: http://127.0.0.1:5186/screens/choice-preview-correction/index.html');
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,async()=>{await server.close();process.exit(0);});
