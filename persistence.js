// persistence.js
class AppPersistence {
  constructor() {
    this.storageKeys = {
      CHAT_HISTORY: 'coding_ai_chat_history',
      CODE_FILES: 'coding_ai_code_files',
      TEMPLATE: 'coding_ai_template',
      QUALITY_SETTING: 'coding_ai_quality',
      UI_STATE: 'coding_ai_ui_state',
      VIEW_TOGGLE_STATE: 'coding_ai_view_toggle_state'
    };
  }

  // Save chat history
  saveChatHistory(prompts) {
    try {
      localStorage.setItem(this.storageKeys.CHAT_HISTORY, JSON.stringify(prompts));
    } catch (error) {
      console.warn('Failed to save chat history:', error);
    }
  }

  // Load chat history
  loadChatHistory() {
    try {
      const saved = localStorage.getItem(this.storageKeys.CHAT_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load chat history:', error);
      return [];
    }
  }

  // Save code files
  saveCodeFiles(codeFiles) {
    try {
      localStorage.setItem(this.storageKeys.CODE_FILES, JSON.stringify(codeFiles));
    } catch (error) {
      console.warn('Failed to save code files:', error);
    }
  }

  // Load code files
  loadCodeFiles() {
    try {
      const saved = localStorage.getItem(this.storageKeys.CODE_FILES);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load code files:', error);
      return null;
    }
  }

  // Save current template
  saveTemplate(template) {
    try {
      localStorage.setItem(this.storageKeys.TEMPLATE, template);
    } catch (error) {
      console.warn('Failed to save template:', error);
    }
  }

  // Load current template
  loadTemplate() {
    try {
      return localStorage.getItem(this.storageKeys.TEMPLATE) || 'react';
    } catch (error) {
      console.warn('Failed to load template:', error);
      return 'react';
    }
  }

  // Save quality setting
  saveQualitySetting(quality) {
    try {
      localStorage.setItem(this.storageKeys.QUALITY_SETTING, quality);
    } catch (error) {
      console.warn('Failed to save quality setting:', error);
    }
  }

  // Load quality setting
  loadQualitySetting() {
    try {
      return localStorage.getItem(this.storageKeys.QUALITY_SETTING) || 'standard';
    } catch (error) {
      console.warn('Failed to load quality setting:', error);
      return 'standard';
    }
  }

  // Save UI state
  saveUIState(uiState) {
    try {
      localStorage.setItem(this.storageKeys.UI_STATE, JSON.stringify(uiState));
    } catch (error) {
      console.warn('Failed to save UI state:', error);
    }
  }

  // Load UI state
  loadUIState() {
    try {
      const saved = localStorage.getItem(this.storageKeys.UI_STATE);
      return saved ? JSON.parse(saved) : { chatVisible: false };
    } catch (error) {
      console.warn('Failed to load UI state:', error);
      return { chatVisible: false };
    }
  }

  // Save view toggle state
  saveViewToggleState(viewState) {
    try {
      localStorage.setItem(this.storageKeys.VIEW_TOGGLE_STATE, JSON.stringify(viewState));
    } catch (error) {
      console.warn('Failed to save view toggle state:', error);
    }
  }

  // Load view toggle state
  loadViewToggleState() {
    try {
      const saved = localStorage.getItem(this.storageKeys.VIEW_TOGGLE_STATE);
      return saved ? JSON.parse(saved) : { currentView: 'code' };
    } catch (error) {
      console.warn('Failed to load view toggle state:', error);
      return { currentView: 'code' };
    }
  }

  // Clear all saved data
  clearAll() {
    Object.values(this.storageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Clear all saved data except theme and view toggle state (for HQ mode)
  clearAllExceptCritical() {
    const keysToPreserve = [
      this.storageKeys.VIEW_TOGGLE_STATE,
      'theme' // Preserve theme as well
    ];
    
    Object.values(this.storageKeys).forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Check if storage is available
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export as global instance
window.appPersistence = new AppPersistence(); 