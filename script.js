import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Sandpack } from "@codesandbox/sandpack-react";

// Initialize React root
const root = createRoot(document.getElementById("root"));

// Initialize persistence (will be available after DOM loads)
let appPersistence;
function getCurrentUsecase() {
  const path = window.location.pathname;
  if (path === '/resume') {
    return 'resume';
  }
  return 'default';
}
// Typing animation functionality
function initializeTypingAnimation() {
    const words = ['idea', 'prompt'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const animatedWord = document.getElementById('animated-word');
    
    if (!animatedWord) return;
    
    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            // Remove characters
            animatedWord.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(type, 500); // Pause before typing next word
                return;
            }
        } else {
            // Add characters
            animatedWord.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            
            if (charIndex === currentWord.length) {
                setTimeout(() => {
                    isDeleting = true;
                    type();
                }, 2000); // Pause before deleting
                return;
            }
        }
        
        setTimeout(type, isDeleting ? 100 : 150); // Typing speed
    }
    
    // Start the animation after a brief delay
    setTimeout(type, 1000);
}

// Theme management - Always dark theme
function initializeTheme() {
    // Always set dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
}

// Initialize prompts with saved data (will be loaded on DOM ready)
let prompts = [];

// Flag to track when we're intentionally clearing session data
let isResettingSession = false;

// Function to clear previous session data when starting a new chat
function clearPreviousSessionData() {
  console.log('🧹 Clearing session data (preserving critical settings) before new chat...');
  
  // Show a brief loading indicator
  const existingLoader = document.getElementById('sessionClearLoader');
  if (!existingLoader) {
    const loader = document.createElement('div');
    loader.id = 'sessionClearLoader';
    loader.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--blue-color);
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 0.9rem;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    loader.textContent = '🧹 Clearing session data & cache...';
    document.body.appendChild(loader);
    
    // Remove after a short delay
    setTimeout(() => {
      if (document.getElementById('sessionClearLoader')) {
        document.body.removeChild(loader);
      }
    }, 3000);
  }
  
  // Clear in-memory data
  prompts = [];
  
  // Hide download button when clearing session data
  hideDownloadButton();
  
  // SELECTIVE CLEAR: Clear session data but preserve critical settings
  try {
    // Save current view toggle state before clearing
    const sandpackContainer = document.getElementById('root');
    let currentViewState = { currentView: 'code' };
    if (sandpackContainer) {
      if (sandpackContainer.classList.contains('preview-mode')) {
        currentViewState.currentView = 'preview';
      } else if (sandpackContainer.classList.contains('code-mode')) {
        currentViewState.currentView = 'code';
      }
    }
    
    // Use selective clearing to preserve theme and view toggle state
    if (appPersistence && appPersistence.isStorageAvailable()) {
      // Save current view state
      appPersistence.saveViewToggleState(currentViewState);
      // Clear all except critical settings
      appPersistence.clearAllExceptCritical();
      console.log('🧹 CLEARED session data (preserved theme & view toggle state)');
    } else {
      // Fallback: manual selective clear
      const themeValue = localStorage.getItem('theme');
      const viewToggleValue = localStorage.getItem('webbuilder_view_toggle_state');
      
      localStorage.clear();
      
      if (themeValue) {
        localStorage.setItem('theme', themeValue);
      }
      if (viewToggleValue) {
        localStorage.setItem('webbuilder_view_toggle_state', viewToggleValue);
      } else {
        localStorage.setItem('webbuilder_view_toggle_state', JSON.stringify(currentViewState));
      }
      console.log('🧹 CLEARED session data (preserved critical settings via fallback)');
    }
    
    // Try to clear any cached data in browser storage APIs
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('sandpack') || cacheName.includes('codesandbox')) {
            caches.delete(cacheName).then(() => {
              console.log('🗑️ Cleared cache:', cacheName);
            });
          }
        });
      }).catch(e => console.log('Cache clearing failed:', e.message));
    }
  } catch (error) {
    console.warn('Error clearing localStorage:', error);
  }
  
  // Force Sandpack to completely restart with cache busting
  if (window.forceSandpackRestart) {
    window.forceSandpackRestart();
    console.log('🔄 Forced Sandpack restart with cache busting - new iframe created');
    
    // Set default files after restart
    setTimeout(() => {
      if (window.setAllSandpackFiles) {
        window.setAllSandpackFiles(Object.fromEntries(
          Object.entries(defaultCodeFiles).map(([filePath, file]) => [filePath, file.code])
        ));
        console.log('📁 Set default files after restart');
      }
    }, 200);
  }
  
  console.log('✅ Session data cleared with critical settings preserved!');
}

// Function to completely clear all session data
function clearAllSessionData() {
  console.log('🧹 Starting COMPLETE localStorage cleanup...');
  isResettingSession = true;
  
  // Debug: Show what's in localStorage before clearing
  console.log('📋 LocalStorage before clearing:');
  debugLocalStorage();
  
  // Clear in-memory data
  prompts = [];
  console.log('✅ Cleared in-memory prompts');
  
  // Hide download button when clearing all session data
  hideDownloadButton();
  
  // NUCLEAR OPTION: Clear ALL localStorage except theme
  try {
    const themeValue = localStorage.getItem('theme'); // Preserve theme setting
    
    // Clear everything
    localStorage.clear();
    console.log('🧹 CLEARED ALL localStorage');
    
    // Try to clear any cached data in browser storage APIs
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('sandpack') || cacheName.includes('codesandbox')) {
            caches.delete(cacheName).then(() => {
              console.log('🗑️ Cleared cache:', cacheName);
            });
          }
        });
      }).catch(e => console.log('Cache clearing failed:', e.message));
    }
    
    // Restore theme if it existed
    if (themeValue) {
      localStorage.setItem('theme', themeValue);
      console.log('✅ Restored theme setting:', themeValue);
    }
    
    // Reset UI state to homepage
    if (appPersistence && appPersistence.isStorageAvailable()) {
      appPersistence.saveUIState({ chatVisible: false });
      console.log('✅ Set UI state to homepage');
    }
  } catch (error) {
    console.warn('Error clearing localStorage:', error);
  }
  
  // Clear UI elements
  const chatContainer = document.getElementById('chatContainer');
  if (chatContainer) {
    chatContainer.innerHTML = '';
  }
  
  // Force Sandpack to completely restart (creates new iframe)
  if (window.forceSandpackRestart) {
    window.forceSandpackRestart();
    console.log('🔄 Forced Sandpack restart for homepage reset');
    
    setTimeout(() => {
      if (window.setAllSandpackFiles) {
        window.setAllSandpackFiles(Object.fromEntries(
          Object.entries(defaultCodeFiles).map(([filePath, file]) => [filePath, file.code])
        ));
        console.log('📁 Reset to default files');
      }
      
      // Debug: Show what's in localStorage after clearing
      setTimeout(() => {
        console.log('📋 LocalStorage after clearing:');
        debugLocalStorage();
        console.log('🎉 ALL localStorage cleared - completely fresh start!');
      }, 50);
      
      isResettingSession = false;
    }, 150);
  } else {
    isResettingSession = false;
  }
}

