import { renderHero, mountHero } from './hero/hero.js';
import { renderArk } from './projects/ark/ark.js';
import { renderGrantmaster } from './projects/grantmaster/grantmaster.js';
import { renderSvetlo } from './projects/svetlo/svetlo.js';
import { renderIndustrial } from './projects/industrial/industrial.js';
import { renderMetrika } from './projects/metrika/metrika.js';
import { renderNewsletter } from './projects/newsletter/newsletter.js';
import { renderRegistry } from './projects/registry/registry.js';
import { appendProjects } from './shared/project-separator.js';
import { mountProjectNavigation } from './shared/project-navigation.js';
import { mountGallery } from './shared/gallery.js';

const landing = document.querySelector('#landing');
const projects = [
  { number: 1, target: 'project-01', label: 'АРК', render: renderArk },
  { number: 2, target: 'project-02', label: 'Грантмастер', render: renderGrantmaster },
  { number: 3, target: 'project-03', label: 'SVETLO', render: renderSvetlo },
  { number: 4, target: 'project-04', label: 'Индустриальная история', render: renderIndustrial },
  { number: 5, target: 'project-05', label: 'Агент.Метрика', render: renderMetrika },
  { number: 6, target: 'project-06', label: 'Студия рассылок', render: renderNewsletter },
  { number: 7, target: 'project-07', label: 'Реестр ЗАЛов', render: renderRegistry },
];
landing.append(renderHero());
appendProjects(landing, projects);
// Register only implemented projects. Future projects supply their own section IDs.
mountProjectNavigation(projects);
document.querySelectorAll('[data-gallery]').forEach(mountGallery);
mountHero(document.querySelector('.hero'));
