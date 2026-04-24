# Privy Integration Setup Guide for ArtSoul

## 🚀 Overview

ArtSoul now uses **Privy** for unified Web3 + Web2 authentication. This provides:
- ✅ Wallet connection (MetaMask, Phantom, WalletConnect, Coinbase)
- ✅ Social login (Google, Twitter/X, Email)
- ✅ Embedded wallets for social users
- ✅ Mobile deep linking
- ✅ Network switching with validation
- ✅ SIWE (Sign-in with Ethereum) security

---

## 📋 Step 1: Create Privy Account

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Sign up with your email
3. Create a new app: **ArtSoul Marketplace**
4. Copy your **App ID** (looks like: `clxxx-xxxx-xxxx-xxxx`)

---

## 🔧 Step 2: Configure Privy App

### Basic Settings
- **App Name**: ArtSoul Marketplace
- **App URL**: `https://maysonkiller.github.io/artsoul-marketplace`
- **Logo**: Upload your logo (optional)

### Login Methods
Enable these in Privy Dashboard → **Login Methods**:
- ✅ Wallet (MetaMask, WalletConnect, Coinbase, etc.)
- ✅ Email
- ✅ Google
- ✅ Twitter

### Embedded Wallets
Enable in Privy Dashboard → **Embedded Wallets**:
- ✅ Create on login: **Users without wallets**
- ✅ Auto-create wallet for social logins

### Allowed Origins
Add these URLs in Privy Dashboard → **Settings** → **Allowed Origins**:
- `http://localhost:3000` (for local development)
- `https://maysonkiller.github.io` (for production)

---

## 🔑 Step 3: Get WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project: **ArtSoul**
3. Copy your **Project ID**
4. Add allowed domains:
   - `maysonkiller.github.io`
   - `localhost`

---

## 💻 Step 4: Update Code

### Update `index-privy.html`

Replace this line:
```javascript
const PRIVY_APP_ID = 'clxxx-your-privy-app-id';
```

With your actual Privy App ID:
```javascript
const PRIVY_APP_ID = 'clxxx-1234-5678-9abc'; // Your real App ID
```

### Optional: Add WalletConnect Project ID

If you want WalletConnect support, add this to the Privy config:
```javascript
mobileWalletConnectOptions: {
    projectId: 'your-walletconnect-project-id',
}
```

---

## 🌐 Step 5: Deploy

### Option A: GitHub Pages (Current)
1. Rename `index-privy.html` to `index.html`:
```bash
mv index-privy.html index.html
```

2. Commit and push:
```bash
git add index.html
git commit -m "Integrate Privy authentication"
git push origin main
```

3. Wait 1-2 minutes for GitHub Pages to update

### Option B: Local Testing
1. Install a local server:
```bash
npm install -g http-server
```

2. Run server:
```bash
http-server -p 3000
```

3. Open: `http://localhost:3000`

---

## 🔐 Step 6: Configure Networks

### Supported Networks (Default)
- Ethereum (Mainnet)
- Polygon
- BSC (Binance Smart Chain)
- Arbitrum
- Optimism
- Avalanche
- Base

### Add Custom Network

Edit the `networks` object in `index-privy.html`:
```javascript
const networks = {
    // ... existing networks
    999: { 
        name: 'Your Network', 
        icon: '◈', 
        color: '#FF0000', 
        rpcUrl: 'https://your-rpc-url.com' 
    },
};
```

### Change Required Network

By default, transactions require **Polygon**. To change:
```javascript
const REQUIRED_CHAIN_ID = 1; // Change to Ethereum
// or
const REQUIRED_CHAIN_ID = 56; // Change to BSC
```

---

## 📱 Mobile Support

Privy automatically handles mobile deep linking:
- **iOS**: Opens wallet apps directly
- **Android**: Opens wallet apps directly
- **Fallback**: Shows QR code for desktop wallets

No additional configuration needed!

---

## 🧪 Testing

### Test Wallet Connection
1. Click "Connect" button
2. Choose wallet (MetaMask, WalletConnect, etc.)
3. Approve connection
4. Verify address shows in header

### Test Social Login
1. Click "Connect" button
2. Choose "Google" or "Twitter"
3. Authorize app
4. Embedded wallet created automatically

### Test Network Switching
1. Connect wallet
2. Switch to wrong network in MetaMask
3. Try to place bid
4. Modal appears asking to switch
5. Click "Switch Network"
6. Verify network changed

---

## 🐛 Troubleshooting

### "Privy is not initialized"
- Check your App ID is correct
- Verify allowed origins in Privy Dashboard
- Clear browser cache and reload

### "Failed to connect"
- Check internet connection
- Verify wallet extension is installed
- Try different wallet

### Network switch fails
- Check RPC URL is correct
- Verify chain ID is in hex format
- Try adding network manually in wallet first

### Social login not working
- Verify Google/Twitter is enabled in Privy Dashboard
- Check redirect URLs are correct
- Clear cookies and try again

---

## 🔒 Security Best Practices

1. **Never commit App IDs to public repos** (use environment variables in production)
2. **Enable SIWE** (Sign-in with Ethereum) in Privy Dashboard
3. **Whitelist only your domains** in allowed origins
4. **Use HTTPS** in production
5. **Regularly rotate API keys**

---

## 📚 Resources

- [Privy Documentation](https://docs.privy.io/)
- [Privy React SDK](https://docs.privy.io/guide/react)
- [WalletConnect Docs](https://docs.walletconnect.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

---

## 🎯 Next Steps

1. ✅ Setup Privy account and get App ID
2. ✅ Update code with your App ID
3. ✅ Test wallet connection
4. ✅ Test social login
5. ✅ Test network switching
6. ✅ Deploy to production
7. 🔄 Monitor usage in Privy Dashboard

---

## 💡 Pro Tips

- **Embedded Wallets**: Users who login with Google/Twitter get automatic wallets
- **Multi-device**: Users can access same wallet across devices
- **Recovery**: Privy handles wallet recovery automatically
- **Analytics**: Check Privy Dashboard for user stats
- **Customization**: Customize modal appearance in Privy Dashboard

---

## 🆘 Support

- **Privy Support**: support@privy.io
- **ArtSoul Issues**: https://github.com/maysonkiller/artsoul-marketplace/issues
- **Twitter**: @maysonkiller23
