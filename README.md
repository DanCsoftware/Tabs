# 🗂️ AI Tab Organizer

A Chrome extension that automatically organizes your browser tabs into logical groups using Claude AI.

## Features

- 🤖 AI-powered tab categorization
- 🔒 Privacy-first: Your data never leaves your browser (except for API calls to Anthropic)
- 🎨 Automatic color-coded tab groups
- ⚡ Fast and lightweight
- 🔐 Secure local storage of API keys

## Installation

### Step 1: Clone or Download

```bash
git clone https://github.com/yourusername/ai-tab-organizer.git
cd ai-tab-organizer
```

Or download the ZIP and extract it.

### Step 2: Get a Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (it starts with `sk-ant-...`)

### Step 3: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `ai-tab-organizer` folder
5. The extension icon should appear in your toolbar!

### Step 4: Configure Your API Key

1. Click the extension icon in your toolbar
2. Click "Settings"
3. Paste your Claude API key
4. Click "Save Settings"

## Usage

1. Open multiple tabs in your browser
2. Click the AI Tab Organizer extension icon
3. Click "Organize Tabs"
4. Watch as your tabs are automatically grouped into categories! 🎉

## How It Works

1. The extension reads your open tab titles and URLs (only the domain)
2. Sends this data to Claude AI via the Anthropic API
3. Claude analyzes the tabs and suggests logical groupings
4. The extension creates color-coded tab groups based on the AI's suggestions

## Privacy & Security

- **Your API key** is stored locally in Chrome's storage and never sent anywhere except to Anthropic's API
- **Tab data** is only sent to Anthropic for categorization (title + domain only, not full URLs)
- **No tracking** or analytics
- **Open source** - you can review all the code

## Technical Details

- Built with Chrome Extensions Manifest V3
- Uses the Anthropic Claude API (Sonnet 4)
- Minimal permissions required:
  - `tabs` - to read tab information
  - `tabGroups` - to create and manage tab groups
  - `storage` - to save your API key locally

## Development

### File Structure

```
ai-tab-organizer/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── options.html        # Settings page UI
├── options.js          # Settings page logic
├── background.js       # Main extension logic & AI integration
├── icons/              # Extension icons
└── README.md           # This file
```

### Customization

You can modify the AI prompt in `background.js` to change how tabs are categorized. Look for the `categorizeTabs` function.

## Troubleshooting

**"API key not set" error:**
- Make sure you've entered your API key in Settings
- Verify it starts with `sk-ant-`

**Tabs not organizing:**
- Check the browser console (F12) for errors
- Ensure you have at least 3-4 tabs open
- Verify your API key is valid

**Extension not loading:**
- Make sure Developer Mode is enabled in `chrome://extensions/`
- Try reloading the extension
- Check that all files are in the correct directory

## Cost

This extension uses the Claude API, which has usage-based pricing:
- Claude Sonnet 4: ~$3 per million input tokens
- Organizing 50 tabs typically uses ~500 tokens
- Cost per organization: Less than $0.01

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - feel free to use and modify!

## Disclaimer

This is an independent project and is not officially affiliated with Anthropic.

---

Made with ❤️ by developers who have too many tabs open
