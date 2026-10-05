import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderScreenshots(ark) {
  return elementFromHTML(`
    <section class="ark-gallery paper-section interface-section" data-gallery aria-labelledby="ark-gallery-title">
      <div class="ark-gallery__intro">
        <p class="eyebrow interface-section__label" id="ark-gallery-title">ИНТЕРФЕЙС И РАЗДЕЛЫ</p>
        <p>Основные разделы платформы: направления работы, проекты и цифровые продукты. Каждый раздел сохраняет собственную логику внутри общей визуальной системы.</p>
      </div>
      <div class="gallery__area">
        <div class="gallery__controls" aria-label="Открыть галерею"><button type="button" data-gallery-open="2" aria-label="Открыть предыдущее изображение">←</button><button type="button" data-gallery-open="0" aria-label="Открыть первое изображение">→</button></div>
        <div class="gallery__items">
          ${ark.gallery.map((item, index) => `<figure class="gallery__item"><button class="gallery__preview" type="button" data-gallery-open="${index}" data-src="${escapeHTML(item.src)}" data-title="${escapeHTML(item.title)}" aria-label="Открыть скриншот: ${escapeHTML(item.title)}"><img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(item.title)}</figcaption></figure>`).join('')}
        </div>
      </div>
    </section>`);
}
