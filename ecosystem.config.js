
module.exports = {
  apps: [{
    name: "crafteddocs-app",
    script: "./server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      // REPLACE THIS with your real Gemini API Key for the VPS to pick it up
      API_KEY: "PASTE_YOUR_GEMINI_API_KEY_HERE"
    }
  }]
}
