import { imageManifest } from './image-manifest.js';

const loading = new WeakMap();
const backgrounds = new WeakMap();
const observed = new WeakSet();
let observer;
let sizesObserver;

function keyFor(source) { return decodeURI(source).replace(/^\.\//, ''); }

// Transform inert template images before they enter the document. Original
// gallery data-src values are deliberately untouched: only Lightbox uses them.
export function prepareImages(fragment) {
  fragment.querySelectorAll('img[src]').forEach(image => {
    const source = image.getAttribute('src');
    const key = keyFor(source);
    const asset = imageManifest[key];
    if (!asset) return;
    const role = image.closest('.hero-card') ? 'hero'
      : image.closest('[data-gallery-open]') ? 'thumbnail'
      : image.classList.contains('mobile-app__mockup') ? 'mockup'
      : asset.photo ? 'photo' : 'display';
    const rendition = asset[role];
    if (!rendition) throw new Error(`Missing ${role} derivative: ${source}`);
    image.dataset.imageKey = key;
    image.dataset.imageRole = role;
    image.removeAttribute('src');
    image.removeAttribute('srcset');
    image.loading = role === 'hero' ? 'eager' : 'lazy';
    const first = rendition.variants[0];
    if (!image.hasAttribute('width')) image.width = first.width;
    if (!image.hasAttribute('height')) image.height = first.height;
    const width = rendition.aspectWidth ?? first.width;
    const height = rendition.aspectHeight ?? first.height;
    if (role !== 'hero') image.style.aspectRatio = `${width} / ${height}`;
    // An inert, transparent placeholder reserves the exact aspect ratio and
    // prevents a no-src image's long alt text becoming grid min-content width.
    // It has no network transfer and disappears as soon as the rendition loads.
    image.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`)}`;
  });
}

function updateSize(image) {
  // Measured CSS pixels are independent of DPR. The browser chooses the matching
  // density from srcset; fixed CSS geometry and intrinsic master ratio stay intact.
  image.sizes = `${Math.max(1, Math.ceil(image.clientWidth))}px`;
}

export function loadImage(image) {
  if (loading.has(image)) return loading.get(image);
  const rendition = imageManifest[image.dataset.imageKey][image.dataset.imageRole];
  updateSize(image);
  image.srcset = rendition.variants.map(v => `${v.src} ${v.width}w`).join(', ');
  image.src = rendition.variants[0].src;
  const ready = image.decode().then(() => { image.dataset.imageReady = 'true'; });
  loading.set(image, ready);
  sizesObserver?.observe(image);
  return ready;
}

export function imageIsReady(image) {
  return image.dataset.imageReady === 'true' && image.complete && image.naturalWidth > 0;
}

export function setDeferredBackground(element, source, property = '--section-image') {
  const key = keyFor(source);
  const variant = imageManifest[key]?.photo?.variants[0];
  if (!variant) throw new Error(`Missing background derivative: ${source}`);
  backgrounds.set(element, { src: variant.src, property });
  element.dataset.imageBackground = key;
}

function loadBackground(element) {
  const config = backgrounds.get(element);
  if (!config || config.loading) return;
  config.loading = true;
  const image = new Image();
  image.src = config.src;
  image.decode().then(() => {
    element.style.setProperty(config.property, `url("${new URL(config.src, document.baseURI).href}")`);
    element.dataset.imageBackgroundReady = 'true';
  }).catch(error => console.error('Background failed to load', config.src, error));
}

export function mountImageLoading(root) {
  sizesObserver = new ResizeObserver(entries => entries.forEach(({ target }) => updateSize(target)));
  observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    if (backgrounds.has(element)) loadBackground(element);
    else loadImage(element).catch(error => console.error('Image failed to load', element.dataset.imageKey, error));
    observer.unobserve(element);
  }), { rootMargin: '800px 0px' });
  root.querySelectorAll('[data-image-key]:not([data-image-role="hero"]), [data-image-background]').forEach(element => {
    if (!observed.has(element)) { observed.add(element); observer.observe(element); }
  });
  // ARK is the next layer over Hero, so its cover must already be available.
  const arkCover = root.querySelector('.ark-cover');
  if (arkCover) loadBackground(arkCover);
}