// Default code files for Sandpack
const defaultCodeFiles = {
  "/App.js": {
    code: `import React from 'react';
import './styles.css';
import Greeting from './components/Greeting';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Welcome to LLM Coder</h1>
      </header>
      <main className="app-main">
        <Greeting />
        <div className="content-section">
          <p>Start building your application here!</p>
        </div>
      </main>
      <footer className="app-footer">
        <p>Created with React</p>
      </footer>
    </div>
  );
}

export default App;`,
    hidden: false,
  },
  "/components/Greeting.js": {
    code: `import React from 'react';

function Greeting() {
  const currentTime = new Date().getHours();
  let greeting = 'Hello';
  
  if (currentTime < 12) {
    greeting = 'Good morning';
  } else if (currentTime < 18) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  return (
    <div className="greeting-container">
      <h2>{greeting}, LLM Coder!</h2>
      <p className="greeting-subtitle">Welcome to your AI-powered development environment</p>
    </div>
  );
}

export default Greeting;`,
    hidden: false,
  },
  "/index.js": {
    code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    hidden: false,
  },
  "/styles.css": {
    code: `/* Reset default styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #333;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #256dcf;
  padding: 1rem;
  color: white;
  text-align: center;
}

.app-header h1 {
  font-size: 2rem;
  margin: 0;
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.greeting-container {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.greeting-container h2 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.greeting-subtitle {
  color: #666;
  font-size: 1.1rem;
}

.content-section {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-footer {
  background-color: #f5f5f5;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #ddd;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .app-main {
    padding: 1rem;
  }

  .greeting-container {
    padding: 1rem;
  }

  .greeting-container h2 {
    font-size: 1.5rem;
  }

  .greeting-subtitle {
    font-size: 1rem;
  }
}`,
    hidden: false,
  },
  "/index.html": {
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="root"></div>
</body>
</html>`,
    hidden: false,
  }
};

// Template configurations
const templateConfigs = {
  'react': {
    template: 'react',
    entry: '/index.js',
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.22.0'
    }
  },
  'vue': {
    template: 'vue',
    entry: '/src/main.js',
    dependencies: {
      'vue': '^3.3.0'
    }
  },
  'angular': {
    template: 'angular',
    entry: '/src/main.ts',
    dependencies: {
      '@angular/core': '^16.0.0',
      '@angular/common': '^16.0.0',
      '@angular/platform-browser': '^16.0.0'
    }
  },
  'svelte': {
    template: 'svelte',
    entry: '/src/main.js',
    dependencies: {
      'svelte': '^4.0.0'
    }
  },
  'vanilla': {
    template: 'vanilla',
    entry: '/index.html',
    dependencies: {}
  }
};

// Main App component
function App() {
  // Add a key to force Sandpack re-render when needed
  const [sandpackKey, setSandpackKey] = useState(0);
  // Add cache busting timestamp for Sandpack bundler URL
  const [cacheBustTimestamp, setCacheBustTimestamp] = useState(Date.now());
  
  // Initialize state with saved data or defaults
  const [codeFiles, setCodeFiles] = useState(() => {
    // Don't load saved files if we're in the middle of resetting session
    if (isResettingSession) {
      return defaultCodeFiles;
    }
    
    if (window.appPersistence && window.appPersistence.isStorageAvailable()) {
      const savedFiles = window.appPersistence.loadCodeFiles();
      // Only use saved files if they exist AND we have an active chat session
      const chatHistory = window.appPersistence.loadChatHistory();
      const uiState = window.appPersistence.loadUIState();
      
      if (savedFiles && chatHistory.length > 0 && uiState.chatVisible) {
        return savedFiles;
      }
    }
    return defaultCodeFiles;
  });

  const [currentTemplate, setCurrentTemplate] = useState(() => {
    if (window.appPersistence && window.appPersistence.isStorageAvailable()) {
      // Only use saved template if we have an active chat session
      const chatHistory = window.appPersistence.loadChatHistory();
      const uiState = window.appPersistence.loadUIState();
      
      if (chatHistory.length > 0 && uiState.chatVisible) {
        return window.appPersistence.loadTemplate();
      }
    }
    return 'react';
  });

  const [editorHeight, setEditorHeight] = useState(500);
  const [sandpackError, setSandpackError] = useState(null);

  // Save state whenever it changes, but only if we have an active chat session
  useEffect(() => {
    // Don't save if we're in the middle of resetting session
    if (isResettingSession) {
      return;
    }
    
    if (window.appPersistence && window.appPersistence.isStorageAvailable()) {
      // Only save code files if we have an active chat session
      const uiState = window.appPersistence.loadUIState();
      const chatHistory = window.appPersistence.loadChatHistory();
      if (uiState.chatVisible && chatHistory.length > 0) {
        window.appPersistence.saveCodeFiles(codeFiles);
      }
    }
  }, [codeFiles]);

  useEffect(() => {
    if (window.appPersistence && window.appPersistence.isStorageAvailable()) {
      window.appPersistence.saveTemplate(currentTemplate);
    }
  }, [currentTemplate]);

  // Function to calculate editor height
  const calculateEditorHeight = () => {
    const windowHeight = window.innerHeight;
    const headerHeight = 60; // Approximate height of header/navigation
    const padding = 40; // Padding for spacing
    const newHeight = windowHeight - headerHeight - padding;
    setEditorHeight(Math.max(newHeight, 300)); // Minimum height of 300px
  };

  // Update editor height on mount and window resize
  useEffect(() => {
    calculateEditorHeight();
    window.addEventListener('resize', calculateEditorHeight);
    return () => window.removeEventListener('resize', calculateEditorHeight);
  }, []);

  // Function to update a single Sandpack file
  const updateSandpackFiles = (newCode, filePath = "/App.js") => {
    setCodeFiles(prevFiles => ({
      ...prevFiles,
      [filePath]: {
        ...(prevFiles[filePath] || {}), // Ensure filePath exists or initialize
        code: newCode,
        hidden: false // Ensure file is visible if updated/created
      }
    }));
    calculateEditorHeight();
  };

  // Function to replace all Sandpack files with a new set
  const setAllSandpackFiles = (newFilesObjectFromAI) => {
    try {
      const formattedFiles = Object.entries(newFilesObjectFromAI).reduce((acc, [filePath, code]) => {
        acc[filePath] = {
          code,
          hidden: false
        };
        return acc;
      }, {});
      
      setCodeFiles(formattedFiles);
      calculateEditorHeight();
    } catch (error) {
      console.error("Error replacing Sandpack files:", error);
    }
  };

  // Function to update template based on language
  const updateTemplate = (language) => {
    const normalizedLanguage = language.toLowerCase().replace(/\\s+/g, '');
    const templateConfig = templateConfigs[normalizedLanguage] || templateConfigs['react'];
    setCurrentTemplate(templateConfig.template);
    setCodeFiles(prevFiles => ({...prevFiles}));
    calculateEditorHeight();
  };

  // Make functions available globally
  useEffect(() => {
    window.updateSandpackFiles = updateSandpackFiles;
    window.setAllSandpackFiles = setAllSandpackFiles;
    window.updateTemplate = updateTemplate;
    window.getCurrentCodeFiles = () => codeFiles;
    window.getSandpackError = () => sandpackError;
    
    // Enhanced Sandpack restart function that tries to clear iframe localStorage
    window.forceSandpackRestart = () => {
      console.log('🔄 Forcing Sandpack restart with cache bust...');
      
      // Update cache bust timestamp to force new bundler URL
      setCacheBustTimestamp(Date.now());
      
      // Change the key to force complete re-render
      setSandpackKey(prev => prev + 1);
      
      // Try to communicate with the Sandpack iframe to clear its localStorage
      setTimeout(() => {
        try {
          // Find all Sandpack iframes and try to send a clear message
          const iframes = document.querySelectorAll('iframe[src*="sandpack-bundler"]');
          iframes.forEach(iframe => {
            try {
              // Try to post a message to clear storage (this might not work due to CORS but worth trying)
              iframe.contentWindow?.postMessage({ type: 'CLEAR_STORAGE' }, '*');
              console.log('📤 Sent clear storage message to Sandpack iframe');
            } catch (e) {
              console.log('⚠️ Could not send message to iframe (expected due to CORS):', e.message);
            }
          });
        } catch (error) {
          console.log('⚠️ Error communicating with Sandpack iframe:', error.message);
        }
      }, 100);
      
      console.log('🎯 Sandpack restart complete with new cache-bust timestamp');
    };
  }, [codeFiles, sandpackError]);

  // Sandpack error handler
  const handleSandpackError = (error) => {
    console.error("Sandpack Runtime Error:", error);
    const errorMessage = error.message || (typeof error === 'string' ? error : 'An unknown error occurred in Sandpack.');
    setSandpackError(errorMessage);
    displayChatMessage('system', `⚠️ Code Error Detected: ${errorMessage}`);
    showFixButton(errorMessage);
  };

  return React.createElement(
    Sandpack,
    {
      key: sandpackKey, // Force re-render when key changes
      template: currentTemplate,
      files: codeFiles,
      customSetup: {
        dependencies: templateConfigs[currentTemplate]?.dependencies || {},
        entry: templateConfigs[currentTemplate]?.entry || '/index.js',
        environment: "create-react-app"
      },
      options: {
        recompileMode: "delayed",
        recompileDelay: 300,
        bundlerURL: `https://sandpack-bundler.codesandbox.io?cacheBust=${cacheBustTimestamp}&clearStorage=true`,
        autorun: true,
        showLineNumbers: true,
        showInlineErrors: true,
        showConsole: false,
        showConsoleButton: false,
        closableTabs: true,
        wrapContent: true,
        editorHeight: editorHeight,
      },
      listeners: {
        error: handleSandpackError,
        timeout: (err) => handleSandpackError(new Error("Sandpack timeout: The code took too long to run.")),
        success: () => setSandpackError(null),
        start: () => setSandpackError(null)
      }
    }
  );
}

// Render the App
root.render(React.createElement(App));

// Chat functionality
class Prompt {
  constructor(role, message) {
    this.role = role;
    this.message = message;
  }
}

// Function to get the currently selected quality
function getCurrentQualityLevel() {
  // Prefer chat interface dropdown if visible, otherwise use landing page's
  const chatQualitySelect = document.getElementById('qualitySelectChat');
  const landingQualitySelect = document.getElementById('qualitySelectLanding');
  
  if (chatQualitySelect && chatQualitySelect.closest('.chat-interface')?.style.display !== 'none') {
    return chatQualitySelect.value;
  }
  return landingQualitySelect ? landingQualitySelect.value : 'standard';
}

// Function to synchronize quality dropdowns
function synchronizeQualityDropdowns(sourceId) {
  const chatQualitySelect = document.getElementById('qualitySelectChat');
  const landingQualitySelect = document.getElementById('qualitySelectLanding');
  const sourceSelect = document.getElementById(sourceId);

  if (sourceSelect && chatQualitySelect && sourceId === 'qualitySelectLanding') {
    chatQualitySelect.value = sourceSelect.value;
  } else if (sourceSelect && landingQualitySelect && sourceId === 'qualitySelectChat') {
    landingQualitySelect.value = sourceSelect.value;
  }
  
  // Save quality setting
  if (appPersistence && appPersistence.isStorageAvailable() && sourceSelect) {
    appPersistence.saveQualitySetting(sourceSelect.value);
  }
}

