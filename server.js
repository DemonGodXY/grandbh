// server.js (root, CommonJS)
const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const params = require("./params");

const app = express();

// 🛑 Handle favicon quietly
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Apply query->params middleware


// Root route
app.get("/", async (req, res) => {
  try {
    const { url, webp, grayscale, quality } = req.params;

    if (!url) {
      res.status(400).send("Missing ?url");
      return;
    }

    const incomingHeaders = { ...req.headers };
    delete incomingHeaders.host;

    const response = await axios.get(url, {
      headers: incomingHeaders,
      responseType: "stream"
    });

    

    let transformer = sharp();

    if (grayscale) {
      transformer = transformer.grayscale();
    }

    if (webp) {
      transformer = transformer.toFormat("webp", { quality });
      res.type("image/webp");
    } else {
      transformer = transformer.toFormat("jpeg", { quality });
      res.type("image/jpeg");
    }

    response.data.pipe(transformer).pipe(res);
  } catch (err) {
    res.status(500).send("Server error: " + err.message);
  }
});

// 🚨 IMPORTANT: no app.listen() here!
// Export app for Vercel's serverless function runtime
module.exports = app;
