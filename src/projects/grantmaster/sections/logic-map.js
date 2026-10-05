import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderLogicMap(project) {
  return elementFromHTML(`
    <section class="grantmaster-map grantmaster__scene" aria-labelledby="grantmaster-map-title">
      <img class="grantmaster__scene-image" src="${escapeHTML(project.images.logicMap)}" alt="Карта логики проекта на большом экране в тёплом офисе" loading="lazy" decoding="async">
      <div class="grantmaster-map__content">
        <p class="eyebrow">КАРТА ЛОГИКИ ПРОЕКТА</p>
        <h3 id="grantmaster-map-title">Проект сильнее,<br>когда его части<br>связаны между собой.</h3>
        <p class="grantmaster__copy">Карта показывает проект не как набор отдельных полей, а как единую систему: от проблемы и аудитории до реализации, результатов и ресурсов.</p>
        <div class="grantmaster-map__tags">${project.logicTags.map(row => `<ul class="grantmaster__tags">${row.map(tag => `<li>${escapeHTML(tag)}</li>`).join('')}</ul>`).join('')}</div>
      </div>
    </section>`);
}
