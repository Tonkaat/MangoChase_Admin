// src/services/aiService.ts

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GenerationConfig {
  temperature: number;
  maxOutputTokens: number;
  topP: number;
}

interface SafetySetting {
  category: string;
  threshold: string;
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig: GenerationConfig;
  safetySettings: SafetySetting[];
}

interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getChatResponse(message: string, history: ChatMessage[]): Promise<string> {
    try {
      console.log('Sending request to Gemini API...');
      
      // Convert history to Gemini format
      const contents = this.convertHistoryToGeminiFormat(history, message);
      
      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 50000,
              topP: 0.8,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH', 
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          } as GeminiRequest),
        }
      );

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (response.status === 200) {
        const data: GeminiResponse = JSON.parse(responseText);
        
        if (
          data.candidates &&
          data.candidates.length > 0 &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts.length > 0
        ) {
          return data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('No response content found in API response');
        }
      } else if (response.status === 400) {
        throw new Error('Bad request - check your API parameters');
      } else if (response.status === 403) {
        throw new Error('Invalid API key or permission denied');
      } else if (response.status === 404) {
        throw new Error('Model not found. Try using gemini-1.5-flash-8b or gemini-1.5-pro');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`API request failed with status ${response.status}: ${responseText}`);
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to communicate with AI service: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private convertHistoryToGeminiFormat(history: ChatMessage[], currentMessage: string): GeminiContent[] {
    const contents: GeminiContent[] = [];
    
    // Add system prompt as the first user message with model response
    contents.push({
      role: 'user',
      parts: [{
        text: 'You are an expert mango farming assistant. Provide practical, ' +
              'actionable advice for mango cultivation, disease management, and harvest optimization. ' +
              'Keep responses concise and focused on agricultural best practices.'
      }]
    });
    
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I am ready to provide expert mango farming advice.' }]
    });
    
    // Convert conversation history
    for (const message of history) {
      contents.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content || '' }]
      });
    }
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage }]
    });
    
    return contents;
  }
}

// Export a singleton instance (optional)
export const geminiService = new GeminiService('YOUR_API_KEY_HERE');