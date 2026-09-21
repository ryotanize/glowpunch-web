// Existing announcements remain readable, but only reviewed guides are indexed.
export const guideIds = ['pdf-editor', 'heic-converter', 'audio-extractor', 'audio-loudness', 'ai-psd-exporter', 'token-counter', 'browser-local-processing'];
export const isGuide = (id) => guideIds.includes(id);
export const isIndexable = (url) => {
  const path = new URL(url).pathname;
  if (path === '/404/' || path === '/404' || path === '/404.html') return false;
  const article = path.match(/^\/blog\/([^/]+)\/?$/);
  return !article || isGuide(article[1]);
};
