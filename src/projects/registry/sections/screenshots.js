import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderScreenshots(project) {
  return elementFromHTML(`
    <section class="registry-gallery dark-section interface-section" data-gallery aria-labelledby="registry-gallery-title">
      <div class="registry-gallery__intro"><p class="eyebrow interface-section__label" id="registry-gallery-title">ИНТЕРФЕЙС И СЦЕНАРИИ</p><p class="registry__copy">${escapeHTML(project.copy.gallery)}</p></div>
      <div class="registry-gallery__previews">${project.gallery.map((screen, index) => `<figure class="registry-gallery__item"><button type="button" class="registry-gallery__preview" data-gallery-open="${index}" data-src="${escapeHTML(screen.src)}" data-title="${escapeHTML(screen.title)}" aria-label="Открыть скриншот: ${escapeHTML(screen.title)}"><img src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(screen.title)}</figcaption></figure>`).join('')}</div>
    </section>`);
}
