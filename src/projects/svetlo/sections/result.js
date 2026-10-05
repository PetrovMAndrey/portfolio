import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderResult(project) {
  return elementFromHTML(`
    <section class="svetlo-result" aria-labelledby="svetlo-result-title">
      <img class="svetlo-result__image" src="${escapeHTML(project.images.result)}" alt="Интерьер SVETLO с креслом и скульптурным напольным светильником" loading="lazy" decoding="async">
      <div class="svetlo-result__content"><p class="eyebrow">РЕЗУЛЬТАТ</p><h3 id="svetlo-result-title">Стильный магазин<br>для вдохновения<br>и продаж</h3><p class="svetlo__copy">Готовый пример современного интернет-магазина освещения, который демонстрирует возможности Яндекс КИТ и может использоваться как портфолио для витрин платформы.</p></div>
    </section>`);
}
