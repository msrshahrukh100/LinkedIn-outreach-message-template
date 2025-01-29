// Function to extract profile information
function extractProfileInfo() {
  let fullName = '';
  
  // Get name from the profile title
  const titleElement = document.querySelector('.artdeco-entity-lockup__title');
  console.log('Title element found:', titleElement);
  
  if (titleElement) {
    // Get all text nodes directly under the element (excluding span elements)
    const textNodes = Array.from(titleElement.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .filter(text => text.length > 0);
    
    console.log('Found text nodes:', textNodes);
    
    // Use the first non-empty text node (this will be the name without pronouns)
    if (textNodes.length > 0) {
      fullName = textNodes[0];
    }
  }

  // Clean up the full name
  if (fullName) {
    fullName = fullName
      .trim()
      .replace(/\s+/g, ' '); // Normalize spaces
  }

  console.log('Cleaned full name:', fullName);

  // Extract first name from the full name
  let firstName = '';
  if (fullName) {
    // Get the first part of the name
    firstName = fullName.split(/\s+/)[0];

    // Clean up the first name
    firstName = firstName
      .replace(/[()[\]{}]/g, '') // Remove any brackets
      .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '') // Remove non-letter characters from start and end
      .trim();
  }

  console.log('Final extracted info:', { fullName, firstName });
  
  return {
    name: firstName,
  };
}

// Function to replace placeholders in template
function replacePlaceholders(template, profileInfo) {
  const result = template.replace(/\{(\w+)\}/g, (match, key) => {
    console.log('Replacing placeholder:', { match, key, value: profileInfo[key] });
    return profileInfo[key] || match;
  });
  console.log('Template after replacement:', result);
  return result;
}

// Function to find the message input box
function findMessageBox() {
  // Try different possible selectors
  const selectors = [
    '.connect-button-send-invite__custom-message',
    'textarea[name="message"]',
    '#custom-message',
    'textarea[placeholder*="know each other"]',
    'textarea.ember-text-area'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('Found message box with selector:', selector);
      return element;
    }
  }
  
  console.log('No message box found with any selector');
  console.log('Available textareas:', document.querySelectorAll('textarea'));
  return null;
}

// Function to fill the connection message
function fillConnectionMessage(template) {
  console.log('Attempting to fill message with template:', template);
  const messageBox = findMessageBox();
  console.log('Found message box:', messageBox);
  
  if (messageBox) {
    const profileInfo = extractProfileInfo();
    const message = replacePlaceholders(template, profileInfo);
    
    // Set the value
    messageBox.value = message;
    console.log('Set message box value to:', message);
    
    // Try different ways to trigger the input event
    messageBox.dispatchEvent(new Event('input', { bubbles: true }));
    messageBox.dispatchEvent(new Event('change', { bubbles: true }));
    messageBox.dispatchEvent(new Event('blur', { bubbles: true }));
    console.log('Dispatched input events');
  } else {
    console.log('Message box not found');
  }
}

// Function to observe the connect button click
function observeConnectButton() {
  console.log('Starting to observe for connect button click');
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        const messageBox = findMessageBox();
        if (messageBox) {
          console.log('Message box found in mutation observer');
          // When message box is found, get template and fill
          chrome.storage.local.get(['selectedTemplate'], (result) => {
            console.log('Retrieved selected template:', result.selectedTemplate);
            if (result.selectedTemplate) {
              fillConnectionMessage(result.selectedTemplate);
            } else {
              console.log('No template selected');
            }
          });
          // Stop observing once we've found and filled the message box
          observer.disconnect();
          console.log('Disconnected observer');
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log('Observer started');
}

// Function to initialize the extension
function initializeExtension() {
  console.log('Initializing extension');
  observeConnectButton();
}

// Start the extension
console.log('Content script loaded');
// Wait for the page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.type === 'FILL_TEMPLATE') {
    fillConnectionMessage(request.template);
    sendResponse({ success: true });
  }
  return true;
}); 