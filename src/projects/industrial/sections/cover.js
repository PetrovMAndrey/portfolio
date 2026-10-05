import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderCover(project) {
  return elementFromHTML(`
    <section class="industrial-cover" aria-labelledby="industrial-title">
      <img class="industrial-cover__image" src="${escapeHTML(project.images.cover)}" alt="Индустриальный архив на закате с прототипом цифрового музея на мониторе" decoding="async">
      <div class="industrial-cover__content">
        <p class="industrial__number"><span>04</span> / 10 <i aria-hidden="true"></i></p>
        <p class="eyebrow">ПРОЕКТ</p>
        <h2 id="industrial-title">Индустриальный музей<br><span>Красногвардейского<br>района</span></h2>
        <p class="industrial__copy">${escapeHTML(project.copy.cover)}</p>
      </div>
    </section>`);
}
