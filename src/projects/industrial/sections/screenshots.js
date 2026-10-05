import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderScreenshots(project) {
  return elementFromHTML(`
    <section class="industrial-gallery interface-section" data-gallery aria-labelledby="industrial-gallery-title">
      <div class="industrial-gallery__intro"><p class="eyebrow interface-section__label" id="industrial-gallery-title">ИНТЕРФЕЙС И РАЗДЕЛЫ</p><p class="industrial__copy">${escapeHTML(project.copy.gallery)}</p></div>
      <div class="industrial-gallery__previews">${project.gallery.map((item, index) => `<figure class="industrial-gallery__item"><button type="button" class="industrial-gallery__preview" data-gallery-open="${index}" data-src="${escapeHTML(item.src)}" data-title="${escapeHTML(item.title)}" aria-label="Открыть изображение: ${escapeHTML(item.title)}"><img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(item.title)}</figcaption></figure>`).join('')}</div>
    </section>`);
}
