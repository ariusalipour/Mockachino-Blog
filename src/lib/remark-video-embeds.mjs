/** Turn the site's preserved VIDEO comments into explicit, allowlisted embeds. */
export function parseVideoComment(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^<!--\s*VIDEO:\s*([\s\S]*?)\s*-->$/);
  if (!match) return null;
  // Imported video titles may themselves contain a pipe, so split at the last one.
  const separator = match[1].lastIndexOf(' | ');
  if (separator < 0) return null;
  const title = match[1].slice(0, separator).trim();
  const src = match[1].slice(separator + 3).trim();
  let url;
  try { url = new URL(src); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!['youtube.com', 'youtube-nocookie.com', 'giphy.com'].includes(host)) return null;
  if (!/^\/embed\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return null;
  return { title: title || 'Embedded video', src, provider: host === 'giphy.com' ? 'giphy' : 'youtube' };
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export default function remarkVideoEmbeds() {
  return function transform(tree) {
    function visit(node) {
      if (node.type === 'html') {
        const video = parseVideoComment(node.value);
        if (video) {
          const title = escapeHtml(video.title);
          node.value = `<figure class="video-embed" data-embed-provider="${video.provider}"><iframe src="${escapeHtml(video.src)}" title="${title}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><figcaption>${title}</figcaption></figure>`;
        }
      }
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
  };
}
