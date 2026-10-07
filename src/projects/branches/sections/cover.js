import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderCover(project) {
  const screen = project.gallery[0];
  return elementFromHTML(`
    <section class="branches-cover dark-section" aria-labelledby="branches-title">
      <div class="branches-cover__visual">
        <img class="branches-cover__background" src="${escapeHTML(project.backgrounds.visual)}" alt="" aria-hidden="true" decoding="async">
        <img class="branches-cover__screen" src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" decoding="sync">
      </div>
      <div class="branches-cover__content">
        <img class="branches-cover__background" src="${escapeHTML(project.backgrounds.content)}" alt="" aria-hidden="true" decoding="async">
        <img class="branches-cover__divider" src="./Вайфреймы в работу/Line.svg" width="29" height="1104" alt="" aria-hidden="true">
        <div class="branches-cover__text">
          <p class="branches__number"><span>08</span> / 10 <i aria-hidden="true"></i></p>
          <p class="eyebrow">ПРОЕКТ</p>
          <h2 id="branches-title">8 филиалов</h2>
          <p class="branches-cover__subtitle">${escapeHTML(project.copy.subtitle)}</p>
          <p class="branches__copy">${escapeHTML(project.copy.cover)}</p>
          <ul class="branches-cover__tags" aria-label="Направления проекта">${project.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>`);
}
