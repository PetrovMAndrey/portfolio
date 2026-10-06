import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

const icons = {
  indicators: '<path d="M5 21v-5m7 5V9m7 12V3" stroke-width="5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18M7 15h2m6 0h2m-10 3h2m6 0h2"/>',
  content: '<path d="M14 2H5v20h14V7zM14 2v6h5M8 12h8m-8 4h8"/>',
  report: '<path d="M4 3h16v18H4zM8 8h8m-8 4h8m-8 4h5"/>',
};

export function renderInformation(project) {
  return elementFromHTML(`
    <section class="metrika-information paper-section" aria-label="Задача, решение и возможности сервиса">
      <div class="metrika-information__task"><p class="eyebrow">ЗАДАЧА</p><h3>${escapeHTML(project.copy.taskTitle)}</h3><p class="metrika__copy">${escapeHTML(project.copy.task)}</p></div>
      <div class="metrika-information__solution"><p class="eyebrow">РЕШЕНИЕ</p><h3>Агент.Метрика</h3><p class="metrika__copy">${escapeHTML(project.copy.solution)}</p></div>
      <ul class="metrika-information__features" aria-label="Возможности сервиса">${project.features.map(feature => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[feature.icon]}</svg><div><h4>${escapeHTML(feature.title)}</h4><p>${escapeHTML(feature.text)}</p></div></li>`).join('')}</ul>
    </section>`);
}
