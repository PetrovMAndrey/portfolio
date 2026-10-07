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
const {mobile}=await import('../src/projects/mobile/data.js');
await mkdir('.preview',{recursive:true});
await command('Runtime.enable');await command('Page.enable');
await command('Page.navigate',{url:pageURL});await delay(600);
assert.equal(await evaluate('document.querySelectorAll(".project-navigation a").length'),10);
assert.equal(await evaluate('document.querySelectorAll(".project-navigation__unavailable").length'),0);
assert.equal(await evaluate('document.querySelectorAll(".project-separator").length'),9);
assert.equal(await evaluate('document.querySelectorAll("#project-10 [data-gallery],#project-10 [data-gallery-open],#project-10 button,#project-10 a,#project-10 dialog").length'),0);
assert.equal(await evaluate('document.querySelectorAll("#project-10 .mobile-app__mockup").length'),9);
const text=await evaluate('document.querySelector("#project-10").textContent');
for(const word of [mobile.title,mobile.subtitle,mobile.description,...mobile.apps.flatMap(a=>[a.title,a.subtitle,...a.paragraphs,...a.features.flatMap(f=>[f.title,...(f.text?[f.text]:[])])])])assert.ok(text.includes(word),word);
assert.deepEqual(await evaluate('[...document.querySelectorAll("#project-10 .mobile-app__mockup")].map(n=>n.getAttribute("src"))'),mobile.apps.flatMap(a=>a.mockups.map(n=>n.src)));
for(const width of [1920,1440,1280]){
 await command('Emulation.setDeviceMetricsOverride',{width,height:1080,deviceScaleFactor:1,mobile:false});
 for(const selector of ['.mobile-cover',...mobile.apps.map(a=>'.mobile-app--'+a.id)]){
  await evaluate(`document.querySelector('${selector}').scrollIntoView({behavior:'instant'})`);
  await evaluate(`Promise.all([...document.querySelectorAll('${selector} img')].map(n=>n.complete&&n.naturalWidth?Promise.resolve():new Promise((resolve,reject)=>{n.addEventListener('load',resolve,{once:true});n.addEventListener('error',()=>reject(new Error(n.src)),{once:true})})))`);
  await evaluate(`Promise.all([...document.querySelectorAll('${selector} img')].map(n=>n.decode()))`);
  await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-10');
 }
 const layout=await evaluate(`(()=>{
  const p=document.querySelector('#project-10'),rect=n=>n.getBoundingClientRect(),apps=[...p.querySelectorAll('.mobile-app')],nav=rect(document.querySelector('.project-navigation'));
  const outside=[...p.querySelectorAll('h2,h3,p,li,.mobile-app__mockup')].filter(n=>{const a=rect(n),b=rect(n.closest('section'));return a.left<b.left-.5||a.right>b.right+.5||a.top<b.top-.5||a.bottom>b.bottom+.5||a.right>nav.left-1}).map(n=>n.textContent||n.alt);
  const overlaps=[];for(const app of apps){const t=rect(app.querySelector('.mobile-app__text')),imgs=[...app.querySelectorAll('.mobile-app__mockup')];for(const n of imgs){const r=rect(n);if(t.left<r.right&&t.right>r.left&&t.top<r.bottom&&t.bottom>r.top)overlaps.push(n.alt);}for(let i=0;i<imgs.length;i++)for(let j=i+1;j<imgs.length;j++){const a=rect(imgs[i]),b=rect(imgs[j]);if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)overlaps.push('Images');}}
  return {overflow:document.documentElement.scrollWidth>innerWidth,outside,overlaps,images:[...p.querySelectorAll('.mobile-app__mockup')].map(n=>{const r=rect(n);return {width:r.width,height:r.height,naturalWidth:n.naturalWidth,naturalHeight:n.naturalHeight,fit:getComputedStyle(n).objectFit,transform:getComputedStyle(n).transform,border:getComputedStyle(n).borderWidth,parentOverflow:getComputedStyle(n.parentElement).overflow}}),backgrounds:[...p.querySelectorAll('.mobile-project__background')].map(n=>n.getAttribute('src')),middle:apps.slice(1,3).map(n=>{const r=rect(n);return {x:r.left,y:r.top,width:r.width,height:r.height}}),gaps:[...p.children].slice(1).map((n,i)=>rect(n).top-rect(p.children[i]).bottom),transition:[rect(p).top-rect(p.previousElementSibling).bottom,rect(p.previousElementSibling).top-rect(document.querySelector('#project-09')).bottom]};
 })()`);
 assert.equal(layout.overflow,false);assert.deepEqual(layout.outside,[]);assert.deepEqual(layout.overlaps,[]);
 for(const img of layout.images){assert.ok(img.width>=180);assert.ok(Math.abs(img.width/img.height-img.naturalWidth/img.naturalHeight)<.0001);assert.equal(img.fit,'contain');assert.equal(img.transform,'none');assert.equal(img.border,'0px');assert.equal(img.parentOverflow,'visible');}
 assert.deepEqual(layout.backgrounds,[mobile.background,...mobile.apps.map(a=>a.background)]);
 assert.equal(layout.middle[0].y,layout.middle[1].y);assert.equal(layout.middle[0].height,layout.middle[1].height);assert.ok(layout.middle[0].x<layout.middle[1].x);assert.ok(layout.middle[1].width>=550);
 assert.ok(layout.gaps.every(n=>Math.abs(n)<.5));assert.ok(layout.transition.every(n=>Math.abs(n)<.5));
 const clip=await evaluate('(()=>{const r=document.querySelector("#project-10").getBoundingClientRect();return {x:0,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()');
 const shot=await command('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});await writeFile('.preview/mobile-full-'+width+'.png',Buffer.from(shot.data,'base64'));
 await evaluate('document.querySelector("#project-09").scrollIntoView({behavior:"instant"})');await delay(100);
 assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-09');
 await evaluate('document.querySelector(".project-navigation a[href=\\"#project-10\\"]").click()');await waitForProject('10');
 await evaluate('scrollTo({top:0,behavior:"instant"})');await delay(100);
 await evaluate('(()=>{const n=document.querySelector(".hero-rail__item a[href=\\"#project-10\\"]"),r=n.getBoundingClientRect();document.querySelector(".hero-rail__viewport").scrollLeft+=r.left+r.width/2-innerWidth/2;})()');
 const click=await evaluate('(()=>{const r=document.querySelector(".hero-rail__item a[href=\\"#project-10\\"]").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
 await command('Input.dispatchMouseEvent',{type:'mouseMoved',...click});await command('Input.dispatchMouseEvent',{type:'mousePressed',...click,button:'left',clickCount:1});await command('Input.dispatchMouseEvent',{type:'mouseReleased',...click,button:'left',clickCount:1});await waitForProject('10');
 assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-10');
 console.log('PASS mobile project file://',width,JSON.stringify({mockupWidths:layout.images.map(n=>Math.round(n.width)),middleHeight:layout.middle[0].height}),'full mockups, exact copy, no clipping/overlap/overflow, both anchors and active 10');
}
assert.deepEqual(errors,[]);socket.close();