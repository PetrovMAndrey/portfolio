import { elementFromHTML } from '../../shared/dom.js';
import { compass } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderInformation } from './sections/information.js';
import { renderScreenshots } from './sections/screenshots.js';

export function renderCompass() {
  const project = elementFromHTML('<article class="compass" id="project-09" aria-labelledby="compass-title"></article>');
  [renderCover, renderInformation, renderScreenshots].forEach(render => project.append(render(compass)));
  return project;
}
