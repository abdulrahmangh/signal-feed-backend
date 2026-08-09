// Parses the HTML of https://t.me/s/<channel>[?before=<id>]
// into a clean array of post objects. Telegram's web preview
// (the "instant view" widget) uses a stable set of class names —
// this targets those directly with cheerio rather than a headless
// browser, so it's fast and cheap to run on every request.

import * as cheerio from "cheerio";

/**
 * @param {string} html - raw HTML from t.me/s/<channel>
 * @param {object} opts
 * @param {boolean} opts.skipForwarded - drop posts forwarded from other channels
 * @returns {{ posts: Array, oldestId: number|null }}
 */
export function parseChannelHtml(html, { skipForwarded = true } = {}) {
  const $ = cheerio.load(html);
  const posts = [];
  let oldestId = null;

  $(".tgme_widget_message_wrap").each((_, el) => {
    const msg = $(el).find(".tgme_widget_message").first();
    const dataPost = msg.attr("data-post"); // e.g. "Alsakrandrr/6866"
    if (!dataPost) return;

    const id = parseInt(dataPost.split("/").pop(), 10);
    if (Number.isFinite(id)) {
      oldestId = oldestId === null ? id : Math.min(oldestId, id);
    }

    const isForwarded = msg.find(".tgme_widget_message_forwarded_from").length > 0;
    if (isForwarded && skipForwarded) return;

    const textEl = msg.find(".tgme_widget_message_text").first();
    textEl.find("br").replaceWith("\n");
    const text = textEl.text().trim() || null;

    const photoEl = msg.find(".tgme_widget_message_photo_wrap").first();
    let imageUrl = null;
    if (photoEl.length) {
      const style = photoEl.attr("style") || "";
      const match = style.match(/url\(['"]?(.*?)['"]?\)/);
      if (match) imageUrl = match[1];
    }

    const timeEl = msg.find("time.time").first();
    const datetime = timeEl.attr("datetime") || null;

    const viewsEl = msg.find(".tgme_widget_message_views").first();
    const viewsRaw = viewsEl.text().trim() || null;

    posts.push({
      id,
      permalink: `https://t.me/${dataPost}`,
      type: imageUrl ? "photo" : "text",
      text: imageUrl ? null : text,
      caption: imageUrl ? text : null,
      imageUrl,
      time: datetime,
      viewsRaw,
      views: parseViews(viewsRaw),
      forwarded: isForwarded,
    });
  });

  return { posts, oldestId };
}

function parseViews(raw) {
  if (!raw) return null;
  const m = raw.trim().match(/^([\d.]+)([KM]?)$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const mult = m[2].toUpperCase() === "K" ? 1e3 : m[2].toUpperCase() === "M" ? 1e6 : 1;
  return Math.round(n * mult);
}
