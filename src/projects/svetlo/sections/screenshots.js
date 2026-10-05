import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderScreenshots(project) {
  return elementFromHTML(`
    <section class="svetlo-gallery interface-section" data-gallery aria-labelledby="svetlo-gallery-title">
      <div class="svetlo-gallery__intro"><p class="eyebrow interface-section__label" id="svetlo-gallery-title">ИНТЕРФЕЙС И РАЗДЕЛЫ</p><p class="svetlo__copy">Коллекция, каталог, журнал и полная страница магазина. Скриншоты открываются в полном размере, их можно листать и увеличивать.</p></div>
      <div class="svetlo-gallery__previews">${project.gallery.map((item, index) => `
        <figure class="svetlo-gallery__item"><button type="button" class="svetlo-gallery__preview" data-gallery-open="${index}" data-src="${escapeHTML(item.src)}" data-title="${escapeHTML(item.title)}" aria-label="Открыть скриншот: ${escapeHTML(item.title)}"><img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(item.title)}</figcaption></figure>`).join('')}
      </div>
    </section>`);
}
