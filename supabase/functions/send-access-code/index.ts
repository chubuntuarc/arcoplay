import { serve } from "std/http/server.ts"
import { createClient } from "supabase"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request details
    console.log('Request received:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    })

    // Read and parse request body
    let body
    try {
      const text = await req.text()
      console.log('Raw request body:', text)
      body = JSON.parse(text)
      console.log('Parsed request body:', body)
    } catch (e) {
      console.error('Error parsing request body:', e)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const { email, name, accessCode } = body

    // Validate required fields
    if (!email || !name || !accessCode) {
      const missing = []
      if (!email) missing.push('email')
      if (!name) missing.push('name')
      if (!accessCode) missing.push('accessCode')
      console.error('Missing required fields:', missing)
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          missing 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    })

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Send email using Supabase's email service
    console.log('Attempting to send email to:', email)
    const { error } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Tu código de acceso para ArcoPlay',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">¡Hola ${name}!</h2>
            <p>Tu código de acceso para ArcoPlay es:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${accessCode}
            </div>
            <p>Este código expirará en 24 horas.</p>
            <p>Si no solicitaste este código, por favor ignora este correo.</p>
            <p>Saludos,<br>El equipo de ArcoPlay</p>
          </div>
        `
      }
    })

    if (error) {
      console.error('Error sending email:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 