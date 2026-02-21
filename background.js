// background.js - Calls backend API (NO API KEY!)

const BACKEND_URL = 'https://tab-organizer-backend.vercel.app';

// Generate or retrieve unique user ID for rate limiting
async function getUserId() {
  const { userId } = await chrome.storage.local.get('userId');
  
  if (userId) {
    return userId;
  }
  
  const newUserId = 'user_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  await chrome.storage.local.set({ userId: newUserId });
  return newUserId;
}

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

chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      const group = await chrome.tabGroups.get(tab.groupId);
      await learnFromUserAction(tab, group);
    }
  } catch (error) {
    // Ignore errors
  }
});

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
  
  console.log('✅ Learned:', domain, '→', groupName);
}

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

async function getUsageStats() {
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${BACKEND_URL}/api/usage?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get usage stats');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      used: 0,
      limit: 10,
      remaining: 10,
      resetDate: new Date().toLocaleDateString()
    };
  }
}

async function organizeTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    console.log(`📊 Organizing ${tabs.length} tabs`);
    
    const tabsToUngroup = tabs.filter(tab => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE);
    if (tabsToUngroup.length > 0) {
      await chrome.tabs.ungroup(tabsToUngroup.map(tab => tab.id));
    }
    
    const { userPreferences = {} } = await chrome.storage.local.get('userPreferences');
    
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
    
    const userId = await getUserId();
    
    const response = await fetch(`${BACKEND_URL}/api/organize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tabData,
        userId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to organize tabs');
    }
    
    const data = await response.json();
    const categories = data.categories;
    
    console.log('🤖 AI suggested categories:', categories);
    
    const validatedCategories = validateAndFixCategories(categories, tabs.length);
    
    console.log('✅ Validated categories:', validatedCategories);
    
    const categoriesWithRealIds = validatedCategories.map(category => ({
      ...category,
      tabIds: category.tabIndices
        .filter(idx => idx >= 0 && idx < tabs.length)
        .map(idx => tabs[idx].id)
    }));
    
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
        
        console.log(`📁 Created group: "${category.name}" with ${category.tabIds.length} tabs`);
        
        colorIndex++;
        groupsCreated++;
      }
    }
    
    return {
      success: true,
      groupCount: groupsCreated,
      remaining: data.remaining
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function validateAndFixCategories(categories, totalTabs) {
  if (!Array.isArray(categories) || categories.length === 0) {
    console.warn('⚠️ AI returned invalid response');
    return createFallbackCategories(totalTabs);
  }
  
  const assignedTabs = new Set();
  categories.forEach(cat => {
    if (cat.tabIndices && Array.isArray(cat.tabIndices)) {
      cat.tabIndices.forEach(idx => assignedTabs.add(idx));
    }
  });
  
  const orphanedTabs = [];
  for (let i = 0; i < totalTabs; i++) {
    if (!assignedTabs.has(i)) {
      orphanedTabs.push(i);
    }
  }
  
  if (orphanedTabs.length > 0) {
    console.warn(`⚠️ Found ${orphanedTabs.length} orphaned tabs`);
    
    let largestCat = categories[0];
    for (const cat of categories) {
      if (cat.tabIndices.length > largestCat.tabIndices.length) {
        largestCat = cat;
      }
    }
    
    largestCat.tabIndices.push(...orphanedTabs);
  }
  
  const lazyNames = ['other', 'misc', 'miscellaneous', 'random', 'stuff'];
  const betterNames = ['General', 'Mixed', 'Various', 'Additional'];
  
  categories.forEach(cat => {
    if (lazyNames.includes(cat.name.toLowerCase())) {
      const randomName = betterNames[Math.floor(Math.random() * betterNames.length)];
      console.warn(`⚠️ Renamed "${cat.name}" to "${randomName}"`);
      cat.name = randomName;
    }
  });
  
  const validCategories = categories.filter(cat => 
    cat.tabIndices && cat.tabIndices.length > 0
  );
  
  if (validCategories.length < 2) {
    return createFallbackCategories(totalTabs);
  }
  
  return validCategories;
}

function createFallbackCategories(totalTabs) {
  return [{
    name: 'All Tabs',
    tabIndices: Array.from({ length: totalTabs }, (_, i) => i)
  }];
}