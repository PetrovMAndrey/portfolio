import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderInformation(project) {
  return elementFromHTML(`
    <section class="newsletter-information paper-section" aria-label="Задача, решение и преимущества Студии рассылок">
      <div class="newsletter-information__task"><p class="eyebrow">ЗАДАЧА</p><h3>${escapeHTML(project.copy.taskTitle)}</h3>${project.copy.task.map(text => `<p class="newsletter__copy">${escapeHTML(text)}</p>`).join('')}</div>
      <div class="newsletter-information__solution"><p class="eyebrow">РЕШЕНИЕ</p><h3>Студия рассылок</h3>${project.copy.solution.map(text => `<p class="newsletter__copy">${escapeHTML(text)}</p>`).join('')}</div>
      <ul class="newsletter-information__features" aria-label="Преимущества сервиса">${project.features.map(feature => `<li><span class="newsletter-information__accent" aria-hidden="true"></span><div><h4>${escapeHTML(feature.title)}</h4><p>${escapeHTML(feature.text)}</p></div></li>`).join('')}</ul>
    </section>`);
}
