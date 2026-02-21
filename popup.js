// popup.js - Handles the extension popup UI

document.addEventListener('DOMContentLoaded', async () => {
  const organizeBtn = document.getElementById('organizeBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const statusDiv = document.getElementById('status');
  const loadingDiv = document.getElementById('loading');
  const tabCountSpan = document.getElementById('tabCount');
  
  // Check if API key is set
  const { apiKey } = await chrome.storage.local.get('apiKey');
  
  if (!apiKey) {
    statusDiv.style.display = 'block';
    organizeBtn.disabled = true;
  } else {
    statusDiv.style.display = 'none';
    statusDiv.className = 'status success';
    statusDiv.textContent = 'Ready to organize!';
  }
  
  // Get current tab count
  const tabs = await chrome.tabs.query({ currentWindow: true });
  tabCountSpan.textContent = tabs.length;
  
  // Organize button click
  organizeBtn.addEventListener('click', async () => {
    organizeBtn.disabled = true;
    loadingDiv.classList.add('active');
    
    try {
      // Wake up the service worker first
      await chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {
        // Service worker might be asleep, this will wake it
      });
      
      // Small delay to ensure service worker is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send message to background script to organize tabs
      const response = await chrome.runtime.sendMessage({ action: 'organizeTabs' });
      
      if (response && response.success) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status success';
        statusDiv.textContent = `Organized into ${response.groupCount} groups!`;
      } else {
        throw new Error(response?.error || 'Organization failed');
      }
    } catch (error) {
      console.error('Organization error:', error);
      statusDiv.style.display = 'block';
      statusDiv.className = 'status warning';
      statusDiv.textContent = `Error: ${error.message}`;
    } finally {
      organizeBtn.disabled = false;
      loadingDiv.classList.remove('active');
    }
  });
  
  // Settings button click
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});