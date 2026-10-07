import { elementFromHTML } from '../../shared/dom.js';
import { mobile } from './data.js';
import { renderCover } from './sections/cover.js';
import { renderApp } from './sections/app.js';

export function renderMobile() {
  const project = elementFromHTML('<article class="mobile-project" id="project-10" aria-labelledby="mobile-title"></article>');
  project.append(renderCover(mobile), renderApp(mobile.apps[0]));
  const middle = elementFromHTML('<div class="mobile-project__middle"></div>');
  middle.append(renderApp(mobile.apps[1]), renderApp(mobile.apps[2]));
  project.append(middle, renderApp(mobile.apps[3]));
  return project;
}
