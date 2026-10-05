import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';
import { siteCTA } from '../../../shared/cta.js';

export function renderResult(project) {
  return elementFromHTML(`
    <section class="grantmaster-result grantmaster__scene" aria-labelledby="grantmaster-result-title">
      <img class="grantmaster__scene-image" src="${escapeHTML(project.images.result)}" alt="Золотой закат за окнами конференц-зала" loading="lazy" decoding="async">
      <div class="grantmaster-result__content">
        <p class="eyebrow">РЕЗУЛЬТАТ</p>
        <h3 id="grantmaster-result-title">Больше сильных<br>проектов и инициатив</h3>
        <p class="grantmaster__copy">«Грантмастер» помогает превратить первоначальную идею в понятный, логически связанный и аргументированный проект, который можно использовать как основу для подготовки заявки.</p>
      </div>
      <div class="grantmaster-result__action">${siteCTA(project.url)}</div>
    </section>`);
}
