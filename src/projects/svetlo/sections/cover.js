import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderCover(project) {
  return elementFromHTML(`
    <section class="svetlo-cover" aria-labelledby="svetlo-title">
      <img class="svetlo-cover__image" src="${escapeHTML(project.images.cover)}" alt="SVETLO на планшете в тёплом светлом интерьере" decoding="async">
      <div class="svetlo-cover__content">
        <p class="svetlo__number"><span>03</span> / 10 <i aria-hidden="true"></i></p>
        <p class="eyebrow">ПРОЕКТ</p>
        <h2 id="svetlo-title">SVETLO</h2>
        <p class="svetlo-cover__subtitle">Интернет-магазин премиального интерьерного освещения, созданный на Яндекс КИТ.</p>
        <p class="svetlo__copy">Проект показывает, как можно соединить полноценную структуру интернет-магазина с визуальной подачей, в которой свет рассматривается не только как товар, но и как часть пространства.</p>
        <ul class="svetlo__tags">${project.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
      </div>
    </section>`);
}
