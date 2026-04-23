# ArtSoul Backend - OAuth Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your OAuth credentials (see instructions below).

### 3. Run Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

---

## 🔐 OAuth Setup Instructions

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - Application name: `ArtSoul Marketplace`
   - Authorized domains: `maysonkiller.github.io`
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://your-backend-url.com/auth/google/callback` (production)
7. Copy **Client ID** and **Client Secret** to `.env`

### Twitter (X) OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new App or select existing one
3. Go to **Keys and tokens** tab
4. Generate **API Key** and **API Secret Key**
5. Go to **App settings** → **Authentication settings**
6. Enable **OAuth 1.0a**
7. Add Callback URLs:
   - `http://localhost:3000/auth/twitter/callback` (development)
   - `https://your-backend-url.com/auth/twitter/callback` (production)
8. Request email permission (in App permissions)
9. Copy **API Key** and **API Secret** to `.env` as:
   - `TWITTER_CONSUMER_KEY` = API Key
   - `TWITTER_CONSUMER_SECRET` = API Secret Key

---

## 🌐 Deployment Options

### Option 1: Heroku
```bash
heroku create artsoul-backend
heroku config:set GOOGLE_CLIENT_ID=your-id
heroku config:set GOOGLE_CLIENT_SECRET=your-secret
heroku config:set TWITTER_CONSUMER_KEY=your-key
heroku config:set TWITTER_CONSUMER_SECRET=your-secret
heroku config:set SESSION_SECRET=random-secret
heroku config:set FRONTEND_URL=https://maysonkiller.github.io/artsoul-marketplace
git push heroku main
```

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard

### Option 3: Railway
1. Go to [Railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add environment variables
4. Deploy

### Option 4: Render
1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Add environment variables
5. Deploy

---

## 🔗 Frontend Integration

Update your frontend OAuth functions to use real backend:

```javascript
const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
    // Production: 'https://your-backend-url.com/auth/google'
};

const handleXLogin = () => {
    window.location.href = 'http://localhost:3000/auth/twitter';
    // Production: 'https://your-backend-url.com/auth/twitter'
};
```

---

## 📝 API Endpoints

- `GET /auth/google` - Start Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/twitter` - Start Twitter OAuth flow
- `GET /auth/twitter/callback` - Twitter OAuth callback
- `GET /api/user` - Get current authenticated user
- `POST /api/logout` - Logout user
- `GET /health` - Health check

---

## 🔒 Security Notes

- Never commit `.env` file to git
- Use strong `SESSION_SECRET` in production
- Enable HTTPS in production
- Set `NODE_ENV=production` in production
- Regularly rotate OAuth secrets
- Use CORS whitelist for production

---

## 🐛 Troubleshooting

**OAuth redirect not working?**
- Check callback URLs match exactly in OAuth provider settings
- Ensure backend URL is accessible from frontend

**Session not persisting?**
- Check `SESSION_SECRET` is set
- Ensure cookies are enabled
- Check CORS credentials setting

**"Not authenticated" error?**
- User needs to login first
- Check session middleware is configured
- Verify passport serialization

---

## 📚 Resources

- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [Twitter OAuth Guide](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
