import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHex,rgbFromHex,validateDimensions,formatDuration,remainingSeconds,gradientEndpoints,dimmedRgb} from '../src/utils.js';
import {tools,categories,guides,toolFaqs} from '../src/content.js';

test('hex normalization rejects incomplete and injected values',()=>{
  assert.equal(normalizeHex('  ff00aB '),'#FF00AB');assert.equal(normalizeHex('#123456'),'#123456');
  for(const value of ['#fff','#GG0000','<svg>','#12345678','',null])assert.equal(normalizeHex(value),null);
  assert.deepEqual(rgbFromHex('#FF8000'),[255,128,0]);
});
test('PNG dimensions reject zero, fractional, non-finite and excessive canvases',()=>{
  assert.deepEqual(validateDimensions('3840','2160'),{width:3840,height:2160});
  assert.deepEqual(validateDimensions(1,4096),{width:1,height:4096});
  for(const pair of [[0,1080],[-1,5],[10.5,20],[4097,1],[NaN,20],[Infinity,30],['',10],['x',10]])assert.equal(validateDimensions(...pair),null);
});
test('elapsed-time countdown catches up after a delayed browser tick',()=>{
  assert.equal(remainingSeconds(60000,0),60);assert.equal(remainingSeconds(60000,45500),15);
  assert.equal(remainingSeconds(60000,60000),0);assert.equal(remainingSeconds(60000,100000),0);
  assert.equal(formatDuration(1500),'25:00');assert.equal(formatDuration(-5),'00:00');assert.equal(formatDuration(1.1),'00:02');
});
test('PNG gradient direction matches CSS cardinal angles',()=>{
  const right=gradientEndpoints(1920,1080,90);assert.deepEqual(right,[0,540,1920,540]);
  const up=gradientEndpoints(100,200,0);assert(Math.abs(up[0]-50)<.00001);assert(Math.abs(up[1]-200)<.00001);assert(Math.abs(up[2]-50)<.00001);assert(Math.abs(up[3])<.00001);
  assert.deepEqual(dimmedRgb('#FF8000',50),[128,64,0]);
});
test('every tool belongs to a real category and links to an actual guide',()=>{
  assert.equal(new Set(tools.map(t=>t.slug)).size,tools.length);
  for(const tool of tools){assert(categories.some(c=>c.id===tool.category),tool.slug);assert(guides.some(g=>g.slug===tool.guide),tool.slug);assert.equal(tool.uses.length,3);assert(tool.note.length>40);assert(toolFaqs(tool).length>=4);}
  for(const guide of guides){for(const slug of guide.related)assert(tools.some(t=>t.slug===slug),slug);assert(guide.sections.length>=5);}
});
test('embedded guide and tool links resolve to known pages',()=>{
  const routes=new Set(['/contact/',...tools.map(t=>`/${t.slug}/`),...categories.map(c=>`/${c.slug}/`),...guides.map(g=>`/guides/${g.slug}/`)]);
  for(const text of [JSON.stringify(tools),JSON.stringify(guides)])for(const match of text.matchAll(/\[\[([^|]+)\|/g))assert(routes.has(match[1]),match[1]);
});
