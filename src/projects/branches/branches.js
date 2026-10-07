import { elementFromHTML } from '../../shared/dom.js';
import { branches } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderInformation } from './sections/information.js';
import { renderScreenshots } from './sections/screenshots.js';

export function renderBranches() {
  const project = elementFromHTML('<article class="branches" id="project-08" aria-labelledby="branches-title"></article>');
  [renderCover, renderInformation, renderScreenshots].forEach(render => project.append(render(branches)));
  return project;
}
