// Render the dedicated OG layout and SVG favicon using local Chrome/CDP.
// Start Chrome with --remote-debugging-port=9222 before running this script.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(done => socket.addEventListener('open', done, { once: true }));
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(message.error) : resolve(message.result);
});
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence; pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  assert.equal(response.exceptionDetails, undefined);
  return response.result.value;
};
try {
  await mkdir('assets/social', { recursive: true });
  await command('Page.enable'); await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  const loaded = new Promise(done => {
    const handler = event => { if (JSON.parse(event.data).method === 'Page.loadEventFired') { socket.removeEventListener('message', handler); done(); } };
    socket.addEventListener('message', handler);
  });
  await command('Page.navigate', { url: pathToFileURL(resolve('tools/social-preview.html')).href });
  await loaded;
  await evaluate(`(async () => {await document.fonts.ready; await Promise.all([...document.images].map(image=>image.decode())); await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));})()`);
  const screenshot = await command('Page.captureScreenshot', { format: 'png' });
  const png = Buffer.from(screenshot.data, 'base64');
  assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 630);
  await writeFile('assets/social/portfolio-og.png', png);
  const svg = await readFile('assets/favicon.svg', 'utf8');
  await command('Emulation.setDeviceMetricsOverride', { width: 32, height: 32, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.documentElement.innerHTML='<head><style>html,body{margin:0;width:32px;height:32px;overflow:hidden}svg{display:block;width:32px;height:32px}</style></head><body>'+${JSON.stringify(svg)}+'</body>'`);
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const icon = Buffer.from((await command('Page.captureScreenshot', { format: 'png' })).data, 'base64');
  await writeFile('assets/favicon-32.png', icon);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header[6] = 32; header[7] = 32;
  header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
  header.writeUInt32LE(icon.length, 14); header.writeUInt32LE(22, 18);
  await writeFile('favicon.ico', Buffer.concat([header, icon]));
  console.log(`OG image: 1200×630, ${png.length} bytes. SVG, PNG and ICO favicons generated.`);
} finally {
  socket.close();
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
}
