
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const DOMAIN = "crafteddocs.com";

// Serve static files (HTML, TSX, images)
app.use(express.static(path.join(__dirname, '.')));

// Dynamic config injection for the frontend
app.get('/config.js', (req, res) => {
  const apiKey = process.env.API_KEY || "";
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    window.process = { 
      env: { 
        API_KEY: '${apiKey}' 
      } 
    };
    console.log("[CertiFlow] Configured for ${DOMAIN}");
  `);
});

// Support for Single Page Application (SPA) routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('=============================================');
  console.log(`🚀 DEPLOYMENT SUCCESSFUL`);
  console.log(`🌍 Domain: https://${DOMAIN}`);
  console.log(`📡 Port: ${PORT}`);
  console.log('=============================================');
});
