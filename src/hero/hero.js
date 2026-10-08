import { elementFromHTML, escapeHTML } from '../shared/dom.js';

const directory = './Вайфреймы в работу/Для горизонтального скролла в хиро блоке/';
const cards = [
  ['АРК', '1 АРК для горизонтального скролла.png'],
  ['Грантмастер', '2 Грантмастер_для горизонтального скролла.png'],
  ['SVETLO', '3 СВЕТЛО_для горизонтального скролла.png'],
  ['Индустриальная история', '4 Индустриальная история_для горизонтального скролла.png'],
  ['Агент.Метрика', '5 Агент.Метрика_для горизонтального скролла.png'],
  ['Студия рассылок', '6 Студия рассылок_для горизонтального скролла.png'],
  ['Реестр ЗАЛов', '7 Реестр залов_для горизонтального скролла.png'],
  ['8 филиалов', '8 8_филиалов_для горизонтального скролла.png'],
  ['Рабочий компас', '9 Рабочий компас_для горизонтального скролла.png'],
  ['Мобильные приложения', '10 Блок мобильных приложений_для горизонтального скролла.png'],
];
function cardImage(index) {
  const [title, file] = cards[index];
  return `<img src="${escapeHTML(directory + file)}" alt="${escapeHTML(title)}" width="1672" height="941" loading="eager" decoding="sync" draggable="false"><span class="hero-card__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`;
}
function cardList(copy = false) {
  // Build every cycle before attaching the Hero. Copies retain mouse links but
  // only the original cycle participates in keyboard/screen-reader navigation.
  return `<ol class="hero-rail__cards"${copy ? ' aria-hidden="true"' : ''}>${cards.map(([title], index) => {
    const number = String(index + 1).padStart(2, '0');
    return `<li class="${copy ? 'hero-rail__copy-item' : 'hero-rail__item'}">${index < 10 ? `<a class="hero-card" href="#project-${number}"${copy ? ' tabindex="-1"' : ''} aria-label="Проект ${number}: ${escapeHTML(title)}">${cardImage(index)}</a>` : `<div class="hero-card" aria-label="Проект ${number}: ${escapeHTML(title)}">${cardImage(index)}</div>`}</li>`;
  }).join('')}</ol>`;
}
export function renderHero() {
  return elementFromHTML(`
    <section class="hero" id="hero" aria-labelledby="hero-title"><div class="hero__scene">
      <header class="hero__heading"><p class="hero__name">АНДРЕЙ ПЕТРОВ</p><span class="hero__rule" aria-hidden="true"></span>
        <h1 id="hero-title"><span>Логика</span><span>и практика</span></h1>
        <div class="hero__directions">
          <ul class="hero__disciplines" aria-label="Направления работы"><li>АНАЛИЗ</li><li>КОНЦЕПЦИИ</li><li>DIGITAL</li></ul>
          <a class="hero__cta" href="#discuss">Обсудить проект <span aria-hidden="true">→</span></a>
          <ul class="hero__disciplines" aria-label="Направления работы"><li>КУЛЬТУРА</li><li>ПРОЕКТЫ</li><li>РАЗВИТИЕ</li></ul>
        </div>
      </header>
      <div class="hero-rail"><div class="hero-rail__viewport" tabindex="0" role="region" aria-label="Лента проектов: прокрутка колёсиком, перетаскиванием или стрелками">
        ${cardList(true)}${cardList()}${cardList(true)}
      </div></div>
      <footer class="hero__footer"><span class="hero__rule" aria-hidden="true"></span><p>От анализа к работающим решениям<br>в культуре, образовании и общественных проектах.</p></footer>
    </div></section>`);
}
export function mountHero(hero) {
  const rail = hero.querySelector('.hero-rail__viewport');
  const first = hero.querySelector('.hero-rail__item');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => reducedMotion.matches ? 'instant' : 'smooth';
  function navigateToSection(event, link) {
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1)); if (!target) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(history.state, '', link.hash);
    target.scrollIntoView({ behavior: behavior() });
  }
  hero.querySelector('.hero__cta').addEventListener('click', event => navigateToSection(event, event.currentTarget));
  const list = hero.querySelector('.hero-rail__cards:not([aria-hidden])');
  const visualCards = [...rail.querySelectorAll('.hero-card')];
  visualCards.forEach((card, index) => card.dataset.heroProject = index % cards.length);
  let hoveredProject = null;
  function hoverProject(project) {
    if (project === hoveredProject) return;
    hoveredProject = project;
    visualCards.forEach(card => card.classList.toggle('is-hovered', card.dataset.heroProject === project));
  }
  rail.addEventListener('pointerover', event => hoverProject(event.target.closest('.hero-card')?.dataset.heroProject ?? null));
  rail.addEventListener('pointerleave', () => hoverProject(null));
  let frame = 0, drag = null, suppressClick = false, cycle = 0, animation = 0;
  const modulo = (value, length) => ((value % length) + length) % length;
  function setPosition(value) {
    const lower = cycle - rail.clientWidth / 2;
    const next = lower + modulo(value - lower, cycle);
    rail.scrollLeft = next;
    if (drag) drag.scroll += next - value;
  }
  function stopAnimation() { cancelAnimationFrame(animation); animation = 0; }
  function moveBy(distance) {
    stopAnimation();
    const start = rail.scrollLeft;
    if (reducedMotion.matches) { setPosition(start + distance); return; }
    const began = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - began) / 350);
      setPosition(start + distance * (1 - Math.pow(1 - progress, 3)));
      animation = progress < 1 ? requestAnimationFrame(tick) : 0;
    }
    animation = requestAnimationFrame(tick);
  }
  function update() {
    frame = 0;
    const progress = Math.max(0, Math.min(1, scrollY / hero.offsetHeight));
    hero.style.setProperty('--hero-recede', reducedMotion.matches ? 1 : 1 - progress * .08);
    hero.style.setProperty('--hero-shade', reducedMotion.matches ? 0 : progress * .18);
    hero.classList.toggle('is-covered', progress >= 1);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function resize() {
    stopAnimation();
    const previousCycle = cycle;
    cycle = parseFloat(getComputedStyle(list).width) + parseFloat(getComputedStyle(rail).gap);
    setPosition(previousCycle ? rail.scrollLeft * cycle / previousCycle : cycle - parseFloat(getComputedStyle(first).width) * (234 / 386));
    update();
  }
  rail.addEventListener('scroll', () => {
    const lower = cycle - rail.clientWidth / 2;
    if (cycle && (rail.scrollLeft < lower || rail.scrollLeft >= lower + cycle)) setPosition(rail.scrollLeft);
  }, { passive: true });
  rail.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? rail.clientWidth : 1);
    event.preventDefault(); stopAnimation(); setPosition(rail.scrollLeft + delta);
  }, { passive: false });
  rail.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    moveBy((parseFloat(getComputedStyle(first).width) + parseFloat(getComputedStyle(rail).gap)) * (event.key === 'ArrowLeft' ? -1 : 1));
  });
  rail.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.pointerType !== 'mouse') return;
    stopAnimation();
    drag = { id: event.pointerId, start: event.clientX, scroll: rail.scrollLeft, moved: false }; suppressClick = false;
  });
  rail.addEventListener('dragstart', event => event.preventDefault());
  rail.addEventListener('pointermove', event => {
    const card = document.elementFromPoint(event.clientX, event.clientY)?.closest('.hero-card');
    hoverProject(card && rail.contains(card) ? card.dataset.heroProject : null);
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.start;
    if (!drag.moved && Math.abs(delta) > 5) { drag.moved = true; rail.setPointerCapture(event.pointerId); rail.classList.add('is-dragging'); }
    if (drag.moved) { setPosition(drag.scroll - delta); event.preventDefault(); }
  });
  const endDrag = () => { suppressClick = !!drag?.moved; drag = null; rail.classList.remove('is-dragging'); };
  rail.addEventListener('pointerup', endDrag);
  rail.addEventListener('pointercancel', endDrag);
  rail.addEventListener('lostpointercapture', () => { if (drag) endDrag(); });
  rail.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
    navigateToSection(event, event.target.closest('a[href^="#project-"]'));
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('pageshow', update);
  reducedMotion.addEventListener('change', update);
  resize();
}
