import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, code } = req.body;

    if (!name || !phone || !code) {
      return res.status(400).json({ error: 'Name, phone and code are required' });
    }

    // Find user by phone
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Check if access code matches
    if (user.access_code !== code) {
      return res.status(401).json({ error: 'Código inválido' });
    }

    // Check if code is expired (24 hours)
    const codeCreatedAt = new Date(user.updated_at || user.created_at);
    const now = new Date();
    const hoursDiff = (now - codeCreatedAt) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return res.status(401).json({ error: 'Código expirado' });
    }

    // Update user with name
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ name })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ error: 'Error updating user' });
    }

    // Create or update session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .upsert([
        {
          user_id: user.id,
          access_code: code,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
      ], {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return res.status(500).json({ error: 'Error creating session' });
    }

    res.status(200).json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role
      },
      session 
    });

  } catch (error) {
    console.error('Error in WhatsApp signup:', error);
    res.status(500).json({ 
      error: 'Error en el registro',
      details: error.message 
    });
  }
} 