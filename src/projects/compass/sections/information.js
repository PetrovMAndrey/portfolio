import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

const icons = {
  document: '<path d="M5 2h10l4 4v16H5zM15 2v5h4M8 11h8M8 15h8M8 19h8"/>',
  building: '<rect x="4" y="2" width="12" height="20" rx="1"/><path d="M16 8h4v14H4M8 6h1m3 0h1M8 10h1m3 0h1M8 14h1m3 0h1M9 22v-4h3v4"/>',
  search: '<circle cx="10" cy="10" r="8"/><path d="m16 16 6 6"/>',
  network: '<circle cx="12" cy="4" r="3"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',
};

export function renderInformation(project) {
  return elementFromHTML(`
    <section class="compass-information paper-section" aria-label="Задача, решение и преимущества навигатора внутри организации">
      <div class="compass-information__task"><p class="eyebrow">ЗАДАЧА</p><h3>${escapeHTML(project.copy.taskTitle)}</h3><p class="compass__copy">${escapeHTML(project.copy.task)}</p></div>
      <div class="compass-information__solution"><p class="eyebrow">РЕШЕНИЕ</p><h3>${escapeHTML(project.copy.solutionTitle)}</h3><p class="compass__copy">${escapeHTML(project.copy.solution)}</p></div>
      <ul class="compass-information__features" aria-label="Преимущества сервиса">${project.features.map(feature => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[feature.icon]}</svg><div><h4>${escapeHTML(feature.title)}</h4><p>${escapeHTML(feature.text)}</p></div></li>`).join('')}</ul>
    </section>`);
}
