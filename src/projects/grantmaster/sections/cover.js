import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';
import { siteCTA } from '../../../shared/cta.js';

export function renderCover(project) {
  return elementFromHTML(`
    <section class="grantmaster-cover grantmaster__scene" aria-labelledby="grantmaster-title">
      <img class="grantmaster__scene-image" src="${escapeHTML(project.images.cover)}" alt="Грантмастер на экране ноутбука в золотом офисе" decoding="async">
      <div class="grantmaster-cover__content">
        <p class="grantmaster-cover__index"><span>02</span><span>/</span>10</p>
        <p class="eyebrow">ПРОЕКТ</p>
        <h2 id="grantmaster-title">Грантмастер</h2>
        <p class="grantmaster-cover__subtitle">Помощник в проектировании заявок и инициатив.</p>
        <p class="grantmaster__copy">Сервис, который помогает разобраться, что именно нужно проработать в проекте, последовательно выстроить его логику и подготовить основу для сильной заявки. Объединяет методику, опыт экспертов и удобные инструменты в единую систему.</p>
        <ul class="grantmaster__tags" aria-label="Направления проекта">${project.tags.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>
        ${siteCTA(project.url)}
      </div>
    </section>`);
}
