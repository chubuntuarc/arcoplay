import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log("TWILIO_SID:", process.env.TWILIO_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'set' : 'not set');
console.log("TWILIO_WHATSAPP_FROM:", process.env.TWILIO_WHATSAPP_FROM);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate a 6-digit code
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      // Update existing user's access code
      const { error: updateError } = await supabase
        .from('users')
        .update({ access_code: accessCode })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return res.status(500).json({ error: 'Error updating user' });
      }
    } else {
      // Create new user with phone
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            phone,
            name: 'Usuario', // Default name, can be updated later
            access_code: accessCode,
            role: 'user'
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ error: 'Error creating user' });
      }
    }

    // Send WhatsApp message
    const message = await twilioClient.messages.create({
      body: `Tu código de acceso para ArcoPlay es: ${accessCode}. Este código expirará en 24 horas.`,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:+${phone}`
    });

    console.log('WhatsApp message sent:', message.sid);

    res.status(200).json({ 
      success: true, 
      message: 'Código enviado por WhatsApp' 
    });

  } catch (error) {
    console.error('Error sending WhatsApp code:', error);
    res.status(500).json({ 
      error: 'Error enviando código por WhatsApp',
      details: error.message 
    });
  }
}
