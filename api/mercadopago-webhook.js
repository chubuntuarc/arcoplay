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
    // MercadoPago envía el id de la suscripción en data.id
    const { data, type, entity } = req.body;

    // Solo nos interesa el evento de preapproval
    if (entity === 'preapproval' && data && data.id) {
      // Consultar detalles de la suscripción en MercadoPago
      const preapproval = await mercadopago.preapproval.get(data.id);

      const payer_email = preapproval.body.payer_email;
      const plan_id = preapproval.body.preapproval_plan_id;

      const newRole = PLAN_ROLE_MAP[plan_id];
      if (!newRole) {
        res.status(400).json({ error: 'Plan no reconocido' });
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('email', payer_email);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json({ message: 'Rol actualizado' });
      return;
    }

    res.status(200).json({ message: 'Evento ignorado' });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: e.message });
  }
};
