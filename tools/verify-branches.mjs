// Browser checks using Chrome's local DevTools protocol; no package dependencies.
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const pageURL = process.argv[2] === '--file'
  ? pathToFileURL(resolve('index.html')).href
  : 'http://127.0.0.1:8000/';

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.id) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(message.error) : resolve(message.result);
  }
});
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  // Text assertions compare wording; typographic non-breaking spaces are equivalent.
  const value = result.result.value;
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value).replace(/\u00a0/g, ' '));
}
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function waitForProject(number) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await evaluate(`Math.abs(document.querySelector('#project-${number}').getBoundingClientRect().top) < 2`)) {
      await delay(50);
      return;
    }
    await delay(50);
  }
  throw new Error(`Navigation did not reach project ${number}`);
}
async function key(key, code = key) {
  const windowsVirtualKeyCode = { Escape: 27, ArrowLeft: 37, ArrowRight: 39 }[key];
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
  await delay(50);
}
async function screenshot(name) {
  const result = await command('Page.captureScreenshot', { format: 'png' });
  await writeFile(`.preview/${name}.png`, Buffer.from(result.data, 'base64'));
}
const {branches}=await import('../src/projects/branches/data.js');
await mkdir('.preview', {recursive:true});
await command('Runtime.enable');await command('Page.enable');
await command('Page.navigate',{url:pageURL});await delay(500);
const titles=branches.gallery.map(n=>n.title);
assert.equal(await evaluate('document.querySelectorAll("#project-08 > section").length'),3);
assert.equal(await evaluate('document.querySelectorAll("#project-08 a").length'),0);
assert.equal(await evaluate('document.querySelectorAll(".project-navigation a").length'),8);
assert.equal(await evaluate('document.querySelectorAll(".project-navigation__unavailable").length'),2);
assert.equal(await evaluate('document.querySelectorAll(".project-separator").length'),7);
assert.deepEqual(await evaluate('[...document.querySelectorAll(".branches-gallery figcaption")].map(n=>n.textContent)'),titles);
assert.deepEqual(await evaluate('[...document.querySelectorAll(".branches-gallery [data-src]")].map(n=>n.dataset.src)'),branches.gallery.map(n=>n.src));
const words=await evaluate('document.querySelector("#project-08").textContent');
for(const text of [...Object.values(branches.copy),...branches.tags,...branches.features.flatMap(n=>[n.title,n.text])])assert.ok(words.includes(text),text);
for(const width of [1920,1440,1280]) {
 await command('Emulation.setDeviceMetricsOverride',{width,height:1080,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector("#project-08").scrollIntoView({behavior:"instant"})');
 await evaluate('Promise.all([...document.querySelectorAll("#project-08 img")].map(n=>n.complete&&n.naturalWidth?Promise.resolve():new Promise((resolve,reject)=>{n.addEventListener("load",resolve,{once:true});n.addEventListener("error",()=>reject(new Error("Image failed: "+n.getAttribute("src"))),{once:true});})))');
 await evaluate('Promise.all([...document.querySelectorAll("#project-08 img")].map(n=>n.decode()))');await delay(100);
 const geometry=await evaluate(`(()=>{
  const rect=n=>n.getBoundingClientRect(),p=document.querySelector('#project-08'),cover=p.querySelector('.branches-cover'),visual=p.querySelector('.branches-cover__visual'),content=p.querySelector('.branches-cover__content'),screen=p.querySelector('.branches-cover__screen'),line=p.querySelector('.branches-cover__divider'),s=rect(screen),v=rect(visual),c=rect(content),l=rect(line),sections=[...p.children],nav=rect(document.querySelector('.project-navigation'));
  const outside=[...document.querySelectorAll('.ark h2,.grantmaster h2,.svetlo h2,.industrial h2,.metrika h2,.newsletter h2,.branches h2,.branches h3,.branches h4,.branches p,.branches li,.branches figcaption')].filter(n=>{const a=rect(n),b=rect(n.closest('section'));return a.left<b.left-.5||a.right>b.right+.5||a.top<b.top-.5||a.bottom>b.bottom+.5||a.right>nav.left-1}).map(n=>n.textContent);
  return {overflow:document.documentElement.scrollWidth>innerWidth,coverHeight:rect(cover).height,leftWidth:c.width,rightWidth:v.width,textLeft:c.left,visualLeft:v.left,centerX:s.left+s.width/2-(v.left+v.width/2),centerY:s.top+s.height/2-(v.top+v.height/2),screenRatio:s.width/s.height,naturalRatio:screen.naturalWidth/screen.naturalHeight,screenTransform:getComputedStyle(screen).transform,screenFit:getComputedStyle(screen).objectFit,margins:[s.left-v.left,v.right-s.right,s.top-v.top,v.bottom-s.bottom],backgrounds:[...p.querySelectorAll('.branches-cover__background')].map(n=>({src:n.getAttribute('src'),fit:getComputedStyle(n).objectFit})),line:{src:line.getAttribute('src'),ratio:l.width/l.height,x:l.left+l.width/2-v.left,filter:getComputedStyle(line).filter,transform:getComputedStyle(line).transform},outside,gaps:sections.slice(1).map((n,i)=>rect(n).top-rect(sections[i]).bottom),captions:[...p.querySelectorAll('figcaption')].map(n=>({x:rect(n).left-rect(n.parentElement.querySelector('button')).left,align:getComputedStyle(n).textAlign})),previews:[...p.querySelectorAll('.branches-gallery__preview')].map(n=>({width:rect(n).width,height:rect(n).height,top:rect(n).top,captionTop:rect(n.parentElement.querySelector('figcaption')).top,fit:getComputedStyle(n.querySelector('img')).objectFit,position:getComputedStyle(n.querySelector('img')).objectPosition})),transition:{name:p.previousElementSibling.className,gap:rect(p).top-rect(p.previousElementSibling).bottom,previousGap:rect(p.previousElementSibling).top-rect(document.querySelector('#project-07')).bottom},gold:getComputedStyle(p).getPropertyValue('--branches-accent').trim()};
 })()`);
 assert.equal(geometry.overflow,false);assert.deepEqual(geometry.outside,[]);
 assert.ok(geometry.coverHeight>=520&&geometry.coverHeight<850);
 assert.ok(geometry.leftWidth<geometry.rightWidth);assert.ok(geometry.textLeft<geometry.visualLeft);assert.ok(Math.abs(geometry.leftWidth/(geometry.leftWidth+geometry.rightWidth)-.46)<.0001);
 assert.ok(Math.abs(geometry.centerX)<.5&&Math.abs(geometry.centerY)<.5);
 assert.ok(geometry.margins.every(n=>n>=40));assert.equal(geometry.screenTransform,'none');assert.equal(geometry.screenFit,'contain');
 assert.ok(Math.abs(geometry.screenRatio-geometry.naturalRatio)<.0001);
 assert.deepEqual(geometry.backgrounds.map(n=>n.src),[branches.backgrounds.content,branches.backgrounds.visual]);assert.ok(geometry.backgrounds.every(n=>n.fit==='cover'));
 assert.equal(geometry.line.src,'./Вайфреймы в работу/Line.svg');assert.ok(Math.abs(geometry.line.ratio-29/1104)<.0001);assert.ok(Math.abs(geometry.line.x)<.5);assert.equal(geometry.line.filter,'brightness(0) invert(1)');assert.ok(geometry.line.transform.startsWith('matrix(1, 0, 0, 1,'));assert.equal(geometry.gold,'#ff641b');
 assert.ok(geometry.gaps.every(n=>Math.abs(n)<.5));assert.ok(geometry.captions.every(n=>Math.abs(n.x)<.5&&n.align==='left'));assert.ok(geometry.previews.every(n=>Math.abs(n.width/1.9-n.height)<.1&&Math.abs(n.width-geometry.previews[0].width)<.1&&Math.abs(n.height-geometry.previews[0].height)<.1&&Math.abs(n.top-geometry.previews[0].top)<.1&&Math.abs(n.captionTop-geometry.previews[0].captionTop)<.1&&n.fit==='cover'&&n.position==='50% 0%'));
 assert.deepEqual(await evaluate(`[...document.querySelectorAll('.industrial-gallery .interface-section__label,.metrika-gallery .interface-section__label,.newsletter-gallery .interface-section__label,.registry-gallery .interface-section__label,.branches-gallery .interface-section__label')].map(n=>getComputedStyle(n).color)`),Array(5).fill('rgb(255, 100, 27)'));
 assert.equal(geometry.transition.name,'project-separator');assert.ok(Math.abs(geometry.transition.gap)<.5&&Math.abs(geometry.transition.previousGap)<.5);
 const clip=await evaluate('(()=>{const r=document.querySelector("#project-08").getBoundingClientRect();return {x:0,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()');
 const shot=await command('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});await writeFile('.preview/branches-full-'+width+'.png',Buffer.from(shot.data,'base64'));
 for(const selector of ['.branches-cover','.branches-information','.branches-gallery']) {
  await evaluate(`document.querySelector('${selector}').scrollIntoView({behavior:'instant'})`);await delay(100);
  assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-08');
 }
 await evaluate('document.querySelector("#project-07").scrollIntoView({behavior:"instant"})');await delay(100);
 assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-07');
 await evaluate('document.querySelector(".project-navigation a[href=\\"#project-08\\"]").click()');await waitForProject('08');
 assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-08');
 for(let i=0;i<3;i++) {
  await evaluate(`document.querySelector('.branches-gallery [data-gallery-open="${i}"]').click()`);await evaluate('document.querySelector("dialog[open] img").decode()');await delay(50);
  const title=()=>evaluate('document.querySelector("dialog[open] .lightbox__title").textContent');
  assert.equal(await title(),titles[i]);assert.equal(await evaluate('document.querySelector("dialog[open] img").getAttribute("src")'),branches.gallery[i].src);
  const fullImage=await evaluate('(()=>{const n=document.querySelector("dialog[open] img"),r=n.getBoundingClientRect();return {width:n.naturalWidth,height:n.naturalHeight,ratio:r.width/r.height}})()');assert.equal(fullImage.width,branches.gallery[i].width);assert.equal(fullImage.height,branches.gallery[i].height);assert.ok(Math.abs(fullImage.ratio-fullImage.width/fullImage.height)<.0001);
  await key('ArrowRight');assert.equal(await title(),titles[(i+1)%3]);await key('ArrowLeft');assert.equal(await title(),titles[i]);
  await evaluate('document.querySelector("dialog[open] [data-action=previous]").click()');assert.equal(await title(),titles[(i+2)%3]);await evaluate('document.querySelector("dialog[open] [data-action=next]").click()');assert.equal(await title(),titles[i]);
  await evaluate('document.querySelector("dialog[open] img").decode()');await key('+');assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'),'150%');await key('-');assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'),'100%');
  await evaluate('for(let n=0;n<4;n++)document.querySelector("dialog[open] [data-action=in]").click()');
  const start=await evaluate('document.querySelector("dialog[open] img").style.transform');
  const drag=await evaluate('(()=>{const r=document.querySelector("dialog[open] .lightbox__stage").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await command('Input.dispatchMouseEvent',{type:'mousePressed',...drag,button:'left',clickCount:1});await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:drag.x+60,y:drag.y+100,button:'left',buttons:1});await command('Input.dispatchMouseEvent',{type:'mouseReleased',x:drag.x+60,y:drag.y+100,button:'left',clickCount:1});assert.notEqual(await evaluate('document.querySelector("dialog[open] img").style.transform'),start);
  await key('0');assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'),'100%');
  if(i%2)await key('Escape');else await evaluate('document.querySelector("dialog[open] [data-action=close]").click()');await delay(50);
  assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'),0);assert.equal(await evaluate('document.activeElement.dataset.galleryOpen'),String(i));
 }
 console.log('PASS project 08 file://',width,JSON.stringify({heroHeight:geometry.coverHeight,center:[geometry.centerX,geometry.centerY]}),'approved sources, proportions, no overflow/overlaps, navigation 07/08, lightbox/zoom/drag/keyboard');
}
assert.deepEqual(errors,[]);socket.close();
