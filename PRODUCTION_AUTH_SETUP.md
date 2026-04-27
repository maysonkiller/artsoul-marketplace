# PRODUCTION-GRADE AUTHENTICATION SETUP

## ARCHITECTURE OVERVIEW

### Current Problem
- AppKit provides wallet/social login
- But no Supabase Auth session created
- User remains `anon` in Supabase
- RLS policies fail with `TO authenticated`

### Solution
**Two-tier authentication:**

1. **Wallet Login** → Signature verification → Supabase anonymous session with metadata
2. **Social Login** → Supabase OAuth → Full authenticated session

Both create valid JWT tokens that satisfy `TO authenticated` policies.

---

## STEP 1: Enable Authentication in Supabase

### 1.1 Enable Anonymous Sign-ins

Go to: **Dashboard → Authentication → Providers**

Find **Anonymous Sign-ins** and enable it.

This allows wallet users to get authenticated sessions without email/password.

### 1.2 Enable Social Providers (Optional for future)

For direct Supabase OAuth (bypassing AppKit):

**Google:**
- Enable Google provider
- Add OAuth credentials from Google Cloud Console
- Add redirect URL: `https://maysonkiller.github.io/artsoul-marketplace/`

**Twitter/X:**
- Enable Twitter provider  
- Add OAuth credentials from Twitter Developer Portal
- Add redirect URL: `https://maysonkiller.github.io/artsoul-marketplace/`

**Note:** For now, we use AppKit for social login, then create Supabase session with metadata.

---

## STEP 2: Update RLS Policies (Keep Secure)

Go to: **Dashboard → SQL Editor → New Query**

```sql
-- ============================================
-- SECURE RLS POLICIES FOR AUTHENTICATED USERS
-- ============================================

-- 1. PROFILES: Only authenticated users
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Public can update profiles" ON profiles;

CREATE POLICY "Authenticated can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
    wallet_address = COALESCE(
        auth.jwt() ->> 'wallet_address',
        (auth.jwt() -> 'user_metadata' ->> 'wallet_address')
    )
);

CREATE POLICY "Authenticated can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (
    wallet_address = COALESCE(
        auth.jwt() ->> 'wallet_address',
        (auth.jwt() -> 'user_metadata' ->> 'wallet_address')
    )
);

-- 2. STORAGE: Only authenticated users can upload
DROP POLICY IF EXISTS "Public can upload to artworks" ON storage.objects;
DROP POLICY IF EXISTS "Public can view artworks" ON storage.objects;

CREATE POLICY "Authenticated can upload to artworks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artworks');

CREATE POLICY "Anyone can view artworks"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'artworks');

-- 3. ARTWORKS: Authenticated users can create
DROP POLICY IF EXISTS "Users can create artworks" ON artworks;

CREATE POLICY "Authenticated can create artworks"
ON artworks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view artworks"
ON artworks FOR SELECT
TO public
USING (true);

-- 4. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## STEP 3: How It Works

### Wallet Login Flow

```
1. User clicks "Get Started"
2. AppKit opens wallet selection
3. User connects wallet (MetaMask, etc)
4. subscribeAccount fires with wallet address
5. Frontend calls: SupabaseAuth.authenticateWithWallet(address, provider)
6. Wallet signs message: "ArtSoul Login\nWallet: 0x...\nNonce: ..."
7. Supabase creates anonymous session with metadata:
   {
     wallet_address: "0x...",
     auth_method: "wallet",
     signature: "0x...",
     nonce: "..."
   }
8. User is now authenticated with JWT
9. Can upload files, save profile
```

### Social Login Flow (Current - via AppKit)

```
1. User clicks social login in AppKit modal
2. AppKit handles OAuth with X/Google
3. AppKit returns wallet address (embedded wallet)
4. subscribeAccount fires with address
5. Frontend calls: SupabaseAuth.authenticateWithWallet(address, provider)
6. Supabase creates anonymous session with social metadata
7. User is authenticated
```

### Social Login Flow (Future - Direct Supabase OAuth)

```
1. User clicks "Login with Google" button
2. Frontend calls: SupabaseAuth.authenticateWithSocial('google')
3. Redirects to Google OAuth
4. Google redirects back with token
5. SupabaseAuth.handleOAuthCallback() processes token
6. Full authenticated session created
7. User is authenticated
```

---

## STEP 4: Security Considerations

### ✅ What's Secure

1. **JWT Tokens:** All requests include valid Supabase JWT
2. **RLS Policies:** Only authenticated users can write
3. **Wallet Ownership:** Signature proves wallet ownership
4. **Session Expiry:** Tokens auto-refresh, expire after inactivity

### ⚠️ Current Limitations

1. **Signature Verification:** Done client-side (MVP)
   - **Production:** Verify signature on backend/Edge Function
   - Check signature matches wallet address
   - Prevent replay attacks with nonce

2. **Anonymous Sessions:** Used for wallet login
   - **Production:** Implement custom JWT with backend
   - Use Supabase Admin API to create user with wallet_address as ID
   - Issue proper authenticated session

### 🚀 Production Upgrade Path

**Phase 1 (Current - MVP):**
- Anonymous sessions with metadata
- Client-side signature
- Good enough for beta

**Phase 2 (Production):**
- Backend signature verification
- Custom JWT generation
- Proper user accounts linked to wallets

**Phase 3 (Advanced):**
- Multi-wallet support per user
- Session management dashboard
- Audit logs

---

## STEP 5: Testing

### Test Wallet Login

1. Open site
2. Click "Get Started"
3. Connect MetaMask
4. Sign message when prompted
5. Check console: "✅ Supabase authenticated: ..."
6. Try uploading avatar
7. Should work without RLS errors

### Test Social Login

1. Open AppKit modal
2. Click "Login with Google"
3. Complete OAuth
4. Check console: "✅ Supabase authenticated: ..."
5. Try saving profile
6. Should work without RLS errors

### Verify Authentication

Open browser console:
```javascript
// Check if authenticated
await window.SupabaseAuth.isAuthenticated()
// Should return: true

// Get current session
await window.SupabaseAuth.getCurrentSession()
// Should return: { user: {...}, access_token: "..." }

// Get wallet address
window.SupabaseAuth.getWalletAddress()
// Should return: "0x..."
```

---

## STEP 6: Troubleshooting

### Error: "Anonymous sign-ins are disabled"

**Fix:** Enable in Dashboard → Authentication → Providers → Anonymous Sign-ins

### Error: "Invalid JWT"

**Fix:** Check that supabase-auth.js is loaded before operations

### Error: "Signature request denied"

**Fix:** User cancelled signature. Retry connection.

### Error: Still getting RLS errors

**Fix:** 
1. Verify policies with SQL query in Step 2
2. Check console for "✅ Supabase authenticated"
3. Verify JWT in session: `await SupabaseAuth.getCurrentSession()`

---

## NEXT STEPS

1. ✅ Execute SQL from Step 2
2. ✅ Enable Anonymous Sign-ins in Step 1.1
3. ✅ Test wallet connection
4. ✅ Test file upload
5. ✅ Test profile save

After testing, consider Phase 2 upgrades for production.
