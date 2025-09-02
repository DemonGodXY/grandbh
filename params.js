// params.js
const DEFAULT_QUALITY = 40;

function params(req, res, next) {
  let url = req.query.url;

  // Handle multiple ?url= params joined into one
  if (Array.isArray(url)) {
    url = url.join("&url=");
  }

  // If no URL, return a simple marker response
  if (!url) {
    return res.end("bandwidth-hero-proxy");
  }

  // Normalize Bandwidth Hero URLs like: http://1.1.x.x/bmi/http://example.com
  url = url.replace(
    /http:\/\/1\.1\.\d+\.\d+\/bmi\/(https?:\/\/)?/i,
    "http://"
  );

  // Attach parsed params for downstream middleware/route
  req.params.url = url;
  req.params.webp = !req.query.jpeg;               // Default to webp unless ?jpeg
  req.params.grayscale = req.query.bw != 0;        // grayscale if ?bw=1 (default)
  req.params.quality = parseInt(req.query.l, 10) || DEFAULT_QUALITY;

  next();
}

module.exports = params;
