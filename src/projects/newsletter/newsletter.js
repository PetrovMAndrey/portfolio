import { elementFromHTML } from '../../shared/dom.js';
import { newsletter } from './data.js';
import { renderSidebar } from './sections/sidebar.js';
import { renderCover } from './sections/cover.js';
import { renderInformation } from './sections/information.js';
import { renderScreenshots } from './sections/screenshots.js';

export function renderNewsletter() {
  const project = elementFromHTML('<article class="newsletter" id="project-06" aria-labelledby="newsletter-title"></article>');
  const sections = elementFromHTML('<div class="newsletter__sections"></div>');
  [renderCover, renderInformation, renderScreenshots].forEach(render => sections.append(render(newsletter)));
  project.append(renderSidebar(newsletter), sections);
  return project;
}
