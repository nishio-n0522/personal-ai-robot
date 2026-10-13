import test from 'node:test';import assert from 'node:assert/strict';import {binocularGazeOffset} from '../src/model.js';
test('convergence is opposite, bounded, removable and fades at extreme gaze',()=>{
 assert.equal(binocularGazeOffset(0,10,1),10);assert.equal(binocularGazeOffset(0,10,-1),-10);
 for(const c of [0,10,18,24,36,48,75,100,200])for(const side of [-1,1]){let previous=-Infinity;for(let i=-100;i<=100;i++){const g=i/100,v=binocularGazeOffset(g,c,side);assert.ok(Math.abs(v)<=112);assert.ok(v>=previous);previous=v;if(c===0)assert.equal(v,36*g);}if(c<=24)for(const g of [-1,1])assert.equal(binocularGazeOffset(g,c,side),36*g);}
 assert.equal(binocularGazeOffset(0,48,1),48);assert.equal(binocularGazeOffset(0,48,-1),-48);
 for(let c=0;c<=100;c++){assert.equal(binocularGazeOffset(0,c,1),c);assert.equal(binocularGazeOffset(0,c,-1),c===0?0:-c);}
});
