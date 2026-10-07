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
await command('Runtime.enable');await command('Page.enable');
await command('Page.navigate',{url:pageURL});await delay(700);
const titles=['Настройка выпуска','Настройка соцсетей','Публикация для соцсетей','Готовая рассылка'];
const directory='./REFERENCES/06_Студия рассылок/';
const {newsletter}=await import('../src/projects/newsletter/data.js');
assert.equal(await evaluate('document.querySelectorAll("#project-06 .newsletter__sections > section").length'),3);
assert.equal(await evaluate('document.querySelectorAll("#project-06 a").length'),0);
assert.equal(await evaluate('document.querySelectorAll(".project-navigation a:not(.project-navigation__service)").length'),10);
assert.equal(await evaluate('document.querySelectorAll(".project-separator").length'),9);
assert.deepEqual(await evaluate('[...document.querySelectorAll(".newsletter-gallery figcaption")].map(n=>n.textContent)'),titles);
assert.deepEqual(await evaluate('[...document.querySelectorAll(".newsletter-gallery [data-src]")].map(n=>n.dataset.src)'),titles.map((_,i)=>directory+(i+1)+'.png'));
const words=await evaluate('document.querySelector("#project-06").textContent');
for(const text of [newsletter.copy.subtitle,newsletter.copy.cover,newsletter.copy.taskTitle,...newsletter.copy.task,...newsletter.copy.solution,...newsletter.copy.gallery,...newsletter.tags,...newsletter.features.flatMap(f=>[f.title,f.text])])assert.ok(words.includes(text),text);
assert.ok(words.includes('4 экрана'));
for(const width of [1920,1440,1280]){
 await command('Emulation.setDeviceMetricsOverride',{width,height:1080,deviceScaleFactor:1,mobile:false});await delay(80);
 await evaluate('document.querySelector("#project-06").scrollIntoView({behavior:"instant"})');
 await evaluate('Promise.all([...document.querySelectorAll("#project-06 img")].map(n=>n.decode()))');
 await delay(80);
 const geometry=await evaluate(`(()=>{
  const p=document.querySelector('#project-06'),r=p.getBoundingClientRect(),side=p.querySelector('aside'),s=side.getBoundingClientRect(),img=side.querySelector('.newsletter-sidebar__screen'),ir=img.getBoundingClientRect(),line=side.querySelector('.newsletter-sidebar__line'),lr=line.getBoundingClientRect(),sections=[...p.querySelector('.newsletter__sections').children];
  const nav=document.querySelector('.project-navigation').getBoundingClientRect();
  return {overflow:document.documentElement.scrollWidth>innerWidth,side:{top:s.top-r.top,height:s.height-r.height,width:s.width/r.width},ratio:ir.width/ir.height,natural:img.naturalWidth/img.naturalHeight,sticky:getComputedStyle(img).position,
   line:{src:line.getAttribute('src'),ratio:lr.width/lr.height,top:lr.top-r.top,height:lr.height-r.height,center:lr.left+lr.width/2-s.right,filter:getComputedStyle(line).filter,transform:getComputedStyle(line).transform},
   sections:sections.map(n=>({left:n.getBoundingClientRect().left-s.right,bg:getComputedStyle(n).backgroundColor})),gaps:sections.slice(1).map((n,i)=>n.getBoundingClientRect().top-sections[i].getBoundingClientRect().bottom),end:sections.at(-1).getBoundingClientRect().bottom-r.bottom,
   outside:[...p.querySelectorAll('h2,h3,h4,p,li,figcaption')].filter(n=>{const a=n.getBoundingClientRect(),b=n.closest('section').getBoundingClientRect();return a.left<b.left-.5||a.right>b.right-.5||a.top<b.top-.5||a.bottom>b.bottom+.5||a.right>nav.left-1}).map(n=>n.textContent),
   rows:[...p.querySelectorAll('.newsletter-gallery__preview')].map(n=>n.getBoundingClientRect().top),fits:[...p.querySelectorAll('.newsletter-gallery__preview img')].map(n=>getComputedStyle(n).objectFit),
   captions:[...p.querySelectorAll('figcaption')].map(n=>({left:n.getBoundingClientRect().left-n.parentElement.querySelector('button').getBoundingClientRect().left,align:getComputedStyle(n).textAlign})),
   transition:p.previousElementSibling.className,gap:p.getBoundingClientRect().top-p.previousElementSibling.getBoundingClientRect().bottom,previousGap:p.previousElementSibling.getBoundingClientRect().top-document.querySelector('#project-05').getBoundingClientRect().bottom,
   bg:p.querySelector('.newsletter-cover__background').getAttribute('src'),gold:getComputedStyle(p).getPropertyValue('--newsletter-gold').trim()};})()`);
 assert.equal(geometry.overflow,false);assert.ok(Math.abs(geometry.side.top)<1&&Math.abs(geometry.side.height)<1);assert.ok(geometry.side.width<.3);
 assert.ok(Math.abs(geometry.ratio-geometry.natural)<.0001);assert.equal(geometry.sticky,'sticky');
 assert.equal(geometry.line.src,'./Вайфреймы в работу/Line.svg');assert.ok(Math.abs(geometry.line.ratio-29/1104)<.0001);assert.ok(Math.abs(geometry.line.top)<1&&Math.abs(geometry.line.height)<1&&Math.abs(geometry.line.center)<1);assert.equal(geometry.line.filter,'none');assert.ok(geometry.line.transform.startsWith('matrix(1, 0, 0, 1,'));assert.equal(geometry.gold,'#c4a464');
 assert.ok(geometry.sections.every(n=>Math.abs(n.left)<1));assert.deepEqual(geometry.sections.map(n=>n.bg),['rgb(16, 18, 17)','rgb(245, 242, 236)','rgb(16, 18, 17)']);
 assert.deepEqual(geometry.outside,[]);assert.ok(geometry.gaps.every(n=>Math.abs(n)<1));assert.ok(Math.abs(geometry.end)<1);
 assert.ok(geometry.rows.every(n=>Math.abs(n-geometry.rows[0])<1));assert.ok(geometry.fits.every(n=>n==='contain'));assert.ok(geometry.captions.every(n=>Math.abs(n.left)<1&&n.align==='left'));
 assert.equal(geometry.transition,'project-separator');assert.ok(Math.abs(geometry.gap)<1&&Math.abs(geometry.previousGap)<1);assert.equal(geometry.bg,directory+'Фон.png');
 for(const selector of ['.newsletter-cover','.newsletter-information','.newsletter-gallery']){
  await evaluate(`document.querySelector('${selector}').scrollIntoView({behavior:'instant'})`);await delay(100);
  assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-06');
  assert.ok(await evaluate('(()=>{const r=document.querySelector(".newsletter-sidebar__screen").getBoundingClientRect();return r.bottom>0&&r.top<innerHeight})()'),'Sidebar screenshot visible at every section');
  await screenshot('newsletter-'+selector.slice(1)+'-'+width);
 }
 await evaluate('document.querySelector("#project-05").scrollIntoView({behavior:"instant"})');await delay(100);
 const nav=await evaluate('document.querySelector(".project-navigation").getBoundingClientRect().toJSON()');
 await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:width-25,y:nav.top+18});await delay(350);
 const rect=await evaluate(`document.querySelector('.project-navigation a[href="#project-06"]').getBoundingClientRect().toJSON()`);
 const point={x:rect.x+rect.width/2,y:rect.y+rect.height/2,button:'left',clickCount:1};
 await command('Input.dispatchMouseEvent',{type:'mousePressed',...point});await command('Input.dispatchMouseEvent',{type:'mouseReleased',...point});await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:5});await waitForProject('06');await delay(300);
 assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-06');assert.ok(await evaluate('document.querySelector(".project-navigation").getBoundingClientRect().width<=51'));
 for(let i=0;i<4;i++){
  await evaluate(`document.querySelector('.newsletter-gallery [data-gallery-open="${i}"]').click()`);await evaluate('document.querySelector("dialog[open] img").decode()');await delay(50);
  const title=()=>evaluate('document.querySelector("dialog[open] .lightbox__title").textContent');
  assert.equal(await title(),titles[i]);assert.equal(await evaluate('decodeURIComponent(document.querySelector("dialog[open] img").src).split("/").pop()'),(i+1)+'.png');
  assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__toolbar").children.length'),2,'Existing toolbar without counter');
  await key('ArrowRight');assert.equal(await title(),titles[(i+1)%4]);await key('ArrowLeft');assert.equal(await title(),titles[i]);
  await evaluate('document.querySelector("dialog[open] [data-action=previous]").click()');assert.equal(await title(),titles[(i+3)%4]);await evaluate('document.querySelector("dialog[open] [data-action=next]").click()');assert.equal(await title(),titles[i]);
  await evaluate('document.querySelector("dialog[open] img").decode()');await key('+');assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'),'150%');await key('-');assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'),'100%');
  await evaluate('for(let n=0;n<4;n++)document.querySelector("dialog[open] [data-action=in]").click()');
  const start=await evaluate('document.querySelector("dialog[open] img").style.transform');
  const drag=await evaluate('(()=>{const r=document.querySelector("dialog[open] .lightbox__stage").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await command('Input.dispatchMouseEvent',{type:'mousePressed',...drag,button:'left',clickCount:1});await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:drag.x+60,y:drag.y+100,button:'left',buttons:1});await command('Input.dispatchMouseEvent',{type:'mouseReleased',x:drag.x+60,y:drag.y+100,button:'left',clickCount:1});assert.notEqual(await evaluate('document.querySelector("dialog[open] img").style.transform'),start);
  await key('0');assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'),'100%');
  if(i%2)await key('Escape');else await evaluate('document.querySelector("dialog[open] [data-action=close]").click()');await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'),0);assert.equal(await evaluate('document.activeElement.dataset.galleryOpen'),String(i));
 }
 console.log('PASS project 06 file://',width,'full sidebar, gold SVG, three sections, no overflow/overlaps, texts, approved background, gallery 1–4, shared lightbox, arrows/zoom/drag/keyboard/Esc, navigation 06');
}
assert.deepEqual(errors,[]);socket.close();
