import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderScreenshots(project) {
  return elementFromHTML(`
    <section class="newsletter-gallery dark-section interface-section" data-gallery aria-labelledby="newsletter-gallery-title">
      <div class="newsletter-gallery__intro"><p class="eyebrow interface-section__label" id="newsletter-gallery-title">ИНТЕРФЕЙС И РАЗДЕЛЫ</p>${project.copy.gallery.map(text => `<p class="newsletter__copy">${escapeHTML(text)}</p>`).join('')}<p class="newsletter-gallery__count">4 экрана</p></div>
      <div class="newsletter-gallery__previews">${project.images.map((screen, index) => `<figure class="newsletter-gallery__item"><button type="button" class="newsletter-gallery__preview" data-gallery-open="${index}" data-src="${escapeHTML(screen.src)}" data-title="${escapeHTML(screen.title)}" aria-label="Открыть скриншот: ${escapeHTML(screen.title)}"><img src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(screen.title)}</figcaption></figure>`).join('')}</div>
    </section>`);
}
