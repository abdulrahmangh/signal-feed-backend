# Signal Feed — backend

Scrapes and parses public Telegram channel posts on demand. No login,
no bot token — it reads the same public preview page anyone can see
in a browser at `t.me/s/<channel>`.

## Deploy (Vercel)

1. Put this folder in a repo (or a `/backend` subfolder of your project).
2. `vercel` (or connect the repo in the Vercel dashboard). No config
   needed — Vercel auto-detects `api/channel.js` as a serverless function.
3. Optional: set `OCR_SPACE_API_KEY` in the project's environment
   variables if you want text pulled out of images that have no caption.
   Get a free key at https://ocr.space/ocrapi. Without it, photo posts
   with no caption just show the image with no text overlay.

## Endpoints

`GET /api/channel?name=Alsakrandrr` — latest posts, newest first (forwarded posts skipped by default)

`GET /api/channel?name=Alsakrandrr&sinceId=6866` — only posts newer than id 6866, for the polling refresh

`GET /api/channel?name=Alsakrandrr&before=6847` — older posts than id 6847, for infinite backscroll

## Notes

- No database — each request scrapes fresh, cached at the edge for 60s
- The parser targets Telegram's current widget class names — if Telegram changes their markup this will need a small update
- Verify against your actual channel after deploying


