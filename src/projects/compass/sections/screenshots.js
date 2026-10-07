import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderScreenshots(project) {
  return elementFromHTML(`
    <section class="compass-gallery dark-section interface-section" data-gallery aria-labelledby="compass-gallery-title">
      <div class="compass-gallery__intro"><p class="eyebrow interface-section__label" id="compass-gallery-title">ИНТЕРФЕЙС И СЦЕНАРИИ</p><p class="compass__copy">${escapeHTML(project.copy.gallery)}</p></div>
      <div class="compass-gallery__previews">${project.gallery.map((screen, index) => `<figure class="compass-gallery__item"><button type="button" class="compass-gallery__preview" data-gallery-open="${index}" data-src="${escapeHTML(screen.src)}" data-title="${escapeHTML(screen.title)}" aria-label="Открыть скриншот: ${escapeHTML(screen.title)}"><img src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(screen.title)}</figcaption></figure>`).join('')}</div>
    </section>`);
}
