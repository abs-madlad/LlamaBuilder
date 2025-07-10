const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Added for Gemini
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const usecaseConfig = require('./usecaseConfig');
const app = express();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));


const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- Refined Prompts ---
const softwareArchitectPrompt = `You are an expert software architect and product lead responsible for taking an idea of an app, analyzing
it, and producing an implementation plan for a React frontend app. 
You are describing a plan for a React + CSS app.\n\nGuidelines:\n- Focus on MVP - Describe the Minimum Viable Product, 
which are the essential set of features needed to launch the app. 
Identify and prioritize the top 2-3 critical features.\n- Detail the High-Level Overview - Begin with a broad overview of the app's purpose 
and core functionality, then detail specific features.
 Break down tasks into two levels of depth (Features → Tasks → Subtasks).\n- Be concise, clear, and straight forward. Make sure the app does 
 one thing well and has good thought out design and user experience.\n- Skip code examples and commentary. Do not include any external API 
 calls either.\n- Make sure the implementation can fit into one big React component\n- You CANNOT use any other libraries or frameworks 
 besides React, CSS.\n- Focus on creating a practical, implementable plan that a developer could follow to build a high-quality 
 application\n- Be specific about React patterns, state management, and component hierarchy when applicable\n- Consider responsive design 
 and accessibility from the planning stage\n\nRespond with a detailed plan in plain text format, not JSON.`;
const enhancedCodingPrompt = `You are LlamaCoder, an expert frontend React engineer who is also a great UI/UX designer. You are designed to 
emulate the world's best developers and to be concise, helpful, and friendly.\n\n# General Instructions\n\nFollow the following instructions 
very carefully:\n- Before generating a React project, think through the right requirements, structure, styling, images, and formatting\n- 
Create a React component for whatever the user asked you to create and make sure it can run by itself by using a default export\n- Make sure 
the React app is interactive and functional by creating state when needed and having no required props\n- If you use any imports from React 
like useState or useEffect, make sure to import them directly\n- Do not include any external API calls\n- Use JavaScript as the language for 
the React component (not TypeScript)\n- Use CSS classes for styling with modern CSS techniques (Flexbox, Grid, CSS Variables)\n- Use CSS 
margin and padding to make sure components are spaced out nicely and follow good design principles\n- Write complete code that can be copied/
pasted directly. Do not write partial code or include comments for users to finish the code\n- Generate responsive designs that work well on 
mobile + desktop\n- Default to using a white background unless a user asks for another one. If they do, use a wrapper element with a 
background color\n- For placeholder images, please use a <div className="placeholder-image" style={{backgroundColor: '#e5e7eb', border: '2px 
dashed #9ca3af', borderRadius: '12px', width: '64px', height: '64px'}} />\n\n# Implementation Guidelines\n\nWhen provided with an 
architectural plan:\n1. Implement ALL features mentioned in the architectural plan\n2. Use modern React patterns and best practices\n3. 
Create clean, well-structured, and maintainable code\n4. Include proper error handling and loading states\n5. Implement responsive design 
principles\n6. Add meaningful comments for complex logic\n7. Use semantic HTML and accessible design patterns\n8. Follow the component 
structure outlined in the plan\n9. Implement the data flow as specified\n10. Prioritize features according to the implementation plan\n\n# 
Response Format\n\nProvide the output in a JSON object with the following structure:\n{\n  "language": "react",\n  "code": {\n    "App.js": 
"React component code here",\n    "styles.css": "CSS styles here"\n  },\n  "description": "Brief explanation of the implemented features and 
functionality"\n}\n\nEnsure that the code is properly formatted, includes all necessary files for the project to run correctly in Sandpack's 
environment, and implements the architectural plan comprehensively.`;

const standardCodingPrompt = `You are an expert React developer. Generate a functional React application based on the user's request.

Guidelines:
- Create a complete, working React component with default export
- Use modern React patterns (hooks, functional components)
- Include proper state management where needed
- Use CSS for styling with responsive design
- Import React features directly (useState, useEffect, etc.)
- No external API calls
- Use JavaScript (not TypeScript)
- Generate clean, readable code that works immediately
- Focus on core functionality and good UX

**Important**: Your response **must** be a single, valid JSON object. Do not include any text outside of this JSON object.
The JSON object should follow this structure:
{
  "language": "react", // or "static" for vanilla HTML/CSS/JS
  "code": {
    "App.js": "Your React component code here...",
    "styles.css": "Your CSS styles here..."
    // Add other files like index.js for vanilla if needed
  },
  "description": "A brief explanation of what the app does and its key features."
}

Ensure the code is complete and functional. For example, if providing a React component, it should be self-contained in App.js.`;

