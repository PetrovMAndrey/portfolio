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
await mkdir('.preview', {recursive:true});
await command('Runtime.enable');
await command('Page.enable');
await command('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
await command('Page.navigate', {url:pageURL});
await delay(1200);
for(const width of [1920,1440,1280]) {
  await command('Emulation.setDeviceMetricsOverride', {width,height:1080,deviceScaleFactor:1,mobile:false});
  await evaluate('document.activeElement.blur(); scrollTo({top:0,behavior:"instant"})');
  await evaluate('(() => {const list=document.querySelector(".hero-rail__cards:not([aria-hidden])");const rail=document.querySelector(".hero-rail__viewport");rail.scrollLeft=parseFloat(getComputedStyle(list).width)+parseFloat(getComputedStyle(rail).gap)-parseFloat(getComputedStyle(document.querySelector(".hero-rail__item")).width)*(234/386);})()');
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:5});
  await delay(150);
  const layout=await evaluate(`(() => {
    const hero=document.querySelector('.hero'), rail=document.querySelector('.hero-rail__viewport');
    const rect=hero.getBoundingClientRect(), footer=hero.querySelector('.hero__footer').getBoundingClientRect();
    const items=[...hero.querySelectorAll('.hero-rail__item')];
    const masks=['::before','::after'].map(p=>getComputedStyle(document.querySelector('.hero-rail'),p));
    return {height:rect.height,footer:footer.bottom,overflow:document.documentElement.scrollWidth>innerWidth,
      titles:items.map(item=>item.querySelector('.hero-card__number').textContent),
      links:items.map(item=>item.querySelector('a')?.hash||null),
      mask:masks.map(css=>({background:css.backgroundImage,pointer:css.pointerEvents,z:css.zIndex})),
      scrollbar:getComputedStyle(rail).scrollbarWidth,position:getComputedStyle(hero).position,
      firstProject:document.querySelector('#project-01').getBoundingClientRect().top,
      opacity:items.map(item=>getComputedStyle(item.querySelector('.hero-card__number')).opacity)};
  })()`);
  assert.equal(layout.overflow,false);
  assert.equal(layout.position,'sticky');
  assert.ok(layout.footer < layout.height);
  assert.ok(Math.abs(layout.firstProject-layout.height)<1);
  assert.deepEqual(layout.titles,Array.from({length:10},(_,i)=>String(i+1).padStart(2,'0')));
  assert.deepEqual(layout.links,['#project-01','#project-02','#project-03','#project-04',null,null,null,null,null,null]);
  assert.equal(new Set(layout.opacity).size,1);
  assert.equal(layout.scrollbar,'none');
  assert.ok(layout.mask.every(mask=>mask.background.includes('linear-gradient')&&mask.pointer==='none'&&mask.z==='2'));
  assert.equal(await evaluate('Promise.all([...document.querySelectorAll(".hero img")].map(image=>image.decode())).then(()=>true)'),true);
  const loop = await evaluate(`(() => {
    const rail=document.querySelector('.hero-rail__viewport'), list=rail.querySelector('.hero-rail__cards:not([aria-hidden])');
    const cycle=parseFloat(getComputedStyle(list).width)+parseFloat(getComputedStyle(rail).gap), lower=cycle-rail.clientWidth/2, start=rail.scrollLeft;
    const sample=()=>[...rail.querySelectorAll('.hero-card')].map(card=>({number:card.querySelector('.hero-card__number').textContent,x:card.getBoundingClientRect().left,width:card.getBoundingClientRect().width})).filter(card=>card.x>50&&card.x+card.width<innerWidth-50);
    const errors=[];let boundaries=0;
    for(const direction of [1,-1]){
      rail.scrollLeft=direction>0?lower+cycle-20:lower+20;
      for(let i=0;i<120;i++){
        const before=sample(), previous=rail.scrollLeft, delta=direction*(i%4===0?40:cycle/5);
        rail.dispatchEvent(new WheelEvent('wheel',{deltaX:delta,bubbles:true,cancelable:true}));
        const after=sample();
        for(const old of before){const next=after.find(card=>card.number===old.number);if(next&&Math.abs(next.x-old.x+delta)>1.5)errors.push({old,next,delta});}
        if(Math.abs(rail.scrollLeft-previous)>Math.abs(delta)+cycle/2)boundaries++;
        if(rail.scrollLeft<=0||rail.scrollLeft>=rail.scrollWidth-rail.clientWidth)errors.push('Physical edge');
      }
    }
    rail.scrollLeft=start;
    return {errors,boundaries};
  })()`);
  assert.deepEqual(loop.errors,[]);
  assert.ok(loop.boundaries>30);
  await screenshot('hero-final-'+width);
  const point=await evaluate('(() => {const r=document.querySelector(".hero-rail__item a").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()');
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
  await delay(300);
  const hover=await evaluate('(() => {const css=getComputedStyle(document.querySelector(".hero-rail__item a"));const m=new DOMMatrix(css.transform);return {x:m.a,y:m.d,lift:m.f,shadow:css.boxShadow};})()');
  assert.deepEqual(hover,{x:1,y:1,lift:-5,shadow:'none'});
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:5});
  await delay(300);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".hero-rail__item a")).transform'),'none');
  const start=await evaluate('document.querySelector(".hero-rail__viewport").scrollLeft');
  await command('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:180});
  await delay(150);
  assert.ok(await evaluate('document.querySelector(".hero-rail__viewport").scrollLeft')>start+150);
  assert.equal(await evaluate('scrollY'),0);
  const dragStart=await evaluate('document.querySelector(".hero-rail__viewport").scrollLeft');
  await command('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x-110,y:point.y,button:'left',buttons:1});
  await command('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x-110,y:point.y,button:'left',clickCount:1});
  await delay(100);
  assert.ok(await evaluate('document.querySelector(".hero-rail__viewport").scrollLeft')>dragStart+90);
  assert.equal(await evaluate('scrollY'),0);
  await evaluate('document.querySelector(".hero-rail__viewport").focus({preventScroll:true})');
  const keyboardStart=await evaluate('document.querySelector(".hero-rail__viewport").scrollLeft');
  await key('ArrowRight');await delay(550);
  assert.ok(await evaluate('document.querySelector(".hero-rail__viewport").scrollLeft')>keyboardStart+100);
  await evaluate('document.activeElement.blur()');
  for(const progress of [.25,.5,.9,1,1.25,.9,.5,.25,0]){
    await evaluate(`scrollTo({top:${layout.height*progress},behavior:'instant'})`);await delay(100);
    const transition=await evaluate(`(() => {const hero=document.querySelector('.hero');const box=hero.getBoundingClientRect();const ark=document.querySelector('#project-01').getBoundingClientRect();const testY=Math.min(innerHeight-1,Math.max(1,ark.top+20));return {top:box.top,ark:ark.top,scale:new DOMMatrix(getComputedStyle(hero.querySelector('.hero__scene')).transform).a,shade:parseFloat(getComputedStyle(hero,'::after').opacity),covered:hero.classList.contains('is-covered'),front:document.elementFromPoint(innerWidth/2,testY).closest('#project-01')!==null};})()`);
    assert.equal(transition.top,0);
    assert.ok(Math.abs(transition.ark-(layout.height-await evaluate('scrollY')))<1);
    const actualProgress=Math.min(1,await evaluate('scrollY/document.querySelector(".hero").offsetHeight'));
    assert.ok(Math.abs(transition.scale-(1-actualProgress*.08))<.0001);
    assert.ok(Math.abs(transition.shade-actualProgress*.18)<.0001);
    if(progress>0)assert.equal(transition.front,true);
    assert.equal(transition.covered,progress>=1);
    if(progress===.5)await screenshot('hero-overlap-'+width);
    if(progress>=1)assert.equal(transition.covered,true);
  }
  for(const number of ['01','02','03','04']){
    await evaluate('scrollTo({top:0,behavior:"instant"})');await delay(100);
    await evaluate(`(() => {const link=document.querySelector('.hero-rail__item a[href="#project-${number}"]');const r=link.getBoundingClientRect();document.querySelector('.hero-rail__viewport').scrollLeft+=r.left+r.width/2-innerWidth/2;})()`);
    const click=await evaluate(`(() => {const r=document.querySelector('.hero-rail__item a[href="#project-${number}"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
    await command('Input.dispatchMouseEvent',{type:'mouseMoved',...click});
    await command('Input.dispatchMouseEvent',{type:'mousePressed',...click,button:'left',clickCount:1});
    await command('Input.dispatchMouseEvent',{type:'mouseReleased',...click,button:'left',clickCount:1});
    await delay(80);
    const intermediate=await evaluate('scrollY');
    assert.ok(intermediate < await evaluate(`document.querySelector('#project-${number}').offsetTop`),'Navigation should be smooth');
    await waitForProject(number);
    assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'),'#project-'+number);
  }
  console.log('PASS Hero: assets/order, masks, hover, wheel, drag, keyboard, smooth clicks, overlap',width);
}
assert.deepEqual(errors,[]);
socket.close();
