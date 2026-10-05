import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderResult(project) {
  return elementFromHTML(`
    <section class="industrial-result" aria-labelledby="industrial-result-title">
      <img class="industrial-result__image" src="${escapeHTML(project.images.result)}" alt="Стальной мост на закате над рекой" loading="lazy" decoding="async">
      <div class="industrial-result__content"><p class="eyebrow">РЕЗУЛЬТАТ</p><h3 id="industrial-result-title">Цифровая среда<br>для истории района</h3><p class="industrial__copy">${escapeHTML(project.copy.result)}</p></div>
    </section>`);
}
