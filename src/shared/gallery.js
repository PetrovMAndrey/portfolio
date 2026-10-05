import { createLightbox } from './lightbox.js';

export function mountGallery(gallery) {
  const previews = [...gallery.querySelectorAll('[data-src]')];
  const images = previews.map(preview => ({
    src: preview.dataset.src,
    title: preview.dataset.title,
    alt: preview.querySelector('img').alt,
  }));
  const lightbox = createLightbox(images);
  gallery.addEventListener('click', event => {
    const trigger = event.target.closest('[data-gallery-open]');
    if (trigger) lightbox.open(Number(trigger.dataset.galleryOpen), trigger);
  });
}
