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

    if (response.status !== 200) {
      res.status(response.status).send(`Failed fetching image: ${response.statusText}`);
      return;
    }

    // Always convert to WebP with optional quality setting
    let transformer = sharp();

    // Apply resizing if needed
    if (width || height) {
      transformer = transformer.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null,
        { fit: "inside", withoutEnlargement: true }
      );
    }

    // Use quality param if provided, else default to 80
    const qualityValue = quality ? Math.max(1, Math.min(parseInt(quality), 100)) : 80;
    transformer = transformer.toFormat("webp", { quality: qualityValue });

    // Content-Type: WebP
    res.type("image/webp");

    // Stream pipeline: Axios → Sharp → Client
    response.data.pipe(transformer).pipe(res);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Image transformer running at http://localhost:${PORT}`);
});
