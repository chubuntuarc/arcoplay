import { createClient } from '@supabase/supabase-js';
import mercadopago from 'mercadopago';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLAN_ROLE_MAP = {
  "2c9380849783ce770197a0396e770acf": "player",
  "2c9380849788f4e40197a041b476085c": "pro",
  "2c938084979341770197a0429a5404ad": "premium",
};

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

export default async (req, res) => {
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('URL:', req.url);
  
  if (req.method === 'GET') {
    // MercadoPago puede probar el webhook con GET, responde 200 OK
    console.log('GET request received - webhook test');
    res.status(200).json({ message: 'Webhook GET ok' });
    return;
  }
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('=== WEBHOOK BODY ===');
    console.log('Raw body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body stringified:', JSON.stringify(req.body, null, 2));
    
    const { data, type, entity, id: notificationId } = req.body;
    
    console.log('=== PARSED DATA ===');
    console.log('data:', data);
    console.log('type:', type);
    console.log('entity:', entity);
    console.log('notificationId:', notificationId);

    // Handle different types of events
    if (entity === 'preapproval') {
      console.log('=== PROCESSING PREAPPROVAL ===');
      
      // Get the preapproval ID from the data
      const preapprovalId = data?.id || notificationId;
      console.log('Preapproval ID:', preapprovalId);
      
      if (!preapprovalId) {
        console.log('No preapproval ID found in webhook data');
        res.status(400).json({ error: 'No preapproval ID found' });
        return;
      }

      let payer_email = null;
      let planId = null;
      
      try {
        console.log('Getting preapproval details for ID:', preapprovalId);
        const preapproval = await mercadopago.preapproval.get(preapprovalId);
        console.log('Preapproval response:', preapproval.body);
        
        payer_email = preapproval.body.payer_email;
        planId = preapproval.body.preapproval_plan_id;
        
        console.log('Found payer email:', payer_email);
        console.log('Found plan ID:', planId);
      } catch (e) {
        console.log('Error getting preapproval details:', e.message);
        console.log('Error details:', e);
        
        // If we can't get the preapproval, try to extract info from the webhook data
        if (data && data.preapproval_plan_id) {
          planId = data.preapproval_plan_id;
          console.log('Using plan ID from webhook data:', planId);
        }
        
        // Try to get email from webhook data if available
        if (data && data.payer_email) {
          payer_email = data.payer_email;
          console.log('Using payer email from webhook data:', payer_email);
        }
      }

      // If we still don't have a plan ID, we can't proceed
      if (!planId) {
        console.log('No plan ID found, cannot update user role');
        res.status(400).json({ error: 'No plan ID found' });
        return;
      }

      const newRole = PLAN_ROLE_MAP[planId];
      console.log('Plan ID:', planId);
      console.log('New Role:', newRole);
      
      if (!newRole) {
        console.log('Plan no reconocido:', planId);
        res.status(400).json({ error: 'Plan no reconocido' });
        return;
      }

      // If we don't have an email, we can't update the user
      if (!payer_email) {
        console.log('No se pudo identificar el email, no se actualiza el rol.');
        res.status(200).json({ message: 'No se pudo identificar el usuario, rol no actualizado.' });
        return;
      }

      console.log('=== UPDATING USER ROLE ===');
      console.log('Email:', payer_email);
      console.log('New Role:', newRole);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', payer_email)
        .single();

      if (!user) {
        console.error('No user found with email:', payer_email);
        res.status(404).json({ error: 'No user found with this email' });
        return;
      }

      // Update user role
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('email', payer_email);

      if (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      console.log(`Updated user ${payer_email} to role ${newRole}`);
      res.status(200).json({ message: 'Rol actualizado', email: payer_email, role: newRole });
      return;
    }

    console.log('Evento ignorado - entity:', entity, 'data:', data);
    res.status(200).json({ message: 'Evento ignorado' });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: e.message });
  }
};
