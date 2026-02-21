// config.example.js
// Copy this file to config.js and add your actual API key

const CONFIG = {
  CLAUDE_API_KEY: 'YOUR_CLAUDE_API_KEY_HERE',
  FREE_TIER_LIMIT: 10  // organizes per month
};

// Don't modify this line
if (typeof module !== 'undefined') {
  module.exports = CONFIG;
}