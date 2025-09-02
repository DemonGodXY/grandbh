// server.js
const express = require("express");
const axios = require("axios");
const sharp = require("sharp");

const app = express();
const PORT = 3000;

// 🛑 Shortcut: Quietly handle favicon requests with 204 (no content)
app.get("/favicon.ico", (req, res) => res.status(204).end());

// 🎨 Image transform endpoint
// Example:
//   http://localhost:3000/image?url=https://example.com/cat.jpg&width=400&quality=70
app.get("/image", async (req, res) => {
  try {
    const { url, width, height, quality } = req.query;
    if (!url) {
      res.status(400).send("Missing required ?url parameter");
      return;
    }

    // Clone incoming headers, but drop "host" (must match real server)
    const incomingHeaders = { ...req.headers };
    delete incomingHeaders.host;

    // Fetch the original image as a stream
    const response = await axios.get(url, {
      headers: incomingHeaders,
      responseType: "stream",
      validateStatus: () => true // don’t auto-throw on non-200
    });

    if (response.status !== 200) {
      res
        .status(response.status)
        .send(`Failed fetching image: ${response.statusText}`);
      return;
    }

    // Create Sharp transformer pipeline
    let transformer = sharp();

    // Optional resizing
    if (width || height) {
      transformer = transformer.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null,
        { fit: "inside", withoutEnlargement: true }
      );
    }

    // Always convert to WebP with adjustable quality (default 80)
    const qualityValue = quality
      ? Math.max(1, Math.min(parseInt(quality), 100))
      : 80;

    transformer = transformer.toFormat("webp", { quality: qualityValue });

    // Tell browser it's WebP
    res.type("image/webp");

    // Pipe: Axios Stream → Sharp Transform → Client
    response.data.pipe(transformer).pipe(res);
  } catch (err) {
    console.error("Image transform error:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Image transformer running at http://localhost:${PORT}`);
});
