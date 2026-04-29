# Claude AI Integration Setup

## Overview
ArtSoul uses Claude AI to analyze artwork and provide System Value ratings as part of the Triple Valuation system.

## Getting Your API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

## Setting Up the API Key

### Option 1: Browser Console (Recommended for Testing)

Open browser console (F12) and run:

```javascript
window.ClaudeAIAnalysis.setApiKey('sk-ant-your-api-key-here');
```

The key will be saved to localStorage and persist across sessions.

### Option 2: Check API Key Status

```javascript
window.ClaudeAIAnalysis.getApiKeyStatus();
```

Returns:
```javascript
{
  isSet: true/false,
  usingMock: true/false,
  keyPreview: "sk-ant-a...xyz" // masked preview
}
```

### Option 3: Remove API Key

```javascript
window.ClaudeAIAnalysis.setApiKey(null);
```

## How It Works

1. **Upload Artwork**: When you upload artwork, the system automatically triggers AI analysis
2. **Image Analysis**: Claude analyzes the image, title, description, and creator value
3. **Valuation**: AI provides:
   - System Value (ETH)
   - Confidence score (0-1)
   - Detailed reasoning
   - Technical analysis
   - Market comparison

4. **Fallback**: If API key is not set, uses mock analysis with simulated values

## Mock Analysis (No API Key)

Without an API key, the system uses intelligent mock analysis:
- Analyzes file size, type, and metadata
- Generates realistic valuations based on creator value
- Provides simulated confidence scores
- Useful for development and testing

## API Costs

Claude API pricing (as of 2026):
- Claude 3.5 Sonnet: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Average artwork analysis: ~1000 tokens input + 500 tokens output
- Estimated cost per analysis: ~$0.01

## Security Notes

⚠️ **Important**: 
- API keys are stored in browser localStorage
- Never share your API key
- For production, implement backend proxy to hide API keys
- Consider rate limiting to prevent abuse

## Production Deployment

For production, create a backend endpoint:

```javascript
// Backend endpoint (Node.js example)
app.post('/api/analyze-artwork', async (req, res) => {
  const apiKey = process.env.CLAUDE_API_KEY; // From environment
  // ... call Claude API securely
});
```

Then update `claude-ai-analysis.js` to call your backend instead of Anthropic directly.

## Troubleshooting

### "Using mock analysis" warning
- API key not set
- Run `window.ClaudeAIAnalysis.setApiKey('your-key')`

### API errors
- Check API key is valid
- Verify you have credits in Anthropic account
- Check browser console for detailed error messages

### CORS errors
- Anthropic API supports CORS for browser requests
- If issues persist, implement backend proxy

## Testing

Test the integration:

```javascript
// Check status
window.ClaudeAIAnalysis.getApiKeyStatus();

// Test analysis (will use mock if no key)
const result = await window.ClaudeAIAnalysis.analyzeFromUpload(
  file,
  "Test Artwork",
  "Test description",
  0.5
);
console.log(result);
```

## Support

For issues:
- Check browser console for errors
- Verify API key at console.anthropic.com
- Review Anthropic API documentation
- Open issue on GitHub
