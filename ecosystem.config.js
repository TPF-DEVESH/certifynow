
module.exports = {
  apps: [{
    name: "certiflow-app",
    script: "./server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      // PLACE YOUR GEMINI API KEY HERE
      API_KEY: "PASTE_YOUR_GEMINI_API_KEY_HERE"
    }
  }]
}
