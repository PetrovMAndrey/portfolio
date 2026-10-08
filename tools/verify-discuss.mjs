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
const { discuss } = await import('../src/discuss/data.js');
await mkdir('.preview',{recursive:true});
await command('Runtime.enable');await command('Page.enable');await command('Network.enable');await command('Network.setCacheDisabled',{cacheDisabled:true});
await command('Page.navigate',{url:pageURL});await delay(600);
assert.equal(await evaluate('document.querySelectorAll("#discuss").length'),1);
assert.equal(await evaluate('document.querySelectorAll(".project-separator").length'),9);
assert.equal(await evaluate('document.querySelectorAll(".gallery-lightbox-indicator").length'),9);
const copy=await evaluate('document.querySelector("#discuss").textContent');
for(const text of [discuss.name,discuss.subtitle,...discuss.paragraphs,'Есть задача или идея?','Давайте обсудим.'])assert.ok(copy.includes(text),text);
assert.deepEqual(await evaluate('Array.from(document.querySelectorAll(".discuss__contact"),n=>n.getAttribute("href"))'),[discuss.telegram,discuss.email]);
assert.equal(await evaluate('document.querySelector(".discuss__background").getAttribute("src")'),discuss.background);
assert.deepEqual(await evaluate('Array.from(document.querySelectorAll(".discuss__contact-detail"),n=>n.textContent)'),[discuss.telegramUsername,discuss.emailAddress]);
for(const width of [1920,1440,1280]) {
 await command('Emulation.setDeviceMetricsOverride',{width,height:1080,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector("#discuss").scrollIntoView({behavior:"instant"})');
 await evaluate(`(()=>{const n=document.querySelector('.discuss__background');n.loading='eager';return n.complete&&n.naturalWidth?Promise.resolve():new Promise((resolve,reject)=>{n.addEventListener('load',resolve,{once:true});n.addEventListener('error',()=>reject(new Error(n.src)),{once:true});});})()`);
 await evaluate('document.querySelector(".discuss__background").decode()');await delay(100);
 const layout=await evaluate(`(()=>{
  const p=document.querySelector('#discuss'),r=n=>n.getBoundingClientRect(),b=r(p),decor=r(p.querySelector('.discuss__decoration')),content=r(p.querySelector('.discuss__content'));
  const s=Math.max(b.width/1672,b.height/941),dx=b.left+(b.width-1672*s)/2,dy=b.top+(b.height-941*s)/2;
  const person={left:dx+1108*s,right:dx+1210*s,top:dy+655*s,bottom:dy+758*s};
  const outside=Array.from(p.querySelectorAll('h2,p,a'),n=>({text:n.textContent,r:r(n)})).filter(n=>n.r.left<b.left||n.r.right>b.right||n.r.bottom>b.bottom||n.r.top<b.top).map(n=>n.text);
  return {height:b.height,overflow:document.documentElement.scrollWidth>innerWidth,outside,personVisible:person.left>=b.left&&person.right<=b.right&&person.top>=b.top&&person.bottom<=b.bottom,personClear:content.right<person.left-20&&decor.bottom<person.top-20,buttonWidths:Array.from(p.querySelectorAll('a'),n=>r(n).width),backgroundFit:getComputedStyle(p.querySelector('img')).objectFit,active:document.querySelector('.project-navigation [aria-current]').hash,decorOverflow:p.querySelector('.discuss__decoration').scrollWidth>p.querySelector('.discuss__decoration').clientWidth,previous:p.previousElementSibling.id,gap:b.top-r(p.previousElementSibling).bottom};
 })()`);
 assert.equal(layout.overflow,false);assert.deepEqual(layout.outside,[]);assert.equal(layout.personVisible,true);assert.equal(layout.personClear,true);
 assert.equal(layout.backgroundFit,'cover');assert.equal(layout.active,'#discuss');assert.equal(layout.previous,'project-10');assert.equal(layout.gap,0);
 assert.ok(Math.abs(layout.buttonWidths[0]-layout.buttonWidths[1])<.1);assert.equal(layout.decorOverflow,false);
 const details=await evaluate(`Array.from(document.querySelectorAll('.discuss__contact-item'),n=>{const a=n.querySelector('a'),p=n.querySelector('.discuss__contact-detail'),r=p.getBoundingClientRect(),b=a.getBoundingClientRect(),s=getComputedStyle(p);const range=document.createRange();range.selectNodeContents(p);getSelection().removeAllRanges();getSelection().addRange(range);const selected=getSelection().toString();getSelection().removeAllRanges();return {center:r.left+r.width/2-b.left-b.width/2,below:r.top>=b.bottom+9,font:parseFloat(s.fontSize),buttonFont:parseFloat(getComputedStyle(a).fontSize),align:s.textAlign,selectable:s.userSelect,selected,text:p.textContent,overflow:p.scrollWidth>p.clientWidth};})`);
 for(const detail of details){assert.ok(Math.abs(detail.center)<.1);assert.equal(detail.below,true);assert.ok(detail.font<detail.buttonFont*.8);assert.equal(detail.align,'center');assert.equal(detail.selectable,'text');assert.equal(detail.selected,detail.text);assert.equal(detail.overflow,false);}
 await screenshot(`discuss-${width}`);
 const button=await evaluate('document.querySelector(".discuss__contact").getBoundingClientRect().toJSON()');
 await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:button.left+button.width/2,y:button.top+button.height/2});await delay(260);
 const hover=await evaluate('({transform:getComputedStyle(document.querySelector(".discuss__contact")).transform,cursor:getComputedStyle(document.querySelector(".discuss__contact")).cursor,glow:getComputedStyle(document.querySelector(".discuss__contact")).boxShadow,edge:getComputedStyle(document.querySelector(".discuss__contact"),"::before").opacity})');
 assert.equal(hover.cursor,'pointer');assert.equal(hover.transform,'matrix(1, 0, 0, 1, 0, -3)');assert.equal(hover.edge,'1');
 await screenshot(`discuss-hover-${width}`);
 await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:20});await delay(260);
 for(const id of ['01','05','10']) {
  await evaluate(`document.querySelector('#project-${id}').scrollIntoView({behavior:'instant'})`);await delay(50);
  assert.equal(await evaluate('document.querySelector(".project-navigation [aria-current]").hash'),`#project-${id}`);
 }
 await evaluate('document.querySelector(".project-navigation a[href=\\"#discuss\\"]").click()');
 for(let i=0;i<100;i++){if(await evaluate('document.documentElement.scrollHeight-innerHeight-scrollY<2'))break;await delay(50);}
 assert.equal(await evaluate('document.querySelector(".project-navigation [aria-current]").hash'),'#discuss');
 await evaluate('document.querySelector(".project-navigation a[href=\\"#hero\\"]").click()');
 for(let i=0;i<100;i++){if(await evaluate('scrollY<1'))break;await delay(50);}
 assert.ok(await evaluate('scrollY<1'));assert.equal(await evaluate('document.querySelector(".project-navigation [aria-current]").hash'),'#hero');
 console.log('PASS Discuss file://',width,JSON.stringify(layout),'contacts, hover, portrait visibility, project navigation, Home and Discuss');
}
assert.deepEqual(errors,[]);socket.close();
