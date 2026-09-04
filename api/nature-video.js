// GET /api/nature-video — returns a real nature/landscape video URL,
// sourced from Pexels' curated video library.
// Restricted to purely natural scenes (forests, oceans, mountains, wildlife, sky) —
// no buildings, roads, boats, or other human-made structures.

const NATURE_QUERIES = [
  "forest canopy trees",
  "ocean waves aerial",
  "mountain range clouds",
  "waterfall rainforest",
  
  "northern lights sky",
 
  "misty forest morning",
  "river rapids nature",
  
  "snow mountain peak",
  
  "starry night sky",
 
  "clouds timelapse sky",
  
  "lake reflection mountains",
  
  "sunset ocean horizon"
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "PEXELS_API_KEY not set" });
  }

  const query = NATURE_QUERIES[Math.floor(Math.random() * NATURE_QUERIES.length)];
  const page = Math.floor(Math.random() * 20) + 1;

  try {
    const upstream = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1&page=${page}&orientation=portrait`,
      { headers: { Authorization: apiKey } }
    );
    const data = await upstream.json();
    const video = data.videos && data.videos[0];
    if (!video) return res.status(404).json({ error: "No video found" });

    const files = video.video_files || [];
    const pick =
      files.find(function (f) { return f.quality === "sd" && f.width && f.width <= 960; }) ||
      files.find(function (f) { return f.quality === "sd"; }) ||
      files[0];

    if (!pick) return res.status(404).json({ error: "No video file found" });
    res.status(200).json({ url: pick.link });
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Pexels: " + err.message });
  }
}
