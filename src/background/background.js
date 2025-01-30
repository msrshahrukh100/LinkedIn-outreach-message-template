// Initialize extension data on installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ templates: [] });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_TEMPLATES') {
    chrome.storage.local.get(['templates'], (result) => {
      sendResponse({ templates: result.templates || [] });
    });
    return true;
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('linkedin.com/in/')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }
});

// Listen for navigation events
chrome.webNavigation?.onHistoryStateUpdated?.addListener((details) => {
  // Check if the navigation is to a LinkedIn page
  if (details.url.includes('linkedin.com')) {
    // Re-inject the content script
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ['content.js']
    }).catch(error => {
      console.log('Content script injection error:', error);
    });
  }
}); 