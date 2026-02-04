
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const DOMAIN = "crafteddocs.com";

// 1. Serve static files (HTML, TSX, images, etc.)
app.use(express.static(path.join(__dirname, '.')));

/**
 * 2. CONFIG INJECTION ENDPOINT
 * This dynamically provides the API_KEY to the frontend.
 * The key is pulled from the VPS system environment variables.
 */
app.get('/config.js', (req, res) => {
  const apiKey = process.env.API_KEY || "";
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    // Global environment configuration for CraftedDocs
    window.process = { 
      env: { 
        API_KEY: '${apiKey}' 
      } 
    };
    console.log("[CraftedDocs] Production environment active for ${DOMAIN}");
  `);
});

/**
 * 3. SPA ROUTING
 * Redirects all browser requests to index.html so React can handle the routes.
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('=============================================');
  console.log(`🚀 CraftedDocs Production Server is LIVE`);
  console.log(`🌍 Domain: https://${DOMAIN}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔑 API Key Injected: ${process.env.API_KEY ? 'YES' : 'NO (Check ENV)'}`);
  console.log('=============================================');
});
