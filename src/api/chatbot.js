// Chatbot API Service
// This service handles communication with AI chatbot APIs (Claude/OpenAI)

// TODO: Insert API key here - Add your API key to environment variables
// For Claude: VITE_CLAUDE_API_KEY
// For OpenAI: VITE_OPENAI_API_KEY
const API_PROVIDER = import.meta.env.VITE_API_PROVIDER || 'gemini';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Debug: Check configuration
console.log('API Provider:', API_PROVIDER);
console.log('OpenAI Key loaded:', OPENAI_API_KEY ? 'Yes (length: ' + OPENAI_API_KEY.length + ')' : 'No');
console.log('Hugging Face Key loaded:', HUGGINGFACE_API_KEY ? 'Yes (length: ' + HUGGINGFACE_API_KEY.length + ')' : 'No (using free tier)');
console.log('Gemini Key loaded:', GEMINI_API_KEY ? 'Yes (length: ' + GEMINI_API_KEY.length + ')' : 'No');

// API endpoints
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Get chatbot response from AI API
 * @param {string} message - User message
 * @param {Object} context - Context including selected well and uploaded data
 * @returns {Promise<string>} - AI response
 */
export const getChatbotResponse = async (message, context = {}) => {
  try {
    // Prepare context information for the AI
    const contextInfo = prepareContext(context);
    const systemPrompt = createSystemPrompt(contextInfo);
    
    if (API_PROVIDER === 'claude') {
      if (!import.meta.env.VITE_CLAUDE_API_KEY) {
        throw new Error('Claude API key not configured. Please add VITE_CLAUDE_API_KEY to your environment variables.');
      }
      return await getClaudeResponse(message, systemPrompt);
    } else if (API_PROVIDER === 'openai') {
       if (!OPENAI_API_KEY) {
         throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
       }
       return await getOpenAIResponse(message, systemPrompt);
     } else if (API_PROVIDER === 'gemini') {
       if (!GEMINI_API_KEY) {
         throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
       }
       return await getGeminiResponse(message, systemPrompt);
     } else {
       // Default to Hugging Face (free tier available)
       return await getHuggingFaceResponse(message, systemPrompt);
     }
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    throw error;
  }
};

/**
 * Prepare context information from uploaded data and selected well
 * @param {Object} context - Context object
 * @returns {string} - Formatted context string
 */
const prepareContext = (context) => {
  const { selectedWell, uploadedData, hasUploadedData, dataPoints } = context;
  
  let contextInfo = 'You are an AI assistant specialized in oil drilling data analysis.\n\n';
  
  if (selectedWell) {
    contextInfo += `Currently selected well: ${selectedWell.name} (Depth: ${selectedWell.depth}ft)\n`;
  }
  
  if (hasUploadedData && uploadedData) {
    contextInfo += `Uploaded drilling data available with ${dataPoints} data points.\n`;
    
    // Add sample data structure info
    if (uploadedData.length > 0) {
      const sampleRow = uploadedData[0];
      const columns = Object.keys(sampleRow);
      contextInfo += `Data columns: ${columns.join(', ')}\n`;
      
      // Add data range information
      if (sampleRow.Depth) {
        const depths = uploadedData.map(row => parseFloat(row.Depth)).filter(d => !isNaN(d));
        const minDepth = Math.min(...depths);
        const maxDepth = Math.max(...depths);
        contextInfo += `Depth range: ${minDepth}ft to ${maxDepth}ft\n`;
      }
      
      // Add rock type information if available
      if (sampleRow['Rock Type']) {
        const rockTypes = [...new Set(uploadedData.map(row => row['Rock Type']).filter(Boolean))];
        contextInfo += `Rock types found: ${rockTypes.join(', ')}\n`;
      }
    }
  } else {
    contextInfo += 'No drilling data uploaded yet.\n';
  }
  
  return contextInfo;
};

/**
 * Create system prompt for the AI
 * @param {string} contextInfo - Context information
 * @returns {string} - System prompt
 */
