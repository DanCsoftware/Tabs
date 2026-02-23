// popup.js - Local usage tracking with developer bypass

// 🔧 DEVELOPER MODE: Unlimited tries for you!
const DEVELOPER_USER_ID = ''; // Production: No unlimited access

document.addEventListener('DOMContentLoaded', async () => {
  const organizeBtn = document.getElementById('organizeBtn');
  const statusDiv = document.getElementById('status');
  const loadingDiv = document.getElementById('loading');
  const tabCountSpan = document.getElementById('tabCount');
  const feedbackDiv = document.getElementById('feedback');
  const feedbackGoodBtn = document.getElementById('feedbackGood');
  const feedbackBadBtn = document.getElementById('feedbackBad');
  
  const usedCountSpan = document.getElementById('usedCount');
  const limitCountSpan = document.getElementById('limitCount');
  const remainingCountSpan = document.getElementById('remainingCount');
  const usageFillDiv = document.getElementById('usageFill');
  const resetDateSpan = document.getElementById('resetDate');
  
  await loadUsageStats();
  
  const tabs = await chrome.tabs.query({ currentWindow: true });
  tabCountSpan.textContent = tabs.length;
  
  organizeBtn.addEventListener('click', async () => {
    // Check if limit reached
    const stats = await getLocalUsageStats();
    if (stats.remaining <= 0) {
      statusDiv.style.display = 'block';
      statusDiv.className = 'status error';
      statusDiv.textContent = `Monthly limit reached (${stats.limit}/month). Resets ${stats.resetDate}`;
      return;
    }
    
    organizeBtn.disabled = true;
    loadingDiv.classList.add('active');
    statusDiv.style.display = 'none';
    feedbackDiv.style.display = 'none';
    
    try {
      await chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await chrome.runtime.sendMessage({ action: 'organizeTabs' });
      
      if (response && response.success) {
        // Increment usage locally
        await incrementLocalUsage();
        
        statusDiv.style.display = 'block';
        statusDiv.className = 'status success';
        statusDiv.textContent = `✓ Organized into ${response.groupCount} groups!`;
        
        feedbackDiv.style.display = 'block';
        await loadUsageStats();
      } else {
        throw new Error(response?.error || 'Organization failed');
      }
    } catch (error) {
      console.error('Error:', error);
      statusDiv.style.display = 'block';
      statusDiv.className = 'status warning';
      statusDiv.textContent = error.message;
    } finally {
      organizeBtn.disabled = false;
      loadingDiv.classList.remove('active');
    }
  });
  
  async function getLocalUsageStats() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    
    // Get current user ID
    const { userId } = await chrome.storage.local.get('userId');
    
    // 🔧 DEVELOPER MODE: Check if this is the developer
    const isDeveloper = userId === DEVELOPER_USER_ID;
    const FREE_TIER_LIMIT = isDeveloper ? 999 : 10;
    
    // Show developer status in console
    if (isDeveloper) {
      console.log('🔧 Developer mode: Unlimited tries enabled');
    }
    
    const { usageData } = await chrome.storage.local.get('usageData');
    
    let usage = usageData || { month: currentMonth, count: 0 };
    
    if (usage.month !== currentMonth) {
      usage = { month: currentMonth, count: 0 };
      await chrome.storage.local.set({ usageData: usage });
    }
    
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return {
      used: usage.count,
      limit: FREE_TIER_LIMIT,
      remaining: FREE_TIER_LIMIT - usage.count,
      resetDate: nextMonth.toLocaleDateString(),
      isDeveloper: isDeveloper
    };
  }
  
  async function incrementLocalUsage() {
    const stats = await getLocalUsageStats();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    
    await chrome.storage.local.set({ 
      usageData: { 
        month: currentMonth, 
        count: stats.used + 1 
      } 
    });
  }
  
  async function loadUsageStats() {
    const stats = await getLocalUsageStats();
    
    usedCountSpan.textContent = stats.used;
    limitCountSpan.textContent = stats.limit;
    remainingCountSpan.textContent = stats.remaining;
    resetDateSpan.textContent = stats.resetDate;
    
    // Show developer badge if applicable
    if (stats.isDeveloper) {
      limitCountSpan.textContent = '∞'; // Infinity symbol
      remainingCountSpan.textContent = '∞';
    }
    
    const percentage = (stats.used / stats.limit) * 100;
    usageFillDiv.style.width = `${Math.min(percentage, 100)}%`;
    
    if (percentage >= 90 && !stats.isDeveloper) {
      usageFillDiv.className = 'usage-fill danger';
    } else if (percentage >= 70 && !stats.isDeveloper) {
      usageFillDiv.className = 'usage-fill warning';
    } else {
      usageFillDiv.className = 'usage-fill';
    }
    
    if (stats.remaining <= 0 && !stats.isDeveloper) {
      organizeBtn.disabled = true;
      organizeBtn.textContent = `Limit Reached (resets ${stats.resetDate})`;
    }
  }
  
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
