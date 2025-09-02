// server.js
const express = require("express");
const axios = require("axios");
const sharp = require("sharp");

const app = express();
const PORT = 3000;
const DEFAULT_QUALITY = 80;

// 🛑 Silence favicon requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

  let url = req.query.url;
  if (Array.isArray(url)) url = url.join("&url=");
  if (!url) return res.end("bandwidth-hero-proxy");

  // strip weird compression-proxy prefixes if found
  url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, "http://");

  req.params.url = url;
  req.params.webp = !req.query.jpeg; // default to webp unless ?jpeg=1
  req.params.grayscale = req.query.bw != 0;

  // clamp quality between 1-100
  const q = parseInt(req.query.l, 10);
  req.params.quality =
    Number.isInteger(q) && q >= 1 && q <= 100 ? q : DEFAULT_QUALITY;

  next();
});

// 🎨 Root handler: transform without resizing
app.get("/", async (req, res) => {
  try {
    const { url, quality, webp, grayscale } = req.params;

    // forward headers (but drop host to avoid issues)
    const headers = { ...req.headers };
    delete headers.host;

    // fetch original as a stream
    const response = await axios.get(url, {
      headers,
      responseType: "stream",
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      res
        .status(response.status)
        .send(`Failed fetching image: ${response.statusText}`);
      return;
    }

    let transformer = sharp();

    if (grayscale) {
      transformer = transformer.grayscale();
    }

    const format = webp ? "webp" : "jpeg";
    transformer = transformer.toFormat(format, { quality });

    res.type(`image/${format}`);

    // pipe stream: axios → sharp → client
    response.data.pipe(transformer).pipe(res);

    transformer.on("error", (err) => {
      console.error("Sharp error:", err.message);
      if (!res.headersSent) {
        res.status(422).send("Image processing failed");
      }
    });
  } catch (err) {
    console.error("Image transform error:", err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Image transformer running at http://localhost:${PORT}`);
});
