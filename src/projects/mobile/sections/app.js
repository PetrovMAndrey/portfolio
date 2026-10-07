import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

const icons = {
  transfer: '<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  devices: '<rect x="2" y="3" width="13" height="13" rx="1"/><path d="M5 20h7m-4-4v4"/><rect x="16" y="9" width="6" height="13" rx="1"/>',
  shield: '<path d="M12 2 3 5v6c0 5 4 8 9 11 5-3 9-6 9-11V5zM8 12l3 3 5-6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M7 2v4m10-4v4M3 10h18M7 14h2m4 0h2m-8 4h2m4 0h2"/>',
  search: '<circle cx="10" cy="10" r="8"/><path d="m16 16 6 6"/>',
  star: '<path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5L6 21l1-7-5-4.5 7-1z"/>',
  cart: '<path d="M2 3h3l3 13h11l3-9H6M9 21h.01M18 21h.01"/>',
  microphone: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  heart: '<path d="M12 21 3 12a6 6 0 0 1 9-8 6 6 0 0 1 9 8z"/>',
  document: '<path d="M5 2h10l4 4v18H5zM15 2v5h4M8 11h8M8 15h8M8 19h6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
};

export function renderApp(app) {
  return elementFromHTML(`
    <section class="mobile-app mobile-app--${app.id} mobile-app--${app.theme}" aria-labelledby="mobile-${app.id}-title">
      <img class="mobile-project__background" src="${escapeHTML(app.background)}" width="1672" height="941" alt="" aria-hidden="true" loading="lazy" decoding="async">
      <div class="mobile-app__text">
        <p class="mobile-app__number"><span aria-hidden="true"></span>${app.number}</p>
        <h3 id="mobile-${app.id}-title">${escapeHTML(app.title)}</h3>
        <p class="mobile-app__subtitle">${escapeHTML(app.subtitle)}</p>
        <div class="mobile-app__description">${app.paragraphs.map(text => `<p class="mobile-project__copy">${escapeHTML(text)}</p>`).join('')}</div>
        <ul class="mobile-app__features">${app.features.map(feature => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[feature.icon]}</svg><div><p class="mobile-app__feature-title">${escapeHTML(feature.title)}</p>${feature.text ? `<p class="mobile-app__feature-copy">${escapeHTML(feature.text)}</p>` : ''}</div></li>`).join('')}</ul>
      </div>
      <div class="mobile-app__mockups" role="group" aria-label="Экраны приложения ${escapeHTML(app.title)}">${app.mockups.map(screen => `<img class="mobile-app__mockup" src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" loading="lazy" decoding="async">`).join('')}</div>
    </section>`);
}
