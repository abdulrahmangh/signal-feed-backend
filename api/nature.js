// GET /api/nature — returns a random real nature/landscape photo URL,
// sourced from Pexels' curated nature category.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");


  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "PEXELS_API_KEY not set" });
  }

  const page = Math.floor(Math.random() * 50) + 1;

  try {
    const upstream = await fetch(
      `https://api.pexels.com/v1/search?query=nature%20landscape&per_page=1&page=${page}&orientation=portrait`,
      { headers: { Authorization: apiKey } }
    );
    const data = await upstream.json();
    const photo = data.photos && data.photos[0];
    if (!photo) return res.status(404).json({ error: "No photo found" });

    res.status(200).json({ url: photo.src.portrait });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Pexels: " + err.message });
  }
}
