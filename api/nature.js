// GET /api/nature — returns a random real nature/landscape photo URL,
// sourced from Pexels' curated nature category.
// Uses a rotating list of specific nature scene types for variety,
// restricted to purely natural subjects — no buildings, roads, or other
// human-made structures, and only animal types known to be appropriate.

const NATURE_QUERIES = [
  "forest canopy trees",
  "ocean waves aerial",
  "mountain range clouds",
  "waterfall rainforest",
  "desert dunes wind",
  "northern lights sky",
  "deer forest wildlife",
  "eagle flying wildlife",
  "horses running field",
  "dolphin ocean wildlife",
  "coral reef underwater",
  "misty forest morning",
  "river rapids nature",
  "autumn forest leaves",
  "snow mountain peak",
  "tropical jungle canopy",
  "starry night sky",
  "meadow wildflowers wind",
  "clouds sky sunset",
  "birds flying nature",
  "lake reflection mountains",
  "grass field wind",
  "sunset ocean horizon",
  "cherry blossom spring",
  "sand dunes desert",
  "green valley hills",
  "rainy forest leaves",
  "butterfly flower macro",
  "moonlight clouds night",
  "canyon rock formation"
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");


  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "PEXELS_API_KEY not set" });
  }

  const query = NATURE_QUERIES[Math.floor(Math.random() * NATURE_QUERIES.length)];
  const page = Math.floor(Math.random() * 30) + 1;

  try {
    const upstream = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${page}&orientation=portrait`,
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
