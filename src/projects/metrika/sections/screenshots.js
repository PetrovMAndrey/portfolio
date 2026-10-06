import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderScreenshots(project) {
  return elementFromHTML(`
    <section class="metrika-gallery dark-section interface-section" data-gallery aria-labelledby="metrika-gallery-title">
      <div class="metrika-gallery__intro"><p class="eyebrow interface-section__label" id="metrika-gallery-title">ИНТЕРФЕЙС И РАЗДЕЛЫ</p><p class="metrika__copy">${escapeHTML(project.copy.gallery)}</p></div>
      <div class="metrika-gallery__previews">${project.gallery.map((screen, index) => `<figure class="metrika-gallery__item"><button type="button" class="metrika-gallery__preview" data-gallery-open="${index}" data-src="${escapeHTML(screen.src)}" data-title="${escapeHTML(screen.title)}" aria-label="Открыть скриншот: ${escapeHTML(screen.title)}"><img src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(screen.title)}</figcaption></figure>`).join('')}</div>
    </section>`);
}
