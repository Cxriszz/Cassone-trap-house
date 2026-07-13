import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

serve(async (req) => {
  // CORS configuration for browsers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sms-api-key",
    }})
  }

  try {
    // API Key authentication check
    const apiKey = Deno.env.get('SMS_API_KEY') || 'secret_cassone_sms_token_2026'
    const requestKey = req.headers.get('x-sms-api-key') || req.headers.get('X-SMS-API-KEY')

    if (!requestKey || requestKey !== apiKey) {
      return new Response(JSON.stringify({ error: "Unauthorized access: Invalid or missing API key." }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      })
    }

    const { to, body } = await req.json()

    if (!to || !body) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'body' parameter." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    
    // Twilio expects url-encoded form data
    const formData = new URLSearchParams()
    formData.append('To', to)
    formData.append('From', twilioPhoneNumber!)
    formData.append('Body', body)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`
      },
      body: formData.toString()
    })

    const data = await twilioResponse.json()

    if (!twilioResponse.ok) {
      throw new Error(data.message || 'Error sending SMS')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
})
