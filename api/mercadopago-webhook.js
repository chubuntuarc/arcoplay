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
  if (req.method === 'GET') {
    // MercadoPago puede probar el webhook con GET, responde 200 OK
    res.status(200).json({ message: 'Webhook GET ok' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));
    const { data, type, entity, id: notificationId } = req.body;

    // Only handle preapproval events
    if (entity === 'preapproval' && data && data.id) {
      const planId = data.id;
      const newRole = PLAN_ROLE_MAP[planId];
      
      if (!newRole) {
        console.log('Plan no reconocido:', planId);
        res.status(400).json({ error: 'Plan no reconocido' });
        return;
      }

      // Try to get preapproval details using the notification ID first
      let payer_email = null;
      
      try {
        // First try to get preapproval using the notification ID
        const preapproval = await mercadopago.preapproval.get(notificationId);
        payer_email = preapproval.body.payer_email;
      } catch (e) {
        console.log('Could not get preapproval with notification ID, trying alternative approach...');
        
        // If that fails, try to get recent preapprovals for this plan
        try {
          const preapprovals = await mercadopago.preapproval.search({
            preapproval_plan_id: planId,
            status: 'authorized'
          });
          
          if (preapprovals.body.results && preapprovals.body.results.length > 0) {
            // Get the most recent one
            const latestPreapproval = preapprovals.body.results[0];
            payer_email = latestPreapproval.payer_email;
          }
        } catch (searchError) {
          console.error('Error searching preapprovals:', searchError);
        }
      }

      if (!payer_email) {
        console.log('No se pudo identificar el email, no se actualiza el rol.');
        res.status(200).json({ message: 'No se pudo identificar el usuario, rol no actualizado.' });
        return;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', payer_email)
        .single();

      if (!user) {
        console.error('No user found with email:', payer_email);
        // Optionally: send yourself an alert or handle this case
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

    res.status(200).json({ message: 'Evento ignorado' });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: e.message });
  }
};
