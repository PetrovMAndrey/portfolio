import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderCollection(project) {
  return elementFromHTML(`
    <section class="svetlo-collection" aria-labelledby="svetlo-collection-title">
      <div class="svetlo-collection__intro">
        <div><p class="eyebrow">КОЛЛЕКЦИИ И КАТЕГОРИИ</p><h3 id="svetlo-collection-title">Свет, который<br>создаёт пространство.</h3></div>
        <div class="svetlo-collection__description">
          <p class="svetlo__copy">Категории, коллекции и карточки товаров дополняются крупными интерьерными сценами: покупатель видит светильник в контексте и может перейти от образа интерьера к выбору конкретного решения.</p>
          <ul class="svetlo__tags">${project.categories.map(category => `<li>${escapeHTML(category)}</li>`).join('')}</ul>
        </div>
      </div>
      <img class="svetlo-collection__image" src="${escapeHTML(project.images.collection)}" width="2232" height="705" alt="Тёплый интерьер спальни с настенными светильниками — сцена проекта SVETLO" loading="lazy" decoding="async">
    </section>`);
}
