// popup.js - Production version with usage tracking

document.addEventListener('DOMContentLoaded', async () => {
  const organizeBtn = document.getElementById('organizeBtn');
  const statusDiv = document.getElementById('status');
  const loadingDiv = document.getElementById('loading');
  const tabCountSpan = document.getElementById('tabCount');
  const feedbackDiv = document.getElementById('feedback');
  const feedbackGoodBtn = document.getElementById('feedbackGood');
  const feedbackBadBtn = document.getElementById('feedbackBad');
  
  // Usage stats elements
  const usedCountSpan = document.getElementById('usedCount');
  const limitCountSpan = document.getElementById('limitCount');
  const remainingCountSpan = document.getElementById('remainingCount');
  const usageFillDiv = document.getElementById('usageFill');
  const resetDateSpan = document.getElementById('resetDate');
  
  // Load usage stats
  await loadUsageStats();
  
  // Get current tab count
  const tabs = await chrome.tabs.query({ currentWindow: true });
  tabCountSpan.textContent = tabs.length;
  
  // Organize button click
  organizeBtn.addEventListener('click', async () => {
    organizeBtn.disabled = true;
    loadingDiv.classList.add('active');
    statusDiv.style.display = 'none';
    feedbackDiv.style.display = 'none';
    
    try {
      // Wake up service worker
      await chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Organize tabs
      const response = await chrome.runtime.sendMessage({ action: 'organizeTabs' });
      
      if (response && response.success) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status success';
        statusDiv.textContent = `✓ Organized into ${response.groupCount} groups!`;
        
        // Show feedback
        feedbackDiv.style.display = 'block';
        
        // Update usage stats
        await loadUsageStats();
      } else {
        throw new Error(response?.error || 'Organization failed');
      }
    } catch (error) {
      console.error('Error:', error);
      statusDiv.style.display = 'block';
      
      if (error.message.includes('Monthly limit')) {
        statusDiv.className = 'status error';
      } else {
        statusDiv.className = 'status warning';
      }
      
      statusDiv.textContent = error.message;
    } finally {
      organizeBtn.disabled = false;
      loadingDiv.classList.remove('active');
    }
  });
  
  // Load and display usage stats
  async function loadUsageStats() {
    try {
      const stats = await chrome.runtime.sendMessage({ action: 'getUsageStats' });
      
      if (stats) {
        usedCountSpan.textContent = stats.used;
        limitCountSpan.textContent = stats.limit;
        remainingCountSpan.textContent = stats.remaining;
        resetDateSpan.textContent = stats.resetDate;
        
        // Update progress bar
        const percentage = (stats.used / stats.limit) * 100;
        usageFillDiv.style.width = `${percentage}%`;
        
        // Color code the bar
        if (percentage >= 90) {
          usageFillDiv.className = 'usage-fill danger';
        } else if (percentage >= 70) {
          usageFillDiv.className = 'usage-fill warning';
        } else {
          usageFillDiv.className = 'usage-fill';
        }
        
        // Disable button if limit reached
        if (stats.remaining <= 0) {
          organizeBtn.disabled = true;
          organizeBtn.textContent = `Limit Reached (resets ${stats.resetDate})`;
        }
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  }
  
  // Feedback handlers
  feedbackGoodBtn.addEventListener('click', async () => {
    await recordFeedback('positive');
    feedbackDiv.innerHTML = '<p style="color: #0d6832; font-size: 13px; margin: 0;">✓ Thanks! I\'ll keep learning.</p>';
  });
  
  feedbackBadBtn.addEventListener('click', async () => {
    await recordFeedback('negative');
    feedbackDiv.innerHTML = '<p style="color: #856404; font-size: 13px; margin: 0;">Got it. I\'ll try to improve.</p>';
  });
  
  async function recordFeedback(type) {
    const { feedbackStats = { positive: 0, negative: 0 } } = await chrome.storage.local.get('feedbackStats');
    
    if (type === 'positive') {
      feedbackStats.positive++;
    } else {
      feedbackStats.negative++;
    }
    
    await chrome.storage.local.set({ feedbackStats });
  }
});