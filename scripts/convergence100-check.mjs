import {pathToFileURL} from 'node:url';import {writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
await mkdir('evidence',{recursive:true});
const {chromium}=await import(pathToFileURL(process.argv[2]));const b=await chromium.launch({channel:'chrome',headless:false}),p=await b.newPage({viewport:{width:1280,height:1600},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173');
const set=async(id,v)=>p.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input'));},v),frame=()=>p.locator('#eye').evaluate(c=>c.toDataURL());assert.equal(await p.inputValue('#convergence'),'10');assert.equal(await p.locator('#convergence').getAttribute('max'),'100');
const read=()=>p.evaluate(()=>['eye','eye-right'].map(id=>{const a=document.getElementById(id).getContext('2d').getImageData(0,0,466,466).data;let n=0,xsum=0;for(let y=0;y<466;y++)for(let x=0;x<466;x++){let i=(y*466+x)*4;if(a[i+3]>240&&a[i]<40&&a[i+1]<55&&a[i+2]<60){n++;xsum+=x;}}return {visible:n,x:xsum/n};}));
const shots=[],corners=[],measured=[];let cases=0,blinks=0;
for(const size of [.7,.85,1])for(const c of [0,50,100]){
 await p.click('#reset');await set('iris-size',size);await set('convergence',c);
 for(const pos of [[0,0],[-1,-1],[1,-1],[-1,1],[1,1]]){
  await set('gaze-x',pos[0]);await set('gaze-y',pos[1]);const visible=await read();assert.ok(visible.every(v=>v.visible>1000),JSON.stringify({size,c,pos,visible}));cases++;
  if(pos[0]===0){measured.push({size,c,visible});await p.click('#portrait-view');await p.waitForTimeout(100);shots.push({label:'iris '+size*100+'% / convergence '+c+'px',data:(await p.locator('#face').screenshot()).toString('base64')});}
  if(c===100){await p.waitForTimeout(80);corners.push({label:'iris '+size*100+'% / max100 / '+pos,data:(await p.locator('#face').screenshot()).toString('base64')});}
 }
 await p.click('#blink');await p.waitForTimeout(90);const closed=await frame();await p.waitForTimeout(500);assert.notEqual(await frame(),closed);await p.click('#pause');blinks++;
}
for(const size of [.7,.85,1]){const rows=measured.filter(x=>x.size===size);for(let i=1;i<rows.length;i++){assert.ok(rows[i].visible[0].x>rows[i-1].visible[0].x+25);assert.ok(rows[i].visible[1].x<rows[i-1].visible[1].x-25);}}
await p.click('#reset');await set('convergence',0);const zero=await frame();for(let i=0;i<5;i++){await set('convergence',100);await set('convergence',0);assert.equal(await frame(),zero);}
const sheet=await b.newPage();for(const [name,items,columns]of[['convergence100-comparison',shots,3],['convergence100-corners',corners,5]]){await sheet.setViewportSize({width:columns*300,height:1000});await sheet.setContent(`<body style="margin:0;background:#e2e8de;font:13px sans-serif;display:grid;grid-template-columns:repeat(${columns},300px)">`+items.map(x=>`<div>${x.label}<img width="295" style="display:block" src="data:image/png;base64,${x.data}"></div>`).join('')+'</body>');await sheet.screenshot({path:'evidence/'+name+'.png',fullPage:true});}
await p.click('#reset');assert.equal(await p.inputValue('#convergence'),'10');assert.equal(await p.inputValue('#iris-size'),'0.85');assert.deepEqual(errors,[]);const report={max:100,default:10,normalGazeCases:cases,blinkCombinations:blinks,zeroRestoreCycles:5,centroids:measured,http:(await p.request.get('http://127.0.0.1:4173')).status(),errors};await writeFile('evidence/convergence100-results.json',JSON.stringify(report,null,2));console.log({cases,blinks,http:report.http,errors});await b.close();
