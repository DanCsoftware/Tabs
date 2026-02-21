// background.js - Production version with improved AI prompting and validation

// Import configuration
importScripts('config.js');

const CLAUDE_API_KEY = CONFIG.CLAUDE_API_KEY;
const FREE_TIER_LIMIT = CONFIG.FREE_TIER_LIMIT || 10;

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
  
  console.log('✅ Learned:', domain, '→', groupName);
}

// Get user's preferred group for a domain
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

// Check and update usage limits
async function checkUsageLimit() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  const { usageData = {} } = await chrome.storage.local.get('usageData');
  
  // Reset if new month
  if (usageData.month !== currentMonth) {
    usageData.month = currentMonth;
    usageData.count = 0;
  }
  
  // Check limit
  if (usageData.count >= FREE_TIER_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetDate: getNextMonthDate()
    };
  }
  
  // Increment count
  usageData.count++;
  await chrome.storage.local.set({ usageData });
  
  return {
    allowed: true,
    remaining: FREE_TIER_LIMIT - usageData.count,
    resetDate: getNextMonthDate()
  };
}

function getNextMonthDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString();
}

async function getUsageStats() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  const { usageData = { month: currentMonth, count: 0 } } = await chrome.storage.local.get('usageData');
  
  // Reset if new month
  if (usageData.month !== currentMonth) {
    usageData.month = currentMonth;
    usageData.count = 0;
    await chrome.storage.local.set({ usageData });
  }
  
  return {
    used: usageData.count,
    limit: FREE_TIER_LIMIT,
    remaining: FREE_TIER_LIMIT - usageData.count,
    resetDate: getNextMonthDate()
  };
}

async function organizeTabs() {
  try {
    // Check API key
    if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'YOUR_CLAUDE_API_KEY_HERE') {
      throw new Error('Extension not configured. Please add your API key to config.js');
    }
    
    // Check usage limit
    const usage = await checkUsageLimit();
    if (!usage.allowed) {
      throw new Error(`Monthly limit reached (${FREE_TIER_LIMIT}/month). Resets on ${usage.resetDate}`);
    }
    
    // Get all tabs
    const tabs = await chrome.tabs.query({ currentWindow: true });
    console.log(`📊 Organizing ${tabs.length} tabs`);
    
    // Ungroup existing tabs
    const tabsToUngroup = tabs.filter(tab => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE);
    if (tabsToUngroup.length > 0) {
      await chrome.tabs.ungroup(tabsToUngroup.map(tab => tab.id));
    }
    
    // Get learned preferences
    const { userPreferences = {} } = await chrome.storage.local.get('userPreferences');
    
    // Prepare tab data
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
    
    // Call AI to categorize
    const categories = await categorizeTabs(tabData);
    
    console.log('🤖 AI suggested categories:', categories);
    
    // Validate AI response
    const validatedCategories = validateAndFixCategories(categories, tabs.length);
    
    console.log('✅ Validated categories:', validatedCategories);
    
    // Map to real tab IDs
    const categoriesWithRealIds = validatedCategories.map(category => ({
      ...category,
      tabIds: category.tabIndices
        .filter(idx => idx >= 0 && idx < tabs.length)
        .map(idx => tabs[idx].id)
    }));
    
    // Create groups
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
      remaining: usage.remaining
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Validate and fix AI categorization
function validateAndFixCategories(categories, totalTabs) {
  // Check if response is valid
  if (!Array.isArray(categories) || categories.length === 0) {
    console.warn('⚠️ AI returned invalid response, using fallback');
    return createFallbackCategories(totalTabs);
  }
  
  // Flatten all tab indices to see which tabs are assigned
  const assignedTabs = new Set();
  categories.forEach(cat => {
    if (cat.tabIndices && Array.isArray(cat.tabIndices)) {
      cat.tabIndices.forEach(idx => assignedTabs.add(idx));
    }
  });
  
  // Find orphaned tabs (not assigned to any group)
  const orphanedTabs = [];
  for (let i = 0; i < totalTabs; i++) {
    if (!assignedTabs.has(i)) {
      orphanedTabs.push(i);
    }
  }
  
  // If there are orphaned tabs, add them to the largest group
  if (orphanedTabs.length > 0) {
    console.warn(`⚠️ Found ${orphanedTabs.length} orphaned tabs, adding to groups`);
    
    // Find largest category
    let largestCat = categories[0];
    for (const cat of categories) {
      if (cat.tabIndices.length > largestCat.tabIndices.length) {
        largestCat = cat;
      }
    }
    
    // Add orphans to largest category
    largestCat.tabIndices.push(...orphanedTabs);
  }
  
  // Filter out categories with generic/lazy names and fix them
  const lazyNames = ['other', 'misc', 'miscellaneous', 'random', 'stuff', 'rest'];
  const betterNames = ['General', 'Mixed', 'Various', 'Additional', 'Extra'];
  
  categories.forEach(cat => {
    if (lazyNames.includes(cat.name.toLowerCase())) {
      const randomName = betterNames[Math.floor(Math.random() * betterNames.length)];
      console.warn(`⚠️ Renamed lazy category "${cat.name}" to "${randomName}"`);
      cat.name = randomName;
    }
  });
  
  // Ensure no empty categories
  const validCategories = categories.filter(cat => 
    cat.tabIndices && cat.tabIndices.length > 0
  );
  
  // If we ended up with too few categories, that's OK - better than orphaned tabs
  if (validCategories.length < 2) {
    console.warn('⚠️ Only got 1 category, using fallback');
    return createFallbackCategories(totalTabs);
  }
  
  return validCategories;
}

// Fallback categorization if AI fails
function createFallbackCategories(totalTabs) {
  // Simple fallback: put all tabs in one "All Tabs" group
  return [{
    name: 'All Tabs',
    tabIndices: Array.from({ length: totalTabs }, (_, i) => i)
  }];
}

async function categorizeTabs(tabData) {
  // Stronger, more explicit prompt
  const prompt = `You are an expert tab organizer. Analyze these browser tabs and create smart categories.

Tabs to organize:
${tabData.map((tab, i) => {
  let line = `${i}. ${tab.title} (${tab.url})`;
  if (tab.learnedGroup) {
    line += ` [User's preference: "${tab.learnedGroup}"]`;
  }
  return line;
}).join('\n')}

CRITICAL REQUIREMENTS:
1. Create 3-5 categories (or fewer if there are very few tabs)
2. Use SPECIFIC category names based on content: "Development", "Social Media", "Shopping", "Work", "Entertainment", "Research", etc.
3. NEVER use generic names like "Other", "Misc", "Random", "Stuff", "Miscellaneous"
4. If user preference is shown [User's preference: "X"], ALWAYS use that EXACT category name
5. EVERY tab MUST be assigned to a category (no tab left behind!)
6. Each category should have at least 1 tab (single-tab categories are OK)
7. Group related tabs together intelligently

Return ONLY valid JSON (no markdown, no explanation):
[{"name":"Development","tabIndices":[0,2,5]},{"name":"Social Media","tabIndices":[1,3,4]}]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature = more consistent
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    let content = data.content[0].text;
    
    console.log('🤖 Raw AI response:', content);
    
    // Strip markdown code fences
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Parse JSON
    const categories = JSON.parse(content);
    
    return categories;
    
  } catch (error) {
    console.error('❌ AI error:', error);
    throw new Error('Failed to organize tabs');
  }
}