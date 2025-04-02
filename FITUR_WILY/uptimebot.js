
const express = require('express');
const app = express();
const PORT = 5000;

const handleUptimeBot = (config) => {
  if (!config.uptimeBot) return;

  app.get('/', (req, res) => {
    res.send('Bot is running 24/7!');
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Uptime bot server running on port ${PORT}`);
  });
};

module.exports = {
  handleUptimeBot
};
