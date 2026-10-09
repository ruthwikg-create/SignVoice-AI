import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.env.SIGNVOICE_PORT||3000);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.wasm':'application/wasm','.task':'application/octet-stream','.txt':'text/plain','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end('Method not allowed');return;}
  try{
    const url=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(url.pathname);const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');const file=path.resolve(root,relative);
    if(!file.startsWith(root)){res.writeHead(403).end('Forbidden');return;}
    const info=await stat(file);if(!info.isFile())throw Error('not a file');
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Permissions-Policy':'camera=(self), microphone=()','Cache-Control':'no-cache','Referrer-Policy':'strict-origin-when-cross-origin'});if(req.method==='HEAD')res.end();else res.end(await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`SignVoice AI is running at http://localhost:${port}\nPress Ctrl+C to stop. No backend or API key is needed.`));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is busy. Set SIGNVOICE_PORT=3001 and try again.`:error.message);process.exitCode=1;});