// Function to display chat messages
function displayChatMessage(role, message) {
  const chatContainer = document.getElementById('chatContainer');
  const chatInterface = document.getElementById('chatInterface');
  
  if (!chatContainer) return;
  
  // Remove any existing fix button before adding new message or button
  const existingFixButton = chatContainer.querySelector('.fix-button');
  if (existingFixButton) {
    existingFixButton.remove();
  }

  chatInterface.style.display = 'flex';
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${role}`;
  
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = message;
  
  messageDiv.appendChild(bubble);
  chatContainer.appendChild(messageDiv);
  
  // Save UI state
  if (appPersistence && appPersistence.isStorageAvailable()) {
    appPersistence.saveUIState({ chatVisible: true });
  }
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to show the "Try to fix" button
function showFixButton(errorDetails) {
  const chatContainer = document.getElementById('chatContainer');
  if (!chatContainer) return;

  // Remove previous fix button if any to avoid duplicates
  const existingFixButton = chatContainer.querySelector('.fix-button');
  if (existingFixButton) {
    existingFixButton.remove();
  }

  const fixButton = document.createElement('button');
  fixButton.className = 'fix-button chat-button';
  fixButton.textContent = '🔧 Try to fix';
  fixButton.onclick = () => requestAutoFix(errorDetails);
  
  // Append to chat container, ideally after the error message
  chatContainer.appendChild(fixButton);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Add function to save prompts after each interaction
function savePromptsToStorage() {
  if (appPersistence && appPersistence.isStorageAvailable()) {
    appPersistence.saveChatHistory(prompts);
  }
}

// Helper functions to manage input visibility during loading
function hideInputSection() {
  const chatInputSection = document.querySelector('.chat-input-section');
  if (chatInputSection) {
    chatInputSection.classList.add('loading');
  }
}

function showInputSection() {
  const chatInputSection = document.querySelector('.chat-input-section');
  if (chatInputSection) {
    chatInputSection.classList.remove('loading');
  }
}

// Function to request an automatic fix for an error
async function requestAutoFix(errorDetails) {
  displayChatMessage('user', `Attempting to fix: "${errorDetails}"`); 
  const fixPrompt = `The code is not working. Can you fix it? Here's the error: ${errorDetails}`;
  
  prompts.push(new Prompt('user', fixPrompt));
  savePromptsToStorage(); // Save prompts after adding
  
  const quality = getCurrentQualityLevel();
  const loadingBox = document.getElementById('loadingBox');
  const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
  const sandpackWrapper = document.getElementById('sandpackWrapper');
  
  if (loadingBox) {
    loadingBox.style.display = 'flex';
    loadingBox.querySelector('.loading-message').textContent = '🔧 Analyzing error and generating fix...';
  }
  hideInputSection();
  
  // Show loading overlay in Sandpack area
  if (sandpackLoadingOverlay && sandpackWrapper) {
    sandpackWrapper.classList.add('loading');
    sandpackLoadingOverlay.style.display = 'flex';
    sandpackLoadingOverlay.querySelector('.loading-message').textContent = '🔧 Analyzing error and generating fix...';
  }

  if (quality === 'higher') {
    console.log("Higher quality selected for auto-fix, initiating two-stage process (placeholder)...");
    await fetchHighQualityCode(fixPrompt);
  } else {
    await fetchDataFromChatGPT(prompts);
  }
}

// Download functionality
function showDownloadButton() {
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.style.display = 'flex';
  }
}

function hideDownloadButton() {
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.style.display = 'none';
  }
}

async function downloadCode() {
  console.log('🔽 Download button clicked - starting download process...');
  
  try {
    // Get current code files from React state
    console.log('📁 Attempting to get code files...');
    const files = window.getCurrentCodeFiles ? window.getCurrentCodeFiles() : {};
    console.log('📋 Code files retrieved:', files);
    
    if (!files || Object.keys(files).length === 0) {
      console.warn('⚠️ No code files available for download');
      alert('No code files to download. Please generate some code first.');
      return;
    }

    console.log('📦 Found', Object.keys(files).length, 'files to download');

    // Import JSZip dynamically
    console.log('🔗 Loading JSZip library...');
    let JSZip;
    try {
      JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
      console.log('✅ JSZip loaded successfully');
    } catch (importError) {
      console.error('❌ Failed to load JSZip:', importError);
      // Fallback: try alternative CDN
      try {
        JSZip = (await import('https://cdn.skypack.dev/jszip')).default;
        console.log('✅ JSZip loaded from fallback CDN');
      } catch (fallbackError) {
        console.error('❌ Fallback JSZip import also failed:', fallbackError);
        throw new Error('Failed to load ZIP library from both primary and fallback sources');
      }
    }

    const zip = new JSZip();
    console.log('🗜️ ZIP instance created');

    // Add each file to the ZIP with proper structure
    let fileCount = 0;
    Object.entries(files).forEach(([filePath, fileData]) => {
      const code = typeof fileData === 'object' ? fileData.code : fileData;
      
      if (!code || typeof code !== 'string') {
        console.warn('⚠️ Skipping invalid file:', filePath, 'Data:', fileData);
        return;
      }
      
      // Clean up the file path (remove leading slash if present)
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      
      // Add file to ZIP with proper path and extension
      zip.file(cleanPath, code);
      fileCount++;
      console.log(`📄 Added file ${fileCount}: ${cleanPath} (${code.length} chars)`);
    });

    if (fileCount === 0) {
      throw new Error('No valid code files found to add to ZIP');
    }

    // Generate ZIP file
    console.log('🗜️ Generating ZIP file...');
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    console.log(`✅ ZIP generated successfully (${zipBlob.size} bytes)`);
    
    // Create download link
    console.log('🔗 Creating download link...');
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-code.zip';
    a.style.display = 'none';
    document.body.appendChild(a);
    
    console.log('🖱️ Triggering download...');
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('🧹 Cleaned up download link');
    }, 100);
    
    console.log('🎉 Code downloaded successfully as ZIP with', fileCount, 'files');
    // alert(`✅ Downloaded ${fileCount} code files successfully!`);
    
  } catch (error) {
    console.error('❌ Error downloading code:', error);
    // alert(`Error downloading code: ${error.message}\n\nCheck console for details.`);
  }
}

// Function to fetch data from ChatGPT
async function fetchDataFromChatGPT(prompts) {
  const loadingBox = document.getElementById('loadingBox');
  const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
  const sandpackWrapper = document.getElementById('sandpackWrapper');
  const qualityLevel = getCurrentQualityLevel(); // Get current quality
  
  try {
    // Show loading state in both chat and Sandpack areas
    if (loadingBox) {
      loadingBox.style.display = 'flex';
      // Update loading message based on quality (more detailed messages later)
      loadingBox.querySelector('.loading-message').textContent = 
        qualityLevel === 'higher' ? 
        '🏗️ Analyzing requirements and planning architecture...' : 
        'Coming up with response, may take a minute...';
    }
    hideInputSection();
    
    // Show loading overlay in Sandpack area
    if (sandpackLoadingOverlay && sandpackWrapper) {
      sandpackWrapper.classList.add('loading');
      sandpackLoadingOverlay.style.display = 'flex';
      sandpackLoadingOverlay.querySelector('.loading-message').textContent = 
        qualityLevel === 'higher' ? 
        '🏗️ Analyzing requirements and planning architecture...' : 
        'Coming up with response, may take a minute...';
    }

    // Display user message
    const lastPrompt = prompts[prompts.length - 1];
    if (lastPrompt && lastPrompt.role === 'user') {
      // displayChatMessage('user', lastPrompt.message); // This would be the duplicate if uncommented or if logic is similar elsewhere
    }
    
    const requestBody = {
      messages: prompts.map(p => ({
        role: p.role,
        content: p.message
      })),
      quality: getCurrentQualityLevel(),
      usecase: getCurrentUsecase() // Send quality level to backend
    };

    const response = await fetch('http://localhost:3001/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Update template based on language
    if (data.language && window.updateTemplate) {
      window.updateTemplate(data.language);
    }

    // Display the AI's description
    if (data.description) {
      displayChatMessage('ai', data.description);
    }

    // Update Sandpack with the received code files
    if (window.setAllSandpackFiles && data.code && typeof data.code === 'object') {
      window.setAllSandpackFiles(data.code);    
      // Code updated silently without success message
      showDownloadButton(); // Show download button after successful code generation
    } else{
      const errorMessage = "The AI did not provide a valid code structure for this request.";
      displayChatMessage('ai', errorMessage);
      prompts.push(new Prompt('ai', errorMessage));
    }
    
    // Add AI response to prompts and save
    if (data.description) {
      prompts.push(new Prompt('ai', data.description));
    }
    savePromptsToStorage();
    
  } catch (error) {
    console.error('Error:', error);
    displayChatMessage('ai', `Error: ${error.message}. Please try again.`);
    // Save error message to prompts as well
    prompts.push(new Prompt('ai', `Error: ${error.message}. Please try again.`));
    savePromptsToStorage();
  } finally {
    // Hide loading state
    if (loadingBox) {
      loadingBox.style.display = 'none';
    }
    showInputSection();
    
    // Hide Sandpack loading overlay
    const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
    const sandpackWrapper = document.getElementById('sandpackWrapper');
    if (sandpackLoadingOverlay && sandpackWrapper) {
      sandpackWrapper.classList.remove('loading');
      sandpackLoadingOverlay.style.display = 'none';
    }
  }
}

// Function to fetch the architectural plan (Stage 1)
async function fetchArchitecturalPlan(userPrompt) {
  const loadingBox = document.getElementById('loadingBox');
  const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
  const sandpackWrapper = document.getElementById('sandpackWrapper');
  
  if (loadingBox) {
    loadingBox.style.display = 'flex';
    loadingBox.querySelector('.loading-message').textContent = '🏗️ Analyzing requirements and planning architecture...';
  }
  hideInputSection();
  
  // Show loading overlay in Sandpack area
  if (sandpackLoadingOverlay && sandpackWrapper) {
    sandpackWrapper.classList.add('loading');
    sandpackLoadingOverlay.style.display = 'flex';
    sandpackLoadingOverlay.querySelector('.loading-message').textContent = '🏗️ Analyzing requirements and planning architecture...';
  }
  displayChatMessage('system', '🏗️ Stage 1: Planning software architecture...');

  try {
    const response = await fetch('http://localhost:3001/api/architect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt, quality: 'higher' })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Architectural planning request failed with status: ' + response.status }));
      throw new Error(errorData.error || 'Architectural planning failed');
    }

    const data = await response.json();
    if (!data.success || !data.architecturalPlan) {
      throw new Error(data.error || 'Failed to retrieve architectural plan.');
    }
    
    displayChatMessage('system', `🏛️ Architectural plan (using ${data.model || 'AI'}) received. Proceeding to code generation...`);
    // Optionally display plan to user here if desired
    // console.log("Architectural Plan:", data.architecturalPlan);
    return data.architecturalPlan;

  } catch (error) {
    console.error('Error fetching architectural plan:', error);
    displayChatMessage('ai', `⚠️ Error in Stage 1 (Planning): ${error.message}. Trying standard generation instead.`);
    throw error; // Re-throw to be caught by fetchHighQualityCode for fallback
  }
}

