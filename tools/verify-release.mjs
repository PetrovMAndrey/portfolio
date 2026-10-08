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
// Final release audit, also usable against the published GitHub Pages URL.
const failures=[];const resources=new Set();
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Network.responseReceived'){resources.add(m.params.response.url);if(m.params.response.status>=400)failures.push({url:m.params.response.url,status:m.params.response.status});}if(m.method==='Network.loadingFailed'&&!m.params.canceled)failures.push(m.params.errorText);});
await mkdir('.preview',{recursive:true});await command('Runtime.enable');await command('Page.enable');await command('Network.enable');
const releaseURL=process.argv[2]?.startsWith('https://')?process.argv[2]:pageURL;
for(const width of [1920,1440,1280]){
 await command('Emulation.setDeviceMetricsOverride',{width,height:1080,deviceScaleFactor:1,mobile:false});
 await command('Page.navigate',{url:releaseURL});await delay(1000);
 await evaluate('Promise.all([...document.images].filter(image=>image.getAttribute("src")).map(async image=>{image.loading="eager";if(!image.complete)await new Promise((resolve,reject)=>{image.addEventListener("load",resolve,{once:true});image.addEventListener("error",()=>reject(new Error(image.src)),{once:true})});await image.decode()}))');
 assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 const assets=await evaluate(`(() => {const urls=new Set([...document.images].filter(i=>i.getAttribute('src')).map(i=>i.src));for(const n of document.querySelectorAll('*'))for(const pseudo of [null,'::before','::after']){const s=getComputedStyle(n,pseudo);for(const value of [s.backgroundImage,s.maskImage])for(const part of value.split('url("').slice(1)){const url=part.split('")')[0];if(!url.startsWith('data:'))urls.add(new URL(url,location.href).href);}}return [...urls];})()`);
 for(const url of assets)assert.ok(await evaluate(`new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>0);i.onerror=()=>resolve(false);i.src=${JSON.stringify(url)}})`),`Missing asset ${url}`);
 for(const id of ['hero',...Array.from({length:10},(_,i)=>'project-'+String(i+1).padStart(2,'0')),'discuss']){
  await evaluate(`document.querySelector('.project-navigation a[href="#${id}"]').click()`);
  for(let i=0;i<110;i++){if(await evaluate(`document.querySelector('.project-navigation [aria-current]')?.hash==='#${id}' && (Math.abs(${id==='hero'?'scrollY':`document.getElementById('${id}').getBoundingClientRect().top`})<2 || document.documentElement.scrollHeight-innerHeight-scrollY<2)`))break;await delay(50);}
  assert.equal(await evaluate('document.querySelector(".project-navigation [aria-current]").hash'),'#'+id);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  if(id!=='hero')await screenshot('release-'+width+'-'+id);
 }
 assert.equal(await evaluate('document.querySelectorAll("[data-gallery]").length'),9);
 for(let g=0;g<9;g++){
  const info=await evaluate(`(()=>{const g=document.querySelectorAll('[data-gallery]')[${g}];return {count:g.querySelectorAll('[data-src]').length,indicators:g.querySelectorAll('.gallery-lightbox-indicator').length,first:g.querySelector('[data-src]').contains(g.querySelector('.gallery-lightbox-indicator'))}})()`);
  assert.equal(info.indicators,1);assert.equal(info.first,true);
  for(let i=0;i<info.count;i++){
   await evaluate(`document.querySelectorAll('[data-gallery]')[${g}].querySelectorAll('[data-src]')[${i}].click()`);await delay(60);
   const image=await evaluate(`(async()=>{const d=document.querySelector('dialog[open]');const img=d.querySelector('img');await img.decode();const b=document.querySelectorAll('[data-gallery]')[${g}].querySelectorAll('[data-src]')[${i}];return {source:img.src,expected:new URL(b.dataset.src,location.href).href,w:img.naturalWidth,h:img.naturalHeight,ratio:img.getBoundingClientRect().width/img.getBoundingClientRect().height,expectedRatio:img.naturalWidth/img.naturalHeight}})()`);
   assert.equal(image.source,image.expected);assert.ok(Math.abs(image.ratio-image.expectedRatio)<.002);
   await key('ArrowRight');await key('ArrowLeft');await key('+');assert.notEqual(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'),'100%');await key('0');await key('Escape');assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'),0);
  }
 }
 const links=await evaluate(`Array.from(document.querySelectorAll('a[href]'),a=>({href:a.getAttribute('href'),target:a.target,rel:a.rel})).filter(a=>!a.href.startsWith('#'))`);
 assert.ok(links.some(a=>a.href==='https://t.me/Andrey_M_Petrov'));assert.ok(links.some(a=>a.href==='mailto:petrov_nlr@mail.ru'));
 assert.equal(await evaluate('Array.from(document.links).filter(a=>a.getAttribute("href").startsWith("#")).every(a=>document.getElementById(a.hash.slice(1)))'),true);
 assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
 console.log('PASS release',width,'12 menu anchors, 9 galleries / every full original, first-thumbnail indicators, zoom/keyboard/Esc, all image/SVG backgrounds, no horizontal overflow');
}
await writeFile('.preview/release-resource-urls.json',JSON.stringify([...resources],null,2));socket.close();
