import { elementFromHTML } from '../../shared/dom.js';
import { ark } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderTaskSolution } from './sections/task-solution.js';
import { renderVisual } from './sections/visual.js';
import { renderScreenshots } from './sections/screenshots.js';
import { renderResult } from './sections/result.js';

export function renderArk() {
  const project = elementFromHTML('<article class="ark" id="project-01" aria-labelledby="ark-title"></article>');
  [renderCover, renderTaskSolution, renderVisual, renderScreenshots, renderResult]
    .forEach(render => project.append(render(ark)));
  return project;
}
