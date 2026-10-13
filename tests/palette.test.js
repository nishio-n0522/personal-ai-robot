import test from 'node:test';
import assert from 'node:assert/strict';
import {PEARL,isNeutral} from '../src/renderer.js';
test('pearl and manual grays use neutral shading; previous colors retain their palette',()=>{assert.equal(PEARL,'#e8e7e2');for(const c of [PEARL,'#ffffff','#b0b0b0','#000000'])assert.equal(isNeutral(c),true);for(const c of ['#79b8ac','#ce9a52','#ff0000','bad'])assert.equal(isNeutral(c),false);});
