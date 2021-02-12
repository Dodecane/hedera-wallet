const AppInfo = require("./app.json");

module.exports = {
  name: "Hedera Wallet",
  description: "Hedera Browser Extension Wallet",
  author: "dodecane2242",
  version: AppInfo.version,
  icons: {
    "16": "icons/hedera-wallet-16.png",
    "32": "icons/hedera-wallet-32.png",
    "48": "icons/hedera-wallet-48.png",
    "128": "icons/hedera-wallet-128.png",
  },

  permissions: ["storage", "activeTab"],
  browser_action: {
    default_title: "Hedera Wallet",
    default_popup: "popup.html",
  },
  background: {
    scripts: ["background.js"],
  },
  content_scripts: [
    {
      matches: ["file://*/*", "http://*/*", "https://*/*"],
      js: ["content-script.js"],
      run_at: "document_start",
      all_frames: true,
    },
  ],
  manifest_version: 2,
  content_security_policy: "script-src 'self'; object-src 'self'",
  web_accessible_resources: ["popup.html", "inject-script.js"],
};
