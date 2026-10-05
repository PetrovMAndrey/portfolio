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
  return `<img src="${escapeHTML(directory + file)}" alt="${escapeHTML(title)}" width="1672" height="941" decoding="async" draggable="false"><span class="hero-card__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`;
}
export function renderHero() {
  return elementFromHTML(`
    <section class="hero" id="hero" aria-labelledby="hero-title"><div class="hero__scene">
      <header class="hero__heading"><p class="hero__name">АНДРЕЙ ПЕТРОВ</p><span class="hero__rule" aria-hidden="true"></span>
        <h1 id="hero-title"><span>Логика</span><span>и практика</span></h1>
        <ul class="hero__disciplines" aria-label="Направления работы"><li>АНАЛИЗ</li><li>КОНЦЕПЦИЯ</li><li>КУЛЬТУРА</li><li>ПРОЕКТЫ</li><li>РАЗВИТИЕ</li></ul>
      </header>
      <div class="hero-rail"><div class="hero-rail__viewport" tabindex="0" role="region" aria-label="Лента проектов: прокрутка колёсиком, перетаскиванием или стрелками">
        <div class="hero-card hero-card--lead" aria-hidden="true">${cardImage(9)}</div>
        <ol class="hero-rail__cards">${cards.map(([title], index) => {
          const number = String(index + 1).padStart(2, '0');
          return `<li class="hero-rail__item">${index < 4 ? `<a class="hero-card" href="#project-${number}" aria-label="Проект ${number}: ${escapeHTML(title)}">${cardImage(index)}</a>` : `<div class="hero-card" aria-label="Проект ${number}: ${escapeHTML(title)}">${cardImage(index)}</div>`}</li>`;
        }).join('')}</ol>
      </div></div>
      <footer class="hero__footer"><span class="hero__rule" aria-hidden="true"></span><p>От анализа к работающим решениям<br>в культуре, образовании и общественных проектах.</p></footer>
    </div></section>`);
}
export function mountHero(hero) {
  const rail = hero.querySelector('.hero-rail__viewport');
  const first = hero.querySelector('.hero-rail__item');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const behavior = () => reducedMotion.matches ? 'instant' : 'smooth';
  let frame = 0, drag = null, suppressClick = false, previousWidth = 0;
  function update() {
    frame = 0;
    const progress = Math.max(0, Math.min(1, scrollY / hero.offsetHeight));
    hero.style.setProperty('--hero-recede', reducedMotion.matches ? 1 : 1 - progress * .035);
    hero.classList.toggle('is-covered', progress >= 1);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function resize() {
    const width = first.offsetWidth;
    // Decorative tail of 10 precedes the ordered 01–10 list, as in the reference.
    rail.scrollLeft = previousWidth ? rail.scrollLeft * width / previousWidth : width * (168 / 386);
    previousWidth = width; update();
  }
  rail.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.ctrlKey) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? rail.clientWidth : 1);
    const next = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, rail.scrollLeft + delta));
    if (next !== rail.scrollLeft) { event.preventDefault(); rail.scrollLeft = next; }
  }, { passive: false });
  rail.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    rail.scrollBy({ left: (first.offsetWidth + parseFloat(getComputedStyle(rail).gap)) * (event.key === 'ArrowLeft' ? -1 : 1), behavior: behavior() });
  });
  rail.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.pointerType !== 'mouse') return;
    drag = { id: event.pointerId, start: event.clientX, scroll: rail.scrollLeft, moved: false }; suppressClick = false;
  });
  rail.addEventListener('dragstart', event => event.preventDefault());
  rail.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.start;
    if (!drag.moved && Math.abs(delta) > 5) { drag.moved = true; rail.setPointerCapture(event.pointerId); rail.classList.add('is-dragging'); }
    if (drag.moved) { rail.scrollLeft = drag.scroll - delta; event.preventDefault(); }
  });
  const endDrag = () => { suppressClick = !!drag?.moved; drag = null; rail.classList.remove('is-dragging'); };
  rail.addEventListener('pointerup', endDrag);
  rail.addEventListener('pointercancel', endDrag);
  rail.addEventListener('lostpointercapture', () => { if (drag) endDrag(); });
  rail.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
    const link = event.target.closest('a[href^="#project-"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1)); if (!target) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(history.state, '', link.hash);
    target.scrollIntoView({ behavior: behavior() });
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('pageshow', update);
  reducedMotion.addEventListener('change', update);
  resize();
}
