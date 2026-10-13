import test from 'node:test';
import assert from 'node:assert/strict';
import {EyeModel,lidGeometry} from '../src/model.js';
test('upper lid alone closes toward lower lid, with no crossed geometry',()=>{for(const o of [0,.05,.46,.92,1]){let prior=-Infinity;for(let i=0;i<=100;i++){const g=lidGeometry(o,i/100);assert.ok(g.upper>=prior&&g.upper<=g.lower);assert.equal(g.lower,lidGeometry(o,0).lower);prior=g.upper;}const closed=lidGeometry(o,1);assert.equal(closed.upper,closed.lower);}});
test('sleepy opening has room below pupil instead of a central slit',()=>{const g=lidGeometry(.46,0);const top=(g.edge+g.upper)/2,bottom=(g.edge+g.lower)/2;assert.ok(top>100&&top<150);assert.ok(bottom>400);assert.ok(bottom-top>280);});
test('head lags eye, converges and never overshoots for extreme reversals',()=>{const m=new EyeModel();m.auto=false;for(const target of [1,-1,1,0]){m.setGaze(target,-target);for(let i=0;i<200;i++){m.step(1/60);assert.ok(Math.abs(m.headX)<=1&&Math.abs(m.headY)<=1);if(i===0&&target===1)assert.ok(m.headX<m.x);}assert.ok(Math.abs(m.headX-target)<.002);}});
test('head remains unchanged when time does not advance; reset centers it',()=>{const m=new EyeModel();m.auto=false;m.setGaze(1,1);m.step(.1);const before=m.snapshot();m.step(0);assert.equal(m.headX,before.headX);m.reset();assert.equal(m.headX,0);assert.equal(m.headY,0);});
