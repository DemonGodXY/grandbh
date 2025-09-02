// server.js
const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const params = require("./params"); // import our params middleware

const app = express();
const PORT = 3000;

// 🛑 Handle favicon cleanly
app.get("/favicon.ico", (req, res) => res.status(204).end());

// ⚙️ Apply params middleware globally
app.use(params);

// 🎨 Image transform proxy at root
// Example:
//   http://localhost:3000/?url=https://example.com/cat.jpg&l=60&bw=0&jpeg=1
app.get("/", async (req, res) => {
  try {
    const { url, webp, grayscale, quality } = req.params;

    // Forward request headers except host
    const incomingHeaders = { ...req.headers };
    delete incomingHeaders.host;

    // Fetch the original image as a stream
    const response = await axios.get(url, {
      headers: incomingHeaders,
      responseType: "stream",
      validateStatus: () => true
    });

    if (response.status !== 200) {
      res
        .status(response.status)
        .send(`Failed fetching image: ${response.statusText}`);
      return;
    }

    // Build Sharp transformation pipeline
    let transformer = sharp();

    if (grayscale) {
      transformer = transformer.grayscale();
    }

    // Set output format: WebP or JPEG
    if (webp) {
      transformer = transformer.toFormat("webp", { quality });
      res.type("image/webp");
    } else {
      transformer = transformer.toFormat("jpeg", { quality });
      res.type("image/jpeg");
    }

    // Pipe: Axios stream → Sharp → HTTP response
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
