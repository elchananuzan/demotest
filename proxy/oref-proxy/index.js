const http = require("http");
const https = require("https");
const { URL } = require("url");

const OREF_ALERTS_URL =
  "https://www.oref.org.il/warningMessages/alert/Alerts.json";
const OREF_HISTORY_URL =
  "https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&mode=1";

const OREF_HEADERS = {
  Referer: "https://www.oref.org.il/",
  "X-Requested-With": "XMLHttpRequest",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
};

const PROXY_API_KEY = process.env.PROXY_API_KEY || "";

function fetchUrl(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: { ...OREF_HEADERS, ...extraHeaders },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks).toString("utf-8"),
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function sendJson(res, statusCode, data, origin) {
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  const origin = req.headers.origin || "*";

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" }, origin);
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/+$/, "");

  // API key check
  if (PROXY_API_KEY) {
    const key = url.searchParams.get("key") || req.headers["x-api-key"];
    if (key !== PROXY_API_KEY) {
      sendJson(res, 403, { error: "Invalid API key" }, origin);
      return;
    }
  }

  try {
    if (path === "/alerts" || path === "/oref-proxy/alerts") {
      const result = await fetchUrl(OREF_ALERTS_URL, { Client: "true" });
      res.writeHead(result.status, {
        ...corsHeaders(origin),
        "Content-Type": "application/json",
      });
      res.end(result.body);
    } else if (path === "/history" || path === "/oref-proxy/history") {
      const result = await fetchUrl(OREF_HISTORY_URL);
      res.writeHead(result.status, {
        ...corsHeaders(origin),
        "Content-Type": "application/json",
      });
      res.end(result.body);
    } else if (path === "/" || path === "/oref-proxy") {
      sendJson(res, 200, { status: "ok", endpoints: ["/alerts", "/history"] }, origin);
    } else {
      sendJson(res, 404, { error: "Not found" }, origin);
    }
  } catch (err) {
    console.error("Proxy error:", err.message);
    sendJson(res, 502, { error: "Upstream fetch failed" }, origin);
  }
}

// GCP Cloud Functions entry point
exports.orefProxy = (req, res) => handleRequest(req, res);

// Also support standalone server for local testing
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  http.createServer(handleRequest).listen(PORT, () => {
    console.log(`Oref proxy listening on http://localhost:${PORT}`);
  });
}
