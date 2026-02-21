# 🔒 Privacy & Security Policy

Last updated: February 21, 2026

## Our Commitment

**We take your privacy seriously.** This extension is designed to be privacy-first and transparent about what data is accessed and how it's used.

---

## What Data We Access

### ✅ Data the Extension Can See:
- **Tab titles** - The text shown on each browser tab
- **Tab domains** - Just the domain (e.g., `github.com`), NOT full URLs
- **Your manual tab groupings** - To learn your preferences

### ❌ Data We NEVER Access:
- Full URLs (we strip everything after the domain)
- Page content or text
- Passwords or login credentials
- Form data
- Cookies or session data
- Your complete browsing history
- Bookmarks
- Downloads
- Personal information

---

## What Data Gets Sent Where

### To Claude AI (Anthropic):
When you click "Organize Tabs," we send:
```
Tab titles + domains ONLY
Example:
- "GitHub - Pull Request" (github.com)
- "Gmail" (mail.google.com)
- "Twitter" (twitter.com)
```

**We DO NOT send:**
- Full URLs (e.g., `/your-company/secret-repo`)
- Page content
- Your history
- Any personal data

### Anthropic's Data Handling:
- They process the data to categorize your tabs
- They may temporarily log API calls (standard practice)
- They do NOT permanently store your tab data
- See: [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)

---

## What Data We Store

### Locally in Your Browser (chrome.storage.local):
```javascript
{
  // Your learned preferences
  userPreferences: {
    "github.com": { "Development": 5 },
    "twitter.com": { "Social": 3 }
  },
  
  // Usage tracking (for free tier limit)
  usageData: {
    month: "2026-2",
    count: 7
  },
  
  // Your feedback
  feedbackStats: {
    positive: 10,
    negative: 1
  }
}
```

**This data:**
- ✅ Stays on YOUR device
- ✅ Never sent to any server
- ✅ Can be cleared anytime (remove extension or clear browser data)
- ✅ Doesn't sync across devices (local only)

### On Our Servers:
**NOTHING.** We don't have servers. All data stays local.

---

## Your Rights

### You Can:
✅ **See exactly what's sent** - Check the service worker console  
✅ **Delete all data** - Remove the extension or clear browser storage  
✅ **Use it privately** - No account needed  
✅ **Verify the code** - It's open source  

### How to Clear Your Data:
1. **Remove extension:** All local data deleted
2. **Clear browser data:** Delete extension storage
3. **Manual:** Open DevTools → Application → Storage → chrome.storage.local

---

## Security Measures

### Code-Level:
- No external scripts loaded
- No tracking pixels
- No hidden network calls
- All communication over HTTPS

### Browser Permissions:
We only request:
- `tabs` - To read tab info (titles, domains)
- `tabGroups` - To create/update groups
- `storage` - To save your preferences locally
- `host_permissions` - To call Claude API

**We do NOT request:**
- `history` - Don't access browsing history
- `cookies` - Don't read cookies
- `webRequest` - Don't intercept network traffic
- `<all_urls>` - Don't access all pages

---

## Contact & Questions

**Questions about privacy?**
- GitHub Issues: [github.com/DanCsoftware/Tabs/issues](https://github.com/DanCsoftware/Tabs/issues)

**Found a security issue?**
- Please report via GitHub issues
- We'll respond within 48 hours

---

## TL;DR (Summary)

**What we do:**
- Send tab titles + domains to Claude AI for categorization
- Store your preferences locally in your browser
- That's it!

**What we DON'T do:**
- Track your browsing history
- Store data on servers
- Sell or share your data
- Spy on you in any way

**Your data:**
- Stays on your device
- Only sent to Claude for AI processing
- Never stored permanently
- You control it completely

---

**We're committed to privacy. If you have concerns, please reach out!**