import {spawn} from 'node:child_process';
import {openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url='http://127.0.0.1:4173';
async function status(){try{const r=await fetch(url,{signal:AbortSignal.timeout(1500)});const body=await r.text();return r.ok&&body.includes('PERSONAL AI ROBOT')?'ready':'occupied';}catch{return 'absent';}}
let state=await status();
if(state==='occupied')throw new Error('Port 4173 is used by a different application. It was not stopped.');
if(state==='absent'){
 const log=openSync(path.join(root,'preview-server.log'),'a');
 const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',log,log]});
 child.on('error',e=>{console.error(e);process.exitCode=1;});child.unref();closeSync(log);
 for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,200));if(await status()==='ready'){state='ready';break;}}
}
if(state!=='ready')throw new Error('Preview did not start. See preview-server.log.');
console.log('Windows preview ready: '+url);
const browser=spawn('cmd.exe',['/d','/c','start','',url],{detached:true,windowsHide:true,stdio:'ignore'});browser.unref();
