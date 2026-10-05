import { elementFromHTML, escapeHTML } from '../../../shared/dom.js';

export function renderTools(project) {
  return elementFromHTML(`
    <section class="grantmaster-tools interface-section" data-gallery aria-labelledby="grantmaster-tools-title">
      <div class="grantmaster-tools__intro">
        <p class="eyebrow interface-section__label" id="grantmaster-tools-title">ИНТЕРФЕЙС И РАЗДЕЛЫ</p>
        <p class="grantmaster__copy">«Грантмастер» сочетает обучение и практическую работу: объясняет логику каждого раздела, показывает сильные и слабые примеры и помогает последовательно собрать проект в единую систему.</p>
      </div>
      <div class="grantmaster-tools__screenshots">
        <div class="grantmaster-tools__previews">${project.gallery.map((item, index) => `<figure class="grantmaster-tools__item"><button class="grantmaster-tools__preview" type="button" data-gallery-open="${index}" data-src="${escapeHTML(item.src)}" data-title="${escapeHTML(item.title)}" aria-label="Открыть скриншот: ${escapeHTML(item.title)}"><img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.alt)}" loading="lazy" decoding="async"></button><figcaption>${escapeHTML(item.title)}</figcaption></figure>`).join('')}</div>
      </div>
    </section>`);
}
