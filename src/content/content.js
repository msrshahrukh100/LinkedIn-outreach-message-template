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

  // Function to handle connect button click
  function handleConnectClick() {
    console.log('Connect button clicked');
    // Wait for the message box to appear
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkForMessageBox = setInterval(() => {
      attempts++;
      const messageBox = findMessageBox();
      
      if (messageBox) {
        clearInterval(checkForMessageBox);
        console.log('Message box found after', attempts, 'attempts');
        
        chrome.storage.local.get(['selectedTemplate'], (result) => {
          console.log('Retrieved selected template:', result.selectedTemplate);
          if (result.selectedTemplate) {
            fillConnectionMessage(result.selectedTemplate);
          } else {
            console.log('No template selected');
          }
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(checkForMessageBox);
        console.log('Gave up looking for message box after', maxAttempts, 'attempts');
      }
    }, 100); // Check every 100ms
  }

  // Function to set up connect button listeners
  function setupConnectButtonListeners() {
    // Look for any button that might be the connect button
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
      const buttonText = (button.textContent || '').toLowerCase();
      
      if (ariaLabel.includes('connect') || buttonText.includes('connect')) {
        console.log('Found connect button:', button);
        // Remove existing listener if any and add new one
        button.removeEventListener('click', handleConnectClick);
        button.addEventListener('click', handleConnectClick);
      }
    });
  }

  // Initial setup
  setupConnectButtonListeners();

  // Watch for new buttons being added
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        setupConnectButtonListeners();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log('Observer started');
}

// Function to check if we're on a profile page
function isProfilePage() {
  return window.location.href.includes('linkedin.com/in/');
}

// Function to initialize the extension
function initializeExtension() {
  console.log('Initializing extension on:', window.location.href);
  if (isProfilePage()) {
    observeConnectButton();
  }
}

// Function to handle URL changes
function setupURLChangeListener() {
  console.log('Setting up URL change listener');
  
  // Last known URL
  let lastUrl = window.location.href;
  
  // Create an observer instance to watch for URL changes
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('URL changed from', lastUrl, 'to', currentUrl);
      lastUrl = currentUrl;
      
      // If we're on a profile page, reinitialize
      if (isProfilePage()) {
        console.log('New page is a profile, reinitializing...');
        initializeExtension();
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document, {
    subtree: true,
    childList: true
  });

  // Also listen for popstate events (browser back/forward)
  window.addEventListener('popstate', () => {
    console.log('Navigation detected (popstate)');
    if (isProfilePage()) {
      initializeExtension();
    }
  });
}

// Start the extension
console.log('Content script loaded');
// Wait for the page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeExtension();
    setupURLChangeListener();
  });
} else {
  initializeExtension();
  setupURLChangeListener();
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