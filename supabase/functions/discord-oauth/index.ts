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
    const { code, state } = await req.json()

    // Discord OAuth credentials
    const DISCORD_CLIENT_ID = '1498799956536852480'
    const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')
    const REDIRECT_URI = 'https://maysonkiller.github.io/artsoul-marketplace/profile.html'

    // Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange code')
    }

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
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
      // Update profile with Discord info
      await supabaseClient
        .from('profiles')
        .update({
          discord_id: userData.id,
          discord_username: `${userData.username}#${userData.discriminator}`,
          discord_avatar: userData.avatar
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : null,
        })
        .eq('wallet_address', state)

      // Store OAuth token (optional, for future use)
      await supabaseClient
        .from('oauth_tokens')
        .upsert({
          user_id: profile.id,
          provider: 'discord',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.id,
          username: `${userData.username}#${userData.discriminator}`,
          avatar: userData.avatar,
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
