export function siteCTA(href, label = 'Перейти на сайт') {
  return `<a class="site-cta" href="${href}" target="_blank" rel="noopener noreferrer"><span>${label}</span><span class="site-cta__arrow" aria-hidden="true">→</span></a>`;
}
