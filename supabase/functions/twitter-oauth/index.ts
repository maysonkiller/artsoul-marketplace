import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, state, code_verifier } = await req.json()

    // Twitter OAuth 2.0 credentials
    const TWITTER_CLIENT_ID = 'YVNmTUVHcE5Sb1hVbnp3NUFFNUs6MTpjaQ'
    const TWITTER_CLIENT_SECRET = Deno.env.get('TWITTER_CLIENT_SECRET')
    const REDIRECT_URI = 'https://maysonkiller.github.io/artsoul-marketplace/profile.html'

    // Exchange code for token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: code_verifier,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange code')
    }

    // Get user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from state (wallet address)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('wallet_address', state)
      .single()

    if (profile) {
      // Update profile with Twitter info
      await supabaseClient
        .from('profiles')
        .update({
          twitter_id: userData.data.id,
          twitter_username: userData.data.username,
          twitter_handle: `@${userData.data.username}`,
        })
        .eq('wallet_address', state)

      // Store OAuth token (optional, for future use)
      await supabaseClient
        .from('oauth_tokens')
        .upsert({
          user_id: profile.id,
          provider: 'twitter',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.data.id,
          username: userData.data.username,
          profile_image: userData.data.profile_image_url,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