// Special prompt for vanilla HTML/CSS/JS projects (current one, can be refined later if needed)
const vanillaPrompt = `You are a code generator.Generate code for the prompt user is giving you in this json format:
      {
      "language": Set this to "static" since the tech stack is limited to HTML, CSS, and JavaScript,
      "description": A brief explanation of what the code does,
      "code": { "index.html": "string", "styles.css": "string", "index.js": "string" }, // the default name for the files are index.html, styles.css, index.js
      }
      if creating any other script file link it to html file using <script src=""></script>
      Always include import {"./styles.css";} inside index.js file `;

const resumeBuilderPrompt = `You are an expert resume writing assistant. Your goal is to generate a clean, professional, and effective resume in reactjs based on the user's prompt. The output should be in Markdown format for clarity and structure.
      Guidelines:
      - Start with the user's Name, followed by contact information (Phone, Email, LinkedIn, Location).
      - Include the following sections if applicable: Summary, Experience, Education, Skills, Projects.
      - For the 'Experience' section, use action verbs to describe accomplishments (e.g., "Led," "Developed," "Optimized").
      - For the 'Skills' section, categorize them (e.g., Languages, Frameworks, Tools).
      - The tone should be professional and confident.
      - The output MUST be a valid JSON object with the following structure:
      {
        "language": "react",
        "code": {
          "App.js": "Your React component code here...",
          "styles.css": "Your CSS styles here...";
        },
        "description": "A brief, encouraging confirmation message that the resume has been generated."
      }`;

const systemPrompts = {
        standard_coding_prompt: standardCodingPrompt,
        vanilla_prompt: vanillaPrompt,
        enhanced_coding_prompt: enhancedCodingPrompt,
        resume_builder_prompt: resumeBuilderPrompt
      };

// Handle root route
app.get('/', (req, res) => {
  try {
    // Read the main index.html file
    let html = fs.readFileSync(__dirname + '/index.html', 'utf8');

    // Create a script tag to inject the config object into the window
    const configScript = `<script>window.pageConfig = ${JSON.stringify(usecaseConfig)};</script>`;

    // Inject this script into the <head> of the HTML
    html = html.replace('</head>', `${configScript}\n</head>`);

    // Send the modified HTML to the client
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading the page.');
  }
});

// Handle resume route
app.get('/resume', (req, res) => {
  try {
    // Read the main index.html file
    let html = fs.readFileSync(__dirname + '/index.html', 'utf8');

    // Create a script tag to inject the config object into the window
    const configScript = `<script>window.pageConfig = ${JSON.stringify(usecaseConfig)};</script>`;

    // Inject this script into the <head> of the HTML
    html = html.replace('</head>', `${configScript}\n</head>`);

    // Send the modified HTML to the client
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading the page.');
  }
});

// Serve other static files (CSS, JS, assets) after the special route handler
app.use(express.static(__dirname));

