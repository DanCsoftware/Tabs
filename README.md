# 🗂️ AI Tab Organizer

Smart tab organization powered by AI - learns from your usage

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Privacy](https://img.shields.io/badge/privacy-first-green) ![License](https://img.shields.io/badge/license-MIT-orange)

---

## We're LIVE
https://chromewebstore.google.com/detail/tabs-ai-tab-organizer/mbfjkfbccmjidpdfochjgipamhobjbcb?authuser=0&hl=en

---

## ✨ Features

- 🤖 **AI-Powered** - Uses Claude Haiku for smart categorization
- 🧠 **Learns From You** - Remembers your manual adjustments
- 🎁 **10 Free/Month** - No credit card, no signup
- ⚡ **Lightning Fast** - Organizes 50+ tabs in seconds
- 🔒 **Privacy-First** - Only tab titles & domains sent to AI
- 📊 **Usage Tracking** - See how many organizes you have left

---

## 🚀 Quick Start

### Installation

1. Download from [Chrome Web Store](https://chromewebstore.google.com/detail/tabs-ai-tab-organizer/mbfjkfbccmjidpdfochjgipamhobjbcb?authuser=0&hl=en) (or load unpacked for development)
2. Click the extension icon
3. Click "Organize Tabs"
4. Done! Your tabs are automatically grouped

### Usage

1. Click the extension icon
2. Click "Organize Tabs"
3. Your tabs are automatically grouped by category
4. Rate with 👍 or 👎 to help it learn
5. Manually adjust groups - extension remembers your preferences

---

## 🔒 Privacy & Security

### What We Access:

✅ **Tab titles** (e.g., "GitHub - Pull Request")  
✅ **Tab domains only** (e.g., "github.com")  
✅ **Your manual grouping preferences** (stored locally)

### What We DON'T Access:

❌ Full URLs or paths  
❌ Page content or browsing history  
❌ Passwords or personal data  
❌ Cookies or form data  

**Read more:** [Privacy Policy](PRIVACY.md)

---

## 📡 How It Works

### Architecture:

```
You → Extension → Secure Backend (Vercel) → Claude AI → Results → Groups Created
```

1. **Extension** collects tab titles and domains
2. **Backend** securely calls Claude AI with your data
3. **AI** suggests categories (Development, Social, Shopping, etc.)
4. **Extension** creates tab groups automatically
5. **Learning** happens locally - your preferences stay in your browser

### Why a Backend?

- 🔒 **Security** - API key never exposed in extension code
- 💰 **Free for you** - We cover the AI costs
- ⚡ **Fast** - Optimized API calls
- 📊 **Fair usage** - 10 free organizes/month per user

---

## 🧠 How Learning Works

The extension learns from your behavior:

1. **First time:** AI makes best guess at categorization
2. **You adjust:** Manually drag tabs between groups
3. **It learns:** Remembers "github.com goes in Development"
4. **Next time:** Automatically uses your preferences

**All learning happens locally** - your preferences never leave your browser!

---

## 💎 Free Tier

- ✅ 10 organizes per month
- ✅ Resets on the 1st of each month
- ✅ Perfect for most users
- ✅ No credit card required
- ✅ No signup needed

---

## 🎯 Perfect For

- **Developers** - Separate GitHub, docs, Stack Overflow
- **Researchers** - Organize papers and articles
- **Shoppers** - Group deals and reviews
- **Students** - Separate by class/subject
- **Anyone with 10+ tabs open constantly!**

---

## 📊 What Gets Sent to AI

When you click "Organize Tabs":

### ✅ Sent to our secure backend:
```
0. GitHub - Pull Request (github.com)
1. Gmail (mail.google.com)
2. Twitter (twitter.com)
```

### ❌ NOT sent:
- Full URLs (e.g., `github.com/your-company/secret-project`)
- Page content or text
- Passwords or form data
- Your browsing history
- Cookies or session data

**Only tab titles and domain names - that's it!**

---

## ⚠️ Known Issues

### macOS (Chrome & Brave)

Tab group names may not display immediately on macOS. This is a browser rendering issue on Mac.

**Workaround:** Groups are created correctly - names appear after clicking into any tab in the group.

**Status:** This affects all tab group extensions on macOS and cannot be fixed from the extension side.

---

## 🛠️ Tech Stack

- **AI:** Claude Haiku 3 (Anthropic)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Platform:** Chrome Extensions Manifest V3
- **Storage:** Local browser storage (privacy!)
- **Security:** Backend authentication, IP rate limiting
- **Tracking:** None whatsoever

---

## 🔐 Security Features

- ✅ **No API keys in extension code** - Secure backend architecture
- ✅ **IP rate limiting** - 20 requests/hour per IP maximum
- ✅ **User rate limiting** - 10 organizes/month per user
- ✅ **Billing caps** - Protected against abuse
- ✅ **Open source** - Verify the code yourself

---

## 🤝 Contributing

Contributions welcome!

### How to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Guidelines:

- Keep privacy-first approach
- No tracking or analytics
- Open source, transparent
- Document security implications

---

## 📄 License

MIT License - Use however you want!

---

## 💬 Support

Questions? Issues?

- **GitHub Issues:** [Open an issue](https://github.com/DanCsoftware/Tabs/issues)
- **Privacy concerns:** See [PRIVACY.md](PRIVACY.md)
- **Chrome Web Store:** [Leave a review](https://chrome.google.com/webstore)

---

## ⭐ Show Your Support

If this extension saves you time:

- ⭐ Star the repo on GitHub
- 📢 Share with friends
- 💬 Leave feedback
- 🔧 Contribute improvements

---

**Made with ❤️ for people drowning in tabs**

🔒 Privacy-first • 🆓 Free forever • 📖 Open source

---

## 🔗 Links

- [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
- [Privacy Policy](PRIVACY.md)
- [GitHub Repository](https://github.com/DanCsoftware/Tabs)
