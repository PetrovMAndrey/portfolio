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
  return result.result.value;
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
await mkdir('.preview', { recursive: true });
await command('Runtime.enable');
await command('Page.enable');
await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await command('Page.navigate', { url: pageURL });
await delay(1200);
assert.equal(await evaluate('document.querySelectorAll(".ark > section").length'), 5);
assert.equal(await evaluate('document.querySelectorAll(".grantmaster > section").length'), 5);
assert.equal(await evaluate('document.querySelectorAll(".svetlo > section").length'), 5);
assert.equal(await evaluate('document.querySelectorAll(".industrial > section").length'), 5);
assert.equal(await evaluate('document.querySelectorAll(".project-navigation li").length'), 10);
assert.equal(await evaluate('document.querySelectorAll(".project-navigation a").length'), 4);
assert.equal(await evaluate('document.querySelectorAll(".project-navigation__unavailable").length'), 6);
assert.equal(await evaluate('document.querySelectorAll(".project-separator").length'), 3);
assert.deepEqual(await evaluate('[...document.querySelector("#landing").children].map(node => node.id || node.className)'), ['hero', 'project-01', 'project-separator', 'project-02', 'project-separator', 'project-03', 'project-separator', 'project-04']);
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
const backgroundURLs = await evaluate('[...document.querySelectorAll("[style]")].map(section => section.style.getPropertyValue("--section-image").slice(5,-2))');
for (const url of backgroundURLs) {
  assert.equal(await evaluate(`new Promise(resolve => { const image = new Image(); image.onload = () => resolve(image.naturalWidth > 0); image.onerror = () => resolve(false); image.src = ${JSON.stringify(url)}; })`), true);
}
assert.equal(await evaluate('getComputedStyle(document.querySelector(".ark-gallery")).display'), 'grid');
const heroURL = await evaluate('new URL("Вайфреймы в работу/Хиро без текста.png", document.baseURI).href');
assert.equal(await evaluate(`new Promise(resolve => { const image = new Image(); image.onload = () => resolve(image.naturalWidth > 0); image.onerror = () => resolve(false); image.src = ${JSON.stringify(heroURL)}; })`), true);
await screenshot('hero');
await evaluate('document.querySelector(".ark-cover").scrollIntoView({behavior:"instant"})');
await delay(200);
await screenshot('ark-cover');
await evaluate('document.querySelector(".ark-visual").scrollIntoView({behavior:"instant"})');
await delay(400);
await screenshot('ark-visual');
await evaluate('document.querySelector(".ark-gallery").scrollIntoView({behavior:"instant"})');
await delay(700);
assert.equal(await evaluate('[...document.querySelectorAll(".ark img")].every(img => img.complete && img.naturalWidth > 0)'), true);
await screenshot('ark-gallery-result');
const galleryTitles = ['Направления работы', 'Проекты', 'Приложения'];
for (let index = 0; index < 3; index++) {
  await evaluate(`document.querySelectorAll('.gallery__preview')[${index}].click()`);
  await delay(200);
  assert.equal(await evaluate('document.querySelector("dialog").open'), true);
  assert.equal(await evaluate('document.querySelector(".lightbox__counter")'), null);
  assert.equal(await evaluate('document.querySelector(".lightbox__title").textContent'), galleryTitles[index]);
  assert.equal(await evaluate('document.querySelector(".lightbox__image").getAttribute("src") === document.querySelectorAll(".gallery__preview")[' + index + '].dataset.src'), true);
  await key('ArrowRight');
  assert.equal(await evaluate('document.querySelector(".lightbox__title").textContent'), galleryTitles[(index + 1) % 3]);
  await key('ArrowLeft');
  assert.equal(await evaluate('document.querySelector(".lightbox__title").textContent'), galleryTitles[index]);
  await evaluate('document.querySelector("dialog[open] [data-action=next]").click()');
  assert.equal(await evaluate('document.querySelector(".lightbox__title").textContent'), galleryTitles[(index + 1) % 3]);
  await evaluate('document.querySelector("dialog[open] [data-action=previous]").click()');
  assert.equal(await evaluate('document.querySelector(".lightbox__title").textContent'), galleryTitles[index]);
  await key('Escape');
  assert.equal(await evaluate('document.querySelector("dialog").open'), false);
  assert.equal(await evaluate('document.activeElement === document.querySelectorAll(".gallery__preview")[' + index + ']'), true);
}
await evaluate('document.querySelectorAll(".gallery__preview")[2].click()');
await delay(300);
const arrowStyles = await evaluate('[...document.querySelectorAll(".lightbox__footer button")].map(button => {const css=getComputedStyle(button);const box=button.getBoundingClientRect();return {background:css.backgroundColor,color:css.color,width:box.width,height:box.height,y:box.y};})');
assert.deepEqual(arrowStyles[0], arrowStyles[1]);
assert.equal(arrowStyles[0].background, 'rgb(255, 100, 27)');
assert.equal(arrowStyles[0].color, 'rgb(255, 255, 255)');
await screenshot('lightbox-controls');
for (let step = 0; step < 4; step++) await evaluate('document.querySelector("dialog[open] [data-action=in]").click()');
assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'), '506%');
const point = await evaluate('(() => {const box = document.querySelector("dialog[open] .lightbox__stage").getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2}})()');
await command('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y + 120, button: 'left', buttons: 1 });
await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y + 120, button: 'left', clickCount: 1 });
assert.equal(await evaluate('document.querySelector("dialog[open] img").style.transform.includes("120px")'), true);
await screenshot('lightbox-zoom');
await evaluate('document.querySelector("dialog[open] [data-action=out]").click()');
assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'), '338%');
await evaluate('document.querySelector("dialog[open] [data-action=reset]").click()');
assert.equal(await evaluate('document.querySelector("dialog[open] .lightbox__scale").textContent'), '100%');
await evaluate('document.querySelector("dialog[open] [data-action=close]").click()');
await delay(50);
assert.equal(await evaluate('document.body.style.overflow'), '');
assert.equal(await evaluate('getComputedStyle(document.querySelector(".project-navigation")).position'), 'fixed');
await evaluate('document.querySelector(".project-navigation a").click()');
await delay(800);
assert.equal(await evaluate('location.hash'), '#project-01');
assert.equal(await evaluate('Math.abs(document.querySelector("#project-01").getBoundingClientRect().top) < 2'), true);
assert.deepEqual(await evaluate('[...document.querySelectorAll(".gallery__item figcaption")].map(item => item.textContent)'), ['Направления работы', 'Проекты', 'Приложения']);
assert.equal(await evaluate('document.querySelectorAll(".gallery__magnify, .ark-gallery__count span, .ark-result__url").length'), 0);
assert.equal(await evaluate('document.querySelectorAll(".ark-result a").length'), 1);
for (const number of ['02', '03', '04', '01']) {
  await evaluate(`document.querySelector('.project-navigation a[href="#project-${number}"]').click()`);
  await waitForProject(number);
  assert.equal(await evaluate('location.hash'), `#project-${number}`);
  assert.equal(await evaluate(`Math.abs(document.querySelector('#project-${number}').getBoundingClientRect().top) < 2`), true);
  assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), `#project-${number}`);
}
assert.deepEqual(await evaluate('[...document.querySelectorAll(".grantmaster a")].map(link => new URL(link.href).hostname)'), [new URL('https://грант-мастер.рф/').hostname, new URL('https://грант-мастер.рф/').hostname]);
const approvedCopy = [
  'Сервис, который помогает разобраться, что именно нужно проработать в проекте, последовательно выстроить его логику и подготовить основу для сильной заявки. Объединяет методику, опыт экспертов и удобные инструменты в единую систему.',
  'Создать понятный инструмент, который помогает последовательно пройти путь от первоначальной идеи до целостного проекта — без необходимости сразу разбираться во всех требованиях конкурсов и грантовых форм.',
  'Цифровой помощник, который объединяет методику, образовательные материалы и пошаговый конструктор. Пользователь сначала понимает логику каждого раздела, затем заполняет его и постепенно собирает целостную модель проекта.',
  'Карта показывает проект не как набор отдельных полей, а как единую систему: от проблемы и аудитории до реализации, результатов и ресурсов.',
  '«Грантмастер» сочетает обучение и практическую работу: объясняет логику каждого раздела, показывает сильные и слабые примеры и помогает последовательно собрать проект в единую систему.',
  '«Грантмастер» помогает превратить первоначальную идею в понятный, логически связанный и аргументированный проект, который можно использовать как основу для подготовки заявки.',
];
assert.deepEqual(await evaluate('[...document.querySelectorAll(".grantmaster__copy")].map(node => node.textContent)'), approvedCopy);
assert.equal(await evaluate('document.querySelectorAll(".grantmaster-tools__list li").length'), 0);
const grantmasterFiles = ['1 Главная и диагностика.png', '2 Карта логики проекта.png', '3 Конструктор проекта.png'];
assert.deepEqual(await evaluate('[...document.querySelectorAll(".grantmaster-tools__preview")].map(node => node.dataset.src.split("/").pop())'), grantmasterFiles);
assert.deepEqual(await evaluate('[...document.querySelectorAll(".grantmaster-tools figcaption")].map(node => node.textContent)'), ['Главная и диагностика', 'Карта логики проекта', 'Конструктор проекта']);
await evaluate('document.querySelector(".grantmaster-tools").scrollIntoView({behavior:"instant"})');
await delay(300);
for (let index = 0; index < 3; index++) {
  await evaluate(`document.querySelectorAll('.grantmaster-tools__preview')[${index}].click()`);
  await delay(250);
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), `./REFERENCES/02_Грантмастер/${grantmasterFiles[index]}`);
  await key('ArrowRight');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), `./REFERENCES/02_Грантмастер/${grantmasterFiles[(index + 1) % 3]}`);
  await key('ArrowLeft');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), `./REFERENCES/02_Грантмастер/${grantmasterFiles[index]}`);
  await evaluate('document.querySelector(".lightbox[open] [data-action=next]").click()');
  await evaluate('document.querySelector(".lightbox[open] [data-action=previous]").click()');
  for (let step=0; step<4; step++) await key('+');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '506%');
  const dragPoint = await evaluate('(() => {const box=document.querySelector(".lightbox[open] .lightbox__stage").getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2}})()');
  await command('Input.dispatchMouseEvent', { type:'mousePressed', ...dragPoint, button:'left', clickCount:1 });
  await command('Input.dispatchMouseEvent', { type:'mouseMoved', x:dragPoint.x, y:dragPoint.y+120, button:'left', buttons:1 });
  await command('Input.dispatchMouseEvent', { type:'mouseReleased', x:dragPoint.x, y:dragPoint.y+120, button:'left', clickCount:1 });
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").style.transform.includes("120px")'), true);
  await key('-');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '338%');
  await key('0');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '100%');
  if (index === 0) await screenshot('grantmaster-lightbox');
  if (index === 1) await evaluate('document.querySelector(".lightbox[open] [data-action=close]").click()');
  else await key('Escape');
  assert.equal(await evaluate('document.querySelector(".lightbox[open]")'), null);
  assert.equal(await evaluate(`document.activeElement === document.querySelectorAll('.grantmaster-tools__preview')[${index}]`), true);
}
assert.equal(await evaluate('document.querySelectorAll(".svetlo a").length'), 0);
assert.deepEqual(await evaluate('[...document.querySelectorAll(".svetlo-cover img, .svetlo-collection__image, .svetlo-result img")].map(image => image.getAttribute("src"))'), ['./REFERENCES/03_Светло/1 Хиро.png', './REFERENCES/03_Светло/2 блок.png', './REFERENCES/03_Светло/3 подвал.png']);
const svetloSources = ['2.png', '3.png', '4.png', '5.png'].map(file => './REFERENCES/03_Светло/' + file);
const svetloTitles = ['Скандинавская коллекция', 'Настенный свет', 'Подход и журнал', 'Полная страница'];
assert.deepEqual(await evaluate('[...document.querySelectorAll(".svetlo-gallery__preview")].map(button => button.dataset.src)'), svetloSources);
await evaluate('document.querySelector(".svetlo-gallery").scrollIntoView({behavior:"instant"})');
await delay(400);
for (let index = 0; index < 4; index++) {
  await evaluate(`document.querySelectorAll('.svetlo-gallery__preview')[${index}].click()`);
  await delay(250);
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), svetloSources[index]);
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__title").textContent'), svetloTitles[index]);
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").complete && document.querySelector(".lightbox[open] img").naturalWidth > 0'), true);
  await key('ArrowRight');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), svetloSources[(index + 1) % 4]);
  await key('ArrowLeft');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), svetloSources[index]);
  await evaluate('document.querySelector(".lightbox[open] [data-action=previous]").click()');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), svetloSources[(index + 3) % 4]);
  await evaluate('document.querySelector(".lightbox[open] [data-action=next]").click()');
  for (let step = 0; step < 4; step++) await key('+');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '506%');
  const dragPoint = await evaluate('(() => {const box=document.querySelector(".lightbox[open] .lightbox__stage").getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2}})()');
  await command('Input.dispatchMouseEvent', { type:'mousePressed', ...dragPoint, button:'left', clickCount:1 });
  await command('Input.dispatchMouseEvent', { type:'mouseMoved', x:dragPoint.x+80, y:dragPoint.y+100, button:'left', buttons:1 });
  await command('Input.dispatchMouseEvent', { type:'mouseReleased', x:dragPoint.x+80, y:dragPoint.y+100, button:'left', clickCount:1 });
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").style.transform.includes("100px")'), true);
  await key('-');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '338%');
  await key('0');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '100%');
  if (index === 3) await screenshot('svetlo-lightbox');
  if (index === 1) await evaluate('document.querySelector(".lightbox[open] [data-action=close]").click()');
  else await key('Escape');
  assert.equal(await evaluate(`document.activeElement === document.querySelectorAll('.svetlo-gallery__preview')[${index}]`), true);
}
assert.equal(await evaluate('document.querySelectorAll(".industrial a").length'), 0);
assert.deepEqual(await evaluate('[...document.querySelectorAll(".industrial-cover img, .industrial-history img, .industrial-result img")].map(image => image.getAttribute("src"))'), ['./REFERENCES/04_Индустриальная история/1 Хиро Индустриальный архив на закате.png', './REFERENCES/04_Индустриальная история/2 Индустриальный город над рекой.png', './REFERENCES/04_Индустриальная история/3 Стальной мост на закате над рекой_подвал.png']);
const industrialSources = await evaluate('[...document.querySelectorAll(".industrial-gallery__preview")].map(button => button.dataset.src)');
assert.deepEqual(industrialSources, ['3.png', '4.png', '5.png', '6.png'].map(file => './REFERENCES/04_Индустриальная история/' + file));
const industrialTitles = ['История района', 'Каталог объектов', 'Тематические исследования', 'Полная страница'];
assert.deepEqual(await evaluate('[...document.querySelectorAll(".industrial-gallery__item figcaption")].map(node => node.textContent)'), industrialTitles);
assert.equal(await evaluate('document.querySelector(".industrial-gallery .eyebrow").textContent'), 'ИНТЕРФЕЙС И РАЗДЕЛЫ');
assert.equal(await evaluate('document.querySelector(".industrial-gallery__count, .industrial-gallery h3")'), null);
await evaluate('document.querySelector(".industrial-gallery").scrollIntoView({behavior:"instant"})');
await delay(400);
for (let index = 0; index < 4; index++) {
  await evaluate(`document.querySelectorAll('.industrial-gallery__preview')[${index}].click()`);
  await delay(250);
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), industrialSources[index]);
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__title").textContent'), industrialTitles[index]);
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").complete && document.querySelector(".lightbox[open] img").naturalWidth > 0'), true);
  await key('ArrowRight');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), industrialSources[(index + 1) % 4]);
  await key('ArrowLeft');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), industrialSources[index]);
  await evaluate('document.querySelector(".lightbox[open] [data-action=previous]").click()');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").getAttribute("src")'), industrialSources[(index + 3) % 4]);
  await evaluate('document.querySelector(".lightbox[open] [data-action=next]").click()');
  for (let step = 0; step < 4; step++) await key('+');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '506%');
  const dragPoint = await evaluate('(() => {const box=document.querySelector(".lightbox[open] .lightbox__stage").getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2}})()');
  await command('Input.dispatchMouseEvent', {type:'mousePressed',...dragPoint,button:'left',clickCount:1});
  await command('Input.dispatchMouseEvent', {type:'mouseMoved',x:dragPoint.x+80,y:dragPoint.y+100,button:'left',buttons:1});
  await command('Input.dispatchMouseEvent', {type:'mouseReleased',x:dragPoint.x+80,y:dragPoint.y+100,button:'left',clickCount:1});
  assert.equal(await evaluate('document.querySelector(".lightbox[open] img").style.transform.includes("100px")'), true);
  await key('-');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '338%');
  await key('0');
  assert.equal(await evaluate('document.querySelector(".lightbox[open] .lightbox__scale").textContent'), '100%');
  if (index === 0) await screenshot('industrial-lightbox');
  if (index === 1) await evaluate('document.querySelector(".lightbox[open] [data-action=close]").click()');
  else await key('Escape');
  assert.equal(await evaluate(`document.activeElement === document.querySelectorAll('.industrial-gallery__preview')[${index}]`), true);
}
for (const width of [1920, 1440, 1280, 1024]) {
  await command('Emulation.setDeviceMetricsOverride', { width, height: 1080, deviceScaleFactor: 1, mobile: false });
  const interfaces = await evaluate(`(() => {
    const baseFont=parseFloat(getComputedStyle(document.querySelector('.industrial-task .eyebrow')).fontSize);
    return [...document.querySelectorAll('.interface-section')].map(section=>{
      const label=section.querySelector('.interface-section__label');
      const css=getComputedStyle(label);
      return {label:label.textContent,fontRatio:parseFloat(css.fontSize)/baseFont,color:css.color,weight:css.fontWeight,
        introChildren:label.parentElement.children.length,next:label.nextElementSibling.tagName,
        headings:section.querySelectorAll('h3').length,extras:section.querySelectorAll('ul,[class$="__count"]').length,
        captions:[...section.querySelectorAll('figcaption')].map(caption=>{const frame=caption.parentElement.querySelector('button');const css=getComputedStyle(caption);return {left:caption.getBoundingClientRect().left-frame.getBoundingClientRect().left,font:css.fontSize,color:css.color,margin:css.marginTop,align:css.textAlign};})};
    });
  })()`);
  assert.equal(interfaces.length,4);
  for(const section of interfaces) {
    assert.equal(section.label,'ИНТЕРФЕЙС И РАЗДЕЛЫ');
    assert.ok(section.fontRatio>=1.4 && section.fontRatio<=1.6);
    assert.equal(section.color,'rgb(255, 100, 27)');
    assert.equal(section.weight,'500');
    assert.equal(section.introChildren,2);
    assert.equal(section.next,'P');
    assert.equal(section.headings,0);
    assert.equal(section.extras,0);
    for(const caption of section.captions) {
      assert.ok(Math.abs(caption.left)<1);
      assert.equal(caption.align,'left');
      assert.deepEqual({font:caption.font,color:caption.color,margin:caption.margin},{font:interfaces[0].captions[0].font,color:interfaces[0].captions[0].color,margin:interfaces[0].captions[0].margin});
    }
  }
  await evaluate('document.activeElement.blur(); window.scrollTo({top:0,behavior:"instant"})');
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
  await delay(250);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  const composition = await evaluate(`(() => {
    const rect=selector=>document.querySelector(selector).getBoundingClientRect();
    return {marker:rect('.grantmaster-task__marker').right,task:rect('.grantmaster-task__column').left,solution:rect('.grantmaster-task__solution').left,
      resultText:rect('.grantmaster-result__content').right,resultCTA:rect('.grantmaster-result__action').left,
      coverHeight:rect('.grantmaster-cover').height,resultHeight:rect('.grantmaster-result').height};
  })()`);
  assert.equal(composition.marker < composition.task && composition.task < composition.solution, true);
  assert.equal(composition.resultText < composition.resultCTA, true);
  assert.equal(composition.coverHeight < 780 && composition.resultHeight < 500, true);
  const geometry = await evaluate(`(() => {
    const main = document.querySelector('main').getBoundingClientRect();
    const hero = document.querySelector('.hero').getBoundingClientRect();
    const text = document.querySelector('.hero__content').getBoundingClientRect();
    const sections = [...document.querySelectorAll('.hero, .ark > section, .project-separator, .grantmaster > section, .svetlo > section, .industrial > section')].map(section => section.getBoundingClientRect());
    const arrows = [...document.querySelectorAll('.gallery__controls button')].map(button => button.getBoundingClientRect());
    return {width:main.width, gaps:sections.slice(1).map((section,index) => section.top-sections[index].bottom), hero:{width:hero.width,height:hero.height,top:hero.top},text:{right:text.right,bottom:text.bottom},arrows:arrows.map(arrow => arrow.top+arrow.height/2),navigationWidth:document.querySelector('.project-navigation').getBoundingClientRect().width};
  })()`);
  assert.equal(geometry.width, await evaluate('document.documentElement.clientWidth'));
  assert.equal(geometry.hero.top, 0);
  assert.equal(geometry.gaps.every(gap => Math.abs(gap) < 1), true);
  assert.equal(geometry.text.right < geometry.hero.width * .4, true);
  assert.equal(geometry.text.bottom < geometry.hero.height, true);
  assert.equal(geometry.arrows[0], geometry.arrows[1]);
  assert.equal(geometry.navigationWidth, 50);
  const navigationGeometry = () => evaluate(`(() => {
    const box = document.querySelector('.project-navigation').getBoundingClientRect();
    return {right:box.right,top:box.top,height:box.height,numbers:[...document.querySelectorAll('.project-navigation__number')].map(number => {
      const rect=number.getBoundingClientRect();return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,font:getComputedStyle(number).fontSize};
    })};
  })()`);
  const collapsedNavigation = await navigationGeometry();
  await screenshot(`hero-${width}`);
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: width - 20, y: 540 });
  await delay(250);
  assert.equal(await evaluate('Math.round(document.querySelector(".project-navigation").getBoundingClientRect().width)'), 236);
  assert.deepEqual(await navigationGeometry(), collapsedNavigation);
  assert.equal(await evaluate('document.querySelector("main").getBoundingClientRect().width'), geometry.width);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".project-navigation__name")).visibility'), 'visible');
  if (width === 1440) await screenshot('navigation-expanded');
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
  await delay(250);
  await evaluate('document.querySelector(".project-navigation").focus()');
  await delay(250);
  assert.equal(await evaluate('Math.round(document.querySelector(".project-navigation").getBoundingClientRect().width)'), 236);
  assert.deepEqual(await navigationGeometry(), collapsedNavigation);
  await evaluate('document.activeElement.blur()');
  await evaluate('document.querySelector(".ark-gallery").scrollIntoView({behavior:"instant"})');
  await delay(300);
  await screenshot(`gallery-result-${width}`);
  await evaluate('window.scrollTo({top:document.querySelector(".project-separator").offsetTop-180,behavior:"instant"})');
  await delay(300);
  await screenshot(`project-transition-${width}`);
  for (const selector of ['.grantmaster-cover', '.grantmaster-task', '.grantmaster-map', '.grantmaster-tools', '.grantmaster-result']) {
    await evaluate(`document.querySelector('${selector}').scrollIntoView({behavior:'instant'})`);
    await delay(300);
    await screenshot(`${selector.slice(1)}-${width}`);
    assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), '#project-02');
  }
  assert.equal(await evaluate('[...document.querySelectorAll(".grantmaster img, .project-separator img")].every(image => image.complete && image.naturalWidth > 0)'), true);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  const grantmasterGeometry = await evaluate(`(() => {
    const separator = document.querySelector('.project-separator img');
    const sections = [...document.querySelectorAll('.grantmaster > section')];
    const outOfBounds = [...document.querySelectorAll('.grantmaster p, .grantmaster h2, .grantmaster h3, .grantmaster h4, .grantmaster a, .grantmaster li')].filter(node => {
      const box=node.getBoundingClientRect(), parent=node.closest('section').getBoundingClientRect();
      return box.left < parent.left-1 || box.right > parent.right+1 || box.top < parent.top-1 || box.bottom > parent.bottom+1 || node.scrollWidth > node.clientWidth+1;
    }).map(node => node.textContent);
    const separatorBox=separator.getBoundingClientRect();
    return {outOfBounds,separatorRatio:separatorBox.width/separatorBox.height, imageRatio:separator.naturalWidth/separator.naturalHeight};
  })()`);
  assert.deepEqual(grantmasterGeometry.outOfBounds, [], `Text exceeds its block at ${width}px`);
  assert.equal(Math.abs(grantmasterGeometry.separatorRatio-grantmasterGeometry.imageRatio) < .1, true);
  const mainWidth = await evaluate('document.querySelector("main").getBoundingClientRect().width');
  await evaluate('document.querySelector(".project-navigation").focus()');
  await delay(250);
  assert.equal(await evaluate('document.querySelector("main").getBoundingClientRect().width'), mainWidth);
  await evaluate('document.activeElement.blur()');
  await evaluate('document.querySelector(".ark-result").scrollIntoView({behavior:"instant"})');
  await delay(300);
  assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), '#project-01');
  await evaluate('window.scrollTo({top:document.querySelectorAll(".project-separator")[1].offsetTop-180,behavior:"instant"})');
  await delay(300);
  await screenshot(`svetlo-transition-${width}`);
  for (const selector of ['.svetlo-cover', '.svetlo-task', '.svetlo-collection', '.svetlo-gallery', '.svetlo-result']) {
    await evaluate(`document.querySelector('${selector}').scrollIntoView({behavior:'instant'})`);
    await delay(300);
    await screenshot(`${selector.slice(1)}-${width}`);
    assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), '#project-03');
  }
  const svetloGeometry = await evaluate(`(() => {
    const outOfBounds = [...document.querySelectorAll('.svetlo p, .svetlo h2, .svetlo h3, .svetlo li, .svetlo figcaption')].filter(node => {
      const box=node.getBoundingClientRect(), parent=node.closest('section').getBoundingClientRect();
      return box.left < parent.left-1 || box.right > parent.right+1 || box.top < parent.top-1 || box.bottom > parent.bottom+1 || node.scrollWidth > node.clientWidth+1;
    }).map(node => node.textContent);
    const cover = document.querySelector('.svetlo-cover').getBoundingClientRect();
    const text = document.querySelector('.svetlo-cover__content').getBoundingClientRect();
    const last = document.querySelector('.svetlo-result').getBoundingClientRect();
    return {outOfBounds, textRight:text.right/cover.width, end:last.bottom+scrollY, height:document.documentElement.scrollHeight};
  })()`);
  assert.deepEqual(svetloGeometry.outOfBounds, [], `SVETLO text exceeds its block at ${width}px`);
  assert.equal(svetloGeometry.textRight < .5, true, 'Hero text stays left of the tablet');
  assert.equal(await evaluate('[...document.querySelectorAll(".svetlo img")].every(image => image.complete && image.naturalWidth > 0)'), true);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate('document.querySelector(".project-navigation a[href=\\"#project-03\\"]").click()');
  await delay(1200);
  assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), '#project-03');
  await evaluate('window.scrollTo({top:document.querySelectorAll(".project-separator")[2].offsetTop-180,behavior:"instant"})');
  await delay(300);
  await screenshot(`industrial-transition-${width}`);
  for (const selector of ['.industrial-cover', '.industrial-task', '.industrial-history', '.industrial-gallery', '.industrial-result']) {
    await evaluate(`document.querySelector('${selector}').scrollIntoView({behavior:'instant'})`);
    await delay(300);
    await screenshot(`${selector.slice(1)}-${width}`);
    assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), '#project-04');
  }
  const industrialGeometry = await evaluate(`(() => {
    const outOfBounds = [...document.querySelectorAll('.industrial p, .industrial h2, .industrial h3, .industrial figcaption')].filter(node => {
      const box=node.getBoundingClientRect(), parent=node.closest('section').getBoundingClientRect();
      return box.left < parent.left-1 || box.right > parent.right+1 || box.top < parent.top-1 || box.bottom > parent.bottom+1 || node.scrollWidth > node.clientWidth+1;
    }).map(node => node.textContent);
    const last = document.querySelector('.industrial-result').getBoundingClientRect();
    const separators = [...document.querySelectorAll('.project-separator')].map(node => {const box=node.getBoundingClientRect(),image=node.querySelector('img').getBoundingClientRect();return {top:image.top-box.top,bottom:box.bottom-image.bottom,strip:image.height,white:getComputedStyle(node).backgroundColor};});
    return {outOfBounds,separators,end:last.bottom+scrollY,height:document.documentElement.scrollHeight};
  })()`);
  assert.deepEqual(industrialGeometry.outOfBounds, [], `Project 04 text exceeds its block at ${width}px`);
  assert.equal(Math.abs(industrialGeometry.end-industrialGeometry.height) < 1, true, 'No empty section after project 04');
  for (const separator of industrialGeometry.separators) {
    assert.equal(separator.white, 'rgb(255, 255, 255)');
    assert.equal(Math.abs(separator.top-separator.strip) < .1 && Math.abs(separator.bottom-separator.strip) < .1, true);
  }
  assert.equal(await evaluate('[...document.querySelectorAll(".industrial img")].every(image => image.complete && image.naturalWidth > 0)'), true);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate('document.querySelectorAll(".project-navigation a")[3].click()');
  await waitForProject('04');
  assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), '#project-04');
  assert.equal(await evaluate('Math.abs(document.querySelector("#project-04").getBoundingClientRect().top) < 2'), true);
  // Jump deep into any project without first visiting its cover, then scroll both ways.
  for (const selector of ['.grantmaster-tools', '.ark-task', '.svetlo-gallery', '.grantmaster-map', '.ark-cover', '.svetlo-result', '.grantmaster-result']) {
    await evaluate(`document.querySelector('${selector}').scrollIntoView({behavior:'instant'})`);
    await delay(100);
    assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), selector.startsWith('.ark') ? '#project-01' : selector.startsWith('.svetlo') ? '#project-03' : '#project-02');
  }
  await evaluate('window.scrollTo({top:document.querySelector("#project-01").offsetTop,behavior:"instant"})');
  const scrollEnd = await evaluate('document.documentElement.scrollHeight-innerHeight');
  for (let position=await evaluate('scrollY'); position<=scrollEnd; position+=200) {
    await evaluate(`window.scrollTo({top:${position},behavior:'instant'})`);
    await delay(20);
    const expected = await evaluate('document.querySelector("#project-04").getBoundingClientRect().top <= Math.min(160,innerHeight*.15) ? "#project-04" : document.querySelector("#project-03").getBoundingClientRect().top <= Math.min(160,innerHeight*.15) ? "#project-03" : document.querySelector("#project-02").getBoundingClientRect().top <= Math.min(160,innerHeight*.15) ? "#project-02" : "#project-01"');
    assert.equal(await evaluate('document.querySelector(".project-navigation a[aria-current]").hash'), expected);
  }
}
assert.deepEqual(errors, []);
console.log('PASS: Hero and projects 01–04, approved assets and gallery order, white SVG transitions, continuous sections, desktop widths, fixed navigation and active projects, galleries, zoom, drag, reset, close, Escape and focus restoration.');
socket.close();
