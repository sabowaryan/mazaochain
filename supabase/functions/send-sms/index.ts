import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  to: string;
  message: string;
  type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, type }: SMSRequest = await req.json()

    // Validate required fields
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate phone number format (basic validation for DRC numbers)
    const phoneRegex = /^\+243[0-9]{9}$/
    if (!phoneRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format. Expected: +243XXXXXXXXX' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get SMS service configuration from environment
    const smsServiceUrl = Deno.env.get('SMS_SERVICE_URL')
    const smsApiKey = Deno.env.get('SMS_API_KEY')
    const smsFrom = Deno.env.get('SMS_FROM') || 'MazaoChain'

    if (!smsServiceUrl || !smsApiKey) {
      console.error('SMS service not configured')
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Truncate message if too long (SMS limit is typically 160 characters)
    const truncatedMessage = message.length > 160 
      ? message.substring(0, 157) + '...' 
      : message

    // Send SMS using external service (e.g., Twilio, Africa's Talking, etc.)
    const smsResponse = await fetch(smsServiceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smsApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: smsFrom,
        to: to,
        text: truncatedMessage,
        type: type,
      }),
    })

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text()
      console.error('SMS service error:', errorText)
      throw new Error(`SMS service error: ${smsResponse.status}`)
    }

    // Log SMS sent for audit purposes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('sms_logs')
      .insert({
        recipient: to,
        message: truncatedMessage,
        type: type,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

    return new Response(
      JSON.stringify({ success: true, message: 'SMS sent successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending SMS:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send SMS', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})