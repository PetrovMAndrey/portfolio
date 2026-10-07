import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

const icons = {
  overview: '<path d="M5 21v-5m7 5V9m7 12V3" stroke-width="5"/>',
  report: '<rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 2h6v5H9zM8 11h2m3 0h3m-8 4h2m3 0h3m-8 4h2m3 0h3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  network: '<circle cx="12" cy="4" r="3"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',
};

export function renderInformation(project) {
  return elementFromHTML(`
    <section class="branches-information paper-section" aria-label="Задача, решение и преимущества сервиса управления филиалами">
      <div class="branches-information__task"><p class="eyebrow">ЗАДАЧА</p><h3>${escapeHTML(project.copy.taskTitle)}</h3><p class="branches__copy">${escapeHTML(project.copy.task)}</p></div>
      <div class="branches-information__solution"><p class="eyebrow">РЕШЕНИЕ</p><h3>${escapeHTML(project.copy.solutionTitle)}</h3><p class="branches__copy">${escapeHTML(project.copy.solution)}</p></div>
      <ul class="branches-information__features" aria-label="Преимущества сервиса">${project.features.map(feature => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[feature.icon]}</svg><div><h4>${escapeHTML(feature.title)}</h4><p>${escapeHTML(feature.text)}</p></div></li>`).join('')}</ul>
    </section>`);
}
