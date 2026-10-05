import { elementFromHTML } from '../../shared/dom.js';
import { svetlo } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderTaskSolution } from './sections/task-solution.js';
import { renderCollection } from './sections/collection.js';
import { renderScreenshots } from './sections/screenshots.js';
import { renderResult } from './sections/result.js';

export function renderSvetlo() {
  const project = elementFromHTML('<article class="svetlo" id="project-03" aria-labelledby="svetlo-title"></article>');
  [renderCover, renderTaskSolution, renderCollection, renderScreenshots, renderResult]
    .forEach(render => project.append(render(svetlo)));
  return project;
}
