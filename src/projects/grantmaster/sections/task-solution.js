import { elementFromHTML } from '../../../shared/dom.js';

export function renderTaskSolution() {
  return elementFromHTML(`
    <section class="grantmaster-task" aria-label="Задача и решение Грантмастера">
      <div class="grantmaster-task__column">
        <p class="eyebrow">ЗАДАЧА</p>
        <h3>Упростить подготовку проектных заявок</h3>
        <p class="grantmaster__copy">Создать понятный инструмент, который помогает последовательно пройти путь от первоначальной идеи до целостного проекта — без необходимости сразу разбираться во всех требованиях конкурсов и грантовых форм.</p>
      </div>
      <div class="grantmaster-task__column grantmaster-task__solution">
        <p class="eyebrow">РЕШЕНИЕ</p>
        <h3>Единая система проектной логики</h3>
        <p class="grantmaster__copy">Цифровой помощник, который объединяет методику, образовательные материалы и пошаговый конструктор. Пользователь сначала понимает логику каждого раздела, затем заполняет его и постепенно собирает целостную модель проекта.</p>
      </div>
      <div class="grantmaster-task__marker">
        <span aria-hidden="true">02</span>
        <p>ЦИФРОВОЙ<br>ПОМОЩНИК<br>ДЛЯ ПРОЕКТНЫХ<br>ИНИЦИАТИВ</p>
      </div>
    </section>`);
}
