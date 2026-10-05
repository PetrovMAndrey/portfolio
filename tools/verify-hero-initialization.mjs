// First-frame and pointer-focus regressions in fresh Chrome contexts, via file://.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(message.error) : resolve(message.result);
  });
  return { socket, command: (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  }) };
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const version = await (await fetch('http://127.0.0.1:9222/json/version')).json();
const browser = await connect(version.webSocketDebuggerUrl);
await mkdir('.preview', { recursive: true });
try {
  for (const width of [1920, 1440, 1280]) {
    const { browserContextId } = await browser.command('Target.createBrowserContext');
    let page;
    try {
      const { targetId } = await browser.command('Target.createTarget', { url: 'about:blank', browserContextId });
      const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
      page = await connect(targets.find(target => target.id === targetId).webSocketDebuggerUrl);
      const command = page.command;
      const evaluate = async expression => {
        const response = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        assert.equal(response.exceptionDetails, undefined);
        return response.result.value;
      };
      await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable');
      await command('Network.setCacheDisabled', { cacheDisabled: true });
      await command('Emulation.setDeviceMetricsOverride', { width, height: 1080, deviceScaleFactor: 1, mobile: false });
      await command('Page.bringToFront');
      await command('Page.addScriptToEvaluateOnNewDocument', { source: `
        window.heroInitialFrames = [];
        function sample() {
          const rail = document.querySelector('.hero-rail__viewport');
          if (rail) {
            const list = rail.querySelector('.hero-rail__cards:not([aria-hidden])');
            const cycle = parseFloat(getComputedStyle(list).width) + parseFloat(getComputedStyle(rail).gap);
            const expected = cycle - parseFloat(getComputedStyle(list.firstElementChild).width) * (234 / 386);
            heroInitialFrames.push({ position: rail.scrollLeft, expected,
              overflow: document.documentElement.scrollWidth > innerWidth,
              images: [...rail.querySelectorAll('img')].filter(image => {
                const rect = image.getBoundingClientRect(); return rect.right > 0 && rect.left < innerWidth;
              }).map(image => ({ complete: image.complete, naturalWidth: image.naturalWidth,
                decoding: image.decoding, left: image.getBoundingClientRect().left,
                number: image.nextElementSibling.textContent })) });
            if (heroInitialFrames.length === 12) return;
          }
          requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      ` });
      for (const reload of [false, true]) {
        if (reload) await command('Page.reload', { ignoreCache: true });
        else await command('Page.navigate', { url: pathToFileURL(resolve('index.html')).href });
        // Observe recorded render frames; do not decode images, move the mouse,
        // focus the rail or scroll before checking initial load and reload.
        let frames;
        for (let attempt = 0; attempt < 100; attempt++) {
          frames = await evaluate('window.heroInitialFrames');
          if (frames?.length >= 12) break;
          await delay(30);
        }
        assert.equal(frames.length, 12);
        for (const frame of frames) {
          assert.ok(Math.abs(frame.position - frame.expected) <= 1, 'Initial cycle position');
          assert.equal(frame.overflow, false);
          assert.ok(frame.images.length >= 4);
          assert.ok(frame.images.every(image => image.complete && image.naturalWidth === 1672), 'Every visible image ready on first render');
          assert.deepEqual(frame.images.map(image => [image.number, image.left]), frames[0].images.map(image => [image.number, image.left]));
        }
        const screenshot = await command('Page.captureScreenshot', { format: 'png' });
        await writeFile(`.preview/hero-initial-${width}-${reload ? 'reload' : 'cold'}.png`, Buffer.from(screenshot.data, 'base64'));
      }
      const navRect = await evaluate('document.querySelector(".project-navigation").getBoundingClientRect().toJSON()');
      await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: width - 25, y: navRect.top + 18 });
      await delay(350);
      assert.ok(await evaluate('document.querySelector(".project-navigation").getBoundingClientRect().width > 200'));
      const link = await evaluate(`document.querySelector('.project-navigation a[href="#project-02"]').getBoundingClientRect().toJSON()`);
      const click = { x: link.x + link.width / 2, y: link.y + link.height / 2, button: 'left', clickCount: 1 };
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', ...click });
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', ...click });
      await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
      await delay(400);
      assert.ok(await evaluate('document.querySelector(".project-navigation").getBoundingClientRect().width <= 51'), 'Pointer departure collapses clicked menu');
      assert.equal(await evaluate('document.querySelector(".project-navigation").contains(document.activeElement)'), false);
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate('Math.abs(document.querySelector("#project-02").getBoundingClientRect().top)<2')) break;
        await delay(50);
      }
      assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), '#project-02');
      await evaluate('document.querySelector(".project-navigation").focus({preventScroll:true})');
      await delay(350);
      assert.ok(await evaluate('document.querySelector(".project-navigation").getBoundingClientRect().width > 200'), 'Keyboard focus still expands navigation');
      console.log(`${width}: cold first render, reload, stable card positions, pointer collapse, keyboard focus and project 02 navigation passed`);
    } finally {
      page?.socket.close();
      await browser.command('Target.disposeBrowserContext', { browserContextId });
    }
  }
} finally { browser.socket.close(); }
