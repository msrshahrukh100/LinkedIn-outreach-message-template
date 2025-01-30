// Function to extract profile information
function extractProfileInfo() {
  let fullName = '';
  const titleElement = document.querySelector('.artdeco-entity-lockup__title');
  
  if (titleElement) {
    const textNodes = Array.from(titleElement.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .filter(text => text.length > 0);
    
    if (textNodes.length > 0) {
      fullName = textNodes[0];
    }
  }

  if (fullName) {
    fullName = fullName.trim().replace(/\s+/g, ' ');
    const firstName = fullName.split(/\s+/)[0]
      .replace(/[()[\]{}]/g, '')
      .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
      .trim();
    
    return { name: firstName };
  }
  
  return { name: '' };
}

// Function to replace placeholders in template
function replacePlaceholders(template, profileInfo) {
  return template.replace(/\{(\w+)\}/g, (match, key) => profileInfo[key] || match);
}

// Function to wait for an element to be present in the DOM
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      resolve(document.querySelector(selector));
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found`));
    }, timeout);
  });
}

// Function to find and click the "Add a note" button
async function clickAddNoteButton() {
  try {
    // First, wait for the initial dialog
    const dialog = await waitForElement('.artdeco-modal--layer-default.send-invite');
    
    // Then find the "Add a note" button within this dialog
    const addNoteButton = dialog.querySelector('button[aria-label="Add a note"]');
    if (addNoteButton) {
      addNoteButton.click();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Function to find the message input box
async function findMessageBox() {
  try {
    // Wait for the dialog first
    const dialog = await waitForElement('.artdeco-modal--layer-default.send-invite');
    
    // Look for the textarea within the dialog
    const messageBox = dialog.querySelector('#custom-message, textarea[name="message"]');
    if (messageBox) {
      return messageBox;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Function to fill the message box with template
async function fillMessageBox(template) {
  try {
    const messageBox = await waitForElement('#custom-message, textarea[name="message"]', 5000);
    if (!messageBox) return false;

    const profileInfo = extractProfileInfo();
    const message = replacePlaceholders(template, profileInfo);
    
    // Set the value
    messageBox.value = message;
    messageBox.focus();
    
    // Dispatch events
    const events = ['input', 'change', 'keyup'];
    events.forEach(eventType => {
      messageBox.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
    
    // Update character counter
    const counter = document.querySelector('.t-14.t-black--light.flex-1.text-align-right');
    if (counter) {
      counter.textContent = `${message.length}/300`;
    }

    return true;
  } catch (error) {
    console.error('Error in fillMessageBox:', error);
    return false;
  }
}

// Function to initialize the extension
function initializeExtension() {
  if (window.location.href.includes('linkedin.com/in/')) {
    // Watch for the connection dialog
    const observer = new MutationObserver(async (mutations) => {
      const dialog = document.querySelector('.artdeco-modal--layer-default.send-invite');
      if (dialog) {
        // Get the template
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['selectedTemplate'], resolve);
        });

        if (!result?.selectedTemplate) return;

        // Find and click "Add a note" button
        const addNoteButton = dialog.querySelector('button[aria-label="Add a note"]');
        if (addNoteButton) {
          addNoteButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          await fillMessageBox(result.selectedTemplate);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Start the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FILL_TEMPLATE') {
    fillMessageBox(request.template).then(success => {
      sendResponse({ success });
    });
    return true;
  }
}); 