import test from 'node:test';
import assert from 'node:assert/strict';
import {roundedLidGeometry,inwardLidGeometry,droopingLidGeometry} from '../src/model.js';
test('rounded lids never cross and fully close for every openness',()=>{
 for(let o=0;o<=1.001;o+=.05)for(let b=0;b<=1.001;b+=.05){const g=roundedLidGeometry(o,b);for(let i=0;i<2;i++){assert.ok(g.upper[i][1]<=g.lower[i][1]);assert.equal(g.upper[i][0],g.lower[i][0]);}}
 for(const o of [0,.05,.46,.92,1]){const g=roundedLidGeometry(o,1);assert.deepEqual(g.upper,g.lower);}
});
test('inward openings mirror each other and close without a gap',()=>{
 for(const o of [.05,.46,.92,1])for(const b of [0,.3,.8,1]){
 const l=inwardLidGeometry(o,b,1),r=inwardLidGeometry(o,b,-1);
 const lp=[l.left,l.right,...l.upper,...l.lower],rp=[r.left,r.right,...r.upper,...r.lower];
 lp.forEach((p,i)=>{assert.ok(Math.abs(p[0]+rp[i][0]-466)<1e-9);assert.equal(p[1],rp[i][1]);});
 if(b===1){assert.deepEqual(l.upper,l.lower);assert.deepEqual(r.upper,r.lower);}
 }
 const g=inwardLidGeometry(1,0);assert.ok((g.upper[0][0]+g.upper[1][0])/2>233);assert.ok((g.lower[0][0]+g.lower[1][0])/2<233);
});
test('drooping corners stay lower on the outside with mirrored, non-crossing lids',()=>{
 const cubic=(p0,p1,p2,p3,t)=>p0*(1-t)**3+3*p1*t*(1-t)**2+3*p2*t*t*(1-t)+p3*t**3;
 for(const o of [.05,.46,.92,1])for(const b of [0,.3,.8,1]){
 const l=droopingLidGeometry(o,b,1),r=droopingLidGeometry(o,b,-1);
 assert.ok(l.left[1]>l.right[1]);assert.ok(r.left[1]>r.right[1]);assert.ok(r.left[0]>r.right[0]);
 const lp=[l.left,l.right,...l.upper,...l.lower],rp=[r.left,r.right,...r.upper,...r.lower];lp.forEach((p,i)=>{assert.equal(p[0]+rp[i][0],466);assert.equal(p[1],rp[i][1]);});
 for(let t=0;t<=1;t+=.025){const up=cubic(l.left[1],l.upper[0][1],l.upper[1][1],l.right[1],t),lo=cubic(l.left[1],l.lower[0][1],l.lower[1][1],l.right[1],t);assert.ok(up<=lo+1e-9);}
 if(b===1){assert.deepEqual(l.upper,l.lower);assert.deepEqual(r.upper,r.lower);}
 }
});
