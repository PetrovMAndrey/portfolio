import { elementFromHTML } from '../../shared/dom.js';
import { registry } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderInformation } from './sections/information.js';
import { renderScreenshots } from './sections/screenshots.js';

export function renderRegistry() {
  const project = elementFromHTML('<article class="registry" id="project-07" aria-labelledby="registry-title"></article>');
  [renderCover, renderInformation, renderScreenshots].forEach(render => project.append(render(registry)));
  return project;
}
