// options.js - Handles the settings page

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settingsForm');
  const apiKeyInput = document.getElementById('apiKey');
  const messageDiv = document.getElementById('message');
  
  // Load existing API key
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
      showMessage('API key should start with "sk-ant-"', 'error');
      return;
    }
    
    try {
      // Save to Chrome storage
      await chrome.storage.local.set({ apiKey });
      showMessage('Settings saved successfully!', 'success');
    } catch (error) {
      showMessage(`Error saving: ${error.message}`, 'error');
    }
  });
  
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        messageDiv.className = 'message';
      }, 3000);
    }
  }
});
