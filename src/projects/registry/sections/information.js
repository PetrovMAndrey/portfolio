import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderInformation(project) {
  return elementFromHTML(`
    <section class="registry-information paper-section" aria-label="Задача, решение и преимущества Реестра ЗАЛов">
      <div class="registry-information__task"><p class="eyebrow">ЗАДАЧА</p><h3>${escapeHTML(project.copy.taskTitle)}<span class="registry-information__context">${escapeHTML(project.copy.taskContext)}</span></h3><p class="registry__copy">${escapeHTML(project.copy.task)}</p></div>
      <div class="registry-information__solution"><p class="eyebrow">РЕШЕНИЕ</p><h3>Реестр ЗАЛов</h3><p class="registry__copy">${escapeHTML(project.copy.solution)}</p></div>
      <ul class="registry-information__features" aria-label="Преимущества приложения">${project.features.map(feature => `<li><span class="registry-information__accent" aria-hidden="true"></span><div><h4>${escapeHTML(feature.title)}</h4><p>${escapeHTML(feature.text)}</p></div></li>`).join('')}</ul>
    </section>`);
}
