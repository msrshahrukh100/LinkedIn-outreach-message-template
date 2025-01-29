// Initialize extension data on installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      templates: []
    }).then(() => {
      console.log('Storage initialized');
    }).catch((error) => {
      console.error('Error initializing storage:', error);
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_TEMPLATES') {
    chrome.storage.local.get(['templates'], (result) => {
      sendResponse({ templates: result.templates || [] });
    });
    return true; // Will respond asynchronously
  }
}); 