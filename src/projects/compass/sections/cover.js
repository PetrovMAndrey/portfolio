import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderCover(project) {
  const screen = project.gallery[0];
  return elementFromHTML(`
    <section class="compass-cover dark-section" aria-labelledby="compass-title">
      <div class="compass-cover__content">
        <img class="compass-cover__background" src="${escapeHTML(project.backgrounds.content)}" alt="" aria-hidden="true" decoding="async">
        <div class="compass-cover__text">
          <p class="compass__number"><span>09</span> / 10 <i aria-hidden="true"></i></p>
          <p class="eyebrow">ПРОЕКТ</p>
          <h2 id="compass-title">Рабочий компас</h2>
          <p class="compass-cover__subtitle">${escapeHTML(project.copy.subtitle)}</p>
          <p class="compass__copy">${escapeHTML(project.copy.cover)}</p>
          <ul class="compass-cover__tags" aria-label="Направления проекта">${project.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="compass-cover__visual">
        <img class="compass-cover__background" src="${escapeHTML(project.backgrounds.visual)}" alt="" aria-hidden="true" decoding="async">
        <img class="compass-cover__divider" src="./Вайфреймы в работу/Line.svg" width="29" height="1104" alt="" aria-hidden="true">
        <img class="compass-cover__screen" src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" decoding="sync">
      </div>
    </section>`);
}
