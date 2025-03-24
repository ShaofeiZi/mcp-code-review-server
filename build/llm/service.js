/**
 * @file LLM Service
 * @version 0.1.0
 *
 * Service for interacting with LLMs using direct API calls
 */
import fetch from 'node-fetch';
/**
 * Service for interacting with LLMs via direct API calls
 */
export class LLMService {
    config;
    /**
     * Creates a new LLMService
     * @param config LLM configuration
     */
    constructor(config) {
        this.config = config;
        console.log(`LLM service initialized with provider ${config.provider} and model ${config.model}`);
    }
    /**
     * Generates a review using the LLM
     * @param prompt Prompt to send to the LLM
     * @returns Generated review
     */
    async generateReview(prompt) {
        try {
            console.log('Sending code review request to LLM...');
            // Ensure API key exists
            if (!this.config.apiKey) {
                throw new Error(`API key not provided for ${this.config.provider}`);
            }
            // Determine the API endpoint based on the provider
            let endpoint;
            let headers = {
                'Content-Type': 'application/json'
            };
            let requestBody;
            switch (this.config.provider) {
                case 'OPEN_AI':
                    endpoint = 'https://api.openai.com/v1/chat/completions';
                    headers['Authorization'] = `Bearer ${this.config.apiKey}`;
                    requestBody = {
                        model: this.config.model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0,
                        max_tokens: 4000,
                        response_format: { type: 'json_object' }
                    };
                    break;
                case 'ANTHROPIC':
                    endpoint = 'https://api.anthropic.com/v1/messages';
                    headers['x-api-key'] = this.config.apiKey;
                    headers['anthropic-version'] = '2023-06-01';
                    requestBody = {
                        model: this.config.model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0,
                        max_tokens: 4000,
                        response_format: { type: 'json_object' }
                    };
                    break;
                case 'GEMINI':
                    endpoint = `https://generativelanguage.googleapis.com/v1/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
                    requestBody = {
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0,
                            maxOutputTokens: 4000
                        }
                    };
                    break;
                default:
                    throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
            }
            // Make the API request
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestBody)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`LLM API request failed: ${response.status} ${response.statusText} - ${errorText}`);
                }
                // Parse the response JSON with appropriate type
                let responseText;
                switch (this.config.provider) {
                    case 'OPEN_AI': {
                        const data = await response.json();
                        responseText = data.choices[0].message.content;
                        break;
                    }
                    case 'ANTHROPIC': {
                        const data = await response.json();
                        responseText = data.content[0].text;
                        break;
                    }
                    case 'GEMINI': {
                        const data = await response.json();
                        responseText = data.candidates[0].content.parts[0].text;
                        break;
                    }
                    default:
                        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
                }
                // Parse the result
                return this.parseReviewResponse(responseText);
            }
            catch (error) {
                console.error('Fetch error:', error);
                throw new Error(`API request failed: ${error.message}`);
            }
        }
        catch (error) {
            console.error('LLM request failed:', error);
            throw new Error(`Failed to generate review: ${error.message}`);
        }
    }
    /**
     * Parses the LLM response into a structured format
     * @param responseText LLM response text
     * @returns Parsed review result
     */
    parseReviewResponse(responseText) {
        try {
            // Clean the response text - remove markdown code blocks if present
            let cleanedResponse = responseText.trim();
            // Handle responses wrapped in markdown code blocks
            const jsonPattern = /```(?:json)?\s*([\s\S]*?)```/;
            const match = cleanedResponse.match(jsonPattern);
            if (match && match[1]) {
                cleanedResponse = match[1].trim();
            }
            // Parse the JSON response
            const parsedResponse = JSON.parse(cleanedResponse);
            // Validate the response structure
            if (!parsedResponse.summary ||
                !Array.isArray(parsedResponse.issues) ||
                !Array.isArray(parsedResponse.strengths) ||
                !Array.isArray(parsedResponse.recommendations)) {
                throw new Error('Invalid response structure from LLM');
            }
            return parsedResponse;
        }
        catch (error) {
            console.error('Failed to parse LLM response:', error);
            console.error('Response text:', responseText);
            throw new Error(`Failed to parse LLM response: ${error.message}`);
        }
    }
}
