import {EyeModel} from './model.js';
import {EyeRenderer,PEARL,CLASSIC,HIGHLIGHTS} from './renderer.js';
const $=id=>document.getElementById(id),model=new EyeModel(),renderer=new EyeRenderer($('eye'));
const rightRenderer=new EyeRenderer($('eye-right')),detailRenderer=new EyeRenderer($('eye-detail'));
const features={material:true,lids:true,head:true,integrated:true,composition:true,shape:true};
let inward=true,droop=true,irisScale=.85,convergence=10;
let highlight='round',highlightSize=1,highlightBrightness=1;
const robotOption=new Option('まるいロボット','robot');$('animal').prepend(robotOption);$('animal').value='robot';$('face').className='face robot';
document.querySelector('.intro>p:last-child').textContent='丸いロボットと５種類の動物で、相棒のまなざしを比べます。';
document.querySelector('.hint').textContent='オリジナルの比較用デザイン / 目をドラッグすると手動視線になります';
for(const side of ['left','right']){const arm=document.createElement('div');arm.className='robot-arm '+side;$('face').append(arm);}
const portrait=document.createElement('button');portrait.id='portrait-view';portrait.textContent='顔アップ';portrait.setAttribute('aria-pressed','false');$('face-view').after(portrait);$('face-view').textContent='全体';
const pearlButton=document.createElement('button');pearlButton.id='pearl';pearlButton.className='swatch pearl';pearlButton.textContent='白';pearlButton.title='パールホワイト';pearlButton.setAttribute('aria-label','パールホワイトにする');$('teal').before(pearlButton);$('hue').value=PEARL;
const rig=document.createElement('div');rig.className='head-rig';
for(const element of [...$('face').children])if(element.matches('.ear,.head'))rig.append(element);
$('face').prepend(rig);
const comparison=document.createElement('div');comparison.className='comparison';
comparison.innerHTML='<label for="comparison">見た目の比較</label><select id="comparison"><option value="improved">改善版</option><option value="original">変更前</option><option value="custom" disabled>個別に比較中</option></select><details><summary>項目ごとに比較</summary><label><input id="feature-material" type="checkbox" checked> 柔らかい材質・反射</label><label><input id="feature-lids" type="checkbox" checked> 上まぶた主体</label><label><input id="feature-head" type="checkbox" checked> 小さな頭の追従</label></details><p>同じ表情・視線のまま切り替えます</p>';
document.querySelector('.controls').prepend(comparison);
const previous=new Option('前の改善版','previous');$('comparison').add(previous,1);
$('comparison').options[0].text='改善版（境界統合）';
const integrateLabel=document.createElement('label');integrateLabel.innerHTML='<input id="feature-integrated" type="checkbox" checked> 虹彩と瞳孔の境界をなじませる';comparison.querySelector('details').append(integrateLabel);
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,last=0,frames=0,fpsTime=0;
const boundary=new Option('直前の境界統合版','boundary');$('comparison').add(boundary,1);
$('comparison').options[0].text='参考構図に合わせた版';
const compositionLabel=document.createElement('label');compositionLabel.innerHTML='<input id="feature-composition" type="checkbox" checked> 上寄りの瞳と下側の白目';comparison.querySelector('details').append(compositionLabel);
$('hue').value=CLASSIC;
const oldShape=new Option('形状修正前（アーモンド形）','composition');$('comparison').add(oldShape,1);
$('comparison').options[0].text='形状修正版（丸い開口部）';
const shapeLabel=document.createElement('label');shapeLabel.innerHTML='<input id="feature-shape" type="checkbox" checked> 丸い開口部と上まぶた';comparison.querySelector('details').append(shapeLabel);
const shapeControls=document.createElement('div');shapeControls.innerHTML='<label for="aperture">丸い開口部の向き</label><select id="aperture"><option value="inward">内傾（鼻側へ8度）</option><option value="straight">まっすぐ</option></select><label for="iris-size">虹彩サイズ <output id="iris-size-value">90%</output></label><input id="iris-size" type="range" min="0.7" max="1.15" step="0.01" value="0.9"><button id="iris-original" type="button">虹彩を従来サイズへ（100%）</button><p>向きは丸い開口部に適用。虹彩と瞳孔は一緒に拡大縮小します。</p>';comparison.append(shapeControls);
$('aperture').prepend(new Option('たれ目（目尻を柔らかく下げる）','droop'));$('aperture').value='droop';
$('aperture').onchange=e=>{inward=e.target.value!=='straight';droop=e.target.value==='droop';draw();};
const convergeControls=document.createElement('div');convergeControls.innerHTML='<label for="convergence">寄せ具合（0で解除） <output id="convergence-value">10</output></label><input id="convergence" type="range" min="0" max="18" step="1" value="10"><button id="convergence-zero" type="button">寄せなしと比較</button>';shapeControls.append(convergeControls);
function convergeSync(){$('convergence').value=convergence;$('convergence-value').value=convergence;draw();}
$('convergence').oninput=e=>{convergence=+e.target.value;convergeSync();};$('convergence-zero').onclick=()=>{convergence=0;convergeSync();};
$('convergence').max='100';$('convergence').setAttribute('aria-label','寄せ具合：0から100ピクセル、10が軽め');
convergeControls.querySelector('label').firstChild.textContent='寄せ具合（0〜100px・0で解除） ';
const convergenceHint=document.createElement('p');convergenceHint.textContent='正面では表示値ぶん鼻側へ移動。端の視線では最大24px弱まり、まぶたに隠れる部分は表示されません。';convergeControls.append(convergenceHint);
$('iris-size').value=irisScale;$('iris-size-value').value='85%';
function sizeSync(){$('iris-size').value=irisScale;$('iris-size-value').value=Math.round(irisScale*100)+'%';draw();}
$('iris-size').oninput=e=>{irisScale=+e.target.value;sizeSync();};$('iris-original').onclick=()=>{irisScale=1;sizeSync();};
const descriptions={normal:'通常 · ゆったりと周りを見ています',curious:'興味 · 気になるものを見つけました',sleepy:'眠い · そろそろ、おやすみの時間'};
function draw(){
 const s=model.snapshot();rightRenderer.color=detailRenderer.color=renderer.color;
 renderer.lidColor=rightRenderer.lidColor=detailRenderer.lidColor=({robot:'#ece1cc',penguin:'#f1ead6',rabbit:'#f3e5d9',dog:'#e6c394',cat:'#ddcdb8',panda:'#7b8879'})[$('animal').value];
 $('face').classList.toggle('soft-lids',features.lids);
 rig.style.transform=features.head?`translate(${s.headX*5}px,${s.headY*3}px) rotate(${s.headX*1.4}deg)`:'none';
 const rendering={...features,inward,droop,irisScale,convergence,highlight,highlightSize,highlightBrightness};renderer.draw(s,{...rendering,side:1});
 // Share animation state; inward apertures need mirrored per-eye geometry.
 // Straight and legacy modes retain the same raster in both eyes.
 if(convergence>0||inward&&features.shape&&features.lids)rightRenderer.draw(s,{...rendering,side:-1});else{rightRenderer.ctx.clearRect(0,0,466,466);rightRenderer.ctx.drawImage(renderer.canvas,0,0);}
 if(!$('detail').hidden){detailRenderer.ctx.clearRect(0,0,466,466);detailRenderer.ctx.drawImage(renderer.canvas,0,0);}
}
function comparisonSync(){for(const key of Object.keys(features))$('feature-'+key).checked=features[key];const base=features.material&&features.lids&&features.head;$('comparison').value=Object.values(features).every(Boolean)?'improved':base&&features.integrated&&features.composition&&!features.shape?'composition':base&&features.integrated&&!features.composition&&!features.shape?'boundary':base&&!features.integrated&&!features.composition&&!features.shape?'previous':Object.values(features).every(v=>!v)?'original':'custom';draw();}
$('comparison').onchange=e=>{if(e.target.value==='custom')return;const value=e.target.value;for(const k of Object.keys(features))features[k]=value==='improved'||value==='composition'&&k!=='shape'||value==='boundary'&&!['composition','shape'].includes(k)||value==='previous'&&!['integrated','composition','shape'].includes(k);comparisonSync();};
for(const key of Object.keys(features))$('feature-'+key).onchange=e=>{features[key]=e.target.checked;comparisonSync();};
let view='face';
for(const name of ['face','portrait','detail']) $(name+'-view').onclick=()=>{view=name;$('face').hidden=name==='detail';$('detail').hidden=name!=='detail';$('face').classList.toggle('portrait',name==='portrait');for(const id of ['face','portrait','detail'])$(id+'-view').setAttribute('aria-pressed',String(name===id));draw();};
function sync(){
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===model.mode)));
 $('state-label').textContent=descriptions[model.mode];$('auto').checked=model.auto;
 for(const [id,v] of [['gaze-x',model.targetX],['gaze-y',model.targetY],['pupil',model.basePupil],['openness',model.baseOpen]]){$(id).value=v;$(id+'-value').value=v.toFixed(2);}
 $('pause').textContent=paused?'再開':'一時停止';$('pause').setAttribute('aria-pressed',String(paused));
}
function applyManual(){if(paused){model.x=model.targetX;model.y=model.targetY;model.pupil=model.basePupil;model.openness=model.baseOpen;}sync();draw();}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{model.setMode(b.dataset.mode);applyManual();});
$('auto').onchange=e=>{model.auto=e.target.checked;};
for(const id of ['gaze-x','gaze-y','pupil','openness']) $(id).oninput=()=>{if(id.startsWith('gaze')){model.auto=false;model.setGaze(+$('gaze-x').value,+$('gaze-y').value);}else if(id==='pupil')model.setPupil(+$(id).value);else model.setOpen(+$(id).value);applyManual();};
$('hue').oninput=e=>{renderer.color=e.target.value;draw();};
for(const [id,color] of [['pearl',PEARL],['teal','#79b8ac'],['amber','#ce9a52']]) $(id).onclick=()=>{$('hue').value=color;renderer.color=color;draw();};
$('blink').onclick=()=>{model.triggerBlink();paused=false;sync();};
$('pause').onclick=()=>{paused=!paused;sync();};
$('reset').onclick=()=>{model.reset();renderer.color=CLASSIC;$('hue').value=renderer.color;inward=true;droop=true;irisScale=.85;convergence=10;$('aperture').value='droop';paused=matchMedia('(prefers-reduced-motion: reduce)').matches;sync();sizeSync();convergeSync();};
function point(e){const r=e.currentTarget.getBoundingClientRect();model.auto=false;model.setGaze((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1);applyManual();}
for(const id of ['eye','eye-right','eye-detail']){$(id).onpointerdown=e=>{e.currentTarget.setPointerCapture(e.pointerId);point(e);};$(id).onpointermove=e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))point(e);};$(id).onpointerup=e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};}
document.addEventListener('visibilitychange',()=>{last=0;});
function frame(t){const dt=last?(t-last)/1000:0;last=t;if(!paused){model.step(dt);draw();}frames++;if(t-fpsTime>=1000){$('fps').textContent=paused?'PAUSED':Math.round(frames*1000/(t-fpsTime))+' fps';frames=0;fpsTime=t;}requestAnimationFrame(frame);}
$('animal').onchange=e=>{$('face').className='face '+e.target.value; $('face').classList.toggle('portrait',view==='portrait');draw();};
const lightControls=document.createElement('div');lightControls.className='highlight-controls';lightControls.innerHTML='<label for="highlight">ハイライト</label><select id="highlight"></select><label for="highlight-size">大きさ <output id="highlight-size-value">100%</output></label><input id="highlight-size" type="range" min="0.5" max="1.6" step="0.05" value="1"><label for="highlight-brightness">明るさ <output id="highlight-brightness-value">100%</output></label><input id="highlight-brightness" type="range" min="0" max="1" step="0.05" value="1">';shapeControls.append(lightControls);
for(const [value,label]of Object.entries(HIGHLIGHTS))$('highlight').add(new Option(label,value));
lightControls.querySelector('label[for="highlight-size"]').firstChild.textContent='ハイライトの大きさ ';
const lightReset=document.createElement('button');lightReset.type='button';lightReset.id='highlight-size-reset';lightReset.textContent='ハイライトを標準サイズへ（100%）';lightControls.append(lightReset);
lightReset.onclick=()=>{highlightSize=1;$('highlight-size').value=1;$('highlight-size-value').value='100%';draw();};
$('highlight').onchange=e=>{highlight=e.target.value;draw();};
$('highlight-size').oninput=e=>{highlightSize=+e.target.value;$('highlight-size-value').value=Math.round(highlightSize*100)+'%';draw();};
$('highlight-brightness').oninput=e=>{highlightBrightness=+e.target.value;$('highlight-brightness-value').value=Math.round(highlightBrightness*100)+'%';draw();};
sync();draw();requestAnimationFrame(frame);
