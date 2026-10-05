import { elementFromHTML } from '../../../shared/dom.js';

export function renderTaskSolution() {
  return elementFromHTML(`
    <section class="svetlo-task" aria-label="Задача и решение проекта SVETLO">
      <div class="svetlo-task__column">
        <p class="eyebrow">ЗАДАЧА</p>
        <h3>Показать коллекцию<br>в современном формате</h3>
        <p class="svetlo__copy">Соединить выбор освещения с пониманием его роли в интерьере: показать коллекции, категории и товары в контексте пространства и сделать переход к конкретному решению понятным.</p>
      </div>
      <div class="svetlo-task__column svetlo-task__solution">
        <p class="eyebrow">РЕШЕНИЕ</p>
        <h3>Готовый магазин<br>на Яндекс КИТ</h3>
        <p class="svetlo__copy">Полноценная структура интернет-магазина на Яндекс КИТ: категории, коллекции и карточки товаров дополнены крупными интерьерными сценами. Визуальная подача связывает образ пространства с выбором освещения.</p>
      </div>
      <div class="svetlo-task__marker" aria-hidden="true">
        <span>03</span><i></i><p>ИНТЕРНЕТ-МАГАЗИН<br>ОСВЕЩЕНИЯ<br>НА БАЗЕ<br>ЯНДЕКС КИТ</p>
      </div>
    </section>`);
}
