import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderCover(project) {
  return elementFromHTML(`
    <section class="newsletter-cover dark-section" aria-labelledby="newsletter-title">
      <img class="newsletter-cover__background" src="${escapeHTML(project.background)}" width="1672" height="940" alt="" aria-hidden="true" decoding="async">
      <div class="newsletter-cover__content">
        <p class="newsletter__number"><span>06</span> / 10 <i aria-hidden="true"></i></p>
        <p class="eyebrow">ПРОЕКТ</p>
        <h2 id="newsletter-title">Студия рассылок</h2>
        <p class="newsletter-cover__subtitle">${escapeHTML(project.copy.subtitle)}</p>
        <p class="newsletter__copy">${escapeHTML(project.copy.cover)}</p>
        <ul class="newsletter-cover__tags" aria-label="Направления проекта">${project.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
      </div>
    </section>`);
}
