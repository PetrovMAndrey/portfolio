import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderCover(project) {
  const screen = project.gallery[0];
  return elementFromHTML(`
    <section class="registry-cover dark-section" aria-labelledby="registry-title">
      <div class="registry-cover__visual">
        <img class="registry-cover__background" src="${escapeHTML(project.backgrounds.visual)}" alt="" aria-hidden="true" decoding="async">
        <img class="registry-cover__screen" src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" decoding="sync">
      </div>
      <div class="registry-cover__content">
        <img class="registry-cover__background" src="${escapeHTML(project.backgrounds.content)}" alt="" aria-hidden="true" decoding="async">
        <img class="registry-cover__divider" src="./Вайфреймы в работу/Line.svg" width="29" height="1104" alt="" aria-hidden="true">
        <div class="registry-cover__text">
          <p class="registry__number"><span>07</span> / 10 <i aria-hidden="true"></i></p>
          <p class="eyebrow">ПРОЕКТ</p>
          <h2 id="registry-title">Реестр ЗАЛов</h2>
          <p class="registry-cover__subtitle">${escapeHTML(project.copy.subtitle)}</p>
          <p class="registry__copy">${escapeHTML(project.copy.cover)}</p>
          <ul class="registry-cover__tags" aria-label="Направления проекта">${project.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>`);
}
