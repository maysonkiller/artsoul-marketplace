// OAuth Integration for Discord and Twitter
// Handles OAuth flow with PKCE for security

class OAuthIntegration {
    constructor() {
        this.supabaseUrl = 'https://bexigvqrunomwtjsxlej.supabase.co';
        this.discordClientId = '1498799956536852480';
        this.twitterClientId = 'YVNmTUVHcE5Sb1hVbnp3NUFFNUs6MTpjaQ';
        this.redirectUri = 'https://maysonkiller.github.io/artsoul-marketplace/profile.html';
    }

    // Generate random string for PKCE
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        randomValues.forEach(v => result += chars[v % chars.length]);
        return result;
    }

    // Generate code challenge for PKCE
    async generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    // Connect Discord
    async connectDiscord(walletAddress) {
        const state = walletAddress;
        const scope = 'identify email';

        const authUrl = `https://discord.com/api/oauth2/authorize?` +
            `client_id=${this.discordClientId}&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${state}`;

        // Store provider for callback
        localStorage.setItem('oauth_provider', 'discord');
        localStorage.setItem('oauth_wallet', walletAddress);

        window.location.href = authUrl;
    }

    // Connect Twitter
    async connectTwitter(walletAddress) {
        const state = walletAddress;
        const codeVerifier = this.generateRandomString(128);
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        // Store code verifier for callback
        localStorage.setItem('twitter_code_verifier', codeVerifier);
        localStorage.setItem('oauth_provider', 'twitter');
        localStorage.setItem('oauth_wallet', walletAddress);

        const scope = 'tweet.read users.read offline.access';
        const authUrl = `https://twitter.com/i/oauth2/authorize?` +
            `client_id=${this.twitterClientId}&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${state}&` +
            `code_challenge=${codeChallenge}&` +
            `code_challenge_method=S256`;

        window.location.href = authUrl;
    }

    // Handle OAuth callback
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const provider = localStorage.getItem('oauth_provider');

        if (!code || !provider) return null;

        try {
            let result;
            if (provider === 'discord') {
                result = await this.handleDiscordCallback(code, state);
            } else if (provider === 'twitter') {
                const codeVerifier = localStorage.getItem('twitter_code_verifier');
                result = await this.handleTwitterCallback(code, state, codeVerifier);
            }

            // Clean up
            localStorage.removeItem('oauth_provider');
            localStorage.removeItem('oauth_wallet');
            localStorage.removeItem('twitter_code_verifier');

            // Remove query params from URL
            window.history.replaceState({}, document.title, window.location.pathname);

            return result;
        } catch (error) {
            console.error('OAuth callback error:', error);
            alert(`Failed to connect ${provider}: ${error.message}`);
            return null;
        }
    }

    async handleDiscordCallback(code, state) {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/discord-oauth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to connect Discord');
        }

        return await response.json();
    }

    async handleTwitterCallback(code, state, codeVerifier) {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/twitter-oauth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state, code_verifier: codeVerifier }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to connect Twitter');
        }

        return await response.json();
    }

    // Disconnect provider
    async disconnect(provider, walletAddress) {
        if (!window.ArtSoulDB) return;

        const updates = {};
        if (provider === 'discord') {
            updates.discord_id = null;
            updates.discord_username = null;
            updates.discord_avatar = null;
        } else if (provider === 'twitter') {
            updates.twitter_id = null;
            updates.twitter_username = null;
            updates.twitter_handle = null;
        }

        await window.ArtSoulDB.updateProfile(walletAddress, updates);
    }
}

// Export for use in profile.html
window.OAuthIntegration = new OAuthIntegration();
