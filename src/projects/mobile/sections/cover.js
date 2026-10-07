import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderCover(project) {
  return elementFromHTML(`
    <section class="mobile-cover dark-section" aria-labelledby="mobile-title">
      <img class="mobile-project__background" src="${escapeHTML(project.background)}" width="1672" height="941" alt="" aria-hidden="true" decoding="async">
      <div class="mobile-cover__text">
        <p class="mobile-cover__number"><span>10</span> / 10</p>
        <p class="eyebrow">ПРОЕКТ</p>
        <h2 id="mobile-title">${escapeHTML(project.title)}</h2>
        <p class="mobile-cover__subtitle">${escapeHTML(project.subtitle)}</p>
        <p class="mobile-project__copy">${escapeHTML(project.description)}</p>
      </div>
    </section>`);
}
