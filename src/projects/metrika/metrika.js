import { elementFromHTML } from '../../shared/dom.js';
import { metrika } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderInformation } from './sections/information.js';
import { renderScreenshots } from './sections/screenshots.js';

export function renderMetrika() {
  const project = elementFromHTML('<article class="metrika" id="project-05" aria-labelledby="metrika-title"></article>');
  [renderCover, renderInformation, renderScreenshots].forEach(render => project.append(render(metrika)));
  return project;
}
