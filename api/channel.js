// GET /api/channel?name=Alsakrandrr
//   -> latest posts (for polling: pass &sinceId=<id> to get only newer ones)
// GET /api/channel?name=Alsakrandrr&before=6847
//   -> older posts (for infinite backscroll)
//
// This scrapes t.me/s/<name> live on each request, with a short
// edge cache (60s) so bursts of client polling don't hammer Telegram.
// No database needed for the MVP — add one later if you want to
// keep a permanent archive instead of always fetching fresh.

import { parseChannelHtml } from "../lib/parse.js";
import { extractTextFromImage } from "../lib/ocr.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  const { name, before, sinceId, skipForwarded = "true" } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Missing required query param: name" });
  }

  const url = new URL(`https://t.me/s/${encodeURIComponent(name)}`);
  if (before) url.searchParams.set("before", before);

  let html;
  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SignalFeedBot/1.0)" },
    });
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `Telegram returned ${upstream.status} for @${name}` });
    }
    html = await upstream.text();
  } catch (err) {
    return res.status(502).json({ error: `Failed to reach Telegram: ${err.message}` });
  }

  let { posts, oldestId } = parseChannelHtml(html, {
    skipForwarded: skipForwarded !== "false",
  });

  // Newest-first, matching how the feed should scroll
  posts.reverse();
    // Skip stickers/empty posts (no text and no image) and skip
  // personal/announcement-style posts (graduations, weddings, etc.)
  // and posts written mostly in English.
  const PERSONAL_KEYWORDS = ["أعلن", "تخرج", "تخرجي", "زواج", "زفاف", "خطبتي", "مولود", "ولادة", "بمعدل", "بتقدير", "البكالوريوس"];
  function isEnglish(text) {
    if (!text) return false;
    const letters = text.replace(/[^a-zA-Z\u0600-\u06FF]/g, "");
    if (!letters.length) return false;
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
    return englishCount / letters.length > 0.5;
  }
  posts = posts.filter(function (p) {
    const content = p.text || p.caption || "";
    if (!content && !p.imageUrl) return false; // stickers / empty posts
    if (isEnglish(content)) return false;
    if (PERSONAL_KEYWORDS.some(function (kw) { return content.indexOf(kw) !== -1; })) return false;
    return true;
  });


  if (sinceId) {
    const cutoff = parseInt(sinceId, 10);
    posts = posts.filter((p) => p.id > cutoff);
  }

  // OCR fallback: only for photo posts with no caption at all,
  // and only a handful per request to keep response time reasonable.
  const needsOcr = posts.filter((p) => p.type === "photo" && !p.caption).slice(0, 5);
  await Promise.all(
    needsOcr.map(async (p) => {
      p.caption = await extractTextFromImage(p.imageUrl);
    })
  );

  res.status(200).json({
    channel: name,
    posts,
    oldestId,
    fetchedAt: new Date().toISOString(),
  });
}
