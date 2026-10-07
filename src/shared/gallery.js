import { createLightbox } from './lightbox.js';

export function mountGallery(gallery) {
  const previews = [...gallery.querySelectorAll('[data-src]')];
  const images = previews.map(preview => ({
    src: preview.dataset.src,
    title: preview.dataset.title,
    alt: preview.querySelector('img').alt,
  }));
  const lightbox = createLightbox(images);
  // One decorative cue per gallery; the existing preview remains the click target.
  const firstPreview = previews[0];
  if (firstPreview && !firstPreview.querySelector('.gallery-lightbox-indicator')) {
    const indicator = document.createElement('span');
    indicator.className = 'gallery-lightbox-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    firstPreview.append(indicator);
  }
  gallery.addEventListener('click', event => {
    const trigger = event.target.closest('[data-gallery-open]');
    if (trigger) lightbox.open(Number(trigger.dataset.galleryOpen), trigger);
  });
}
