import OpenAI from 'openai';

/**
 * AI Provider Integration
 * Supports OpenAI, Groq, and local AI providers
 */

type AIProvider = 'openai' | 'groq' | 'local';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

// Get AI configuration from environment
function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider;

  switch (provider) {
    case 'groq':
      return {
        provider: 'groq',
        apiKey: process.env.GROQ_API_KEY || '',
        model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
        baseUrl: 'https://api.groq.com/openai/v1',
      };
    case 'local':
      return {
        provider: 'local',
        apiKey: 'not-needed',
        model: process.env.LOCAL_AI_MODEL || 'codellama',
        baseUrl: process.env.LOCAL_AI_URL || 'http://localhost:11434/v1',
      };
    case 'openai':
    default:
      return {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      };
  }
}

// Create OpenAI client (works with OpenAI-compatible APIs)
function createClient(): OpenAI {
  const config = getAIConfig();
  
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });
}

// AI action types
export type AIAction = 'explain' | 'fix' | 'generate' | 'refactor';

interface AIRequest {
  action: AIAction;
  code: string;
  context?: string;
  prompt?: string;
  language?: string;
}

interface AIResponse {
  result: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

// System prompts for different actions
const SYSTEM_PROMPTS: Record<AIAction, string> = {
  explain: `You are a helpful coding assistant. Explain the provided code in a clear and concise way.
- Break down complex logic step by step
- Mention the purpose and functionality
- Point out any important patterns or techniques used
- Keep explanations beginner-friendly but technically accurate`,

  fix: `You are an expert code debugger. Analyze the provided code and fix any bugs or issues.
- Identify the problem(s)
- Explain what was wrong
- Provide the corrected code
- Format your response with the explanation first, then the fixed code in a code block`,

  generate: `You are an expert programmer. Generate code based on the user's request.
- Write clean, well-commented code
- Follow best practices for the language
- Include error handling where appropriate
- Provide the code in a properly formatted code block`,

  refactor: `You are a senior software engineer. Refactor the provided code to improve its quality.
- Improve readability and maintainability
- Apply best practices and design patterns
- Optimize performance where possible
- Explain the changes you made
- Provide the refactored code in a code block`,
};

/**
 * Process AI request
 */
export async function processAIRequest(request: AIRequest): Promise<AIResponse> {
  const config = getAIConfig();
  const client = createClient();

  const systemPrompt = SYSTEM_PROMPTS[request.action];
  
  let userMessage = '';
  
  switch (request.action) {
    case 'explain':
      userMessage = `Please explain this ${request.language || 'code'}:\n\n\`\`\`\n${request.code}\n\`\`\``;
      break;
    case 'fix':
      userMessage = `Please fix any bugs in this ${request.language || 'code'}:\n\n\`\`\`\n${request.code}\n\`\`\``;
      if (request.prompt) {
        userMessage += `\n\nAdditional context: ${request.prompt}`;
      }
      break;
    case 'generate':
      userMessage = request.prompt || 'Generate a code snippet';
      if (request.context) {
        userMessage += `\n\nContext/existing code:\n\`\`\`\n${request.context}\n\`\`\``;
      }
      break;
    case 'refactor':
      userMessage = `Please refactor this ${request.language || 'code'}:\n\n\`\`\`\n${request.code}\n\`\`\``;
      if (request.prompt) {
        userMessage += `\n\nSpecific improvements requested: ${request.prompt}`;
      }
      break;
  }

  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content || 'No response generated';
    
    return {
      result,
      tokensUsed: {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    console.error('AI request failed:', error);
    throw new Error('Failed to process AI request');
  }
}

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return config.provider === 'local' || !!config.apiKey;
}