// Function to generate code from the architectural plan (Stage 2)
async function generateCodeFromPlan(architecturalPlan, originalUserPrompt) {
  const loadingBox = document.getElementById('loadingBox');
  const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
  const sandpackWrapper = document.getElementById('sandpackWrapper');
  
  if (loadingBox) {
    loadingBox.querySelector('.loading-message').textContent = '⚡ Generating high-quality code based on architectural plan...';
  }
  
  // Update Sandpack loading overlay
  if (sandpackLoadingOverlay && sandpackWrapper) {
    sandpackLoadingOverlay.querySelector('.loading-message').textContent = '⚡ Generating high-quality code based on architectural plan...';
  }
  displayChatMessage('system', '⚡ Stage 2: Generating code based on architectural plan...');

  // Create a minimal messages array for stage 2, the plan is a special parameter.
  // The backend will combine the plan with the latest user prompt.
  const stage2Messages = [new Prompt('user', originalUserPrompt)]; 

  try {
    const response = await fetch('http://localhost:3001/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: stage2Messages.map(p => ({ role: p.role, content: p.message })),
        architecturalPlan: architecturalPlan,
        quality: 'higher',
        usecase: getCurrentUsecase()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Code generation request failed with status: ' + response.status }));
      throw new Error(errorData.error || 'Code generation from plan failed');
    }

    const data = await response.json();

    // Update template based on language
    if (data.language && window.updateTemplate) {
      window.updateTemplate(data.language);
    }

    // Display the AI's description
    if (data.description) {
      displayChatMessage('ai', data.description);
      prompts.push(new Prompt('ai', data.description));
    }

    // Update Sandpack with the received code files
    if (window.setAllSandpackFiles && data.code && typeof data.code === 'object') {
      window.setAllSandpackFiles(data.code);
      // High-quality code updated silently without success message
      showDownloadButton(); // Show download button after successful high-quality code generation
    } else {
      const rawResponseForError = typeof data.code !== 'object' ? JSON.stringify(data) : "Invalid code structure in response.";
      const errorMessage = `⚠️ The AI did not provide a valid code structure for the high-quality request. Raw: ${rawResponseForError}`;
      displayChatMessage('ai', errorMessage);
      prompts.push(new Prompt('ai', errorMessage));
      // Potentially trigger an auto-fix here or offer the user to try again.
    }
    
    savePromptsToStorage();
    return data; // Return the full response data

  } catch (error) {
    console.error('Error generating code from plan:', error);
    displayChatMessage('ai', `⚠️ Error in Stage 2 (Code Generation): ${error.message}. You might need to try standard quality or a different prompt.`);
    throw error; // Re-throw for fetchHighQualityCode to handle
  } finally {
    if (loadingBox) {
      loadingBox.style.display = 'none';
    }
    showInputSection();
    
    // Hide Sandpack loading overlay
    const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
    const sandpackWrapper = document.getElementById('sandpackWrapper');
    if (sandpackLoadingOverlay && sandpackWrapper) {
      sandpackWrapper.classList.remove('loading');
      sandpackLoadingOverlay.style.display = 'none';
    }
  }
}

// Main function for two-stage high-quality code generation
async function fetchHighQualityCode(userPromptText) {
  const loadingBox = document.getElementById('loadingBox');
  try {
    // Stage 1: Get architectural plan
    const architecturalPlan = await fetchArchitecturalPlan(userPromptText);

    // Stage 2: Generate code from plan
    // Pass the original userPromptText for context, backend will combine with plan
    const codeResponse = await generateCodeFromPlan(architecturalPlan, userPromptText);
    
    return codeResponse;

  } catch (error) {
    console.warn('High-quality generation process failed at some stage:', error.message);
    // Fallback to standard quality generation using the original user prompt text
    displayChatMessage('system', 'ℹ️ Fallback: Attempting standard quality generation...');
    if (loadingBox) {
        loadingBox.querySelector('.loading-message').textContent = 'Standard quality fallback...';
    }
    // Ensure prompts array has the original user prompt for standard fallback
    // If requestAutoFix called this, 'prompts' might already contain the fix request.
    // For a fresh high-quality request, 'prompts' would have the initial user message.
    // We need to ensure the standard fetchDataFromChatGPT gets the correct history.
    // For simplicity now, if it was an auto-fix, prompts is already set. 
    // If it was an initial high-quality request, prompts contains that.
    
    // If the last message in prompts isn't the current userPromptText (e.g. it was a fix attempt that failed into high quality)
    // ensure the userPromptText is what we send for standard fallback.
    const lastPromptInHistory = prompts.length > 0 ? prompts[prompts.length - 1].message : "";
    if (lastPromptInHistory !== userPromptText && !lastPromptInHistory.includes(userPromptText)) {
        // This case implies a complex sequence, e.g. error -> fix attempt (high quality) -> failure -> standard fallback.
        // We should use the 'userPromptText' which was the trigger for THIS fetchHighQualityCode call.
        // Create a new prompt history just for this fallback if necessary.
        await fetchDataFromChatGPT([new Prompt('user', userPromptText)]);
    } else {
        // If prompts history seems consistent with userPromptText being the latest or part of it.
        await fetchDataFromChatGPT(prompts);
    }
    
    return null; // Indicate high-quality failed
  } finally {
    if (loadingBox) {
      loadingBox.style.display = 'none';
    }
    showInputSection();
    
    // Hide Sandpack loading overlay
    const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
    const sandpackWrapper = document.getElementById('sandpackWrapper');
    if (sandpackLoadingOverlay && sandpackWrapper) {
      sandpackWrapper.classList.remove('loading');
      sandpackLoadingOverlay.style.display = 'none';
    }
  }
}