// New Endpoint for Architectural Planning (Stage 1)
app.post('/api/architect', async (req, res) => {
  const { prompt, quality } = req.body;
  console.log(`Architect API called with quality: ${quality}, prompt: ${prompt}`);

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt for architectural planning' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});
    const geminiMessages = [
      { role: 'user', parts: [{text: softwareArchitectPrompt}] },
      { role: 'model', parts: [{text: "Okay, I will act as an expert software architect and product lead. Provide the app idea, and I will produce a detailed implementation plan for a single-page React frontend app based on your guidelines."}] }, // Priming the model
      { role: 'user', parts: [{text: prompt}] }
    ];

    const result = await model.generateContent({ contents: geminiMessages });
    const response = result.response;
    const architecturalPlan = response.text();

    res.json({ architecturalPlan, model: 'gemini-2.0-flash', success: true });

  } catch (err) {
    console.error('Error with Gemini API:', err);
    // Fallback to OpenAI for architectural planning if Gemini fails
    try {
      console.log('Gemini failed, falling back to OpenAI for architecture.');
      // For architectural planning, we don't need JSON format, so use direct call
      const openaiCompletion = await openai.chat.completions.create({
        model: "gpt-4.1-nano", // Cheaper model for fallback planning
        messages: [
          { role: "system", content: softwareArchitectPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 8192 // Architectural plans are usually shorter
      });
      const architecturalPlan = openaiCompletion.choices[0].message.content;
      res.json({ architecturalPlan, model: 'gpt-4.1-nano', success: true, fallback: true });
    } catch (fallbackErr) {
      console.error('OpenAI architectural fallback failed:', fallbackErr);
      res.status(500).json({
        error: 'Architectural planning failed with both Gemini and OpenAI',
        details: fallbackErr.message
      });
    }
  }
});


app.post('/api/openai', async (req, res) => {
  // const userMessages = req.body.messages;
  // const quality = req.body.quality || 'standard';
  // const architecturalPlan = req.body.architecturalPlan; // New parameter for Stage 2
  const { messages: userMessages, quality = 'standard', architecturalPlan, usecase = 'default' } = req.body;

  // console.log(`OpenAI API called with quality: ${quality}`);
  console.log(`OpenAI API called for usecase: ${usecase} with quality: ${quality}`);
  if (architecturalPlan) {
    console.log('Architectural plan received for code generation.');
  }

  if (!Array.isArray(userMessages) || userMessages.length === 0) {
    return res.status(400).json({ error: 'Missing or empty messages array' });
  }

  const openaiMessages = userMessages.map(m => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: String(m.content || '').trim()
  }));

  let systemMessageContent;
  const currentConfig = usecaseConfig[usecase] || usecaseConfig.default;
  const systemPromptKey = currentConfig.systemPromptKey;

  // Check for vanilla/static keywords
  const latestUserMessageContent = openaiMessages[openaiMessages.length - 1]?.content?.toLowerCase() || "";
  const keywords = ["html", "css", "vanilla"];

  if (!systemMessageContent) {
    console.warn(`Invalid systemPromptKey '${systemPromptKey}', falling back to default.`);
    systemMessageContent = systemPrompts[usecaseConfig.default.systemPromptKey];
  }
  
  if (keywords.some(keyword => latestUserMessageContent.includes(keyword)) && !architecturalPlan) {
    systemMessageContent = vanillaPrompt; 
  } else if (quality === 'higher' && architecturalPlan) {
    systemMessageContent = enhancedCodingPrompt;
    // The architectural plan itself will be part of the user message in this flow
    // We prepend it to the last user message for context for the coding model
    const lastUserMessage = openaiMessages.pop();
    openaiMessages.push({
        role: 'user',
        content: `Architectural Plan:\n${architecturalPlan}\n\nUser Request: ${lastUserMessage.content}`
    });
  } else {
    // Use the dynamically selected system prompt
    systemMessageContent = systemPrompts[systemPromptKey];
  }
  
  openaiMessages.unshift({ role: 'system', content: systemMessageContent });

  try {
    // Use the hybrid continuation approach
    const fullResponseContent = await generateWithContinuation(openaiMessages);

    try {
      const responseData = combineJsonResponses(fullResponseContent);
      console.log('OpenAI response successfully parsed:', responseData);
      res.json(responseData);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw OpenAI response content:', fullResponseContent);
      res.status(500).json({
        error: 'Failed to parse OpenAI response',
        rawResponse: fullResponseContent,
        suggestion: 'The response may be too complex. Try breaking down your request into smaller parts.'
      });
    }
  } catch (err) {
    console.error('Error with OpenAI API:', err.message);
    res.status(500).json({
      error: err.response?.data?.error?.message || err.message || 'OpenAI request failed',
      details: err.message
    });
  }
});

