import { elementFromHTML } from '../../../shared/dom.js';
import { siteCTA } from '../../../shared/cta.js';

export function renderCover(ark) {
  const section = elementFromHTML(`
    <section class="ark-cover dark-section" aria-labelledby="ark-title">
      <div class="ark-cover__content">
        <p class="project-index"><span>01</span><span class="project-index__slash">/</span>10<span class="project-index__line" aria-hidden="true"></span></p>
        <p class="eyebrow">ПРОЕКТ</p>
        <h2 id="ark-title">АРК</h2>
        <p class="ark-cover__subtitle">Анализ. Развитие. Культура.</p>
        <p class="ark-cover__description">Персональный сайт, объединяющий направления профессиональной работы, проекты и цифровые продукты в единую систему.</p>
        <ul class="project-tags" aria-label="Направления проекта"><li>Веб-сайт</li><li>Архитектура</li><li>Контент</li><li>Разработка</li></ul>
        ${siteCTA(ark.url)}
      </div>
    </section>`);
  section.style.setProperty('--section-image', `url("${new URL(ark.images.cover, document.baseURI).href}")`);
  return section;
}
