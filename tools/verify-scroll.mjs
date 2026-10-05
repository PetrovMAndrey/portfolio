// Check native reload restoration and explicitly smooth project navigation via file://.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id);
    pending.delete(message.id);
    message.error ? request.reject(message.error) : request.resolve(message.result);
  }
});
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
await command('Page.enable');
await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await command('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.reloadFrames = [];
  window.reloadPaints = [];
  let frames = 0;
  function record() {
    window.reloadFrames.push({y:scrollY,time:performance.now(),built:!!document.querySelector('#project-04')});
    if (++frames < 90) requestAnimationFrame(record);
  }
  requestAnimationFrame(record);
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) window.reloadPaints.push({name:entry.name,y:scrollY,time:entry.startTime});
  }).observe({type:'paint',buffered:true});
` });
await mkdir('.preview', { recursive: true });
await command('Page.navigate', { url: pathToFileURL(resolve('index.html')).href });
await delay(1000);
assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'auto');
const reports = [];
for (const width of [1920, 1440, 1280]) {
  await command('Emulation.setDeviceMetricsOverride', { width, height: 1080, deviceScaleFactor: 1, mobile: false });
  for (const hash of ['', '#project-03', '#project-04']) {
    await evaluate(`history.replaceState(null, '', location.pathname + ${JSON.stringify(hash)})`);
    for (const project of ['03', '04']) {
      // Wait for image dimensions above the target before storing the browser's own position.
      await evaluate(`new Promise(resolve => { const image=document.querySelector('.svetlo-collection__image'); image.loading='eager'; if(image.complete) resolve(); else image.addEventListener('load',resolve,{once:true}); })`);
      await evaluate(`window.scrollTo({top:document.querySelector('#project-${project}').offsetTop+250,behavior:'instant'})`);
      await delay(300);
      const before = await evaluate('scrollY');
      const projectTop = await evaluate(`document.querySelector('#project-${project}').getBoundingClientRect().top`);
      await command('Page.reload');
      await delay(1600);
      const after = await evaluate('({y:scrollY,frames:window.reloadFrames,paints:window.reloadPaints,active:document.querySelector(".project-navigation a[aria-current]").hash})');
      reports.push({width,hash,project,before,after});
      assert.ok(Math.abs(after.y-before) < 2, `Restoration changed offset at ${width}px, project ${project}, hash ${hash}: ${before} -> ${after.y}`);
      assert.equal(after.active, '#project-' + project);
      assert.ok(Math.abs(await evaluate(`document.querySelector('#project-${project}').getBoundingClientRect().top`)-projectTop)<2, 'Project moves during image loading after reload');
      const paintedFrames = after.frames.filter(frame => frame.built && frame.time >= (after.paints[0]?.time || Infinity));
      assert.ok(paintedFrames.length > 0, 'No painted frames recorded');
      assert.ok(paintedFrames.every(frame => Math.abs(frame.y-before)<2), 'Visible scroll animation on reload');
      assert.ok(after.paints.every(paint => Math.abs(paint.y-before)<2), 'Top of page visible at first paint');
      console.log(`PASS reload ${width}px: project ${project}, hash ${hash || '(none)'}, offset ${before}`);
    }
  }
  await evaluate("window.scrollTo({top:0,behavior:'instant'})");
  const navigation = await evaluate(`new Promise(resolve => {
    const offsets=[];
    let frames=0;
    document.querySelector('.project-navigation a[href="#project-04"]').click();
    function record(){offsets.push(scrollY); if(++frames<100) requestAnimationFrame(record);else resolve(offsets);}
    requestAnimationFrame(record);
  })`);
  assert.ok(new Set(navigation.map(Math.round)).size > 10, 'User navigation must stay smooth');
  assert.equal(await evaluate('location.hash'), '#project-04');
  for (let attempt=0;attempt<80;attempt++) {
    if(await evaluate('Math.abs(document.querySelector("#project-04").getBoundingClientRect().top)<2')) break;
    await delay(50);
  }
  assert.ok(await evaluate('Math.abs(document.querySelector("#project-04").getBoundingClientRect().top)<2'));
  console.log(`PASS smooth navigation ${width}px`);
}
await writeFile('.preview/reload-report.json', JSON.stringify(reports, null, 2));
socket.close();
