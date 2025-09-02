// server.js
const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const params = require("./params"); // import our params middleware

const app = express();
const PORT = 3000;



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
      transformer = transformer.toFormat("webp", { quality:req.params.quality });
    } else {
      transformer = transformer.toFormat("jpeg", { quality:req.params.quality });
    }

    // Pipe: Axios stream → Sharp → HTTP response
    response.data.pipe(transformer).pipe(res);
  } catch (err) {
    console.error("Image transform error:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});
// 🛑 Handle favicon cleanly
app.get("/favicon.ico", (req, res) => res.status(204).end());
// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Image transformer running at http://localhost:${PORT}`);
});
