import { elementFromHTML } from '../../../shared/dom.js';

export function renderVisual(ark) {
  const section = elementFromHTML(`
    <section class="ark-visual dark-section" aria-label="Ключевые разделы сайта АРК">
      <div class="ark-visual__image"><img src="${ark.images.visual}" alt="Реальный скриншот раздела приложений сайта АРК" loading="lazy" decoding="async"></div>
      <div class="ark-visual__content">
        <h3 class="eyebrow">КЛЮЧЕВЫЕ<br>РАЗДЕЛЫ САЙТА</h3>
        <ul><li>О нас</li><li>Направления</li><li>Проекты</li><li>Подход</li><li>Контакты</li></ul>
      </div>
    </section>`);
  section.style.setProperty('--section-image', `url("${new URL(ark.images.visualBackground, document.baseURI).href}")`);
  return section;
}
