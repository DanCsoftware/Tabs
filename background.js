// background.js - Production version with usage limits

// Import configuration
importScripts('config.js');

const CLAUDE_API_KEY = CONFIG.CLAUDE_API_KEY;
const FREE_TIER_LIMIT = CONFIG.FREE_TIER_LIMIT;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
    return true;
  }
  
  if (request.action === 'organizeTabs') {
    organizeTabs().then(sendResponse);
    return true;
  }
  
  if (request.action === 'getUsageStats') {
    getUsageStats().then(sendResponse);
    return true;
  }
});

// Track when users manually reorganize tabs to learn preferences
chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      const group = await chrome.tabGroups.get(tab.groupId);
      await learnFromUserAction(tab, group);
    }
  } catch (error) {
    // Ignore errors - this is just learning
  }
});

// Learn from user's manual tab organization
async function learnFromUserAction(tab, group) {
  const domain = new URL(tab.url).hostname;
  const groupName = group.title;
  
  if (!groupName || groupName === '') return;
  
  const { userPreferences = {} } = await chrome.storage.local.get('userPreferences');
  
  if (!userPreferences[domain]) {
    userPreferences[domain] = {};
  }
  
  if (!userPreferences[domain][groupName]) {
    userPreferences[domain][groupName] = 0;
  }
  
  userPreferences[domain][groupName]++;
  await chrome.storage.local.set({ userPreferences });
  
  console.log('Learned preference:', domain, '→', groupName);
}

// Get the user's preferred group for a domain based on past behavior
function getUserPreferredGroup(domain, userPreferences) {
  if (!userPreferences[domain]) return null;
  
  const groups = userPreferences[domain];
  let maxCount = 0;
  let preferredGroup = null;
  
  for (const [groupName, count] of Object.entries(groups)) {
    if (count > maxCount) {
      maxCount = count;
      preferredGroup = groupName;
    }
  }
  
  return maxCount >= 2 ? preferredGroup : null;
}

async function organizeTabs() {
  try {
    // Get all tabs in current window
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Get API key from storage
    const { apiKey } = await chrome.storage.local.get('apiKey');
    
    if (!apiKey) {
      throw new Error('API key not set');
    }
    
    // First, ungroup ALL existing tabs to clean slate
    const tabsToUngroup = tabs.filter(tab => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE);
    if (tabsToUngroup.length > 0) {
      await chrome.tabs.ungroup(tabsToUngroup.map(tab => tab.id));
    }
    
    // Get user's learned preferences
    const { userPreferences = {} } = await chrome.storage.local.get('userPreferences');
    
    // Prepare tab data for AI
    const tabData = tabs.map((tab, index) => {
      const domain = new URL(tab.url).hostname;
      const learnedGroup = getUserPreferredGroup(domain, userPreferences);
      
      return {
        index: index,
        title: tab.title,
        url: domain,
        learnedGroup: learnedGroup
      };
    });
    
    // Call Claude API to categorize tabs
    const categories = await categorizeTabs(tabData, apiKey);
    
    // Map indices back to real tab IDs and filter out invalid groups
    const categoriesWithRealIds = categories
      .map(category => ({
        ...category,
        tabIds: category.tabIndices.map(idx => tabs[idx].id).filter(id => id !== undefined)
      }))
      .filter(category => category.tabIds.length >= 2);
    
    // Create groups based on AI categorization
    const colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    let colorIndex = 0;
    let groupsCreated = 0;
    
    for (const category of categoriesWithRealIds) {
      if (category.tabIds.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds: category.tabIds });
        
        await chrome.tabGroups.update(groupId, {
          title: category.name,
          color: colors[colorIndex % colors.length],
          collapsed: false
        });
        
        colorIndex++;
        groupsCreated++;
      }
    }
    
    return {
      success: true,
      groupCount: groupsCreated
    };
    
  } catch (error) {
    console.error('Error organizing tabs:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function categorizeTabs(tabData, apiKey) {
  const prompt = `You are a tab organizer. Analyze these browser tabs and group them into logical categories.

Tabs:
${tabData.map((tab, i) => {
  let line = `${i}. ${tab.title} (${tab.url})`;
  if (tab.learnedGroup) {
    line += ` [User prefers: "${tab.learnedGroup}"]`;
  }
  return line;
}).join('\n')}

Return a JSON array of categories. Each category should have:
- "name": A short, clear category name (max 15 chars)
- "tabIndices": Array of tab indices that belong in this category

IMPORTANT RULES:
- RESPECT user preferences shown as [User prefers: "X"] - always use that exact group name
- Each category must have at least 2 tabs
- Aim for 3-5 categories total
- Group similar tabs together
- Every tab must be assigned to exactly one category

Return ONLY the JSON array, no other text. Example:
[{"name":"Work","tabIndices":[0,3,5]},{"name":"Social","tabIndices":[1,2,4]}]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // ← HAIKU MODEL
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      let errorMessage = 'API request failed';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    let content = data.content[0].text;
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const categories = JSON.parse(content);
    return categories;
    
  } catch (error) {
    console.error('Network or fetch error:', error);
    throw new Error(`Failed to connect to Claude API: ${error.message}`);
  }
}