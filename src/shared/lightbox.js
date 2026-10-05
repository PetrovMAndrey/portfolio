import { elementFromHTML, nonBreakingText } from './dom.js';

export function createLightbox(images) {
  const dialog = elementFromHTML(`
    <dialog class="lightbox" aria-label="Просмотр скриншотов">
      <div class="lightbox__toolbar">
        <p class="lightbox__title" aria-live="polite"></p>
        <div class="lightbox__tools">
          <button type="button" data-action="out" aria-label="Уменьшить изображение">−</button>
          <button type="button" class="lightbox__scale" data-action="reset" aria-label="Сбросить масштаб"></button>
          <button type="button" data-action="in" aria-label="Увеличить изображение">+</button>
          <button type="button" data-action="close" aria-label="Закрыть галерею">×</button>
        </div>
      </div>
      <div class="lightbox__stage"><img class="lightbox__image" draggable="false" alt=""></div>
      <div class="lightbox__footer"><button type="button" data-action="previous" aria-label="Предыдущее изображение">←</button><p>← → листать <span>·</span> + − масштаб <span>·</span> перетащить увеличенное изображение <span>·</span> Esc закрыть</p><button type="button" data-action="next" aria-label="Следующее изображение">→</button></div>
    </dialog>`);
  const stage = dialog.querySelector('.lightbox__stage');
  const image = dialog.querySelector('img');
  let index = 0, scale = 1, x = 0, y = 0, drag = null, returnFocus = null;
  let previousOverflow = '';
  let baseWidth = 0, baseHeight = 0;

  function measure() {
    if (!image.naturalWidth || !dialog.open) return;
    const fit = Math.min((stage.clientWidth - 48) / image.naturalWidth, (stage.clientHeight - 32) / image.naturalHeight, 1);
    baseWidth = image.naturalWidth * fit;
    baseHeight = image.naturalHeight * fit;
    image.style.width = `${baseWidth}px`;
    image.style.height = `${baseHeight}px`;
    update();
  }

  function update() {
    const limitX = Math.max(0, (baseWidth * scale - stage.clientWidth) / 2 + 24);
    const limitY = Math.max(0, (baseHeight * scale - stage.clientHeight) / 2 + 16);
    x = Math.max(-limitX, Math.min(limitX, x));
    y = Math.max(-limitY, Math.min(limitY, y));
    image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    stage.classList.toggle('is-zoomed', scale > 1);
    dialog.querySelector('.lightbox__scale').textContent = `${Math.round(scale * 100)}%`;
    dialog.querySelector('[data-action="out"]').disabled = scale <= 1;
    dialog.querySelector('[data-action="in"]').disabled = scale >= 12;
  }

  function zoom(value) { scale = Math.max(1, Math.min(12, value)); update(); }
  function reset() { scale = 1; x = 0; y = 0; update(); }
  function show(nextIndex) {
    index = (nextIndex + images.length) % images.length;
    reset();
    image.src = images[index].src;
    image.alt = images[index].alt;
    dialog.querySelector('.lightbox__title').textContent = nonBreakingText(images[index].title);
    measure();
  }

  const actions = {
    previous: () => show(index - 1), next: () => show(index + 1),
    in: () => zoom(scale * 1.5), out: () => zoom(scale / 1.5),
    reset, close: () => dialog.close(),
  };
  dialog.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (button) actions[button.dataset.action]();
  });
  dialog.addEventListener('keydown', event => {
    const keys = { ArrowLeft: 'previous', ArrowRight: 'next', '+': 'in', '=': 'in', '-': 'out', '0': 'reset' };
    if (keys[event.key]) { event.preventDefault(); actions[keys[event.key]](); }
    // Native modal dialog traps focus and handles Escape.
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    drag = null;
    returnFocus?.focus({ preventScroll: true });
  });
  image.addEventListener('load', measure);
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });
  stage.addEventListener('dblclick', () => scale > 1 ? reset() : zoom(3));
  stage.addEventListener('pointerdown', event => {
    if (scale <= 1 || event.button !== 0) return;
    drag = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x, y };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
    event.preventDefault();
  });
  stage.addEventListener('pointermove', event => {
    if (!drag || drag.pointer !== event.pointerId) return;
    x = drag.x + event.clientX - drag.startX;
    y = drag.y + event.clientY - drag.startY;
    update();
  });
  const endDrag = () => { drag = null; stage.classList.remove('is-dragging'); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('lostpointercapture', endDrag);
  new ResizeObserver(measure).observe(stage);
  document.body.append(dialog);
  return {
    open(nextIndex, trigger) {
      returnFocus = trigger;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      show(nextIndex);
      dialog.querySelector('[data-action="close"]').focus();
    },
  };
}
