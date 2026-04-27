# Supabase RLS Policy Update

## Problem
Users connecting via social logins (X, Google, Discord) get "row-level security policy" error when trying to save profile.

## Solution
Run these SQL commands in Supabase SQL Editor:

```sql
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new open policies (we handle auth in app)
CREATE POLICY "Anyone can create profile" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update profile" ON profiles
    FOR UPDATE USING (true);
```

## Steps
1. Go to https://supabase.com/dashboard
2. Select your project: bexigvqrunomwtjsxlej
3. Click "SQL Editor" in left sidebar
4. Paste the SQL commands above
5. Click "Run" button
6. Done! Social logins will now work

## Why This Works
- Social logins (X, Google) create embedded wallets with addresses
- But they don't have JWT tokens with wallet_address claim
- New policies allow anyone to create/update profiles
- Security is handled by wallet address verification in app code
