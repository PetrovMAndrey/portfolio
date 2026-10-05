import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderTaskSolution(project) {
  return elementFromHTML(`
    <section class="industrial-task" aria-label="Задача и решение проекта индустриального музея">
      <div class="industrial-task__column"><p class="eyebrow">ЗАДАЧА</p><h3>Представить промышленное наследие района в цифровом формате</h3><p class="industrial__copy">${escapeHTML(project.copy.task)}</p></div>
      <div class="industrial-task__column industrial-task__solution"><p class="eyebrow">РЕШЕНИЕ</p><h3>Концепция<br>цифрового музея</h3><p class="industrial__copy">${escapeHTML(project.copy.solution)}</p></div>
      <div class="industrial-task__marker"><span aria-hidden="true">04</span><i aria-hidden="true"></i><p>${escapeHTML(project.copy.marker)}</p></div>
    </section>`);
}
