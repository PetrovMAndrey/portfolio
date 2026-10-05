// Bind short Russian function words to the next word without adding line breaks.
// Unicode word boundaries avoid changing parts of words and hyphenated names.
export function nonBreakingText(value) {
  return String(value).replace(
    /(?<![\p{L}\p{N}_-])(?:а|и|но|да|или|либо|как|что|чем|то|в|во|к|ко|с|со|у|о|об|обо|от|до|по|из|из-за|из-под|за|на|над|под|при|без|для|про|не|ни|же|бы|ли)[ \t]+(?=\S)/giu,
    match => match.trimEnd() + '\u00a0',
  );
}

export function elementFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  // Only visible text changes: URLs, attributes, image paths and markup stay intact.
  const textNodes = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  while (textNodes.nextNode()) {
    const node = textNodes.currentNode;
    if (!node.parentElement?.closest('script, style')) node.data = nonBreakingText(node.data);
  }
  return template.content.firstElementChild;
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}
