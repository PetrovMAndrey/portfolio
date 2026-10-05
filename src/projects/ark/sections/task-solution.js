import { elementFromHTML } from '../../../shared/dom.js';

export function renderTaskSolution() {
  return elementFromHTML(`
    <section class="ark-task paper-section" aria-label="Задача и решение">
      <div class="ark-task__column">
        <p class="eyebrow">ЗАДАЧА</p>
        <h3>Собрать<br>разрозненные<br>направления</h3>
        <p>Показать профессиональную деятельность, проекты и цифровые продукты в единой, понятной и структурированной форме.</p>
      </div>
      <div class="ark-task__column ark-task__solution">
        <p class="eyebrow">РЕШЕНИЕ</p>
        <h3>Единая цифровая<br>платформа</h3>
        <p>Персональный сайт с собственной архитектурой, системой проектов и единым визуальным языком, отражающим подход «Логика и практика».</p>
      </div>
      <div class="ark-task__aside">
        <span class="ark-task__number" aria-hidden="true">01</span>
        <p>ОДНА ПЛАТФОРМА<br>ДЛЯ ПРОЕКТОВ,<br>ПРОДУКТОВ<br>И ИДЕЙ</p>
      </div>
    </section>`);
}