// Simple and effective code modification function
async function modifyCode(modificationPrompt) {
  const loadingBox = document.getElementById('loadingBox');
  const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
  const sandpackWrapper = document.getElementById('sandpackWrapper');
  
  try {
    if (loadingBox) loadingBox.style.display = 'flex';
    hideInputSection();
    
    // Show loading overlay in Sandpack area
    if (sandpackLoadingOverlay && sandpackWrapper) {
      sandpackWrapper.classList.add('loading');
      sandpackLoadingOverlay.style.display = 'flex';
      sandpackLoadingOverlay.querySelector('.loading-message').textContent = 'Modifying code...';
    }
    displayChatMessage('user', modificationPrompt);
    
    // Always get the latest code files when starting the modification
    const latestCodeFiles = window.getCurrentCodeFiles ? window.getCurrentCodeFiles() : {};
    const currentCode = Object.fromEntries(
      Object.entries(latestCodeFiles).map(([filePath, file]) => [filePath, file.code])
    );
    
    const requestBody = { currentCode, modificationPrompt, usecase: getCurrentUsecase() };
    
    const response = await fetch('http://localhost:3001/api/modify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.language && window.updateTemplate) window.updateTemplate(data.language);
    if (data.description) {
      displayChatMessage('ai', data.description);
      prompts.push(new Prompt('ai', data.description));
    }
    
    if (window.setAllSandpackFiles && data.code && typeof data.code === 'object') {
      window.setAllSandpackFiles(data.code);
      // Code modified silently without success message
      showDownloadButton(); // Show download button after successful code modification
    } else {
      const errorMessage = "The AI did not provide a valid code structure.";
      displayChatMessage('ai', errorMessage);
      prompts.push(new Prompt('ai', errorMessage));
    }
    
    savePromptsToStorage();
    
  } catch (error) {
    console.error('Error:', error);
    displayChatMessage('ai', `Error: ${error.message}. Please try again.`);
    // Save error message to prompts as well
    prompts.push(new Prompt('ai', `Error: ${error.message}. Please try again.`));
    savePromptsToStorage();
  } finally {
    if (loadingBox) loadingBox.style.display = 'none';
    showInputSection();
    
    // Hide Sandpack loading overlay
    const sandpackLoadingOverlay = document.getElementById('sandpackLoadingOverlay');
    const sandpackWrapper = document.getElementById('sandpackWrapper');
    if (sandpackLoadingOverlay && sandpackWrapper) {
      sandpackWrapper.classList.remove('loading');
      sandpackLoadingOverlay.style.display = 'none';
    }
  }
}

// Function to handle prompt submission
function handleInitialSubmission(input) {
  if (input?.value?.trim().length > 3) {
    // Clear previous session data before starting new session
    clearPreviousSessionData();
    
    // Enable saving for new session
    isResettingSession = false;
    
    // IMMEDIATELY hide footer when conversation starts
    document.body.classList.add('chat-view-active');
    
    const chatInterface = document.getElementById('chatInterface');
    const landingSection = document.getElementById('landingSection');
    const appContainer = document.querySelector('.app-container');
    
    if (chatInterface) chatInterface.style.display = 'flex';
    if (landingSection) landingSection.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    
    // Hide quality selector after initial submission since it's no longer needed
    hideQualitySelector();
    
    const userMessageContent = input.value.trim();
    const userPrompt = new Prompt('user', userMessageContent);
    prompts.push(userPrompt);
    savePromptsToStorage(); // Save prompts after adding user input
    displayChatMessage('user', userMessageContent);
    
    const quality = getCurrentQualityLevel();
    
    if (quality === 'higher') {
      console.log("Higher quality selected, initiating two-stage process...");
      fetchHighQualityCode(userMessageContent);
    } else {
      fetchDataFromChatGPT(prompts);
    }
    input.value = '';
    // Hide submit button after submission
    toggleSubmitButtonVisibility(input);
  }
}

// Function to handle modification submissions in chat
function handleModificationSubmission(input) {
  if (input?.value?.trim().length > 3) {
    const modificationPrompt = input.value.trim();
    // Add modification prompt to prompts array and save
    prompts.push(new Prompt('user', modificationPrompt));
    savePromptsToStorage();
    // Get the latest code files at the time of submission
    modifyCode(modificationPrompt);
    input.value = '';
    // Hide submit button after submission
    toggleSubmitButtonVisibility(input);
  }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Apply page variant configuration
  if (window.pageConfig) {
    const usecase = getCurrentUsecase();
    const config = window.pageConfig[usecase] || window.pageConfig.default;

    // Update the hero section content
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroDescription = document.querySelector('.hero-description');
    const promptInput = document.querySelector('#landingSection .prompt-input');

    if (heroTitle) heroTitle.textContent = config.headline;
    if (heroSubtitle) heroSubtitle.innerHTML = config.subtitle; // Use innerHTML for <br> tag
    if (heroDescription) heroDescription.textContent = config.description;
    if (promptInput) promptInput.placeholder = config.placeholder;
    
    // Also update the document title for better SEO and user experience
    document.title = `${config.headline} - Writecream AI`;
  }

  // Initialize theme
  initializeTheme();
  
  // Initialize typing animation
  initializeTypingAnimation();
  
  // Initialize user counter animation
  initializeUserCounter();
  
  // Initialize persistence
  appPersistence = window.appPersistence;
  
  // Load saved data if persistence is available
  if (appPersistence && appPersistence.isStorageAvailable()) {
    // Load chat history
    prompts = appPersistence.loadChatHistory();
    
    // Load and set quality setting
    const savedQuality = appPersistence.loadQualitySetting();
    setQualityDropdowns(savedQuality);
    
    // Load UI state and only show chat if explicitly set to visible
    const uiState = appPersistence.loadUIState();
    if (uiState.chatVisible && prompts.length > 0) {
      // IMMEDIATELY hide footer when restoring chat interface
      document.body.classList.add('app-active');
      // Restore chat messages in UI and show chat interface
      restoreChatUI();
      showChatInterface();
      
      // Ensure view toggle is properly restored after a delay
      setTimeout(() => {
        const sandpackContainer = document.getElementById('root');
        if (sandpackContainer && appPersistence) {
          const savedViewState = appPersistence.loadViewToggleState();
          if (savedViewState.currentView === 'preview') {
            sandpackContainer.classList.remove('code-mode');
            sandpackContainer.classList.add('preview-mode');
            const previewToggle = document.getElementById('previewToggle');
            const codeToggle = document.getElementById('codeToggle');
            if (previewToggle && codeToggle) {
              previewToggle.classList.add('active');
              codeToggle.classList.remove('active');
            }
          } else {
            sandpackContainer.classList.remove('preview-mode');
            sandpackContainer.classList.add('code-mode');
            const previewToggle = document.getElementById('previewToggle');
            const codeToggle = document.getElementById('codeToggle');
            if (previewToggle && codeToggle) {
              codeToggle.classList.add('active');
              previewToggle.classList.remove('active');
            }
          }
        }
      }, 1500); // Wait longer for Sandpack to fully load
    } else {
      // Ensure we're on the homepage by default
      const chatInterface = document.getElementById('chatInterface');
      const landingSection = document.getElementById('landingSection');
      const appContainer = document.querySelector('.app-container');
      
      if (chatInterface) chatInterface.style.display = 'none';
      if (appContainer) appContainer.style.display = 'none';
      if (landingSection) landingSection.style.display = 'block';
    }
    
    console.log('Persistence initialized and data restored');
  }

  // Initialize landing page elements
  const landingInput = document.querySelector('#landingSection .prompt-input');
  const landingSubmitButton = document.querySelector('#landingSection .submit-btn');
  
  // Initialize chat interface elements
  const chatInterface = document.getElementById('chatInterface');
  const landingSection = document.getElementById('landingSection');
  const chatInput = document.querySelector('.chat-prompt-input');
  const chatSubmitButton = document.querySelector('.chat-submit-btn');

  // Initialize quality dropdowns
  const landingQualitySelect = document.getElementById('qualitySelectLanding');
  const chatQualitySelect = document.getElementById('qualitySelectChat');

  if (landingQualitySelect) {
    landingQualitySelect.addEventListener('change', () => synchronizeQualityDropdowns('qualitySelectLanding'));
  }
  if (chatQualitySelect) {
    chatQualitySelect.addEventListener('change', () => synchronizeQualityDropdowns('qualitySelectChat'));
  }

  // Handle quick app buttons
  document.querySelectorAll('.quick-app-btn').forEach(button => {
    button.addEventListener('click', () => {
      if (landingInput) {
        landingInput.value = button.textContent;
        // Trigger the button visibility check
        toggleSubmitButtonVisibility(landingInput);
        handleInitialSubmission(landingInput);
      }
    });
  });

  // Handle landing page input submission
  if (landingSubmitButton && landingInput) {
    landingSubmitButton.addEventListener('click', () => {
      handleInitialSubmission(landingInput);
    });
    landingInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleInitialSubmission(landingInput);
      }
    });
  }

  // Handle "Try It Now" button from How It Works section
  const tryNowButton = document.querySelector('.try-now-btn');
  if (tryNowButton && landingInput) {
    tryNowButton.addEventListener('click', () => {
      // Focus on the input field and scroll to it smoothly
      landingInput.focus();
      landingInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Optional: Add a subtle animation to draw attention to the input
      landingInput.style.transform = 'scale(1.02)';
      landingInput.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        landingInput.style.transform = 'scale(1)';
      }, 300);
    });
  }

  // Handle popular prompt buttons
  const popularPromptButtons = document.querySelectorAll('.popular-prompt-btn');
  if (popularPromptButtons.length > 0 && landingInput) {
    popularPromptButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Get the text content and remove quotes
        const promptText = button.textContent.replace(/^"|"$/g, '');
        
        // Fill the input with the prompt text
        landingInput.value = promptText;
        
        // Trigger auto-resize and button visibility update
        if (window.autoResizeTextarea) {
          window.autoResizeTextarea(landingInput);
        }
        toggleSubmitButtonVisibility(landingInput);
        
        // Focus on the input and scroll to it
        landingInput.focus();
        landingInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add visual feedback
        landingInput.style.transform = 'scale(1.02)';
        landingInput.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
          landingInput.style.transform = 'scale(1)';
        }, 300);
      });
    });
  }

  // Handle demo tabs
  const demoTabs = document.querySelectorAll('.demo-tab');
  const demoPanes = document.querySelectorAll('.demo-pane');
  
  if (demoTabs.length > 0) {
    demoTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and panes
        demoTabs.forEach(t => t.classList.remove('active'));
        demoPanes.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding pane
        const targetTab = tab.getAttribute('data-tab');
        const targetPane = document.getElementById(targetTab + '-demo');
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  // Handle copy buttons
  const copyButtons = document.querySelectorAll('.copy-btn');
  if (copyButtons.length > 0) {
    copyButtons.forEach(button => {
      button.addEventListener('click', async () => {
        try {
          // For now, just show feedback that copy was clicked
          const originalText = button.textContent;
          button.textContent = '✅ Copied!';
          button.style.background = 'rgba(39, 202, 63, 0.2)';
          
          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'rgba(74, 144, 226, 0.1)';
          }, 2000);
        } catch (err) {
          console.log('Copy failed:', err);
        }
      });
    });
  }

  // Handle testimonials carousel
  const testimonials = [
    {
      quote: "This AI assistant has revolutionized my development workflow. I can prototype ideas in minutes instead of hours. The code quality is exceptional",
      name: "Sarah Chen",
      role: "Frontend Developer",
      company: "TechCorp",
      avatar: "SC"
    },
    {
      quote: "The AI understands context incredibly well. It's like having a senior developer pair programming with you 24/7. Absolutely game-changing!",
      name: "Marcus Rodriguez",
      role: "Full Stack Engineer",
      company: "StartupXYZ",
      avatar: "MR"
    },
    {
      quote: "I've tried many AI coding tools, but this one stands out. The generated code is clean, well-documented, and production-ready.",
      name: "Emily Johnson",
      role: "Senior Developer",
      company: "Enterprise Corp",
      avatar: "EJ"
    },
    {
      quote: "From React components to Python scripts, it handles everything perfectly. My productivity has increased by 300% since I started using it.",
      name: "David Kim",
      role: "Software Architect",
      company: "Innovation Labs",
      avatar: "DK"
    },
    {
      quote: "The quality of generated code is outstanding. It follows best practices and includes proper error handling. Highly recommended!",
      name: "Lisa Wang",
      role: "Backend Developer",
      company: "CloudTech",
      avatar: "LW"
    }
  ];

  let currentTestimonial = 0;

  function createAvatarSVG(initials) {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="30" fill="#4A90E2"/>
        <text x="50%" y="55%" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
      </svg>
    `)}`;
  }

  function updateTestimonial(index) {
    const testimonialCard = document.querySelector('.testimonial-card');
    const dots = document.querySelectorAll('.testimonial-dots .dot');
    
    if (!testimonialCard || !testimonials[index]) return;

    const testimonial = testimonials[index];
    
    // Update content
    testimonialCard.innerHTML = `
      <div class="testimonial-header">
        <div class="testimonial-avatar">
          <img src="${createAvatarSVG(testimonial.avatar)}" alt="${testimonial.name}" class="avatar-img">
        </div>
        <div class="testimonial-rating">
          <span class="star">⭐</span>
          <span class="star">⭐</span>
          <span class="star">⭐</span>
          <span class="star">⭐</span>
          <span class="star">⭐</span>
        </div>
      </div>
      
      <blockquote class="testimonial-quote">
        "${testimonial.quote}"
      </blockquote>
      
      <div class="testimonial-author">
        <h4 class="author-name">${testimonial.name}</h4>
        <p class="author-role">${testimonial.role}</p>
        <p class="author-company">${testimonial.company}</p>
      </div>
    `;

    // Update dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    currentTestimonial = index;
  }

  // Handle testimonial navigation
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const testimonialDots = document.querySelectorAll('.testimonial-dots .dot');

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
      updateTestimonial(currentTestimonial);
    });

    nextBtn.addEventListener('click', () => {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      updateTestimonial(currentTestimonial);
    });
  }

  // Handle dot navigation
  if (testimonialDots.length > 0) {
    testimonialDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        updateTestimonial(index);
      });
    });
  }

  // Auto-rotate testimonials every 5 seconds
  setInterval(() => {
    if (document.querySelector('.testimonial-card')) {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      updateTestimonial(currentTestimonial);
    }
  }, 5000);

  // Handle CTA buttons
  const ctaGetStarted = document.getElementById('ctaGetStarted');
  const ctaLiveDemo = document.getElementById('ctaLiveDemo');

  if (ctaGetStarted && landingInput) {
    ctaGetStarted.addEventListener('click', () => {
      // Scroll to the input field and focus it
      landingInput.focus();
      landingInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add visual feedback
      landingInput.style.transform = 'scale(1.02)';
      landingInput.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        landingInput.style.transform = 'scale(1)';
      }, 300);
    });
  }

  if (ctaLiveDemo && landingInput) {
    ctaLiveDemo.addEventListener('click', () => {
      // Fill input with a demo prompt and focus
      landingInput.value = 'Create a responsive React component for a modern button with hover effects';
      
      // Trigger auto-resize and button visibility update
      if (window.autoResizeTextarea) {
        window.autoResizeTextarea(landingInput);
      }
      toggleSubmitButtonVisibility(landingInput);
      
      // Scroll to the input field
      landingInput.focus();
      landingInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add visual feedback
      landingInput.style.transform = 'scale(1.02)';
      landingInput.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        landingInput.style.transform = 'scale(1)';
      }, 300);
    });
  }
  
  // Handle chat interface input submission
  if (chatSubmitButton && chatInput) {
    chatSubmitButton.addEventListener('click', () => handleModificationSubmission(chatInput));
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleModificationSubmission(chatInput);
      }
    });
  }

  // === Auto-resize for all .prompt-input textareas ===
  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, parseInt(window.getComputedStyle(textarea).maxHeight) || 300) + 'px';
  }

  // Make autoResizeTextarea globally available
  window.autoResizeTextarea = autoResizeTextarea;



  // Attach input event to all prompt-input textareas
  document.querySelectorAll('.prompt-input').forEach(textarea => {
    textarea.addEventListener('input', function() {
      autoResizeTextarea(this);
      toggleSubmitButtonVisibility(this);
    });
    
    // Also check on keyup to handle backspace and delete
    textarea.addEventListener('keyup', function() {
      toggleSubmitButtonVisibility(this);
    });
    
    // Also check on focus and blur for better UX
    textarea.addEventListener('focus', function() {
      toggleSubmitButtonVisibility(this);
    });
    
    textarea.addEventListener('blur', function() {
      toggleSubmitButtonVisibility(this);
    });
    
    // Check on paste events
    textarea.addEventListener('paste', function() {
      // Small delay to let paste content be processed
      setTimeout(() => {
        toggleSubmitButtonVisibility(this);
      }, 10);
    });
    
    // Initial resize and button state check in case of pre-filled value
    autoResizeTextarea(textarea);
    toggleSubmitButtonVisibility(textarea);
  });
});

