// Claude AI Integration for Artwork Analysis
// Analyzes artwork and provides valuation reasoning

class ClaudeAI {
    constructor() {
        this.apiKey = null;
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
    }

    // Get API key from localStorage
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem('claude_api_key');
        }
        return this.apiKey;
    }

    // Set API key
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('claude_api_key', key);
    }

    // Analyze artwork and provide valuation reasoning
    async analyzeArtwork(artwork) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Claude API key not set. Please add your API key in settings.');
        }

        const prompt = `Analyze this artwork and provide a valuation reasoning:

Title: ${artwork.title}
Description: ${artwork.description || 'No description'}
Creator Value: ${artwork.creator_value} ETH
File Type: ${artwork.file_type}

Please provide:
1. A brief analysis of why this artwork might be valued at ${artwork.creator_value} ETH
2. Consider factors like: artistic merit, market trends, creator reputation, uniqueness
3. Your confidence level in this valuation (high/medium/low)

Keep your response concise (2-3 sentences) and professional.`;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 300,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const data = await response.json();
            const reasoning = data.content[0].text;

            // Extract confidence if mentioned
            let confidence = 'medium';
            if (reasoning.toLowerCase().includes('high confidence')) {
                confidence = 'high';
            } else if (reasoning.toLowerCase().includes('low confidence')) {
                confidence = 'low';
            }

            return {
                reasoning: reasoning,
                confidence: confidence,
                system_value: artwork.creator_value // For now, use creator value
            };
        } catch (error) {
            console.error('Claude AI analysis failed:', error);
            throw error;
        }
    }

    // Calculate system value based on analysis
    calculateSystemValue(creatorValue, confidence) {
        // Adjust creator value based on AI confidence
        const multipliers = {
            'high': 1.2,
            'medium': 1.0,
            'low': 0.8
        };

        const multiplier = multipliers[confidence] || 1.0;
        return (parseFloat(creatorValue) * multiplier).toFixed(4);
    }
}

// Export singleton instance
window.ClaudeAI = new ClaudeAI();

console.log('Claude AI module loaded');
