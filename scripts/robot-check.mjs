import {pathToFileURL} from 'node:url';
import {writeFile,mkdir} from 'node:fs/promises';
await mkdir('evidence',{recursive:true});
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.argv[2]));
const browser=await chromium.launch({channel:'chrome',headless:false});
const page=await browser.newPage({viewport:{width:1280,height:1200},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.clock.pauseAt(new Date());await page.goto('http://127.0.0.1:4173');
assert.equal(await page.inputValue('#animal'),'robot');assert.equal(await page.locator('#animal option').count(),6);
const shots=[],comparisons=[];let count=0;
const pixels=()=>page.locator('#eye').evaluate(c=>c.toDataURL());
for(const color of ['pearl','teal','amber'])for(const mode of ['normal','curious','sleepy']){
 for(const pos of [[0,0],[-1,-1],[1,-1],[-1,1],[1,1],'blink']){
  await page.click('#reset');await page.clock.runFor(32);await page.click('#'+color);await page.click('[data-mode="'+mode+'"]');
  if(pos==='blink'){await page.click('#blink');await page.clock.runFor(mode==='sleepy'?176:96);}else await page.evaluate(([x,y])=>{for(const [id,v]of[['gaze-x',x],['gaze-y',y]]){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input'));}},pos);
  assert.ok(await page.evaluate(()=>{const h=document.querySelector('.head').getBoundingClientRect();return [...document.querySelectorAll('.socket')].every(e=>{const r=e.getBoundingClientRect();return r.x>=h.x&&r.right<=h.right&&r.y>=h.y&&r.bottom<=h.bottom;});}));
  shots.push({color,mode,pos,label:color+' / '+mode+' / '+pos,data:(await page.locator('#face').screenshot()).toString('base64')});count++;
  if(pos==='blink')await page.click('#pause');
  if(Array.isArray(pos)&&pos[0]===0&&pos[1]===0){
   const before=await pixels();comparisons.push({label:color+' / '+mode+' / whole',data:shots.at(-1).data});
   await page.click('#portrait-view');assert.equal(await pixels(),before);assert.ok(await page.evaluate(()=>{const f=document.getElementById('face').getBoundingClientRect(),h=document.querySelector('.head').getBoundingClientRect();return h.top>=f.top&&h.bottom<=f.bottom&&h.left>=f.left&&h.right<=f.right;}));comparisons.push({label:color+' / '+mode+' / face',data:(await page.locator('#face').screenshot()).toString('base64')});await page.click('#face-view');
   await page.selectOption('#comparison','original');assert.equal(await page.inputValue('#hue'),{pearl:'#e8e7e2',teal:'#79b8ac',amber:'#ce9a52'}[color]);await page.selectOption('#comparison','improved');assert.equal(await pixels(),before);
  }
 }
}
await page.click('#reset');
for(const animal of ['penguin','rabbit','dog','cat','panda','robot']){await page.selectOption('#animal',animal);const p=await pixels();await page.click('#portrait-view');assert.equal(await pixels(),p);assert.ok(await page.locator('.face').evaluate(e=>e.classList.contains('portrait')));await page.click('#face-view');assert.equal(await pixels(),p);}
await page.click('#detail-view');assert.ok(await page.locator('#detail').isVisible());await page.click('#face-view');
await page.screenshot({path:'evidence/robot-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'evidence/robot-mobile.png',fullPage:true});
const sheet=await browser.newPage({viewport:{width:1440,height:1000}});
for(const color of ['pearl','teal','amber']){await sheet.setContent('<body style="margin:0;background:#e2e8de;font:12px sans-serif;display:grid;grid-template-columns:repeat(6,240px)">'+shots.filter(s=>s.color===color).map(s=>`<div>${s.label}<img style="display:block" width="235" src="data:image/png;base64,${s.data}"></div>`).join('')+'</body>');await sheet.screenshot({path:'evidence/robot-'+color+'-states.png',fullPage:true});}
await sheet.setContent('<body style="margin:0;background:#e2e8de;font:12px sans-serif;display:grid;grid-template-columns:repeat(6,240px)">'+comparisons.map(s=>`<div>${s.label}<img style="display:block" width="235" src="data:image/png;base64,${s.data}"></div>`).join('')+'</body>');await sheet.screenshot({path:'evidence/robot-whole-and-face.png',fullPage:true});
const live=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'no-preference'});await live.goto('http://127.0.0.1:4173');
for(const color of ['pearl','teal','amber'])for(const mode of ['normal','curious','sleepy']){await live.click('#'+color);await live.click('[data-mode="'+mode+'"]');await live.click('#blink');await live.waitForTimeout(850);}
assert.notEqual(await live.locator('.head-rig').evaluate(e=>e.style.transform),'none');assert.equal((await live.request.get('http://127.0.0.1:4173')).status(),200);assert.deepEqual(errors,[]);
const report={browser:await browser.version(),robotStates:count,wholeFaceComparisons:9,styleComparisons:9,retainedCharacters:6,liveStates:9,mobileNoOverflow:true,http:200,errors};await writeFile('evidence/robot-results.json',JSON.stringify(report,null,2));console.log(report);await browser.close();
