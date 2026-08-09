// Runs only for photo posts that came back with no caption —
// the common case (a caption already exists) never touches this.
//
// Uses the OCR.space free API (no server setup, generous free tier,
// good enough for pulling text out of screenshots/graphics). Get a
// free key at https://ocr.space/ocrapi and set OCR_SPACE_API_KEY.
// If no key is set, this quietly no-ops and the post just has no text.

export async function extractTextFromImage(imageUrl) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      url: imageUrl,
      language: "eng",
      OCREngine: "2",
    });

    const res = await fetch(`https://api.ocr.space/parse/imageurl?${params}`);
    const data = await res.json();
    const text = data?.ParsedResults?.[0]?.ParsedText?.trim();
    return text || null;
  } catch (err) {
    console.error("OCR failed:", err.message);
    return null;
  }
}