// Simple and effective /api/modify endpoint
app.post('/api/modify', async (req, res) => {
  const { currentCode, modificationPrompt, usecase = 'default' } = req.body;
  // console.log('Received currentCode:', currentCode);

  if (!currentCode || !modificationPrompt) {
    return res.status(400).json({ error: 'Missing currentCode or modificationPrompt' });
  }

  const modifySystemPrompt = `You are a code modifier. The user will provide existing code and a modification request. Update the existing code based on the modification request and provide the output in a JSON object with the following structure:

"language": a string indicating the Sandpack template used, such as "react" or "static".
"code": an object where each key is a file path (e.g., "/App.js", "/index.html", "/styles.css"), and each value is a string containing the updated code for that file.
"description": a string providing a brief explanation of the changes made.

Guidelines:
- The 'code' object must include all files that are part of the project after applying the modification. This includes:
  - Files that have been updated based on the modification request.
  - New files added as part of the modification.
  - Unchanged files from the original code that are still relevant to the project.
- Do not omit any files unless the modification explicitly requires their removal.
- For static (HTML, CSS, JS) projects, ensure that CSS files are linked in the HTML file using <link rel="stylesheet" href="/styles.css">.
- For React applications, ensure that all necessary files are included, such as component files, CSS files, and any other assets. Use import statements to include CSS files in JavaScript, e.g., import './styles.css';. If the modification involves changes to the UI, update the relevant CSS files accordingly.
- If the original code includes a CSS file, always include it in the response, with updates if necessary, unless the modification removes it.
- Consider whether the modification request impacts multiple files, such as both JavaScript and CSS, and update all affected files accordingly.
- Ensure that the updated code is properly formatted and compatible with the specified Sandpack template.
- For React applications, react-router-dom (v6) is available for multi-page apps. Configure BrowserRouter, Routes, and Route components as needed.

Examples:
- For a vanilla code modification:
  {
    "language": "static",
    "code": {
      "/index.html": "<html><head><link rel='stylesheet' href='/styles.css'></head><body><h1>Hello</h1></body></html>",
      "/styles.css": "h1 { color: blue; }",
      "/index.js": "console.log('Hello');"
    },
    "description": "Changed the heading color to blue"
  }
- For a React code modification:
  {
    "language": "react",
    "code": {
      "/App.js": "import React from 'react';\\nimport './styles.css';\\nfunction App() {\\n return <h1 className='heading'>Hello, World!</h1>;\\n}\\nexport default App;",
      "/styles.css": ".heading { color: blue; }"
    },
    "description": "Added a styled heading"
  }

The response must always be a valid JSON object with the specified structure.`;

  // Format the current code for the AI to understand
  const codeString = Object.entries(currentCode).map(([file, code]) => `File: ${file}\n\`\`\`\n${code}\n\`\`\``).join('\n\n');
  const userMessage = `Here is the current code:\n\n${codeString}\n\nModification request: ${modificationPrompt}`;

  const messages = [
    { role: 'system', content: modifySystemPrompt },
    { role: 'user', content: userMessage }
  ];

  try {
    // Use the hybrid continuation approach
    const fullResponseContent = await generateWithContinuation(messages);
    const response = combineJsonResponses(fullResponseContent);
    res.json(response);
  } catch (err) {
    console.error('Error with modification request:', err.message);
    res.status(500).json({
      error: err.response?.data?.error?.message || err.message || 'Modification request failed',
      details: err.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 3001;

// Hybrid approach: Continuation logic for token limit handling
async function generateWithContinuation(messages, maxAttempts = 3) {
  let fullResponse = '';
  let attempt = 0;
  let currentMessages = [...messages]; // Copy to avoid modifying original
  
  console.log(`Starting code generation with hybrid approach (max_tokens: 16384)`);
  
  while (attempt < maxAttempts) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: currentMessages,
        max_tokens: 16384, // Increased from 8192
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content;
      const finishReason = completion.choices[0].finish_reason;
      
      console.log(`Attempt ${attempt + 1}: finish_reason = ${finishReason}, response length = ${responseContent.length} chars`);
      
      if (finishReason === 'length') {
        // Truncated - continue from where we left off
        console.log(`🔄 Token limit reached on attempt ${attempt + 1}, using continuation logic...`);
        fullResponse += responseContent;
        
        // Add the partial response and continuation prompt
        currentMessages.push({
          role: 'assistant',
          content: responseContent
        });
        currentMessages.push({
          role: 'user',
          content: `Continue the JSON response from where it was cut off. The response was truncated. Continue with valid JSON structure to complete the remaining files. Start directly with the continuation, no explanations. Make sure to include the word "json" in your response.`
        });
        
        attempt++;
      } else {
        // Complete response
        fullResponse += responseContent;
        console.log(`✅ Response completed successfully on attempt ${attempt + 1} (total length: ${fullResponse.length} chars)`);
        break;
      }
    } catch (error) {
      console.error(`❌ Error on continuation attempt ${attempt + 1}:`, error.message);
      if (attempt === maxAttempts - 1) {
        throw error; // Re-throw on final attempt
      }
      attempt++;
    }
  }
  
  if (attempt >= maxAttempts) {
    throw new Error('Maximum continuation attempts reached. Response may be incomplete.');
  }
  
  return fullResponse;
}

// Helper function to clean and combine JSON responses
function combineJsonResponses(responses) {
  try {
    // Try to parse the combined response first
    return JSON.parse(responses);
  } catch (error) {
    console.log('Combined response needs cleaning, attempting to fix...');
    
    // If that fails, try to clean up common continuation issues
    let cleaned = responses;
    
    // Remove duplicate opening braces
    cleaned = cleaned.replace(/}\s*{/g, ',');
    
    // Ensure proper JSON structure
    if (!cleaned.trim().startsWith('{')) {
      cleaned = '{' + cleaned;
    }
    if (!cleaned.trim().endsWith('}')) {
      cleaned = cleaned + '}';
    }
    
    try {
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error('Failed to clean JSON response:', secondError);
      throw new Error('Unable to parse combined JSON response');
    }
  }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}, with OpenAI and Gemini clients initialized.`));