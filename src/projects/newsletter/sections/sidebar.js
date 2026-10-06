import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderSidebar(project) {
  const screen = project.images[0];
  return elementFromHTML(`
    <aside class="newsletter-sidebar" aria-label="Экран настройки выпуска Студии рассылок">
      <img class="newsletter-sidebar__screen" src="${escapeHTML(screen.src)}" width="${screen.width}" height="${screen.height}" alt="${escapeHTML(screen.alt)}" decoding="sync">
      <img class="newsletter-sidebar__line" src="./Вайфреймы в работу/Line.svg" width="29" height="1104" alt="" aria-hidden="true">
    </aside>`);
}