const createSystemPrompt = (contextInfo) => {
  return `${contextInfo}
You should help users understand drilling data, explain drilling parameters like DT (Delta Time) and GR (Gamma Ray), analyze rock formations, and provide insights about the drilling process. Be concise but informative in your responses. If users ask about specific data points, reference the uploaded data when available.`;
};

/**
 * Get response from Claude API
 * @param {string} message - User message
 * @param {string} systemPrompt - System prompt with context
 * @returns {Promise<string>} - Claude response
 */
const getClaudeResponse = async (message, systemPrompt) => {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

/**
 * Get response from OpenAI API
 * @param {string} message - User message
 * @param {string} systemPrompt - System prompt with context
 * @returns {Promise<string>} - OpenAI response
 */
const getOpenAIResponse = async (message, systemPrompt) => {
  console.log('Making request to OpenAI API...');
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error details:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Detailed error in getOpenAIResponse:', error);
    
    // Check for CORS or network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to OpenAI API. This might be due to CORS restrictions or network connectivity issues.');
    }
    
    throw error;
  }
};

/**
 * Get response from Hugging Face API (Free tier available)
 * @param {string} message - User message
 * @param {string} systemPrompt - System prompt with context
 * @returns {Promise<string>} - AI response
 */
const getHuggingFaceResponse = async (message, systemPrompt) => {
  console.log('Making request to Hugging Face API...');
  
  try {
    // For free tier, we'll use a simpler approach with just the latest message
    const prompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if available (optional for free tier)
    if (HUGGINGFACE_API_KEY) {
      headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
    }

    const response = await fetch(HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.7,
          do_sample: true
        }
      })
    });

    console.log('Hugging Face response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Hugging Face API error details:', errorData);
      
      // If model is loading, wait and retry
      if (response.status === 503 && errorData.error?.includes('loading')) {
        console.log('Model is loading, waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        return getHuggingFaceResponse(message, systemPrompt);
      }
      
      throw new Error(`Hugging Face API error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data) && data.length > 0) {
      return data[0].generated_text || data[0].text || 'I apologize, but I received an unexpected response format.';
    } else if (data.generated_text) {
      return data.generated_text;
    } else {
      return 'I apologize, but I could not generate a proper response. Please try again.';
    }
  } catch (error) {
    console.error('Detailed error in getHuggingFaceResponse:', error);
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Hugging Face API. Please check your internet connection.');
    }
    throw error;
  }
};

/**
 * Get response from Google Gemini API
 * @param {string} message - User message
 * @param {string} systemPrompt - System prompt with context
 * @returns {Promise<string>} - AI response
 */
const getGeminiResponse = async (message, systemPrompt) => {
  console.log('Making request to Gemini API...');
  
  try {
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error details:', errorData);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status === 403) {
        throw new Error('Invalid API key or insufficient permissions.');
      } else {
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message || data.error}`);
    }
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }
  } catch (error) {
    console.error('Detailed error in getGeminiResponse:', error);
    
    // Check for CORS or network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Gemini API. This might be due to CORS restrictions or network connectivity issues.');
    }
    
    throw error;
  }
};

/**
 * Test API connection
 * @returns {Promise<boolean>} - True if API is working
 */
export const testAPIConnection = async () => {
  try {
    const response = await getChatbotResponse('Hello', {});
    return response && response.length > 0;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

/**
 * Get available providers
 * @returns {Array} - List of available providers
 */
export const getAvailableProviders = () => {
  const providers = [];
  
  if (import.meta.env.VITE_CLAUDE_API_KEY) {
    providers.push('claude');
  }
  
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    providers.push('openai');
  }
  
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    providers.push('gemini');
  }
  
  // Hugging Face is always available (free tier)
  providers.push('huggingface');
  
  return providers;
};

export default {
  getChatbotResponse,
  testAPIConnection,
  getAvailableProviders
};