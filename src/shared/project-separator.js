import { elementFromHTML } from './dom.js';

export function renderProjectSeparator() {
  return elementFromHTML('<div class="project-separator" aria-hidden="true"><img src="./Вайфреймы в работу/Разделитель.svg" width="5506" height="70" alt="" decoding="async"></div>');
}

// Keep the separator outside project modules and insert it at every project boundary.
export function appendProjects(container, projects) {
  projects.forEach((project, index) => {
    if (index > 0) container.append(renderProjectSeparator());
    container.append(project.render());
  });
}
