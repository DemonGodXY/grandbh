// server.js
import express from "express";
import axios from "axios";
import sharp from "sharp";

const app = express();
const PORT = 3000;

// Example:
//   http://localhost:3000/image?url=https://example.com/pic.jpg&width=400&height=300
app.get("/image", async (req, res) => {
  try {
    const { url, width, height } = req.query;
    if (!url) {
      res.status(400).send("Missing required ?url parameter");
      return;
    }

    // Forward all request headers except "host"
    const incomingHeaders = { ...req.headers };
    delete incomingHeaders.host;

    // Fetch original image as stream
    const response = await axios.get(url, {
      headers: incomingHeaders,
      responseType: "stream",
      validateStatus: () => true, // don't throw on non-200
    });

    if (response.status !== 200) {
      res.status(response.status).send(`Failed fetching image: ${response.statusText}`);
      return;
    }

    // Always convert to WebP
    let transformer = sharp();

    if (width || height) {
      transformer = transformer.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null,
        { fit: "inside", withoutEnlargement: true }
      );
    }

    transformer = transformer.toFormat("webp");

    res.type("image/webp");

    // Stream: Axios → Sharp → client response
    response.data.pipe(transformer).pipe(res);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Image transformer running at http://localhost:${PORT}`);
});
