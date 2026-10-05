import { elementFromHTML } from '../../../shared/dom.js';

export function renderTaskSolution() {
  return elementFromHTML(`
    <section class="ark-task paper-section" aria-label="Задача и решение">
      <div class="ark-task__column">
        <p class="eyebrow">ЗАДАЧА</p>
        <h3>Объединить направления в единую систему</h3>
        <p>Собрать профессиональную экспертизу, проекты и собственные цифровые продукты в одной среде — с понятной структурой и возможностью развивать каждое направление независимо.</p>
      </div>
      <div class="ark-task__column ark-task__solution">
        <p class="eyebrow">РЕШЕНИЕ</p>
        <h3>Единая цифровая<br>платформа</h3>
        <p>Разработана собственная структура АРК: профессиональные направления, портфолио проектов и отдельный контур цифровых продуктов объединены общей навигацией и визуальной системой.</p>
      </div>
      <div class="ark-task__aside">
        <span class="ark-task__number" aria-hidden="true">01</span>
        <p>ОДНА СРЕДА<br>ДЛЯ ЭКСПЕРТИЗЫ,<br>ПРОЕКТОВ<br>И ПРОДУКТОВ</p>
      </div>
    </section>`);
}
