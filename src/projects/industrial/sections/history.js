import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderHistory(project) {
  return elementFromHTML(`
    <section class="industrial-history" aria-labelledby="industrial-history-title">
      <img class="industrial-history__image" src="${escapeHTML(project.images.history)}" alt="Архивная панорама индустриального города над рекой" loading="lazy" decoding="async">
      <div class="industrial-history__content"><p class="eyebrow">ИСТОРИЯ РАЙОНА</p><h3 id="industrial-history-title">Заводы. Люди.<br>Город.</h3><p class="industrial__copy">${escapeHTML(project.copy.history)}</p></div>
    </section>`);
}
