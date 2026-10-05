import { elementFromHTML } from '../../shared/dom.js';
import { grantmaster } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderTaskSolution } from './sections/task-solution.js';
import { renderLogicMap } from './sections/logic-map.js';
import { renderTools } from './sections/tools.js';
import { renderResult } from './sections/result.js';

export function renderGrantmaster() {
  const project = elementFromHTML('<article class="grantmaster" id="project-02" aria-labelledby="grantmaster-title"></article>');
  [renderCover, renderTaskSolution, renderLogicMap, renderTools, renderResult]
    .forEach(render => project.append(render(grantmaster)));
  return project;
}
