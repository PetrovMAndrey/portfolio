import { elementFromHTML } from '../shared/dom.js';

export function renderHero() {
  return elementFromHTML(`
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__content">
        <p class="hero__name">АНДРЕЙ ПЕТРОВ</p>
        <h1 id="hero-title">Логика<br>и практика</h1>
        <p class="hero__description">Работа с задачами, в которых нужно разобраться, понять исходную ситуацию, увидеть связи, выстроить логику решения и превратить её в концепцию проекта или работающий инструмент.</p>
        <p class="hero__disciplines">Анализ · Исследования · Концепции · Проекты · Цифровые продукты · ИИ-инструменты</p>
      </div>
    </section>`);
}
