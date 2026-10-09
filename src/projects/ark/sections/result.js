import { setDeferredBackground } from '../../../shared/images.js';
import { elementFromHTML } from '../../../shared/dom.js';
import { siteCTA } from '../../../shared/cta.js';

export function renderResult(ark) {
  const section = elementFromHTML(`
    <section class="ark-result dark-section" aria-labelledby="ark-result-title">
      <div><p class="eyebrow">РЕЗУЛЬТАТ</p><h3 id="ark-result-title">Единая профессиональная среда.<br>Проекты и продукты в одной системе.<br>Платформа для дальнейшего развития.</h3></div>
      <div class="ark-result__links">${siteCTA(ark.url)}</div>
    </section>`);
  setDeferredBackground(section, ark.images.result);
  return section;
}
