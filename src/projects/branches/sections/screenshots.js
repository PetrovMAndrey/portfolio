import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderScreenshots(project) {
  return elementFromHTML(`
    <section class="branches-gallery dark-section interface-section" data-gallery aria-labelledby="branches-gallery-title">
      <div class="branches-gallery__intro"><p class="eyebrow interface-section__label" id="branches-gallery-title">ИНТЕРФЕЙС И СЦЕНАРИИ</p><p class="branches__copy">${escapeHTML(project.copy.gallery)}</p></div>
      <div class="branches-gallery__previews">${project.gallery.map((screen, index) => `<figure class="branches-gallery__item"><button type="button" class="branches-gallery__preview" data-gallery-open="${index}" data-src="${escapeHTML(screen.src)}" data-title="${escapeHTML(screen.title)}" aria-label="Открыть скриншот: ${escapeHTML(screen.title)}"><img src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(screen.title)}</figcaption></figure>`).join('')}</div>
    </section>`);
}
