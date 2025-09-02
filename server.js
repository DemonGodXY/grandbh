// server.js
import express from "express";
import axios from "axios";
import sharp from "sharp";

const app = express();
const PORT = 3000;

// Example with usage:
//   http://localhost:3000/image?url=https://example.com/pic.jpg&width=400&quality=80
app.get("/image", async (req, res) => {
  try {
    const { url, width, height, quality } = req.query;
    if (!url) {
      res.send("Missing required ?url parameter");
      return;
    }

    // Forward all request headers except "host"
    const incomingHeaders = { ...req.headers };
    delete incomingHeaders.host;

    // Fetch original image as stream
    const response = await axios.get(url, {
      headers: incomingHeaders,
      responseType: "stream",
      validateStatus: () => true
    });
// server.js
import express from "express";
import axios from "axios";
import sharp from "sharp";

const app = express();
const PORT = 3000;

// --- 🖼 Dynamic Favicon ---
// Browsers will call /favicon.ico automatically.
// We generate a tiny 32x32 PNG in memory via Sharp.
app.get("/favicon.ico", async (req, res) => {
  try {
    const iconBuffer = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 0, g: 150, b: 200, alpha: 1 } // teal square
      }
    })
      // toFormat("png") ensures browser compatibility
      .png()
      .toBuffer();

    res.type("image/png").send(iconBuffer);
  } catch (err) {
    console.error("Favicon error:", err.message);
    res.status(500).send("Error generating favicon");
  }
});

// --- 🎨 Image transform route ---
// Example: 
//   http://localhost:3000/image?url=https://example.com/image.jpg&width=400&quality=80
app.get("/image", async (req, res) => {
  try {
    const { url, width, height, quality } = req.query;
    if (!url) {
      res.status(400).send("Missing required ?url parameter");
      return;
    }

    // Forward headers (excluding host) to preserve cookies, user-agent, etc.
    const incomingHeaders = { ...req.headers };
    delete incomingHeaders.host;

    // Fetch original image as stream
    const response = await axios.get(url, {
      headers: incomingHeaders,
      responseType: "stream",
      validateStatus: () => true
    });

    if (response.status !== 200) {
// server.js
import express from "express";
import axios from "axios";
import sharp from "sharp";

const app = express();
const PORT = 3000;

// 🛑 Handle favicon probes with no content
// (prevents noisy 404s from browsers)
app.get("/favicon.ico", (req, res) => res.status(204).end());

// 🎨 Image transform endpoint
// Example:
//   http://localhost:3000/image?url=https://example.com/image.jpg&width=400&quality=80
app.get("/image", async (req, res) => {
  try {
    const { url, width, height, quality } = req.query;
    if (!url) {
      res.status(400).send("Missing required ?url parameter");
      return;
    }

    // Clone headers but drop "host"
    const incomingHeaders = { ...req.headers };
    delete incomingHeaders.host;

    // Fetch original image as a stream
    const response = await axios.get(url, {
      headers: incomingHeaders,
      responseType: "stream",
      validateStatus: () => true // prevents throwing on non-200
    });

    if (response.status !== 200) {
      res
        .status(response.status)
        .send(`Failed fetching image: ${response.statusText}`);
      return;
    }

    // Create Sharp pipeline
    let transformer = sharp();

    // Optional resize
    if (width || height) {
      transformer = transformer.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null,
        { fit: "inside", withoutEnlargement: true }
      );
    }

    // WebP conversion with adjustable quality (default 80)
    const qualityValue = quality
      ? Math.max(1, Math.min(parseInt(quality), 100))
      : 80;
    transformer = transformer.toFormat("webp", { quality: qualityValue });

    // Set Content-Type
    res.type("image/webp");

    // Pipe: Axios stream → Sharp → response
    response.data.pipe(transformer).pipe(res);
  } catch (err) {
    console.error("Image transform error:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Image transformer running at http://localhost:${PORT}`);
});
