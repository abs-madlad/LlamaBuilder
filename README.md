# WebBuilder - AI-Powered Code Generator

![WebBuilder Logo](https://img.shields.io/badge/WebBuilder-AI%20Code%20Generator-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange)

## 🚀 Overview

WebBuilder is an innovative AI-powered code generation platform that transforms your ideas into fully functional web applications. Simply describe what you want to build, and our AI will generate complete, runnable code with a live preview in seconds.

## ✨ Features

- **🤖 AI-Powered Code Generation**: Leverages OpenAI's GPT-4 to generate high-quality code from natural language descriptions
- **📱 Live Code Preview**: Real-time code execution and preview using Sandpack
- **🔄 Interactive Code Modification**: Chat with AI to modify and improve your generated code
- **🎨 Multiple Framework Support**: Supports React and vanilla HTML/CSS/JS
- **📝 Intelligent Template Selection**: Automatically selects the best framework based on your requirements
- **💬 Conversational Interface**: Natural language interaction for code generation and modifications
- **🎯 Quick Start Templates**: Pre-built app ideas for instant inspiration
- **📱 Responsive Design**: Works seamlessly across desktop and mobile devices

## 📋 Latest Changes & Updates

### Recent Updates (June 2025)

#### 🔄 **Version 2.1.0** - June 7, 2025
**Major Persistence & UI Enhancements**

**🆕 New Features:**
- **🌙 Night Mode Toggle**: Added dark/light theme switcher with persistent user preference
- **💾 Complete Data Persistence**: Implemented comprehensive local storage system
  - Chat history preservation across sessions
  - Code files auto-save and restore
  - Template selection memory
  - Quality settings persistence
  - UI state management
- **🏠 Homepage Navigation**: Added "Go to Homepage" functionality for better navigation
- **📁 Project Organization**: Enhanced project structure with proper gitignore configuration

**🔧 Technical Improvements:**
- **Enhanced Script Architecture** (`script.js`): 
  - Added 254 new lines of persistence logic
  - Improved chat history management
  - Better state management for UI components
  - Enhanced error handling and recovery
- **Responsive UI Updates** (`style.css`):
  - Fixed preview section height issues for better mobile experience
  - Added comprehensive dark mode styling (254+ lines of new CSS)
  - Improved button styling and interactions
  - Enhanced responsive design patterns
- **HTML Structure Updates** (`index.html`):
  - Integrated night mode toggle button
  - Improved accessibility features
  - Better semantic structure

**🛠️ Infrastructure:**
- **New Persistence Module** (`persistence.js`): 132-line dedicated class for data management
  - LocalStorage wrapper with error handling
  - Modular storage key management
  - Storage availability detection
  - Complete data clearing functionality
- **Enhanced Git Configuration**: Updated `.gitignore` to exclude:
  - Environment files (`.env`)
  - Node modules
  - Documentation files (`PERSISTENCE_IMPLEMENTATION_GUIDE.md`, `TOKEN_LIMIT_ANALYSIS.md`)

**🐛 Bug Fixes:**
- Fixed preview section height responsiveness issues
- Resolved persistence-related state management bugs
- Improved loading states and user feedback
- Enhanced error handling for storage operations

**📊 Code Statistics:**
- **Total Lines Added**: 500+ lines across multiple files
- **Files Modified**: 4 core files (`script.js`, `style.css`, `index.html`, `.gitignore`)
- **New Files**: 1 (`persistence.js`)
- **Commits**: 5 major commits with focused improvements

#### 🔄 **Previous Updates**
- **Chat Persistence**: Implemented conversation history saving
- **Submit Button Styling**: Enhanced user interface elements
- **Loading Improvements**: Better user experience during code generation
- **Documentation Updates**: Comprehensive README improvements

### 🎯 Impact of Recent Changes

**For Users:**
- **Seamless Experience**: Your work is now automatically saved and restored
- **Visual Comfort**: Choose between light and dark themes
- **Better Mobile Experience**: Improved responsive design
- **Faster Workflow**: Persistent settings reduce repetitive configuration

**For Developers:**
- **Modular Architecture**: Clean separation of persistence logic
- **Better Error Handling**: Robust storage management
- **Enhanced Maintainability**: Well-documented code structure
- **Scalable Design**: Foundation for future feature additions

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **OpenAI API** - AI-powered code generation using GPT-4
- **Google Gemini API** - Architecture planning
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Markup structure
- **CSS3** - Styling with modern features
- **Vanilla JavaScript** - Core functionality
- **React** - Component-based UI (via CDN)
- **Sandpack** - Live code editor and preview environment

## 🏗️ Architecture

```
WebBuilder/
├── server.js          # Express server with OpenAI integration
├── index.html         # Main application interface
├── script.js          # Frontend JavaScript logic
├── style.css          # Application styling
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## 🔧 How It Works

### 1. **User Input Processing**
- Users describe their application idea in natural language
- The system analyzes keywords to determine the best framework
- Input is processed and formatted for AI consumption

### 2. **AI Code Generation**
- OpenAI's GPT-4 processes the user request
- AI generates structured JSON response with:
  - `language`: Framework/template to use
  - `code`: Object containing all necessary files
  - `description`: Brief explanation of the generated code

### 3. **Live Preview**
- Generated code is loaded into Sandpack environment
- Real-time preview shows the running application
- Users can see their idea come to life instantly

### 4. **Interactive Modifications**
- Users can request changes through natural language
- AI modifies existing code while maintaining structure
- Changes are applied and previewed in real-time

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- OpenAI API key
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WebBuilder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file and add your API keys
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3001`

### Production Deployment

```bash
npm start
```

## 📖 Usage Guide

### Creating Your First App

1. **Describe Your Idea**: Type what you want to build in the input field
   - Example: "Build me a todo app with dark mode"
   - Example: "Create a weather dashboard with charts"

2. **Choose Quality**: Select between:
   - **Standard Quality**: Quick generation (~15s)
   - **Higher Quality**: Architectural planning + premium code (~30s)

3. **Review Generated Code**: Your app appears instantly in the preview pane

4. **Make Modifications**: Chat with the AI to refine your app:
   - "Add a delete button to each todo item"
   - "Change the color scheme to blue"
   - "Add responsive design for mobile"

### Supported Frameworks

- **React**: Modern component-based applications
- **Vanilla**: Pure HTML, CSS, and JavaScript

### Quick Start Ideas

Try these pre-built prompts:
- Quiz app
- SaaS Landing page
- Pomodoro Timer
- Blog app
- Flashcard app
- Timezone dashboard

## 🎨 Customization

### Styling
The application uses a modern, responsive design with:
- Clean, minimalist interface
- Smooth animations and transitions
- Mobile-first responsive design
- Accessible color schemes

### Adding New Templates
To add support for new frameworks:

1. Update the `templateConfigs` object in `script.js`
2. Add corresponding system prompts in `server.js`
3. Test with sample applications

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the powerful GPT-4 API
- **Sandpack** for the excellent code editor and preview environment
- **Together AI** for inspiration and AI infrastructure
- **React** and the open-source community for amazing tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🔮 Future Roadmap

- [ ] Support for more frameworks (Next.js, Nuxt.js, SvelteKit)
- [ ] Code export functionality
- [ ] Project templates library
- [ ] Collaborative editing
- [ ] Version control integration
- [ ] Custom component library
- [ ] Advanced AI models integration

---

**Built with ❤️ by the WebBuilder team**

*Transform your ideas into reality with the power of AI* 