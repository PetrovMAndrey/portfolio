import { elementFromHTML, escapeHTML } from './dom.js';

export function mountProjectNavigation(projects, total = 10) {
  const available = new Map(projects.map(project => [project.number, project]));
  const titles = ['АРК', 'Грантмастер', 'SVETLO', 'Индустриальная история', 'Агент.Метрика', 'Студия рассылок', 'Реестр ЗАЛов', '8 филиалов', 'Рабочий компас', 'Мобильные приложения'];
  const navigation = elementFromHTML(`<nav class="project-navigation" tabindex="0" aria-label="Навигация по проектам"><ol><li><a class="project-navigation__service" href="#hero">Главная</a></li>${Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    const label = String(number).padStart(2, '0');
    const project = available.get(number);
    const title = escapeHTML(project?.label || titles[index] || `Проект ${label}`);
    const content = `<span class="project-navigation__number">${label}</span><span class="project-navigation__name">${title}</span>`;
    return `<li>${project ? `<a href="#${escapeHTML(project.target)}" aria-label="Проект ${label}: ${title}" ${number === 1 ? 'aria-current="location"' : ''}>${content}</a>` : `<span class="project-navigation__unavailable" aria-disabled="true" aria-label="Проект ${label}: ${title}, пока недоступен">${content}</span>`}</li>`;
  }).join('')}<li><a class="project-navigation__service" href="#discuss">Обсудить</a></li></ol></nav>`);
  document.body.append(navigation);
  const onNavigate = event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(history.state, '', link.hash);
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    // Sticky Hero remains at the viewport edge; Home must return to document start.
    if (link.hash === '#hero') window.scrollTo({ top: 0, behavior });
    else target.scrollIntoView({ behavior });
  };
  navigation.addEventListener('click', onNavigate);
  let pointerFocus = false;
  const onPointerDown = event => {
    pointerFocus = navigation.contains(event.target);
    if (pointerFocus) navigation.focus({ preventScroll: true });
    else if (navigation.contains(document.activeElement)) document.activeElement.blur();
  };
  const onPointerLeave = () => {
    if (pointerFocus && navigation.contains(document.activeElement)) document.activeElement.blur();
    pointerFocus = false;
  };
  document.addEventListener('pointerdown', onPointerDown);
  navigation.addEventListener('pointerleave', onPointerLeave);
  navigation.addEventListener('keydown', event => {
    pointerFocus = false;
    if (event.key === 'Escape') document.activeElement.blur();
  });
  const sections = [document.getElementById('hero'), ...projects.map(project => document.getElementById(project.target)), document.getElementById('discuss')].filter(Boolean);
  let frame = 0;
  function updateActiveProject() {
    frame = 0;
    // Recompute actual boundaries even when scrolling jumps across large articles.
    let active = sections[0];
    const readingLine = Math.min(160, window.innerHeight * .15);
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine || (section.id === 'discuss' && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2)) active = section;
    }
    navigation.querySelectorAll('a').forEach(link => {
      if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  const scheduleUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateActiveProject);
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  const observer = new ResizeObserver(scheduleUpdate);
  sections.forEach(section => observer.observe(section));
  updateActiveProject();
  return () => {
    observer.disconnect(); cancelAnimationFrame(frame);
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', scheduleUpdate);
    document.removeEventListener('pointerdown', onPointerDown);
    navigation.removeEventListener('pointerleave', onPointerLeave);
    navigation.removeEventListener('click', onNavigate); navigation.remove();
  };
}
