import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  useEffect(() => {
    // Load templates and selected template from storage when component mounts
    chrome.storage.local.get(['templates', 'selectedTemplate'], (result) => {
      setTemplates(result.templates || []);
      setSelectedTemplate(result.selectedTemplate || null);
    });
  }, []);

  const handleAddTemplate = () => {
    if (newTemplate.trim()) {
      const updatedTemplates = [...templates, newTemplate.trim()];
      // Save to Chrome storage
      chrome.storage.local.set({ templates: updatedTemplates }, () => {
        setTemplates(updatedTemplates);
        setNewTemplate('');
      });
    }
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditingText(templates[index]);
  };

  const handleSaveEdit = (index) => {
    if (editingText.trim()) {
      const updatedTemplates = [...templates];
      updatedTemplates[index] = editingText.trim();
      
      chrome.storage.local.set({ templates: updatedTemplates }, () => {
        setTemplates(updatedTemplates);
        // If this was the selected template, update it
        if (selectedTemplate === templates[index]) {
          chrome.storage.local.set({ selectedTemplate: editingText.trim() });
          setSelectedTemplate(editingText.trim());
        }
      });
    }
    setEditingIndex(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleSelectTemplate = (template) => {
    chrome.storage.local.set({ selectedTemplate: template }, () => {
      setSelectedTemplate(template);
      // Send message to content script to update if connection popup is open
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url?.includes('linkedin.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'FILL_TEMPLATE',
            template: template
          }).catch(error => {
            // Ignore the error about receiving end not existing
            console.log('Content script not ready or not loaded on this page');
          });
        }
      });
    });
  };

  const handleCopyTemplate = (template) => {
    navigator.clipboard.writeText(template)
      .then(() => {
        // Optional: Add some visual feedback
        const button = document.activeElement;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  const handleDeleteTemplate = (index) => {
    const updatedTemplates = templates.filter((_, i) => i !== index);
    const deletedTemplate = templates[index];
    
    chrome.storage.local.set({ templates: updatedTemplates }, () => {
      setTemplates(updatedTemplates);
      // If the deleted template was selected, clear the selection
      if (deletedTemplate === selectedTemplate) {
        chrome.storage.local.remove(['selectedTemplate'], () => {
          setSelectedTemplate(null);
        });
      }
    });
  };

  const toggleMenu = (index) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  return (
    <div className="app">
      <h1>LinkedIn Message Templates</h1>
      <div className="template-help">
        <p>Use {'{name}'} as a placeholder for the person's name</p>
      </div>
      <div className="template-input">
        <div className="textarea-container">
          <textarea
            value={newTemplate}
            onChange={(e) => setNewTemplate(e.target.value)}
            placeholder="Enter your message template... Example: Hi {name}! I'd like to connect..."
          />
          <div className="char-count">{newTemplate.length} characters</div>
        </div>
        <button onClick={handleAddTemplate}>Add Template</button>
      </div>
      <div className="templates-list">
        {templates.map((template, index) => (
          <div key={index} className="template-item">
            {editingIndex === index ? (
              <div className="template-edit">
                <div className="textarea-container">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    autoFocus
                  />
                  <div className="char-count">{editingText.length} characters</div>
                </div>
                <div className="edit-actions">
                  <button onClick={() => handleSaveEdit(index)}>Save</button>
                  <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="template-header">
                  <div className={`template-text ${selectedTemplate === template ? 'selected' : ''}`}>
                    <p>{template}</p>
                  </div>
                  <button 
                    className="menu-button"
                    onClick={() => toggleMenu(index)}
                  >
                    ⋮
                  </button>
                </div>
                {openMenuIndex === index && (
                  <div className="template-actions">
                    <button 
                      onClick={() => handleSelectTemplate(template)}
                      className={`select-btn ${selectedTemplate === template ? 'selected' : ''}`}
                    >
                      {selectedTemplate === template ? 'Selected' : 'Select'}
                    </button>
                    <button onClick={() => handleCopyTemplate(template)}>Copy</button>
                    <button onClick={() => handleStartEdit(index)}>Edit</button>
                    <button 
                      onClick={() => handleDeleteTemplate(index)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App; 