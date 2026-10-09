import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';
import { setDeferredBackground } from '../../../shared/images.js';

export function renderCover(project) {
  const screen = project.gallery[0];
  const section = elementFromHTML(`
    <section class="metrika-cover dark-section" aria-labelledby="metrika-title">
      <div class="metrika-cover__content">
        <p class="metrika__number"><span>05</span> / 10 <i aria-hidden="true"></i></p>
        <p class="eyebrow">ПРОЕКТ</p>
        <h2 id="metrika-title">Агент.Метрика</h2>
        <p class="metrika-cover__subtitle">Помощник исследователя<br>цифровых фондов</p>
        <p class="metrika__copy">${escapeHTML(project.copy.cover)}</p>
        <ul class="metrika-cover__tags" aria-label="Направления проекта">${project.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
      </div>
      <div class="metrika-cover__visual"><img class="metrika-cover__divider" src="./Вайфреймы в работу/Line.svg" width="29" height="1104" alt="" aria-hidden="true"><img class="metrika-cover__screen" src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" decoding="sync"></div>
    </section>`);
  setDeferredBackground(section, './REFERENCES/05_Агент.Метрика/Кинематографичный интерьер с солнечными тенями.png', '--metrika-image');
  return section;
}
