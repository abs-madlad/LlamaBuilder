// usecaseConfig.js

// Using module.exports so it can be 'required' by your Node.js server.
module.exports = {
  // The 'default' use case for the main "CodingAI" page
  default: {
    slug: '/',
    headline: 'Coding AI',
    subtitle: 'Transform your ideas into code with the power of AI.<br>Simply describe what you want to build.',
    description: "AI-powered coding companion. Describe it, and we'll build it.",
    placeholder: 'Build a responsive navbar in React...',
    // This key will be used on the backend to select the right system prompt
    systemPromptKey: 'standard_coding_prompt',
  },
  // The new use case for the Resume Builder
  resume: {
    slug: '/resume',
    headline: 'Resume AI',
    subtitle: 'Build a professional resume that stands out.<br>Simply provide your details and experience.',
    description: "Your personal AI career assistant. Describe your career, and we'll craft the perfect resume.",
    placeholder: 'Create a resume for a senior software engineer with 5 years of experience at Google...',
    systemPromptKey: 'resume_builder_prompt',
  }
  // You can easily add more use cases here in the future!
  // portfolio: { ... }
};