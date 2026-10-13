import test from 'node:test';
import assert from 'node:assert/strict';
import {EyeModel,seededRandom} from '../src/model.js';
test('bounded finite state during all expressions and long runs',()=>{
 for(const mode of ['normal','curious','sleepy']){const m=new EyeModel(seededRandom());m.setMode(mode);for(let i=0;i<18000;i++){const s=m.step(1/60);for(const v of Object.values(s))assert.ok(Number.isFinite(v));assert.ok(Math.abs(s.x)<=1&&Math.abs(s.y)<=1);assert.ok(s.open>=0&&s.open<=1);assert.ok(s.pupil>=.25&&s.pupil<=.7);}}
});
test('manual gaze clamps and converges without overshoot',()=>{const m=new EyeModel();m.auto=false;m.setGaze(5,-4);for(let i=0;i<120;i++)m.step(1/60);assert.ok(m.x>.999&&m.x<=1&&m.y<-.999&&m.y>=-1);});
test('blink closes and reopens in each expression',()=>{for(const mode of ['normal','curious','sleepy']){const m=new EyeModel();m.setMode(mode);m.triggerBlink();let max=0;for(let i=0;i<100;i++){m.step(.01);max=Math.max(max,m.blink);}assert.ok(max>.995);assert.equal(m.blink,0);assert.equal(m.blinkAge,-1);}});
test('time-based gaze agrees at 30 and 120fps',()=>{const models=[30,120].map(fps=>{const m=new EyeModel();m.auto=false;m.setGaze(.8,-.5);for(let i=0;i<fps;i++)m.step(1/fps);return m;});assert.ok(Math.abs(models[0].x-models[1].x)<1e-10);});
test('invalid input and tab time jumps stay safe',()=>{const m=new EyeModel();m.setMode('invalid');assert.equal(m.mode,'normal');m.setGaze(NaN,Infinity);m.setPupil(99);m.setOpen(-2);m.step(100);assert.equal(m.time,.1);assert.equal(m.basePupil,.7);assert.equal(m.baseOpen,.05);assert.ok(Number.isFinite(m.x));});
test('seeded playback repeatable; reset restores default',()=>{const a=new EyeModel(seededRandom(7)),b=new EyeModel(seededRandom(7));for(let i=0;i<500;i++)assert.deepEqual(a.step(.02),b.step(.02));a.setMode('sleepy');a.reset();assert.equal(a.mode,'normal');assert.equal(a.time,0);assert.equal(a.auto,true);});