// Simple test function for Sandpack when needed
window.testSandpack = function() {
  if (window.setAllSandpackFiles) {
    window.setAllSandpackFiles({
      "/index.html": `<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Sandpack Test OK</h1></body></html>`
    });
  }
};

// Function to navigate back to homepage/landing page
function goToHomepage() {
  // Hide chat interface and show landing page
  const chatInterface = document.getElementById('chatInterface');
  const landingSection = document.getElementById('landingSection');
  const appContainer = document.querySelector('.app-container');
  
  if (chatInterface) {
    chatInterface.style.display = 'none';
  }
  
  if (appContainer) {
    appContainer.style.display = 'none';
  }
  
  if (landingSection) {
    landingSection.style.display = 'block';
  }
  
  // Remove app-active class to show footer and restore main scrollbar
  document.body.classList.remove('app-active');
  
  // Show quality selector again for new session
  showQualitySelector();
  
  // Clear any input fields
  const landingInput = document.querySelector('#landingSection .prompt-input');
  const chatInput = document.querySelector('.chat-prompt-input');
  
  if (landingInput) {
    landingInput.value = '';
  }
  
  if (chatInput) {
    chatInput.value = '';
  }
  
  // Clear all session data including code files
  clearAllSessionData();
  
  // Restart user counter animation when returning to homepage
  setTimeout(() => {
    initializeUserCounter();
  }, 100);
  
  console.log('Navigated to homepage and cleared all session data');
}

// Make goToHomepage function globally available
window.goToHomepage = goToHomepage;

// Function to restore chat UI from saved data
function restoreChatUI() {
  if (prompts.length > 0) {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      // Clear existing messages and display all saved messages
      chatContainer.innerHTML = '';
      prompts.forEach(prompt => {
        displayChatMessageRestore(prompt.role, prompt.message);
      });
    }
    
    // Check if there are code files and show download button if so
    setTimeout(() => {
      const files = window.getCurrentCodeFiles ? window.getCurrentCodeFiles() : {};
      if (files && Object.keys(files).length > 0) {
        showDownloadButton();
      }
    }, 1000); // Wait for Sandpack to initialize
  }
}

