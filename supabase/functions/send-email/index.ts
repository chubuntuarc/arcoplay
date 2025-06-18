import { serve } from "std/http/server.ts"
import { Resend } from 'resend'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    const { data, error } = await resend.emails.send({
      from: 'ArcoPlay <noreply@arciniega.dev>',
      to,
      subject,
      html
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Email sent successfully', data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 