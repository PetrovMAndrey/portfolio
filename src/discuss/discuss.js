import { elementFromHTML, escapeHTML } from '../shared/dom.js';
import { discuss } from './data.js';

export function renderDiscuss() {
  return elementFromHTML(`
    <section class="discuss" id="discuss" aria-labelledby="discuss-title">
      <img class="discuss__background" src="${escapeHTML(discuss.background)}" width="1672" height="941" alt="" aria-hidden="true" loading="lazy" decoding="async">
      <div class="discuss__content">
        <p class="discuss__label eyebrow"><span aria-hidden="true"></span>ОБСУДИТЬ</p>
        <h2 id="discuss-title">${escapeHTML(discuss.name)}</h2>
        <p class="discuss__subtitle">${escapeHTML(discuss.subtitle)}</p>
        <div class="discuss__body">${discuss.paragraphs.map(text => `<p>${escapeHTML(text)}</p>`).join('')}</div>
        <p class="discuss__invitation">Есть задача или идея?<span>Давайте обсудим.</span></p>
        <div class="discuss__contacts" aria-label="Связаться с Андреем Петровым">
          <div class="discuss__contact-item">
          <a class="discuss__contact" href="${escapeHTML(discuss.telegram)}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 3-4 18-6-5-3 3 1-6L22 3 2 11l8 2m2 3 10-13"/></svg><span>Telegram</span><span class="discuss__arrow" aria-hidden="true">↗</span></a>
            <p class="discuss__contact-detail">${escapeHTML(discuss.telegramUsername)}</p>
          </div>
          <div class="discuss__contact-item">
            <a class="discuss__contact" href="${escapeHTML(discuss.email)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></svg><span>E-mail</span><span class="discuss__arrow" aria-hidden="true">↗</span></a>
            <p class="discuss__contact-detail">${escapeHTML(discuss.emailAddress)}</p>
          </div>
        </div>
      </div>
      <p class="discuss__decoration" aria-hidden="true"><span>Есть</span><span>что</span><span>обсудить?</span></p>
    </section>`);
}