// Special function for restoring messages without saving UI state again
function displayChatMessageRestore(role, message) {
  const chatContainer = document.getElementById('chatContainer');
  const chatInterface = document.getElementById('chatInterface');
  
  if (!chatContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${role}`;
  
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = message;
  
  messageDiv.appendChild(bubble);
  chatContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to set quality dropdowns
function setQualityDropdowns(quality) {
  const chatQualitySelect = document.getElementById('qualitySelectChat');
  const landingQualitySelect = document.getElementById('qualitySelectLanding');
  
  if (chatQualitySelect) chatQualitySelect.value = quality;
  if (landingQualitySelect) landingQualitySelect.value = quality;
}

// Function to hide quality selector after conversation starts
function hideQualitySelector() {
  const chatQualitySelector = document.querySelector('.chat-input-section .quality-selector');
  const landingQualitySelector = document.querySelector('#landingSection .quality-selector');
  
  if (chatQualitySelector) {
    chatQualitySelector.style.opacity = '0';
    chatQualitySelector.style.transform = 'scale(0.9)';
    setTimeout(() => {
      chatQualitySelector.style.display = 'none';
    }, 300);
  }
  if (landingQualitySelector) {
    landingQualitySelector.style.opacity = '0';
    landingQualitySelector.style.transform = 'scale(0.9)';
    setTimeout(() => {
      landingQualitySelector.style.display = 'none';
    }, 300);
  }
  
  console.log('Quality selector hidden - no longer needed for this session');
}

// Function to show quality selector (for when returning to homepage)
function showQualitySelector() {
  const chatQualitySelector = document.querySelector('.chat-input-section .quality-selector');
  const landingQualitySelector = document.querySelector('#landingSection .quality-selector');
  
  if (chatQualitySelector) {
    chatQualitySelector.style.display = 'flex';
    chatQualitySelector.style.opacity = '1';
    chatQualitySelector.style.transform = 'scale(1)';
  }
  if (landingQualitySelector) {
    landingQualitySelector.style.display = 'flex';
    landingQualitySelector.style.opacity = '1';
    landingQualitySelector.style.transform = 'scale(1)';
  }
  
  console.log('Quality selector restored for new session');
}

// Function to show chat interface
function showChatInterface() {
  const chatInterface = document.getElementById('chatInterface');
  const landingSection = document.getElementById('landingSection');
  const appContainer = document.querySelector('.app-container');
  
  if (chatInterface) chatInterface.style.display = 'flex';
  if (appContainer) appContainer.style.display = 'flex';
  if (landingSection) landingSection.style.display = 'none';
  
  // Add app-active class to body to hide footer and main scrollbar
  document.body.classList.add('app-active');
  
  // Hide quality selector since conversation is already started
  hideQualitySelector();
  
  // Initialize view toggle after showing the interface
  setTimeout(() => {
    // First ensure all content is visible
    if (window.showAllSandpack) {
      window.showAllSandpack();
    }
    // Then initialize toggle with fallback
    const toggleInitialized = initializeViewToggle();
    if (!toggleInitialized) {
      console.log('Full toggle failed, trying simple fallback...');
      simpleFallbackToggle();
    }
  }, 500);
  
  // Update UI state to indicate chat is visible
  if (appPersistence && appPersistence.isStorageAvailable()) {
    appPersistence.saveUIState({ chatVisible: true });
  }
}

// Function to check storage usage
function getStorageUsage() {
  if (!appPersistence || !appPersistence.isStorageAvailable()) {
    return { used: 0, total: 0, percentage: 0 };
  }
  
  let used = 0;
  Object.values(appPersistence.storageKeys).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      used += item.length;
    }
  });
  
  // Approximate localStorage limit (5MB in most browsers)
  const total = 5 * 1024 * 1024;
  const percentage = (used / total) * 100;
  
  return { used, total, percentage: Math.round(percentage * 100) / 100 };
}

// Function to display storage usage (for debugging)
function logStorageUsage() {
  const usage = getStorageUsage();
  console.log(`Storage Usage: ${usage.used} bytes (${usage.percentage}% of ~5MB)`);
}

// Debug function to see all localStorage keys
function debugLocalStorage() {
  console.log('=== LocalStorage Debug ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value?.length > 100 ? `${value.substring(0, 100)}...` : value);
  }
  console.log('========================');
}

// Function to toggle submit button visibility based on input content
function toggleSubmitButtonVisibility(textarea) {
  const container = textarea.closest('.input-inner-container') || textarea.closest('.input-outer-container');
  const submitBtn = container ? container.querySelector('.submit-btn') : null;
  
  if (submitBtn) {
    const hasContent = textarea.value.trim().length > 0;
    if (hasContent) {
      submitBtn.classList.add('visible');
    } else {
      submitBtn.classList.remove('visible');
    }
  }
}

// Make debugging functions globally available
window.getStorageUsage = getStorageUsage;
window.logStorageUsage = logStorageUsage;
window.debugLocalStorage = debugLocalStorage;
window.clearAllSessionData = clearAllSessionData;
window.clearPreviousSessionData = clearPreviousSessionData;
window.testDownloadButton = function() {
  console.log('Testing download button...');
  const btn = document.getElementById('downloadBtn');
  if (btn) {
    btn.style.display = 'flex';
    btn.style.visibility = 'visible';
    btn.style.opacity = '1';
    console.log('Download button manually set to visible');
    console.log('Button element:', btn);
    console.log('Button computed styles:', window.getComputedStyle(btn).display);
  } else {
    console.error('Download button element not found!');
  }
};

window.testCodeFiles = function() {
  console.log('🔍 Testing code files access...');
  const files = window.getCurrentCodeFiles ? window.getCurrentCodeFiles() : {};
  console.log('📋 Current code files:', files);
  console.log('📊 Number of files:', Object.keys(files).length);
  
  if (Object.keys(files).length > 0) {
    Object.entries(files).forEach(([path, data]) => {
      console.log(`📄 File: ${path}`);
      console.log(`   Type: ${typeof data}`);
      console.log(`   Content preview: ${typeof data === 'object' ? data.code?.substring(0, 100) + '...' : data?.substring(0, 100) + '...'}`);
    });
  } else {
    console.warn('⚠️ No code files found. Generate some code first.');
  }
  return files;
};
window.showDownloadButton = showDownloadButton;
window.hideDownloadButton = hideDownloadButton;
window.downloadCode = downloadCode;

// Debug function to test view toggle persistence
window.testViewTogglePersistence = function() {
  if (appPersistence && appPersistence.isStorageAvailable()) {
    const currentState = appPersistence.loadViewToggleState();
    console.log('Current view toggle state:', currentState);
    
    // Test saving different states
    appPersistence.saveViewToggleState({ currentView: 'preview' });
    console.log('Saved preview state');
    
    setTimeout(() => {
      const newState = appPersistence.loadViewToggleState();
      console.log('Loaded state after save:', newState);
    }, 100);
  } else {
    console.log('Persistence not available');
  }
};

// Code/Preview Toggle Functionality
function initializeViewToggle() {
  const codeToggle = document.getElementById('codeToggle');
  const previewToggle = document.getElementById('previewToggle');
  const sandpackContainer = document.getElementById('root');
  
  if (!codeToggle || !previewToggle || !sandpackContainer) {
    return false; // Elements not found, probably on landing page
  }
  
  // Default to showing code view
  let currentView = 'code';
  
  function switchToCodeView() {
    // Remove preview mode classes
    sandpackContainer.classList.remove('preview-mode');
    sandpackContainer.classList.add('code-mode');
    
    // Update button states
    codeToggle.classList.add('active');
    previewToggle.classList.remove('active');
    
    currentView = 'code';
    
    // Save view toggle state
    if (appPersistence && appPersistence.isStorageAvailable()) {
      appPersistence.saveViewToggleState({ currentView: 'code' });
    }
    
    // Apply specific hiding logic for Sandpack components
    setTimeout(() => {
      // Find all possible Sandpack elements
      const allElements = sandpackContainer.querySelectorAll('*');
      
      allElements.forEach(el => {
        // Reset all inline display styles first
        if (el.style.display === 'none') {
          el.style.display = '';
        }
        
        // Hide preview-related elements
        if (el.className && (
          el.className.includes('sp-preview') ||
          el.className.includes('preview') ||
          el.getAttribute('data-sp-component') === 'preview'
        )) {
          el.style.display = 'none';
        }
      });
      
      // Force layout recalculation
      window.dispatchEvent(new Event('resize'));
      
      console.log('Code view elements found:', sandpackContainer.querySelectorAll('.sp-code-editor, .sp-file-explorer, .sp-tabs').length);
    }, 100);
    
    console.log('Switched to Code view');
  }
  
  function switchToPreviewView() {
    // Remove code mode classes
    sandpackContainer.classList.remove('code-mode');
    sandpackContainer.classList.add('preview-mode');
    
    // Update button states
    previewToggle.classList.add('active');
    codeToggle.classList.remove('active');
    
    currentView = 'preview';
    
    // Save view toggle state
    if (appPersistence && appPersistence.isStorageAvailable()) {
      appPersistence.saveViewToggleState({ currentView: 'preview' });
    }
    
    // Apply specific hiding logic for Sandpack components
    setTimeout(() => {
      // Find all possible Sandpack elements
      const allElements = sandpackContainer.querySelectorAll('*');
      
      // Reset all inline display styles first
      allElements.forEach(el => {
        if (el.style.display === 'none') {
          el.style.display = '';
        }
      });
      
      // More aggressive approach to hide code-related elements
      allElements.forEach(el => {
        const className = el.className ? el.className.toString() : '';
        const tagName = el.tagName.toLowerCase();
        
        // Hide elements that are likely code editors, file explorers, or tabs
        if (
          className.includes('sp-code') ||
          className.includes('sp-editor') ||
          className.includes('sp-file') ||
          className.includes('sp-tab') ||
          className.includes('code-editor') ||
          className.includes('file-explorer') ||
          className.includes('editor') ||
          className.includes('tab') ||
          el.getAttribute('data-sp-component') === 'code-editor' ||
          el.getAttribute('data-sp-component') === 'file-explorer' ||
          // Check if it's a div that contains code editor content
          (tagName === 'div' && (
            className.includes('cm-') || // CodeMirror classes
            className.includes('monaco') || // Monaco editor classes
            el.querySelector('.cm-editor') ||
            el.querySelector('[class*="editor"]')
          ))
        ) {
          el.style.display = 'none !important';
          console.log('Hiding element:', className, tagName);
        }
      });
      
      // Force layout recalculation
      window.dispatchEvent(new Event('resize'));
      
      // Make sure preview iframe is interactive
      const iframes = sandpackContainer.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.style.pointerEvents = 'all';
        iframe.style.zIndex = '1';
        iframe.style.position = 'relative';
        // Remove any sandbox restrictions that might block interaction
        if (iframe.hasAttribute('sandbox')) {
          iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
        }
      });
      
      // Remove any overlay elements that might block interaction
      const overlays = sandpackContainer.querySelectorAll('[class*="overlay"], [class*="loading"], .sp-overlay');
      overlays.forEach(overlay => {
        overlay.style.display = 'none';
        overlay.style.pointerEvents = 'none';
      });
      
      const hiddenElements = Array.from(allElements).filter(el => el.style.display === 'none !important').length;
      console.log('Preview view - hidden', hiddenElements, 'code elements, enabled', iframes.length, 'iframes');
    }, 100);
    
    console.log('Switched to Preview view');
  }
  
  // Add event listeners
  codeToggle.addEventListener('click', switchToCodeView);
  previewToggle.addEventListener('click', switchToPreviewView);
  
  // Debug function to see what Sandpack elements exist
  function debugSandpackElements() {
    console.log('=== Sandpack Elements Debug ===');
    const allElements = sandpackContainer.querySelectorAll('*');
    const elementsByClass = {};
    
    allElements.forEach(el => {
      if (el.className) {
        const classes = el.className.toString().split(' ');
        classes.forEach(cls => {
          if (cls.startsWith('sp-') || cls.includes('sandpack') || cls.includes('preview') || cls.includes('code')) {
            if (!elementsByClass[cls]) elementsByClass[cls] = 0;
            elementsByClass[cls]++;
          }
        });
      }
    });
    
    console.log('Elements by class:', elementsByClass);
    console.log('Total Sandpack elements:', allElements.length);
    console.log('================================');
  }
  
  // Wait a bit for Sandpack to fully load, then debug and initialize
  setTimeout(() => {
    debugSandpackElements();
    
    // Restore saved view toggle state or default to code view
    if (appPersistence && appPersistence.isStorageAvailable()) {
      const savedViewState = appPersistence.loadViewToggleState();
      if (savedViewState.currentView === 'preview') {
        switchToPreviewView();
      } else {
        switchToCodeView();
      }
    } else {
      switchToCodeView();
    }
  }, 500);
  
  console.log('View toggle initialized');
  return true;
}

// Simple fallback toggle that works with any Sandpack structure
function simpleFallbackToggle() {
  const codeToggle = document.getElementById('codeToggle');
  const previewToggle = document.getElementById('previewToggle');
  const sandpackContainer = document.getElementById('root');
  
  if (!codeToggle || !previewToggle || !sandpackContainer) {
    return false;
  }
  
  let isPreviewMode = false;
  
  function simpleToggleToCode() {
    // First, make sure everything is visible
    const allElements = sandpackContainer.querySelectorAll('*');
    allElements.forEach(el => {
      el.style.display = '';
    });
    
    // Remove any existing classes that might hide things
    sandpackContainer.classList.remove('preview-mode');
    sandpackContainer.classList.add('code-mode');
    
    // Update buttons
    codeToggle.classList.add('active');
    previewToggle.classList.remove('active');
    isPreviewMode = false;
    
    // Save view toggle state
    if (appPersistence && appPersistence.isStorageAvailable()) {
      appPersistence.saveViewToggleState({ currentView: 'code' });
    }
    
    console.log('Simple toggle: Code view - showing everything');
  }
  
  function simpleToggleToPreview() {
    // First, make sure everything is visible
    const allElements = sandpackContainer.querySelectorAll('*');
    allElements.forEach(el => {
      el.style.display = '';
    });
    
    // Remove any existing classes that might hide things
    sandpackContainer.classList.remove('code-mode');
    sandpackContainer.classList.add('preview-mode');
    
    // Now hide code-related elements
    setTimeout(() => {
      allElements.forEach(el => {
        const className = el.className ? el.className.toString() : '';
        const tagName = el.tagName.toLowerCase();
        
        // Hide code editor elements
        if (
          className.includes('sp-code') ||
          className.includes('sp-editor') ||
          className.includes('sp-file') ||
          className.includes('sp-tab') ||
          className.includes('editor') ||
          className.includes('tab') ||
          className.includes('cm-') ||
          className.includes('monaco') ||
          (tagName === 'div' && el.querySelector('.cm-editor')) ||
          (tagName === 'div' && el.querySelector('[class*="editor"]'))
        ) {
          el.style.display = 'none !important';
        }
      });
      
             // Enable iframe interaction
       const iframes = sandpackContainer.querySelectorAll('iframe');
       iframes.forEach(iframe => {
         iframe.style.pointerEvents = 'all';
         iframe.style.zIndex = '1';
         iframe.style.position = 'relative';
         if (iframe.hasAttribute('sandbox')) {
           iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
         }
       });
       
       // Remove overlays
       const overlays = sandpackContainer.querySelectorAll('[class*="overlay"], [class*="loading"], .sp-overlay');
       overlays.forEach(overlay => {
         overlay.style.display = 'none';
         overlay.style.pointerEvents = 'none';
       });
       
       const hiddenCount = Array.from(allElements).filter(el => el.style.display === 'none !important').length;
       console.log('Simple toggle: Preview view - hid', hiddenCount, 'code elements, enabled', iframes.length, 'iframes');
    }, 50);
    
    // Update buttons
    previewToggle.classList.add('active');
    codeToggle.classList.remove('active');
    isPreviewMode = true;
    
    // Save view toggle state
    if (appPersistence && appPersistence.isStorageAvailable()) {
      appPersistence.saveViewToggleState({ currentView: 'preview' });
    }
    
    console.log('Simple toggle: Preview view initiated');
  }
  
  codeToggle.addEventListener('click', simpleToggleToCode);
  previewToggle.addEventListener('click', simpleToggleToPreview);
  
  // Restore saved view toggle state or default to code view
  if (appPersistence && appPersistence.isStorageAvailable()) {
    const savedViewState = appPersistence.loadViewToggleState();
    if (savedViewState.currentView === 'preview') {
      simpleToggleToPreview();
    } else {
      simpleToggleToCode();
    }
  } else {
    simpleToggleToCode();
  }
  
  console.log('Simple fallback toggle initialized');
  return true;
}

// Initialize toggle when DOM is ready and app container is shown
function initializeToggleWhenReady() {
  const appContainer = document.querySelector('.app-container');
  if (appContainer && appContainer.style.display !== 'none') {
    // Try the full toggle first, fallback to simple if needed
    setTimeout(() => {
      if (!initializeViewToggle()) {
        simpleFallbackToggle();
      }
    }, 1000);
  } else {
    // Wait a bit and try again
    setTimeout(initializeToggleWhenReady, 500);
  }
}

  // Start checking for toggle initialization
setTimeout(initializeToggleWhenReady, 1000);

// Emergency function to show all Sandpack content
window.showAllSandpack = function() {
  const sandpackContainer = document.getElementById('root');
  if (sandpackContainer) {
    const allElements = sandpackContainer.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.style.display === 'none') {
        el.style.display = '';
      }
    });
    console.log('All Sandpack content made visible');
  }
};

// Debug function to see all Sandpack elements and their types
window.debugSandpackElements = function() {
  const sandpackContainer = document.getElementById('root');
  if (sandpackContainer) {
    const allElements = sandpackContainer.querySelectorAll('*');
    console.log('=== All Sandpack Elements ===');
    allElements.forEach((el, index) => {
      const className = el.className || 'no-class';
      const tagName = el.tagName.toLowerCase();
      const isVisible = window.getComputedStyle(el).display !== 'none';
      console.log(`${index}: ${tagName}.${className} - ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
    });
    console.log('===============================');
  }
};

