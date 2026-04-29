// Claude AI Analysis Module
// Analyzes artwork and provides System Value rating

class ClaudeAIAnalysis {
    constructor() {
        // Using Anthropic API endpoint
        this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-5-sonnet-20241022';

        // API key should be stored securely (environment variable or backend)
        // For now, we'll use a placeholder - in production, this should be handled by backend
        this.apiKey = null;
    }

    /**
     * Set API key (should be called from backend or secure storage)
     */
    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * Analyze artwork and return System Value
     * @param {string} imageUrl - URL of the artwork image
     * @param {string} title - Artwork title
     * @param {string} description - Artwork description
     * @param {number} creatorValue - Creator's self-valuation in ETH
     * @returns {Promise<Object>} Analysis result with systemValue and reasoning
     */
    async analyzeArtwork(imageUrl, title, description, creatorValue) {
        if (!this.apiKey) {
            console.warn('⚠️ Claude API key not set. Using mock analysis.');
            return this.mockAnalysis(creatorValue);
        }

        try {
            // Fetch image and convert to base64
            const imageBase64 = await this.fetchImageAsBase64(imageUrl);

            // Prepare prompt for Claude
            const prompt = this.buildAnalysisPrompt(title, description, creatorValue);

            // Call Claude API
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 1024,
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: imageBase64
                                }
                            },
                            {
                                type: 'text',
                                text: prompt
                            }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const analysisText = data.content[0].text;

            // Parse the response to extract system value
            return this.parseAnalysisResponse(analysisText);

        } catch (error) {
            console.error('❌ Claude AI analysis failed:', error);
            // Fallback to mock analysis
            return this.mockAnalysis(creatorValue);
        }
    }

    /**
     * Build analysis prompt for Claude
     */
    buildAnalysisPrompt(title, description, creatorValue) {
        return `You are an expert art critic and valuator for ArtSoul, a decentralized art marketplace with a Triple Valuation system:
1. Creator Value: ${creatorValue} ETH (artist's self-valuation)
2. Community Value: Determined by public voting
3. System Value: Your AI-powered objective assessment

Analyze this artwork titled "${title}" with description: "${description}"

Evaluate based on:
- Technical skill and execution quality
- Originality and creativity
- Composition and visual impact
- Emotional resonance
- Market potential
- Artistic merit

Provide your assessment in this exact format:
SYSTEM_VALUE: [number between 0.01 and 10.0 ETH]
CONFIDENCE: [LOW/MEDIUM/HIGH]
REASONING: [2-3 sentences explaining your valuation]

Be objective and consider that this is a real marketplace where your valuation will influence pricing.`;
    }

    /**
     * Parse Claude's response to extract structured data
     */
    parseAnalysisResponse(text) {
        try {
            // Extract system value
            const valueMatch = text.match(/SYSTEM_VALUE:\s*([\d.]+)/i);
            const systemValue = valueMatch ? parseFloat(valueMatch[1]) : null;

            // Extract confidence
            const confidenceMatch = text.match(/CONFIDENCE:\s*(LOW|MEDIUM|HIGH)/i);
            const confidence = confidenceMatch ? confidenceMatch[1].toUpperCase() : 'MEDIUM';

            // Extract reasoning
            const reasoningMatch = text.match(/REASONING:\s*(.+?)(?:\n\n|\n$|$)/is);
            const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Analysis completed.';

            if (!systemValue) {
                throw new Error('Could not parse system value from response');
            }

            return {
                systemValue: Math.max(0.01, Math.min(10.0, systemValue)),
                confidence,
                reasoning,
                fullAnalysis: text
            };
        } catch (error) {
            console.error('Failed to parse analysis:', error);
            throw error;
        }
    }

    /**
     * Fetch image and convert to base64
     */
    async fetchImageAsBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    // Remove data URL prefix to get pure base64
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Failed to fetch image:', error);
            throw error;
        }
    }

    /**
     * Mock analysis for testing without API key
     * Uses a simple algorithm based on creator value
     */
    mockAnalysis(creatorValue) {
        // Generate a system value that's somewhat related to creator value
        // but with some variance to simulate AI analysis
        const variance = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
        const systemValue = Math.max(0.01, Math.min(10.0, creatorValue * variance));

        const confidenceLevels = ['MEDIUM', 'HIGH'];
        const confidence = confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)];

        const reasonings = [
            'The artwork demonstrates solid technical execution with good composition. The creative concept shows originality and market appeal.',
            'Strong visual impact with professional-level craftsmanship. The piece exhibits clear artistic vision and emotional depth.',
            'Well-executed piece with attention to detail. The artistic style is distinctive and the overall presentation is compelling.',
            'The work shows technical proficiency and creative thinking. Composition is balanced and the concept is engaging.'
        ];
        const reasoning = reasonings[Math.floor(Math.random() * reasonings.length)];

        console.log('🤖 Using mock AI analysis (no API key set)');

        return {
            systemValue: parseFloat(systemValue.toFixed(4)),
            confidence,
            reasoning,
            fullAnalysis: `SYSTEM_VALUE: ${systemValue.toFixed(4)}\nCONFIDENCE: ${confidence}\nREASONING: ${reasoning}`,
            isMock: true
        };
    }

    /**
     * Analyze artwork from upload form
     * This is the main entry point for the upload flow
     */
    async analyzeFromUpload(file, title, description, creatorValue) {
        try {
            // Create temporary URL for the file
            const imageUrl = URL.createObjectURL(file);

            // Perform analysis
            const result = await this.analyzeArtwork(imageUrl, title, description, creatorValue);

            // Clean up temporary URL
            URL.revokeObjectURL(imageUrl);

            return result;
        } catch (error) {
            console.error('Analysis from upload failed:', error);
            throw error;
        }
    }

    /**
     * Re-analyze existing artwork (for updates or re-evaluation)
     */
    async reanalyzeArtwork(artworkId) {
        try {
            // Fetch artwork data from Supabase
            const artwork = await window.ArtSoulDB.getArtwork(artworkId);

            // Perform analysis
            const result = await this.analyzeArtwork(
                artwork.file_url,
                artwork.title,
                artwork.description,
                artwork.creator_value
            );

            // Update system value in database
            await window.ArtSoulDB.updateArtwork(artworkId, {
                system_value: result.systemValue,
                ai_analysis: result.fullAnalysis
            });

            return result;
        } catch (error) {
            console.error('Re-analysis failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
window.ClaudeAIAnalysis = new ClaudeAIAnalysis();

console.log('🤖 Claude AI Analysis module loaded');
