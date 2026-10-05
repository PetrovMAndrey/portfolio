import { elementFromHTML } from '../../shared/dom.js';
import { industrial } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderTaskSolution } from './sections/task-solution.js';
import { renderHistory } from './sections/history.js';
import { renderScreenshots } from './sections/screenshots.js';
import { renderResult } from './sections/result.js';

export function renderIndustrial() {
  const project = elementFromHTML('<article class="industrial" id="project-04" aria-labelledby="industrial-title"></article>');
  [renderCover, renderTaskSolution, renderHistory, renderScreenshots, renderResult]
    .forEach(render => project.append(render(industrial)));
  return project;
}