// Debug function specifically for iframe interaction
window.debugIframeInteraction = function() {
  const sandpackContainer = document.getElementById('root');
  if (sandpackContainer) {
    const iframes = sandpackContainer.querySelectorAll('iframe');
    console.log('=== Iframe Debug ===');
    iframes.forEach((iframe, index) => {
      const computedStyle = window.getComputedStyle(iframe);
      console.log(`Iframe ${index}:`, {
        src: iframe.src,
        sandbox: iframe.getAttribute('sandbox'),
        pointerEvents: computedStyle.pointerEvents,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position,
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        width: computedStyle.width,
        height: computedStyle.height
      });
    });
    console.log('===================');
  }
};

// Function to animate user counter from 0 to 1.1M
function initializeUserCounter() {
  const userCountElement = document.getElementById('userCount');
  if (!userCountElement) return;
  
  const targetNumber = 1100000; // 1.1 million
  const duration = 2000; // 2 seconds
  const startTime = Date.now();
  
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }
  
  function updateCounter() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use easeOutQuart for smooth deceleration
    const easedProgress = 1 - Math.pow(1 - progress, 4);
    const currentNumber = Math.floor(easedProgress * targetNumber);
    
    userCountElement.textContent = formatNumber(currentNumber);
    userCountElement.classList.add('counting');
    
    setTimeout(() => {
      userCountElement.classList.remove('counting');
    }, 100);
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      // Ensure final value is exactly 1.1M
      userCountElement.textContent = '1.1M';
    }
  }
  
  // Start animation after a small delay for better UX
  setTimeout(() => {
    updateCounter();
  }, 1000);
}

// Mobile view toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const toggleViewBtn = document.getElementById('toggleViewBtn');
    const chatInterface = document.getElementById('chatInterface');
    const sandpackWrapper = document.getElementById('sandpackWrapper');
    
    function updateLayout(isChatVisible) {
        if (isChatVisible) {
            chatInterface.style.display = 'flex';
            sandpackWrapper.style.display = 'none';
            toggleViewBtn.textContent = 'Switch to Preview';
        } else {
            chatInterface.style.display = 'none';
            sandpackWrapper.style.display = 'flex';
            toggleViewBtn.textContent = 'Switch to Chat';
        }
    }

    if (toggleViewBtn) {
        // Set initial state
        let isChatVisible = true;
        updateLayout(isChatVisible);
        
        toggleViewBtn.addEventListener('click', function() {
            isChatVisible = !isChatVisible;
            updateLayout(isChatVisible);
        });

        // Handle resize events
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) {
                // Reset styles for larger screens
                chatInterface.style.display = 'flex';
                sandpackWrapper.style.display = 'flex';
                toggleViewBtn.style.display = 'none';
            } else {
                // Show toggle button and maintain current state on small screens
                toggleViewBtn.style.display = 'inline-block';
                updateLayout(isChatVisible);
            }
        });

        // Initial button visibility
        toggleViewBtn.style.display = window.innerWidth < 768 ? 'inline-block' : 'none';
    }
});